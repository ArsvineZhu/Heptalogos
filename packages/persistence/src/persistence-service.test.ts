import { describe, expect, it } from "vitest";
import {
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
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

function authority(signal: AbortSignal): HostPersistenceAuthority {
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
    assertActive() {},
    async withRuntimeDatabasePassword(use) {
      return use(new TextEncoder().encode("R".repeat(32)));
    },
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
});
