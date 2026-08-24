import {
  parseBootId,
  parseHostOwnershipToken,
  parseInstanceId,
  ProblemError,
} from "@heptalogos/foundation-contracts";
import { CompiledQuery } from "kysely";
import {
  HOST_OWNERSHIP_FENCE_LOCK_FUNCTION,
  type HostPersistenceAuthority,
} from "@heptalogos/host-ownership";
import {
  type PersistenceRuntimeOptions,
  type PersistenceService,
  type PersistenceServiceState,
  type PersistenceTransactionContext,
  type PersistenceTransactionMode,
} from "./contracts.js";
import { createKyselyAdapter, type PersistenceDatabase } from "./kysely-adapter.js";
import { createPersistencePool } from "./pg-pool.js";
import {
  persistenceServiceCloseFailedProblem,
  persistenceServiceClosedProblem,
  persistenceServiceFencedProblem,
  persistenceTransactionCommitUncertainProblem,
  persistenceTransactionFailedProblem,
} from "./problems.js";
import {
  issueTransactionContext,
  releaseTransactionContext,
  type PersistenceInternalTransaction,
} from "./transaction-context.js";

interface PersistenceDatabaseLike {
  transaction(): {
    execute<T>(
      callback: (transaction: PersistenceInternalTransaction) => Promise<T>,
    ): Promise<T>;
  };
  destroy(): Promise<void>;
}

interface PersistenceServiceTestHooks {
  readonly onFenceVerified?: () => void;
}

interface HostFenceRow {
  readonly singleton: unknown;
  readonly instance_id: unknown;
  readonly ownership_revision: unknown;
  readonly host_ownership_token: unknown;
  readonly boot_id: unknown;
}

const HOST_FENCE_QUERY = `
SELECT singleton,
       instance_id,
       ownership_revision,
       host_ownership_token,
       boot_id
FROM "heptalogos"."${HOST_OWNERSHIP_FENCE_LOCK_FUNCTION}"()
`;

async function executeSql<Row>(
  transaction: PersistenceInternalTransaction,
  sql: string,
  parameters: readonly unknown[] = [],
): Promise<readonly Row[]> {
  const result = await transaction.executeQuery<Row>(
    CompiledQuery.raw(sql, [...parameters]),
  );
  return result.rows;
}

function isValidRevision(value: unknown): boolean {
  if (typeof value === "string") return /^(0|[1-9][0-9]*)$/u.test(value);
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function incompatibleFenceProblem(): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode: "persistence.host_fence.incompatible",
    category: "integrity",
    retryClass: "manual",
    title: "Host ownership fence is incompatible",
    detail:
      "The canonical HostOwnershipFence row did not match the required singleton shape",
  });
}

function staleOwnerProblem(): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode: "persistence.host_fence.stale_owner",
    category: "conflict",
    retryClass: "after-change",
    title: "Host ownership fence belongs to another owner",
    detail:
      "The database fence does not contain the current Host InstanceId, BootId, and token",
  });
}

function verifyHostFence(
  rows: readonly HostFenceRow[],
  authority: HostPersistenceAuthority,
  hooks: PersistenceServiceTestHooks,
): void {
  if (rows.length !== 1) throw incompatibleFenceProblem();
  const row = rows[0];
  if (
    row.singleton !== true ||
    typeof row.instance_id !== "string" ||
    parseInstanceId(row.instance_id) === undefined ||
    !isValidRevision(row.ownership_revision)
  ) {
    throw incompatibleFenceProblem();
  }
  if (row.host_ownership_token === null || row.boot_id === null) {
    throw staleOwnerProblem();
  }
  if (
    typeof row.host_ownership_token !== "string" ||
    parseHostOwnershipToken(row.host_ownership_token) === undefined ||
    typeof row.boot_id !== "string" ||
    parseBootId(row.boot_id) === undefined
  ) {
    throw incompatibleFenceProblem();
  }
  if (
    row.instance_id !== authority.instanceId ||
    row.host_ownership_token !== authority.token ||
    row.boot_id !== authority.bootId
  ) {
    throw staleOwnerProblem();
  }
  hooks.onFenceVerified?.();
}

function reportBackgroundError(
  options: PersistenceRuntimeOptions,
  error: unknown,
): void {
  try {
    options.onBackgroundError(error);
  } catch {
    // Background reporting must not escape the lifecycle callback.
  }
}

