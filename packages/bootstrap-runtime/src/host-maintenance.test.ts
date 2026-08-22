import { describe, expect, it, vi } from "vitest";
import {
  asContentDigest,
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createUuidV7Id,
  digestCanonicalJson,
} from "@heptalogos/foundation-contracts";
import {
  sealBootstrapState,
  type BootstrapStateBodyV2,
  type BootstrapStateEnvelopeV2,
  type MaintenanceJournalBodyV1,
} from "@heptalogos/bootstrap-state";
import type { HostOwnershipContext } from "@heptalogos/host-ownership";
import type { BootstrapOwnershipLease } from "./bootstrap-ownership.js";
import type {
  OwnedBootstrapPreludeHandoffContext,
  HostOwnershipHandoffOptions,
} from "./host-ownership-handoff.js";
import type { BootstrapPathProfile, ResolvedLifecycleRoot } from "./roots.js";
import type { PrivatePostgresMaintenanceDescriptor } from "./private-postgres-bootstrap.js";

const mocks = vi.hoisted(() => ({
  acquireBootstrapOwnershipMock: vi.fn(),
  openMaintenanceStateAccessMock: vi.fn(),
  inspectSnapshotMock: vi.fn(),
  revokeMock: vi.fn(),
}));

vi.mock("./bootstrap-ownership.js", async () => {
  const actual = await vi.importActual<typeof import("./bootstrap-ownership.js")>(
    "./bootstrap-ownership.js",
  );
  return { ...actual, acquireBootstrapOwnership: mocks.acquireBootstrapOwnershipMock };
});

vi.mock("./maintenance-state-access.js", () => ({
  openMaintenanceStateAccess: mocks.openMaintenanceStateAccessMock,
}));

vi.mock("@heptalogos/host-ownership", async () => {
  const actual = await vi.importActual<typeof import("@heptalogos/host-ownership")>(
    "@heptalogos/host-ownership",
  );
  return {
    ...actual,
    inspectHostOwnershipCanonicalSnapshot: mocks.inspectSnapshotMock,
    revokeHostOwnershipTokenForBootstrap: mocks.revokeMock,
  };
});

const { createHostMaintenanceOperations } = await import("./host-maintenance.js");

function makeState(
  installationId: ReturnType<typeof createInstallationId>,
  instanceId: ReturnType<typeof createInstanceId>,
): BootstrapStateEnvelopeV2 {
  const state: BootstrapStateBodyV2 = {
    schemaVersion: 2,
    revision: 4,
    activeBootstrapRuntimeGeneration: asContentDigest(
      "BootstrapRuntimeGenerationId",
      digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "bootstrap" }),
    ),
    activeProductGeneration: asContentDigest(
      "ProductGenerationId",
      digestCanonicalJson("test.product-generation/v1", { generation: "product" }),
    ),
    privatePostgres: {
      schemaVersion: 2,
      postgresMajor: 18,
      initializedByPostgresVersion: "18.6",
      installationId,
      instanceId,
      bootstrapRoleName: "heptalogos_bootstrap",
      dataPlacement: {
        rootId: "DATA",
        relativePath: "private-postgres",
        dataLayoutVersion: 1,
      },
      persistedPort: 55432,
      clusterSystemIdentifier: "12345678901234567890",
      initializationProfileRevision: asContentDigest(
        "PrivatePostgresInitializationProfileRevision",
        digestCanonicalJson("test.private-postgres-profile/v1", { profile: "m5a" }),
      ),
    },
  };
  return sealBootstrapState(state) as BootstrapStateEnvelopeV2;
}

