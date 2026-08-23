import { ProblemError } from "@heptalogos/foundation-contracts";
import type { HostPersistenceAuthority } from "@heptalogos/host-ownership";
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
): PersistenceService {
  let state: PersistenceServiceState = "OPEN";
  let drainPromise: Promise<void> | undefined;

  const drain = (): Promise<void> => {
    if (drainPromise !== undefined) return drainPromise;
    drainPromise = database.destroy().then(
      () => {
        state = "CLOSED";
      },
      (error: unknown) => {
        state = "CLOSED";
        throw persistenceServiceCloseFailedProblem();
      },
    );
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

  const assertOpen = (): void => {
    if (state !== "OPEN") throw serviceErrorForState(state);
    try {
      authority.assertActive();
    } catch {
      fence();
      throw persistenceServiceFencedProblem();
    }
  };

  const execute = async <T>(
    mode: PersistenceTransactionMode,
    operation: (context: PersistenceTransactionContext) => Promise<T>,
  ): Promise<T> => {
    assertOpen();
    try {
      return await database.transaction().execute(async (transaction) => {
        const context = issueTransactionContext(mode, transaction);
        try {
          return await operation(context);
        } finally {
          releaseTransactionContext(context);
        }
      });
    } catch (error) {
      if (error instanceof ProblemError) throw error;
      throw persistenceTransactionFailedProblem();
    }
  };

  return {
    get state() {
      return state;
    },
    read<T>(
      operation: (context: PersistenceTransactionContext) => Promise<T>,
    ) {
      return execute("READ", operation);
    },
    mutate<T>(
      operation: (context: PersistenceTransactionContext) => Promise<T>,
    ) {
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
): PersistenceService {
  return createPersistenceServiceFromDatabase(authority, options, database);
}
