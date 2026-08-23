import { describe, expect, it } from "vitest";
import {
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  ProblemError,
} from "@heptalogos/foundation-contracts";
import type { HostPersistenceAuthority } from "@heptalogos/host-ownership";
import * as persistence from "./index.js";
import type {
  PersistenceRuntimeOptions,
  PersistenceService,
  PersistenceServiceState,
  PersistenceTransactionContext,
  PersistenceTransactionMode,
} from "./index.js";
import {
  createPersistenceServiceForTests,
} from "./persistence-service.js";
import {
  issueTransactionContext,
  releaseTransactionContext,
  resolveTransactionContext,
  type PersistenceInternalTransaction,
} from "./transaction-context.js";

function runtimeOptions(): PersistenceRuntimeOptions {
  return {
    maxConnections: 1,
    idleTimeoutMs: 1_000,
    connectionTimeoutMs: 1_000,
    statementTimeoutMs: 1_000,
    lockTimeoutMs: 1_000,
    idleInTransactionSessionTimeoutMs: 1_000,
    onBackgroundError() {},
  };
}

function authority(
  signal: AbortSignal,
  onAssert: () => void = () => undefined,
): HostPersistenceAuthority {
  return {
    installationId: createInstallationId(),
    instanceId: createInstanceId(),
    bootId: createBootId(),
    token: createHostOwnershipToken(),
    target: {
      host: "127.0.0.1",
      port: 55436,
      database: "heptalogos",
      user: "heptalogos_runtime",
    },
    signal,
    assertActive() {
      onAssert();
    },
    async withRuntimeDatabasePassword(use) {
      return use(new TextEncoder().encode("R".repeat(32)));
    },
  };
}

function fakeDatabase(
  authorityValue: HostPersistenceAuthority,
  order: string[],
  onFenceVerified: () => void = () => undefined,
  fenceRows: readonly Record<string, unknown>[] | undefined = undefined,
  completionError: unknown = undefined,
  onDestroy: () => void = () => undefined,
) {
  const transaction = {
    async executeQuery(query: { readonly sql: string }) {
      const sql = query.sql.replace(/\s+/gu, " ").trim();
      if (sql.startsWith("SET TRANSACTION READ ONLY")) {
        order.push("SET TRANSACTION READ ONLY");
        return { rows: [] };
      }
      if (sql.includes("lock_host_ownership_fence")) {
        order.push("SELECT fence FOR SHARE");
        return {
          rows:
            fenceRows ??
            [
              {
                singleton: true,
                instance_id: authorityValue.instanceId,
                ownership_revision: "0",
                host_ownership_token: authorityValue.token,
                boot_id: authorityValue.bootId,
              },
            ],
        };
      }
      throw new Error(`unexpected SQL: ${query.sql}`);
    },
  } as unknown as PersistenceInternalTransaction;

  return {
    transaction() {
      return {
        async execute<T>(
          callback: (value: PersistenceInternalTransaction) => Promise<T>,
        ): Promise<T> {
          order.push("transaction begins");
          try {
            const value = await callback(transaction);
            if (completionError !== undefined) throw completionError;
            order.push("transaction completion");
            return value;
          } catch (error) {
            order.push("transaction rollback");
            throw error;
          }
        },
      };
    },
    async destroy() {
      onDestroy();
    },
    onFenceVerified,
  };
}