function makeFixture(): {
  readonly rawHost: HostOwnershipContext;
  readonly context: OwnedBootstrapPreludeHandoffContext;
  readonly handoff: HostOwnershipHandoffOptions;
  readonly descriptor: PrivatePostgresMaintenanceDescriptor;
  readonly freshLease: BootstrapOwnershipLease;
  readonly state: BootstrapStateEnvelopeV2;
  readonly trace: string[];
} {
  const trace: string[] = [];
  const installationId = createInstallationId();
  const instanceId = createInstanceId();
  const bootId = createBootId();
  let hostState: HostOwnershipContext["state"] = "ACTIVE";
  const rawHost: HostOwnershipContext = {
    installationId,
    instanceId,
    bootId,
    token: createHostOwnershipToken(),
    get state() {
      return hostState;
    },
    signal: new AbortController().signal,
    assertActive() {
      if (hostState !== "ACTIVE") throw new Error(`host ${hostState}`);
    },
    async close() {
      trace.push("host.close");
      hostState = "CLOSED";
    },
  };
  const root = `/tmp/heptalogos-m5a-${instanceId}`;
  const resolved: ResolvedLifecycleRoot = {
    id: "INSTANCE",
    configuredPath: root,
    canonicalPath: root,
  };
  const paths: BootstrapPathProfile = {
    installationId,
    instanceId,
    resolve(rootId) {
      if (rootId === "INSTANCE") return resolved;
      throw new Error(`unexpected root ${rootId}`);
    },
    list() {
      return [resolved];
    },
  };
  let leaseState: BootstrapOwnershipLease["state"] = "HELD";
  const freshLease: BootstrapOwnershipLease = {
    get state() {
      return leaseState;
    },
    signal: new AbortController().signal,
    assertHeld() {
      if (leaseState !== "HELD") throw new Error(`lease ${leaseState}`);
    },
    async release() {
      trace.push("bootstrap.release");
      leaseState = "RELEASED";
    },
  };
  const oldLease: BootstrapOwnershipLease = {
    state: "RELEASED",
    signal: new AbortController().signal,
    assertHeld() {
      throw new Error("old lease released");
    },
    async release() {},
  };
  const state = makeState(installationId, instanceId);
  const journal = {
    async create(value: MaintenanceJournalBodyV1) {
      trace.push(`journal.create:${value.lastCompletedStage}`);
      return { state: value, digest: state.digest };
    },
    async advance(value: MaintenanceJournalBodyV1) {
      trace.push(`journal.advance:${value.lastCompletedStage}`);
      return { state: value, digest: state.digest };
    },
  };
  const access = {
    journal,
    state: {
      async load() {
        trace.push("state.load");
        return { status: "CURRENT", value: state } as const;
      },
      async commit() {
        throw new Error("not used");
      },
    },
    async commitOperationPointer(operationId: string) {
      trace.push(`state.pointer:${operationId}`);
      return state;
    },
  };
  const keyProvider = {
    async withPrivatePostgresBootstrapPassword<T>(
      _context: unknown,
      use: (password: Uint8Array) => Promise<T>,
    ) {
      return use(new TextEncoder().encode("B".repeat(32)));
    },
    async withPrivatePostgresHostLeasePassword<T>(
      _context: unknown,
      use: (password: Uint8Array) => Promise<T>,
    ) {
      return use(new TextEncoder().encode("H".repeat(32)));
    },
  };
  const handoff: HostOwnershipHandoffOptions = {
    keyProvider,
    timing: {
      connectionTimeoutMs: 1_000,
      statementTimeoutMs: 1_000,
      fenceLockTimeoutMs: 1_000,
      keepAliveInitialDelayMs: 1_000,
    },
    clientFactory: {},
    bootstrapHeartbeatMs: 1_000,
  };
  const descriptor: PrivatePostgresMaintenanceDescriptor = {
    toolchain: {
      version: "18.6",
      major: 18,
      binDirectory: root,
      postgres: `${root}/postgres`,
      initdb: `${root}/initdb`,
      pgCtl: `${root}/pg_ctl`,
      pgControldata: `${root}/pg_controldata`,
      pgIsReady: `${root}/pg_isready`,
    },
    placement: {
      rootId: "DATA",
      relativePath: "private-postgres",
      dataLayoutVersion: 1,
      canonicalDataDirectory: `${root}/private-postgres`,
    },
    expectedIdentity: {
      installationId,
      instanceId,
      postgresMajor: 18,
      bootstrapRoleName: "heptalogos_bootstrap",
      placement: {
        rootId: "DATA",
        relativePath: "private-postgres",
        dataLayoutVersion: 1,
      },
      persistedPort: 55432,
      clusterSystemIdentifier: "12345678901234567890",
      initializationProfileRevision:
        state.state.privatePostgres.initializationProfileRevision,
    },
    logFilePath: `${root}/private-postgres.log`,
    lifecycle: {
      startupTimeoutMs: 1_000,
      shutdownTimeoutMs: 1_000,
      readinessPollIntervalMs: 10,
    },
  };
  const context = {
    installationId,
    instanceId,
    bootId,
    bootstrapActivityId: createUuidV7Id("ActivityId"),
    paths,
    ownership: oldLease,
    assertOwnership() {
      throw new Error("old lease released");
    },
    state: access.state,
    journal: {} as OwnedBootstrapPreludeHandoffContext["journal"],
    privatePostgresSession:
      {} as OwnedBootstrapPreludeHandoffContext["privatePostgresSession"],
    assertReady() {
      throw new Error("not used");
    },
  } satisfies OwnedBootstrapPreludeHandoffContext;
  mocks.acquireBootstrapOwnershipMock.mockImplementation(async () => {
    trace.push("bootstrap.acquire");
    return freshLease;
  });
  mocks.openMaintenanceStateAccessMock.mockImplementation(() => {
    trace.push("maintenance.access.open");
    return access;
  });
  mocks.inspectSnapshotMock.mockImplementation(async () => {
    trace.push("fence.inspect");
    return {
      roles: [],
      database: [],
      schema: [],
      table: [],
      fence: [
        {
          instance_id: instanceId,
          ownership_revision: "7",
          host_ownership_token: rawHost.token,
          boot_id: bootId,
        },
      ],
    };
  });
  mocks.revokeMock.mockImplementation(async () => {
    trace.push("fence.revoke");
    return { previousRevision: "7", revokedRevision: "8" };
  });
  return {
    rawHost,
    context,
    handoff,
    descriptor,
    freshLease,
    state,
    trace,
  };
}

