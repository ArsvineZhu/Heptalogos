import { describe, expect, it } from "vitest";
import {
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createBootId,
} from "@heptalogos/foundation-contracts";
import {
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_RUNTIME_ROLE,
  type HostOwnershipContext,
} from "@heptalogos/host-ownership";
import {
  assertManagedHostContext,
  createManagedHostContext,
  markManagedHostTerminal,
  type BootstrapManagedHostContext,
  type HostMaintenanceQuiescence,
  type ManagedHostPersistenceOptions,
} from "./managed-host.js";

const persistenceOptions: ManagedHostPersistenceOptions = {
  target: {
    host: "127.0.0.1",
    port: 55436,
    database: HOST_OWNERSHIP_CANONICAL_DATABASE,
    user: HOST_RUNTIME_ROLE,
  },
  async withRuntimeDatabasePassword(use) {
    return use(new TextEncoder().encode("R".repeat(32)));
  },
};

function rawHost(): HostOwnershipContext {
  const controller = new AbortController();
  return {
    installationId: createInstallationId(),
    instanceId: createInstanceId(),
    bootId: createBootId(),
    token: createHostOwnershipToken(),
    state: "ACTIVE",
    signal: controller.signal,
    assertActive() {},
    async close() {},
  };
}

const quiescence: HostMaintenanceQuiescence = {
  async quiesce() {
    return { async resumeAfterAbort() {} };
  },
};

describe("managed Host capability", () => {
  it("preserves the M4 identity view without exposing raw close", () => {
    const raw = rawHost();
    const managed = createManagedHostContext(raw, {
      async preparePrivatePostgresMaintenance() {
        throw new Error("not implemented in Task 3 fixture");
      },
      async shutdownKeepingPrivatePostgres() {},
    }, persistenceOptions);

    expect(managed.installationId).toBe(raw.installationId);
    expect(managed.instanceId).toBe(raw.instanceId);
    expect(managed.bootId).toBe(raw.bootId);
    expect(managed.token).toBe(raw.token);
    expect(managed.state).toBe("ACTIVE");
    expect("close" in managed).toBe(false);
  });

  it("rejects structurally forged managed Host objects", () => {
    const forged = {
      installationId: createInstallationId(),
      instanceId: createInstanceId(),
      bootId: createBootId(),
      token: createHostOwnershipToken(),
      state: "ACTIVE",
      signal: new AbortController().signal,
      assertActive() {},
      async preparePrivatePostgresMaintenance() {},
      async shutdownKeepingPrivatePostgres(_value: HostMaintenanceQuiescence) {},
    } as unknown as BootstrapManagedHostContext;

    expect(() => assertManagedHostContext(forged)).toThrow();
  });

  it("makes the old managed Host terminal after handoff completion", () => {
    const managed = createManagedHostContext(rawHost(), {
      async preparePrivatePostgresMaintenance() {
        throw new Error("not implemented in Task 3 fixture");
      },
      async shutdownKeepingPrivatePostgres() {},
    }, persistenceOptions);

    markManagedHostTerminal(managed);
    expect(managed.state).toBe("CLOSED");
    expect(() => managed.assertActive()).toThrow();
  });

  it("issues a narrow persistence authority fenced by managed-host terminality", async () => {
    const raw = rawHost();
    const managed = createManagedHostContext(
      raw,
      {
        async preparePrivatePostgresMaintenance() {
          throw new Error("not implemented in Task 4 fixture");
        },
        async shutdownKeepingPrivatePostgres() {},
      },
      {
        target: {
          host: "127.0.0.1",
          port: 55436,
          database: HOST_OWNERSHIP_CANONICAL_DATABASE,
          user: HOST_RUNTIME_ROLE,
        },
        async withRuntimeDatabasePassword(use) {
          return use(new TextEncoder().encode("R".repeat(32)));
        },
      },
    );

    expect(managed.persistence.installationId).toBe(raw.installationId);
    expect(managed.persistence.instanceId).toBe(raw.instanceId);
    expect(managed.persistence.bootId).toBe(raw.bootId);
    expect(managed.persistence.token).toBe(raw.token);
    expect(managed.persistence.target.user).toBe(HOST_RUNTIME_ROLE);
    expect("withBootstrapPassword" in managed.persistence).toBe(false);
    expect("withHostLeasePassword" in managed.persistence).toBe(false);
    expect("raw" in managed.persistence).toBe(false);
    expect("client" in managed.persistence).toBe(false);
    expect("pool" in managed.persistence).toBe(false);
    await expect(
      managed.persistence.withRuntimeDatabasePassword(async (password) =>
        new TextDecoder().decode(password),
      ),
    ).resolves.toBe("R".repeat(32));

    markManagedHostTerminal(managed);
    expect(() => managed.persistence.assertActive()).toThrow();
    await expect(
      managed.persistence.withRuntimeDatabasePassword(async () => "not-called"),
    ).rejects.toThrow();
  });

  it("retains an explicit quiescence seam on the managed contract", async () => {
    const managed = createManagedHostContext(rawHost(), {
      async preparePrivatePostgresMaintenance() {
        throw new Error("not implemented in Task 3 fixture");
      },
      async shutdownKeepingPrivatePostgres(received) {
        await received.quiesce();
      },
    }, persistenceOptions);

    await expect(
      managed.shutdownKeepingPrivatePostgres(quiescence),
    ).resolves.toBeUndefined();
  });
});