function serviceErrorForState(state: PersistenceServiceState): ProblemError {
  return state === "FENCED"
    ? persistenceServiceFencedProblem()
    : persistenceServiceClosedProblem();
}

function createPersistenceServiceFromDatabase(
  authority: HostPersistenceAuthority,
  options: PersistenceRuntimeOptions,
  database: PersistenceDatabaseLike,
  hooks: PersistenceServiceTestHooks = {},
): PersistenceService {
  let state: PersistenceServiceState = "OPEN";
  let drainPromise: Promise<void> | undefined;
  let drainRequested = false;
  let drainStarted = false;
  let activeTransactions = 0;
  let resolveDrain: (() => void) | undefined;
  let rejectDrain: ((error: unknown) => void) | undefined;

  const maybeStartDrain = (): void => {
    if (!drainRequested || drainStarted || activeTransactions !== 0) return;
    drainStarted = true;
    void database.destroy().then(
      () => {
        state = "CLOSED";
        resolveDrain?.();
      },
      () => {
        state = "CLOSED";
        rejectDrain?.(persistenceServiceCloseFailedProblem());
      },
    );
  };

  const drain = (): Promise<void> => {
    if (drainPromise !== undefined) return drainPromise;
    drainRequested = true;
    drainPromise = new Promise<void>((resolve, reject) => {
      resolveDrain = resolve;
      rejectDrain = reject;
    });
    maybeStartDrain();
    return drainPromise;
  };

  const fence = (): void => {
    if (state === "OPEN") state = "FENCED";
    const pending = drain();
    void pending.catch((error) => reportBackgroundError(options, error));
  };

  const onAbort = (): void => fence();
  authority.signal.addEventListener("abort", onAbort, { once: true });
  if (authority.signal.aborted) fence();

  const assertAuthorityActive = (): void => {
    try {
      authority.assertActive();
    } catch {
      fence();
      throw persistenceServiceFencedProblem();
    }
  };

  const assertOpen = (): void => {
    if (state !== "OPEN") throw serviceErrorForState(state);
    assertAuthorityActive();
  };

  const execute = async <T>(
    mode: PersistenceTransactionMode,
    operation: (context: PersistenceTransactionContext) => Promise<T>,
  ): Promise<T> => {
    assertOpen();
    let operationCompleted = false;
    activeTransactions += 1;
    try {
      return await database.transaction().execute(async (transaction) => {
        if (mode === "READ") {
          await executeSql(transaction, "SET TRANSACTION READ ONLY");
        } else {
          assertAuthorityActive();
          const rows = await executeSql<HostFenceRow>(transaction, HOST_FENCE_QUERY);
          verifyHostFence(rows, authority, hooks);
          assertAuthorityActive();
        }
        const context = issueTransactionContext(mode, transaction);
        try {
          const result = await operation(context);
          operationCompleted = true;
          return result;
        } finally {
          releaseTransactionContext(context);
        }
      });
    } catch (error) {
      if (operationCompleted) {
        throw persistenceTransactionCommitUncertainProblem();
      }
      if (error instanceof ProblemError) throw error;
      throw persistenceTransactionFailedProblem();
    } finally {
      activeTransactions -= 1;
      maybeStartDrain();
    }
  };

  return {
    get state() {
      return state;
    },
    read<T>(operation: (context: PersistenceTransactionContext) => Promise<T>) {
      return execute("READ", operation);
    },
    mutate<T>(operation: (context: PersistenceTransactionContext) => Promise<T>) {
      return execute("MUTATION", operation);
    },
    close() {
      if (state === "CLOSED") return drainPromise ?? Promise.resolve();
      state = "CLOSING";
      return drain();
    },
  };
}

export function createPersistenceService(
  authority: HostPersistenceAuthority,
  options: PersistenceRuntimeOptions,
): PersistenceService {
  const pool = createPersistencePool(authority, options);
  const database = createKyselyAdapter(pool);
  return createPersistenceServiceFromDatabase(authority, options, database);
}

export function createPersistenceServiceForTests(
  authority: HostPersistenceAuthority,
  options: PersistenceRuntimeOptions,
  database: PersistenceDatabaseLike,
  hooks: PersistenceServiceTestHooks = {},
): PersistenceService {
  return createPersistenceServiceFromDatabase(authority, options, database, hooks);
}