describe("reverse-handoff maintenance preparation and entry", () => {
  it("acquires a fresh bootstrap lease and journals before any mutation", async () => {
    const fixture = makeFixture();
    const operations = createHostMaintenanceOperations({
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      onOldHostTerminal: () => fixture.trace.push("old-host.terminal"),
    });

    const prepared = await operations.preparePrivatePostgresMaintenance({
      kind: "STOP_PRIVATE_POSTGRES",
    });

    expect(prepared.state).toBe("PREPARED");
    expect(fixture.trace).toEqual([
      "bootstrap.acquire",
      "maintenance.access.open",
      "state.load",
      "fence.inspect",
      expect.stringMatching(/^journal.create:/u),
      expect.stringMatching(/^state.pointer:/u),
    ]);
    expect(mocks.revokeMock).not.toHaveBeenCalled();
  });

  it("enters only after quiescence, token revocation, and old lease closure", async () => {
    const fixture = makeFixture();
    const operations = createHostMaintenanceOperations({
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      executeEnteredWindow: async () => ({ kind: "STOPPED" as const }),
      onOldHostTerminal: () => fixture.trace.push("old-host.terminal"),
    });
    const prepared = await operations.preparePrivatePostgresMaintenance({
      kind: "STOP_PRIVATE_POSTGRES",
    });
    const quiescence = {
      async quiesce() {
        fixture.trace.push("quiesce");
        return {
          async resumeAfterAbort() {
            fixture.trace.push("resume");
          },
        };
      },
    };

    await expect(prepared.execute(quiescence)).resolves.toEqual({ kind: "STOPPED" });
    expect(fixture.trace).toEqual([
      "bootstrap.acquire",
      "maintenance.access.open",
      "state.load",
      "fence.inspect",
      expect.stringMatching(/^journal.create:/u),
      expect.stringMatching(/^state.pointer:/u),
      "quiesce",
      expect.stringMatching(/^journal.advance:HOST_QUIESCED$/u),
      "fence.revoke",
      expect.stringMatching(/^journal.advance:HOST_TOKEN_REVOKED$/u),
      "host.close",
      expect.stringMatching(/^journal.advance:HOST_LEASE_CLOSED$/u),
      "old-host.terminal",
    ]);
  });

  it("safely aborts before PONR when revocation is known not committed", async () => {
    const fixture = makeFixture();
    mocks.revokeMock.mockRejectedValueOnce(
      Object.assign(new Error("known not committed"), {
        problem: { problemCode: "host-ownership.revocation.known_not_committed" },
      }),
    );
    const operations = createHostMaintenanceOperations({
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
    });
    const prepared = await operations.preparePrivatePostgresMaintenance({
      kind: "RESTART_PRIVATE_POSTGRES",
    });
    const quiescence = {
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    };

    await expect(prepared.execute(quiescence)).rejects.toThrow("known not committed");
    expect(fixture.rawHost.state).toBe("ACTIVE");
    expect(fixture.freshLease.state).toBe("RELEASED");
    expect(fixture.trace).toContain("bootstrap.release");
    expect(fixture.trace).toContain("journal.advance:ABORTED");
  });

  it("enters RECOVERY_REQUIRED after revocation uncertainty without resuming old Host", async () => {
    const fixture = makeFixture();
    mocks.revokeMock.mockRejectedValueOnce(
      Object.assign(new Error("commit uncertain"), {
        problem: { problemCode: "host-ownership.revocation.commit_uncertain" },
      }),
    );
    const operations = createHostMaintenanceOperations({
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
    });
    const prepared = await operations.preparePrivatePostgresMaintenance({
      kind: "RESTART_PRIVATE_POSTGRES",
    });

    await expect(
      prepared.execute({
        async quiesce() {
          return { async resumeAfterAbort() {} };
        },
      }),
    ).rejects.toThrow("commit uncertain");
    expect(fixture.rawHost.state).toBe("ACTIVE");
    expect(fixture.freshLease.state).toBe("HELD");
    expect(fixture.trace).toContain("journal.advance:RECOVERY_REQUIRED");
    expect(fixture.trace).not.toContain("bootstrap.release");
  });
});