describe("persistence package root", () => {
  it("exposes only the Heptalogos persistence factory at runtime", () => {
    expect(Object.keys(persistence)).toEqual(["createPersistenceService"]);
    expect(persistence.createPersistenceService).toBeTypeOf("function");
  });

  it("keeps the public transaction and resource contracts Heptalogos-owned", () => {
    const mode: PersistenceTransactionMode = "READ";
    const context: PersistenceTransactionContext = { mode };
    const state: PersistenceServiceState = "OPEN";
    const options: PersistenceRuntimeOptions = {
      maxConnections: 1,
      idleTimeoutMs: 1_000,
      connectionTimeoutMs: 1_000,
      statementTimeoutMs: 1_000,
      lockTimeoutMs: 1_000,
      idleInTransactionSessionTimeoutMs: 1_000,
      onBackgroundError() {},
    };
    const service: PersistenceService = {
      state,
      async read<T>(
        operation: (context: PersistenceTransactionContext) => Promise<T>,
      ) {
        return operation({ mode: "READ" });
      },
      async mutate<T>(
        operation: (context: PersistenceTransactionContext) => Promise<T>,
      ) {
        return operation({ mode: "MUTATION" });
      },
      async close() {},
    };

    expect(context).toEqual({ mode: "READ" });
    expect(options.maxConnections).toBe(1);
    expect(service.state).toBe("OPEN");
  });

  it("binds an opaque transaction context only for its callback lifetime", () => {
    const transaction = {} as PersistenceInternalTransaction;
    const context = issueTransactionContext("READ", transaction);

    expect(context).toEqual({ mode: "READ" });
    expect(resolveTransactionContext(context)).toBe(transaction);

    releaseTransactionContext(context);
    expect(() => resolveTransactionContext(context)).toThrow(
      "transaction context was not issued",
    );
  });

  it("stops admission synchronously on Host abort and closes resources once", async () => {
    const controller = new AbortController();
    let destroyCount = 0;
    let releaseDestroy!: () => void;
    const destroyPromise = new Promise<void>((resolve) => {
      releaseDestroy = resolve;
    });
    const database = {
      transaction() {
        throw new Error("transaction should not be opened after fencing");
      },
      destroy() {
        destroyCount += 1;
        return destroyPromise;
      },
    };
    const service = createPersistenceServiceForTests(
      authority(controller.signal),
      runtimeOptions(),
      database,
    );

    expect(service.state).toBe("OPEN");
    controller.abort();
    expect(service.state).toBe("FENCED");
    await expect(service.read(async () => "not-admitted")).rejects.toMatchObject({
      problem: { problemCode: "persistence.service.fenced" },
    });

    const firstClose = service.close();
    const secondClose = service.close();
    expect(secondClose).toBe(firstClose);
    expect(service.state).toBe("CLOSING");
    expect(destroyCount).toBe(1);

    releaseDestroy();
    await firstClose;
    expect(service.state).toBe("CLOSED");
  });

  it("linearizes a mutation only after the held FOR SHARE fence and final active check", async () => {
    const controller = new AbortController();
    const order: string[] = [];
    let assertCount = 0;
    const hostAuthority = authority(controller.signal, () => {
      assertCount += 1;
      order.push("authority.assertActive");
    });
    const database = fakeDatabase(hostAuthority, order, () => {
      order.push("verify singleton/InstanceId/BootId/token");
    });
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
      { onFenceVerified: database.onFenceVerified },
    );

    await expect(
      service.mutate(async (context) => {
        order.push("invoke operation");
        expect(context.mode).toBe("MUTATION");
        return "committed";
      }),
    ).resolves.toBe("committed");

    expect(assertCount).toBe(3);
    expect(order).toEqual([
      "authority.assertActive",
      "transaction begins",
      "authority.assertActive",
      "SELECT fence FOR SHARE",
      "verify singleton/InstanceId/BootId/token",
      "authority.assertActive",
      "invoke operation",
      "transaction completion",
    ]);
  });

  it("starts a read with database-enforced READ ONLY and no write fence", async () => {
    const controller = new AbortController();
    const order: string[] = [];
    const hostAuthority = authority(controller.signal, () => {
      order.push("authority.assertActive");
    });
    const database = fakeDatabase(hostAuthority, order);
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
    );

    await expect(
      service.read(async (context) => {
        order.push("invoke operation");
        expect(context.mode).toBe("READ");
        return "read";
      }),
    ).resolves.toBe("read");

    expect(order).toEqual([
      "authority.assertActive",
      "transaction begins",
      "SET TRANSACTION READ ONLY",
      "invoke operation",
      "transaction completion",
    ]);
  });

  it("rolls back without invoking a mutation when the final in-lock Host check fails", async () => {
    const controller = new AbortController();
    const order: string[] = [];
    let assertCount = 0;
    const hostAuthority = authority(controller.signal, () => {
      assertCount += 1;
      order.push("authority.assertActive");
      if (assertCount === 3) throw new Error("Host lease lost");
    });
    const database = fakeDatabase(hostAuthority, order, () => {
      order.push("verify singleton/InstanceId/BootId/token");
    });
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
      { onFenceVerified: database.onFenceVerified },
    );
    let invoked = 0;

    await expect(
      service.mutate(async () => {
        invoked += 1;
        return undefined;
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "persistence.service.fenced" },
    });

    expect(invoked).toBe(0);
    expect(order).toEqual([
      "authority.assertActive",
      "transaction begins",
      "authority.assertActive",
      "SELECT fence FOR SHARE",
      "verify singleton/InstanceId/BootId/token",
      "authority.assertActive",
      "transaction rollback",
    ]);
  });

  it("rejects a structurally valid but stale database owner before operation invocation", async () => {
    const controller = new AbortController();
    const hostAuthority = authority(controller.signal);
    const staleToken = createHostOwnershipToken();
    const staleBootId = createBootId();
    const database = fakeDatabase(
      hostAuthority,
      [],
      undefined,
      [
        {
          singleton: true,
          instance_id: hostAuthority.instanceId,
          ownership_revision: "1",
          host_ownership_token: staleToken,
          boot_id: staleBootId,
        },
      ],
    );
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
    );
    let invoked = 0;

    await expect(
      service.mutate(async () => {
        invoked += 1;
        return undefined;
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "persistence.host_fence.stale_owner" },
    });
    expect(invoked).toBe(0);
  });

  it("rejects a malformed or missing singleton fence as incompatible", async () => {
    const controller = new AbortController();
    const hostAuthority = authority(controller.signal);
    const database = fakeDatabase(hostAuthority, [], undefined, []);
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
    );

    await expect(service.mutate(async () => undefined)).rejects.toMatchObject({
      problem: { problemCode: "persistence.host_fence.incompatible" },
    });
  });

  it("preserves operation ProblemError and maps other operation failures", async () => {
    const controller = new AbortController();
    const hostAuthority = authority(controller.signal);
    const database = fakeDatabase(hostAuthority, []);
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
    );
    const expected = new ProblemError({
      schemaVersion: 1,
      problemCode: "test.operation.problem",
      category: "conflict",
      retryClass: "manual",
      title: "test problem",
      detail: "preserve me",
    });

    await expect(
      service.mutate(async () => {
        throw expected;
      }),
    ).rejects.toBe(expected);
    await expect(
      service.mutate(async () => {
        throw new Error("driver or operation failure");
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "persistence.transaction.failed" },
    });
  });

  it("allows an already-admitted mutation to finish after a late process-local lease loss", async () => {
    const controller = new AbortController();
    let locallyActive = true;
    const hostAuthority = authority(controller.signal, () => {
      if (!locallyActive) throw new Error("late local lease loss");
    });
    const database = fakeDatabase(hostAuthority, []);
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
    );

    await expect(
      service.mutate(async () => {
        locallyActive = false;
        return "already admitted";
      }),
    ).resolves.toBe("already admitted");
  });

  it("classifies a failed transaction completion after callback success as commit uncertainty", async () => {
    const controller = new AbortController();
    const hostAuthority = authority(controller.signal);
    const database = fakeDatabase(
      hostAuthority,
      [],
      undefined,
      undefined,
      new Error("connection terminated after callback completion"),
    );
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
    );
    let operationCount = 0;

    await expect(
      service.mutate(async () => {
        operationCount += 1;
        return "committed-but-unacknowledged";
      }),
    ).rejects.toMatchObject({
      problem: {
        problemCode: "persistence.transaction.commit_uncertain",
        retryClass: "manual",
      },
    });
    expect(operationCount).toBe(1);
  });

  it("defers pool destruction until an admitted mutation exits after authority abort", async () => {
    const controller = new AbortController();
    const hostAuthority = authority(controller.signal);
    let destroyCount = 0;
    const database = fakeDatabase(
      hostAuthority,
      [],
      undefined,
      undefined,
      undefined,
      () => {
        destroyCount += 1;
      },
    );
    const service = createPersistenceServiceForTests(
      hostAuthority,
      runtimeOptions(),
      database,
    );

    await expect(
      service.mutate(async () => {
        controller.abort();
        expect(destroyCount).toBe(0);
        return "entered mutation completed";
      }),
    ).resolves.toBe("entered mutation completed");
    expect(destroyCount).toBe(1);
  });
});
