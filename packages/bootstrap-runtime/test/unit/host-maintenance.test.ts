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
  type BootstrapStateBodyV1,
  type BootstrapStateEnvelopeV1,
  type MaintenanceJournalBodyV1,
  type MaintenanceStage,
} from "@heptalogos/bootstrap-state";
import {
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_RUNTIME_ROLE,
  type HostOwnershipContext,
} from "@heptalogos/host-ownership";
import type { BootstrapOwnershipLease } from "../../src/bootstrap-ownership.js";
import type {
  OwnedBootstrapPreludeHandoffContext,
  HostOwnershipHandoffOptions,
} from "../../src/host-ownership-handoff.js";
import type { BootstrapPathProfile, ResolvedLifecycleRoot } from "../../src/roots.js";
import type { PrivatePostgresMaintenanceDescriptor } from "../../src/private-postgres-bootstrap.js";
import {
  createManagedHostContext,
  markManagedHostTerminal,
  type BootstrapManagedHostContext,
  type ManagedHostPersistenceOptions,
} from "../../src/managed-host.js";

const persistenceOptions: ManagedHostPersistenceOptions = {
  continuityEpochId:
    "0197cfe0-0000-7000-8000-000000000001" as ManagedHostPersistenceOptions["continuityEpochId"],
  target: {
    host: "127.0.0.1",
    port: 55432,
    database: HOST_OWNERSHIP_CANONICAL_DATABASE,
    user: HOST_RUNTIME_ROLE,
  },
  async withRuntimeDatabasePassword(use) {
    return use(new TextEncoder().encode("R".repeat(32)));
  },
};

const mocks = vi.hoisted(() => ({
  acquireBootstrapOwnershipMock: vi.fn(),
  openMaintenanceStateAccessMock: vi.fn(),
  inspectSnapshotMock: vi.fn(),
  revokeMock: vi.fn(),
  openMaintenanceControllerMock: vi.fn(),
  acquireHostLeaseConnectionMock: vi.fn(),
  publishHostOwnershipTokenMock: vi.fn(),
}));

vi.mock("../../src/bootstrap-ownership.js", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/bootstrap-ownership.js")
  >("../../src/bootstrap-ownership.js");
  return { ...actual, acquireBootstrapOwnership: mocks.acquireBootstrapOwnershipMock };
});

vi.mock("../../src/maintenance-state-access.js", () => ({
  openMaintenanceStateAccess: mocks.openMaintenanceStateAccessMock,
}));

vi.mock("@heptalogos/host-ownership", async () => {
  const actual = await vi.importActual<typeof import("@heptalogos/host-ownership")>(
    "@heptalogos/host-ownership",
  );
  return {
    ...actual,
    acquireHostLeaseConnection: mocks.acquireHostLeaseConnectionMock,
    inspectHostOwnershipCanonicalSnapshot: mocks.inspectSnapshotMock,
    publishHostOwnershipToken: mocks.publishHostOwnershipTokenMock,
    revokeHostOwnershipTokenForBootstrap: mocks.revokeMock,
  };
});

vi.mock("@heptalogos/private-postgres", async () => {
  const actual = await vi.importActual<typeof import("@heptalogos/private-postgres")>(
    "@heptalogos/private-postgres",
  );
  return {
    ...actual,
    openPrivatePostgresMaintenanceController: mocks.openMaintenanceControllerMock,
  };
});

const {
  createHostMaintenanceOperations,
  createRestartPrivatePostgresEnteredWindowExecutor,
  createStopPrivatePostgresEnteredWindowExecutor,
} = await import("../../src/host-maintenance.js");

function makeState(
  installationId: ReturnType<typeof createInstallationId>,
  instanceId: ReturnType<typeof createInstanceId>,
): BootstrapStateEnvelopeV1 {
  const state: BootstrapStateBodyV1 = {
    schemaVersion: 1,
    revision: 4,
    activeBootstrapRuntimeGeneration: asContentDigest(
      "BootstrapRuntimeGenerationId",
      digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "bootstrap" }),
    ),
    activeProductGeneration: asContentDigest(
      "ProductGenerationId",
      digestCanonicalJson("test.product-generation/v1", { generation: "product" }),
    ),
    continuityEpochId:
      "0197cfe0-0000-7000-8000-000000000001" as BootstrapStateBodyV1["continuityEpochId"],
    privatePostgres: {
      schemaVersion: 1,
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
        digestCanonicalJson("test.private-postgres-profile/v1", {
          profile: "host-maintenance",
        }),
      ),
    },
  };
  return sealBootstrapState(state) as BootstrapStateEnvelopeV1;
}

