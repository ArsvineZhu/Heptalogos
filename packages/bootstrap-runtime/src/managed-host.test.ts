import { describe, expect, it } from "vitest";
import {
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createBootId,
} from "@heptalogos/foundation-contracts";
import type { HostOwnershipContext } from "@heptalogos/host-ownership";
import {
  assertManagedHostContext,
  createManagedHostContext,
  markManagedHostTerminal,
  type BootstrapManagedHostContext,
  type HostMaintenanceQuiescence,
} from "./managed-host.js";

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
    });

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
    });

    markManagedHostTerminal(managed);
    expect(managed.state).toBe("CLOSED");
    expect(() => managed.assertActive()).toThrow();
  });

  it("retains an explicit quiescence seam on the managed contract", async () => {
    const managed = createManagedHostContext(rawHost(), {
      async preparePrivatePostgresMaintenance() {
        throw new Error("not implemented in Task 3 fixture");
      },
      async shutdownKeepingPrivatePostgres(received) {
        await received.quiesce();
      },
    });

    await expect(
      managed.shutdownKeepingPrivatePostgres(quiescence),
    ).resolves.toBeUndefined();
  });
});