function makeFixture(): {
  readonly rawHost: HostOwnershipContext;
  readonly context: OwnedBootstrapPreludeHandoffContext;
  readonly handoff: HostOwnershipHandoffOptions;
  readonly descriptor: PrivatePostgresMaintenanceDescriptor;
  readonly freshLease: BootstrapOwnershipLease;
  readonly state: BootstrapStateEnvelopeV1;
  readonly access: unknown;
  readonly trace: string[];
  readonly setFailJournalStage: (stage: MaintenanceStage | undefined) => void;
  readonly setDelayJournalStage: (stage: MaintenanceStage | undefined) => void;
  readonly setRecoveredPrevious: (value: boolean) => void;
  readonly waitForDelayedJournalStage: () => Promise<void>;
  readonly releaseDelayedJournal: () => void;
} {
  const trace: string[] = [];
  let failJournalStage: MaintenanceStage | undefined;
  let delayJournalStage: MaintenanceStage | undefined;
  let recoveredPrevious = false;
  let releaseDelayedJournal: (() => void) | undefined;
  let resolveDelayedJournalStage: (() => void) | undefined;
  const delayedJournalStageReached = new Promise<void>((resolve) => {
    resolveDelayedJournalStage = resolve;
  });
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
  const root = `/tmp/heptalogos-host-maintenance-${instanceId}`;
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
      if (value.lastCompletedStage === failJournalStage) {
        throw new Error(`journal advance failed: ${value.lastCompletedStage}`);
      }
      if (value.lastCompletedStage === delayJournalStage) {
        resolveDelayedJournalStage?.();
        await new Promise<void>((resolve) => {
          releaseDelayedJournal = resolve;
        });
        releaseDelayedJournal = undefined;
      }
      return { state: value, digest: state.digest };
    },
  };
  const access = {
    journal,
    state: {
      async load() {
        trace.push("state.load");
        if (recoveredPrevious) {
          return {
            status: "RECOVERED_PREVIOUS",
            value: state,
            problem: {
              schemaVersion: 1,
              problemCode: "bootstrap.state.current_corrupt",
              category: "integrity",
              retryClass: "manual",
              title: "Current BootstrapState is corrupt",
              detail: "The previous valid BootstrapState revision was recovered",
            },
          } as const;
        }
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
    async withPrivatePostgresRuntimePassword<T>(
      _context: unknown,
      use: (password: Uint8Array) => Promise<T>,
    ) {
      return use(new TextEncoder().encode("R".repeat(32)));
    },
    async withPrivatePostgresMigrationPassword<T>(
      _context: unknown,
      use: (password: Uint8Array) => Promise<T>,
    ) {
      return use(new TextEncoder().encode("M".repeat(32)));
    },
  };
  const handoff: HostOwnershipHandoffOptions = {
    initializeCanonicalHost: async () => undefined,
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
        state.state.privatePostgres!.initializationProfileRevision,
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
    access,
    trace,
    setFailJournalStage(stage) {
      failJournalStage = stage;
    },
    setDelayJournalStage(stage) {
      delayJournalStage = stage;
    },
    setRecoveredPrevious(value) {
      recoveredPrevious = value;
    },
    waitForDelayedJournalStage() {
      return delayedJournalStageReached;
    },
    releaseDelayedJournal() {
      releaseDelayedJournal?.();
    },
  };
}

describe("reverse-handoff maintenance preparation and entry", () => {
  it("blocks maintenance preparation when only RECOVERED_PREVIOUS state is available", async () => {
    const fixture = makeFixture();
    fixture.setRecoveredPrevious(true);
    const operations = createHostMaintenanceOperations({
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
    });

    await expect(
      operations.preparePrivatePostgresMaintenance({
        kind: "STOP_PRIVATE_POSTGRES",
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.state.current_authority_required" },
    });
  });

  it("stops PostgreSQL, arms the journal, releases bootstrap, and completes", async () => {
    const fixture = makeFixture();
    const stop = vi.fn().mockResolvedValue(undefined);
    mocks.openMaintenanceControllerMock.mockResolvedValue({
      state: "READY",
      stop,
      start: vi.fn(),
    });
    const executor = createStopPrivatePostgresEnteredWindowExecutor({
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      onOldHostTerminal: undefined,
      host: fixture.rawHost,
    });
    const complete = vi.fn();
    const window = {
      operationId: "01a0289d-3af4-734a-bf68-f6dedf9fd50b" as never,
      request: { kind: "STOP_PRIVATE_POSTGRES" as const },
      lease: fixture.freshLease,
      access: fixture.access as never,
      journal: {} as MaintenanceJournalBodyV1,
      async advance(stage: string) {
        fixture.trace.push(`entered.advance:${stage}`);
      },
      complete,
    };

    await expect(executor(window)).resolves.toEqual({ kind: "STOPPED" });
    expect(stop).toHaveBeenCalledOnce();
    expect(fixture.trace).toEqual([
      "entered.advance:POSTGRES_STOPPED",
      "entered.advance:BOOTSTRAP_RELEASE_ARMED",
      "bootstrap.release",
    ]);
    expect(complete).toHaveBeenCalledOnce();
  });

  it("keeps bootstrap ownership and does not start when stop is uncertain", async () => {
    const fixture = makeFixture();
    const start = vi.fn();
    mocks.openMaintenanceControllerMock.mockResolvedValue({
      state: "READY",
      stop: vi.fn().mockRejectedValue(new Error("stop uncertain")),
      start,
    });
    const executor = createStopPrivatePostgresEnteredWindowExecutor({
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      onOldHostTerminal: undefined,
      host: fixture.rawHost,
    });
    const complete = vi.fn();
    const window = {
      operationId: "01a0289d-3af4-734a-bf68-f6dedf9fd50b" as never,
      request: { kind: "STOP_PRIVATE_POSTGRES" as const },
      lease: fixture.freshLease,
      access: {} as never,
      journal: {} as MaintenanceJournalBodyV1,
      async advance() {},
      complete,
    };

    await expect(executor(window)).rejects.toThrow("stop uncertain");
    expect(fixture.freshLease.state).toBe("HELD");
    expect(start).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

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

  it("quiesces before raw Host close and leaves PostgreSQL lifecycle untouched", async () => {
    const fixture = makeFixture();
    const operations = createHostMaintenanceOperations({
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      onOldHostTerminal: () => fixture.trace.push("old-host.terminal"),
    });

    await operations.shutdownKeepingPrivatePostgres({
      async quiesce() {
        fixture.trace.push("quiesce");
        return { async resumeAfterAbort() {} };
      },
    });

    expect(fixture.trace).toEqual(["quiesce", "host.close", "old-host.terminal"]);
    expect(fixture.rawHost.state).toBe("CLOSED");
  });

  it("does not close the raw Host when quiescence cannot be proven", async () => {
    const fixture = makeFixture();
    const operations = createHostMaintenanceOperations({
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
    });

    await expect(
      operations.shutdownKeepingPrivatePostgres({
        async quiesce() {
          throw new Error("quiescence failed");
        },
      }),
    ).rejects.toThrow("quiescence failed");
    expect(fixture.rawHost.state).toBe("ACTIVE");
    expect(fixture.trace).not.toContain("host.close");
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
      "host.close",
      expect.stringMatching(/^journal.advance:HOST_TOKEN_REVOKED$/u),
      expect.stringMatching(/^journal.advance:HOST_LEASE_CLOSED$/u),
      "old-host.terminal",
    ]);
  });

  it("does not durably commit an illegal entered-window transition", async () => {
    const fixture = makeFixture();
    const operations = createHostMaintenanceOperations({
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      executeEnteredWindow: async (window) => {
        await window.advance("POSTGRES_READY");
        return { kind: "STOPPED" as const };
      },
    });
    const prepared = await operations.preparePrivatePostgresMaintenance({
      kind: "STOP_PRIVATE_POSTGRES",
    });

    await expect(
      prepared.execute({
        async quiesce() {
          return { async resumeAfterAbort() {} };
        },
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.maintenance.invalid_transition" },
    });
    expect(fixture.trace).not.toContain("journal.advance:POSTGRES_READY");
    expect(prepared.state).toBe("RECOVERY_REQUIRED");
  });

  it("safely aborts before PONR when revocation is known not committed", async () => {
    const fixture = makeFixture();
    mocks.revokeMock.mockRejectedValueOnce(
      Object.assign(new Error("known not committed"), {
        problem: { problemCode: "host-ownership.revocation.known_not_committed" },
      }),
    );
    let managed: BootstrapManagedHostContext;
    const operationsProvenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      beginOldHostRetirement: async () => {
        markManagedHostTerminal(managed);
        await fixture.rawHost.close();
      },
    };
    const operations = createHostMaintenanceOperations(operationsProvenance);
    managed = createManagedHostContext(fixture.rawHost, operations, persistenceOptions);
    const prepared = await managed.preparePrivatePostgresMaintenance({
      kind: "RESTART_PRIVATE_POSTGRES",
    });
    const quiescence = {
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    };

    await expect(prepared.execute(quiescence)).rejects.toThrow("known not committed");
    expect(fixture.rawHost.state).toBe("ACTIVE");
    expect(() => managed.assertActive()).not.toThrow();
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
    let managed: BootstrapManagedHostContext;
    const operationsProvenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      beginOldHostRetirement: async () => {
        markManagedHostTerminal(managed);
        await fixture.rawHost.close();
      },
    };
    const operations = createHostMaintenanceOperations(operationsProvenance);
    managed = createManagedHostContext(fixture.rawHost, operations, persistenceOptions);
    const prepared = await managed.preparePrivatePostgresMaintenance({
      kind: "RESTART_PRIVATE_POSTGRES",
    });

    await expect(
      prepared.execute({
        async quiesce() {
          return { async resumeAfterAbort() {} };
        },
      }),
    ).rejects.toThrow("commit uncertain");
    expect(fixture.rawHost.state).toBe("CLOSED");
    expect(() => managed.assertActive()).toThrow();
    expect(fixture.freshLease.state).toBe("HELD");
    expect(fixture.trace).toContain("journal.advance:RECOVERY_REQUIRED");
    expect(fixture.trace).not.toContain("bootstrap.release");
  });

  it("retires the old managed Host after committed-but-unverified revocation", async () => {
    const fixture = makeFixture();
    mocks.revokeMock.mockRejectedValueOnce(
      Object.assign(new Error("committed but unverified"), {
        problem: { problemCode: "host-ownership.revocation.committed_unverified" },
      }),
    );
    let managed: BootstrapManagedHostContext;
    const operationsProvenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      beginOldHostRetirement: async () => {
        markManagedHostTerminal(managed);
        await fixture.rawHost.close();
      },
    };
    const operations = createHostMaintenanceOperations(operationsProvenance);
    managed = createManagedHostContext(fixture.rawHost, operations, persistenceOptions);
    const prepared = await managed.preparePrivatePostgresMaintenance({
      kind: "RESTART_PRIVATE_POSTGRES",
    });

    await expect(
      prepared.execute({
        async quiesce() {
          return { async resumeAfterAbort() {} };
        },
      }),
    ).rejects.toThrow("committed but unverified");
    expect(prepared.state).toBe("RECOVERY_REQUIRED");
    expect(fixture.rawHost.state).toBe("CLOSED");
    expect(() => managed.assertActive()).toThrow();
    expect(fixture.freshLease.state).toBe("HELD");
    expect(fixture.trace).not.toContain("bootstrap.release");
  });

  it("retires the old Host before a post-revocation token journal failure can escape", async () => {
    const fixture = makeFixture();
    fixture.setFailJournalStage("HOST_TOKEN_REVOKED");
    let managed: BootstrapManagedHostContext;
    const operationsProvenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      beginOldHostRetirement: async () => {
        markManagedHostTerminal(managed);
        await fixture.rawHost.close();
      },
    };
    const operations = createHostMaintenanceOperations(operationsProvenance);
    managed = createManagedHostContext(fixture.rawHost, operations, persistenceOptions);
    const prepared = await managed.preparePrivatePostgresMaintenance({
      kind: "RESTART_PRIVATE_POSTGRES",
    });

    await expect(
      prepared.execute({
        async quiesce() {
          return { async resumeAfterAbort() {} };
        },
      }),
    ).rejects.toThrow("journal advance failed: HOST_TOKEN_REVOKED");
    expect(prepared.state).toBe("RECOVERY_REQUIRED");
    expect(fixture.rawHost.state).toBe("CLOSED");
    expect(() => managed.assertActive()).toThrow();
    expect(fixture.freshLease.state).toBe("HELD");
    expect(fixture.trace).toContain("journal.advance:RECOVERY_REQUIRED");
    expect(fixture.trace).not.toContain("bootstrap.release");
  });

  it("observes an immediate old Host close rejection while token journal advancement is delayed", async () => {
    const fixture = makeFixture();
    const closeError = new Error("old Host close failed");
    fixture.rawHost.close = vi.fn(async () => {
      throw closeError;
    });
    fixture.setDelayJournalStage("HOST_TOKEN_REVOKED");
    let managed: BootstrapManagedHostContext;
    const operationsProvenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      beginOldHostRetirement: async () => {
        markManagedHostTerminal(managed);
        await fixture.rawHost.close();
      },
    };
    const operations = createHostMaintenanceOperations(operationsProvenance);
    managed = createManagedHostContext(fixture.rawHost, operations, persistenceOptions);
    const prepared = await managed.preparePrivatePostgresMaintenance({
      kind: "RESTART_PRIVATE_POSTGRES",
    });
    const unhandledRejections: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejections.push(reason);
    };
    process.on("unhandledRejection", onUnhandledRejection);

    try {
      const execution = prepared.execute({
        async quiesce() {
          return { async resumeAfterAbort() {} };
        },
      });
      await fixture.waitForDelayedJournalStage();
      await new Promise<void>((resolve) => setImmediate(resolve));
      fixture.releaseDelayedJournal();
      await expect(execution).rejects.toBe(closeError);
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }

    expect(unhandledRejections).toEqual([]);
    expect(prepared.state).toBe("RECOVERY_REQUIRED");
    expect(() => managed.assertActive()).toThrow();
    expect(fixture.freshLease.state).toBe("HELD");
    expect(fixture.trace).toContain("journal.advance:RECOVERY_REQUIRED");
    expect(fixture.trace).not.toContain("bootstrap.release");
  });

  it("surfaces structured failure when safe-abort resume cannot complete", async () => {
    const fixture = makeFixture();
    mocks.revokeMock.mockRejectedValueOnce(
      Object.assign(new Error("known not committed"), {
        problem: { problemCode: "host-ownership.revocation.known_not_committed" },
      }),
    );
    let managed: BootstrapManagedHostContext;
    const operationsProvenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      beginOldHostRetirement: async () => {
        markManagedHostTerminal(managed);
        await fixture.rawHost.close();
      },
    };
    const operations = createHostMaintenanceOperations(operationsProvenance);
    managed = createManagedHostContext(fixture.rawHost, operations, persistenceOptions);
    const prepared = await managed.preparePrivatePostgresMaintenance({
      kind: "RESTART_PRIVATE_POSTGRES",
    });

    await expect(
      prepared.execute({
        async quiesce() {
          return {
            async resumeAfterAbort() {
              throw new Error("resume failed");
            },
          };
        },
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.maintenance.abort_resume_failed" },
    });
    expect(prepared.state).toBe("RECOVERY_REQUIRED");
    expect(fixture.rawHost.state).toBe("CLOSED");
    expect(() => managed.assertActive()).toThrow();
    expect(fixture.freshLease.state).toBe("HELD");
    expect(fixture.trace).toContain("journal.advance:RECOVERY_REQUIRED");
    expect(fixture.trace).not.toContain("bootstrap.release");
  });

  it("restarts the same cluster and returns a fresh managed Host after token publication", async () => {
    const fixture = makeFixture();
    const stop = vi.fn(async () => fixture.trace.push("postgres.stop"));
    const start = vi.fn(async () => fixture.trace.push("postgres.start"));
    mocks.openMaintenanceControllerMock.mockResolvedValue({
      state: "READY",
      stop,
      start,
    });

    let connectionState: "ACTIVE" | "CLOSED" = "ACTIVE";
    const connection = {
      get state() {
        return connectionState;
      },
      signal: new AbortController().signal,
      assertActive() {
        if (connectionState !== "ACTIVE") throw new Error("connection closed");
      },
      fence() {
        connectionState = "CLOSED";
      },
      async query() {
        return { rows: [] };
      },
      async close() {
        fixture.trace.push("new-host.close");
        connectionState = "CLOSED";
      },
    };
    mocks.acquireHostLeaseConnectionMock.mockImplementation(async () => {
      fixture.trace.push("new-host.lease");
      return connection;
    });
    mocks.publishHostOwnershipTokenMock.mockImplementation(async () => {
      fixture.trace.push("new-host.publish");
      return { previousRevision: "8", publishedRevision: "9" };
    });

    let nextRaw!: HostOwnershipContext;
    const managedHost = { state: "ACTIVE" } as never;
    const createHostContext = vi.fn(
      (
        _connection: unknown,
        token: ReturnType<typeof createHostOwnershipToken>,
        bootId = createBootId(),
      ) => {
        nextRaw = {
          installationId: fixture.rawHost.installationId,
          instanceId: fixture.rawHost.instanceId,
          bootId,
          token,
          get state() {
            return connectionState;
          },
          signal: connection.signal,
          assertActive() {
            if (connectionState !== "ACTIVE") throw new Error("new Host is not active");
          },
          close: connection.close,
        };
        return nextRaw;
      },
    );
    const createManagedHost = vi.fn(() => managedHost);
    const initializeCanonicalHost = vi.fn(
      async ({
        authority,
      }: Parameters<HostOwnershipHandoffOptions["initializeCanonicalHost"]>[0]) => {
        fixture.trace.push("canonical.initialize");
        authority.assertCurrent();
      },
    );
    const provenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: { ...fixture.handoff, initializeCanonicalHost },
      privatePostgres: fixture.descriptor,
      createHostToken: createHostOwnershipToken,
      createHostContext,
      createManagedHost,
    };
    let journal = {
      schemaVersion: 1,
      revision: 1,
      operationId: createUuidV7Id("MaintenanceOperationId"),
      activityId: fixture.context.bootstrapActivityId,
      installationId: fixture.rawHost.installationId,
      instanceId: fixture.rawHost.instanceId,
      bootId: fixture.rawHost.bootId,
      operationType: "PRIVATE_POSTGRES_RESTART",
      source: {
        hostOwnershipToken: fixture.rawHost.token,
        hostOwnershipRevision: "7",
        postgresClusterSystemIdentifier:
          fixture.descriptor.expectedIdentity.clusterSystemIdentifier,
        persistedPort: fixture.descriptor.expectedIdentity.persistedPort,
      },
      target: { privatePostgres: "RUNNING_SAME_IDENTITY" },
      verifiedPrerequisites: {
        bootstrapStateDigest: fixture.state.digest,
        privatePostgresInitializationProfileRevision:
          fixture.descriptor.expectedIdentity.initializationProfileRevision,
      },
      lastCompletedStage: "HOST_LEASE_CLOSED",
      updatedAt: "2026-08-22T00:00:00.000Z",
    } as MaintenanceJournalBodyV1;
    const complete = vi.fn(() => fixture.trace.push("entered.complete"));
    const window = {
      operationId: journal.operationId,
      request: { kind: "RESTART_PRIVATE_POSTGRES" as const },
      lease: fixture.freshLease,
      access: fixture.access as never,
      get journal() {
        return journal;
      },
      async advance(
        stage: MaintenanceJournalBodyV1["lastCompletedStage"],
        changes: Partial<MaintenanceJournalBodyV1> = {},
      ) {
        fixture.trace.push(`entered.advance:${stage}`);
        journal = {
          ...journal,
          ...changes,
          revision: journal.revision + 1,
          lastCompletedStage: stage,
        };
      },
      complete,
    };

    await expect(
      createRestartPrivatePostgresEnteredWindowExecutor(provenance)(window),
    ).resolves.toEqual({ kind: "RESTARTED", host: managedHost });

    expect(stop).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledOnce();
    expect(createHostContext).toHaveBeenCalledOnce();
    expect(createManagedHost).toHaveBeenCalledWith(nextRaw);
    expect(nextRaw.bootId).not.toBe(fixture.rawHost.bootId);
    expect(nextRaw.token).not.toBe(fixture.rawHost.token);
    expect(journal.target).toMatchObject({
      privatePostgres: "RUNNING_SAME_IDENTITY",
      hostOwnershipToken: nextRaw.token,
      hostBootId: nextRaw.bootId,
      hostOwnershipRevision: "9",
    });
    expect(connectionState).toBe("ACTIVE");
    expect(fixture.freshLease.state).toBe("RELEASED");
    expect(fixture.trace).toEqual([
      "postgres.stop",
      "entered.advance:POSTGRES_STOPPED",
      "postgres.start",
      "entered.advance:POSTGRES_READY",
      "new-host.lease",
      "entered.advance:HOST_LEASE_ACQUIRED",
      "new-host.publish",
      "entered.advance:HOST_TOKEN_PUBLISHED",
      "state.load",
      "canonical.initialize",
      "entered.advance:BOOTSTRAP_RELEASE_ARMED",
      "bootstrap.release",
      "entered.complete",
    ]);
  });

  it("closes an unverified new lease and keeps bootstrap ownership on publication failure", async () => {
    const fixture = makeFixture();
    mocks.openMaintenanceControllerMock.mockResolvedValue({
      state: "READY",
      stop: vi.fn(),
      start: vi.fn(),
    });
    let closed = false;
    const connection = {
      state: "ACTIVE" as const,
      signal: new AbortController().signal,
      assertActive() {},
      fence() {},
      async query() {
        return { rows: [] };
      },
      async close() {
        closed = true;
      },
    } as never;
    mocks.acquireHostLeaseConnectionMock.mockResolvedValue(connection);
    mocks.publishHostOwnershipTokenMock.mockRejectedValue(
      new Error("token publication failed"),
    );
    const journal = {
      ...({} as MaintenanceJournalBodyV1),
      target: { privatePostgres: "RUNNING_SAME_IDENTITY" },
    } as MaintenanceJournalBodyV1;
    const advance = vi.fn();

    await expect(
      createRestartPrivatePostgresEnteredWindowExecutor({
        host: fixture.rawHost,
        bootstrap: fixture.context,
        handoff: fixture.handoff,
        privatePostgres: fixture.descriptor,
        createHostToken: createHostOwnershipToken,
        createHostContext: vi.fn(),
        createManagedHost: vi.fn(),
      })({
        operationId: "01a0289d-3af4-734a-bf68-f6dedf9fd50b" as never,
        request: { kind: "RESTART_PRIVATE_POSTGRES" },
        lease: fixture.freshLease,
        access: {} as never,
        journal,
        advance,
        complete: vi.fn(),
      }),
    ).rejects.toThrow("token publication failed");

    expect(closed).toBe(true);
    expect(fixture.freshLease.state).toBe("HELD");
    expect(advance).toHaveBeenCalledWith("HOST_LEASE_ACQUIRED");
    expect(advance).not.toHaveBeenCalledWith("HOST_TOKEN_PUBLISHED", expect.anything());
  });

  it("keeps release-armed truth and never returns a new Host when bootstrap release is uncertain", async () => {
    const fixture = makeFixture();
    let leaseState: BootstrapOwnershipLease["state"] = "HELD";
    const releaseLease: BootstrapOwnershipLease = {
      get state() {
        return leaseState;
      },
      signal: new AbortController().signal,
      assertHeld() {
        if (leaseState !== "HELD") throw new Error(`lease ${leaseState}`);
      },
      async release() {
        fixture.trace.push("bootstrap.release");
        leaseState = "COMPROMISED";
        throw new Error("release uncertain");
      },
    };
    mocks.acquireBootstrapOwnershipMock.mockResolvedValue(releaseLease);
    mocks.openMaintenanceControllerMock.mockResolvedValue({
      state: "READY",
      stop: vi.fn(async () => fixture.trace.push("postgres.stop")),
      start: vi.fn(async () => fixture.trace.push("postgres.start")),
    });
    let connectionState: "ACTIVE" | "CLOSED" = "ACTIVE";
    const connection = {
      get state() {
        return connectionState;
      },
      signal: new AbortController().signal,
      assertActive() {
        if (connectionState !== "ACTIVE") throw new Error("connection closed");
      },
      fence() {
        connectionState = "CLOSED";
      },
      async query() {
        return { rows: [] };
      },
      async close() {
        connectionState = "CLOSED";
      },
    };
    mocks.acquireHostLeaseConnectionMock.mockResolvedValue(connection);
    mocks.publishHostOwnershipTokenMock.mockResolvedValue({
      previousRevision: "8",
      publishedRevision: "9",
    });
    const managedHost = { state: "ACTIVE" } as never;
    const provenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      createHostToken: createHostOwnershipToken,
      createHostContext: vi.fn(
        (_connection: unknown, token: ReturnType<typeof createHostOwnershipToken>) =>
          ({
            ...fixture.rawHost,
            token,
            signal: connection.signal,
            get state() {
              return connectionState;
            },
            assertActive() {
              connection.assertActive();
            },
            close: connection.close,
          }) satisfies HostOwnershipContext,
      ),
      createManagedHost: vi.fn(() => managedHost),
    };
    const operations = createHostMaintenanceOperations({
      ...provenance,
      executeEnteredWindow: (window) =>
        createRestartPrivatePostgresEnteredWindowExecutor(provenance)(window),
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
    ).rejects.toThrow("release uncertain");
    expect(prepared.state).toBe("RECOVERY_REQUIRED");
    expect(leaseState).toBe("COMPROMISED");
    expect(connectionState).toBe("CLOSED");
    expect(provenance.createManagedHost).not.toHaveBeenCalled();
    expect(fixture.trace).toContain("journal.advance:BOOTSTRAP_RELEASE_ARMED");
    expect(fixture.trace).not.toContain("journal.advance:RECOVERY_REQUIRED");
  });

  it("does not announce maintenance success when the Host lease dies during bootstrap release", async () => {
    const fixture = makeFixture();
    mocks.openMaintenanceControllerMock.mockResolvedValue({
      state: "READY",
      stop: vi.fn(async () => fixture.trace.push("postgres.stop")),
      start: vi.fn(async () => fixture.trace.push("postgres.start")),
    });
    let leaseState: BootstrapOwnershipLease["state"] = "HELD";
    let connectionState: "ACTIVE" | "CLOSED" = "ACTIVE";
    let closed = false;
    const releaseLease: BootstrapOwnershipLease = {
      get state() {
        return leaseState;
      },
      signal: new AbortController().signal,
      assertHeld() {
        if (leaseState !== "HELD") throw new Error(`lease ${leaseState}`);
      },
      async release() {
        fixture.trace.push("bootstrap.release");
        connectionState = "CLOSED";
        leaseState = "RELEASED";
      },
    };
    const connection = {
      state: "ACTIVE" as const,
      signal: new AbortController().signal,
      assertActive() {
        if (connectionState !== "ACTIVE") throw new Error("connection closed");
      },
      async close() {
        closed = true;
        connectionState = "CLOSED";
      },
    };
    mocks.acquireHostLeaseConnectionMock.mockResolvedValue(connection);
    mocks.publishHostOwnershipTokenMock.mockResolvedValue({
      previousRevision: "8",
      publishedRevision: "9",
    });
    const managedHost = { state: "ACTIVE" } as never;
    let rawHost!: HostOwnershipContext;
    const provenance = {
      host: fixture.rawHost,
      bootstrap: fixture.context,
      handoff: fixture.handoff,
      privatePostgres: fixture.descriptor,
      createHostToken: createHostOwnershipToken,
      createHostContext: vi.fn(
        (
          _connection: unknown,
          token: ReturnType<typeof createHostOwnershipToken>,
          bootId = createBootId(),
        ) => {
          rawHost = {
            installationId: fixture.rawHost.installationId,
            instanceId: fixture.rawHost.instanceId,
            bootId,
            token,
            get state() {
              return connectionState === "ACTIVE" ? "ACTIVE" : "CLOSED";
            },
            signal: connection.signal,
            assertActive: connection.assertActive,
            close: connection.close,
          };
          return rawHost;
        },
      ),
      createManagedHost: vi.fn(() => managedHost),
    };
    const advance = vi.fn(async (stage: string) => {
      fixture.trace.push(`entered.advance:${stage}`);
    });
    const complete = vi.fn();

    await expect(
      createRestartPrivatePostgresEnteredWindowExecutor(provenance)({
        operationId: "01a0289d-3af4-734a-bf68-f6dedf9fd50b" as never,
        request: { kind: "RESTART_PRIVATE_POSTGRES" },
        lease: releaseLease,
        access: fixture.access as never,
        journal: {
          target: { privatePostgres: "RUNNING_SAME_IDENTITY" },
        } as MaintenanceJournalBodyV1,
        advance,
        complete,
      }),
    ).rejects.toThrow("connection closed");

    expect(leaseState).toBe("RELEASED");
    expect(closed).toBe(true);
    expect(complete).not.toHaveBeenCalled();
    expect(provenance.createManagedHost).not.toHaveBeenCalled();
    expect(fixture.trace).toContain("entered.advance:BOOTSTRAP_RELEASE_ARMED");
    expect(fixture.trace).toContain("bootstrap.release");
  });
});
