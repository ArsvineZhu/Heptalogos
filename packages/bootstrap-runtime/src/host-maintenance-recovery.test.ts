import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asContentDigest,
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createUuidV7Id,
  digestCanonicalJson,
  ProblemError,
  type HostOwnershipToken,
} from "@heptalogos/foundation-contracts";
import {
  maintenanceOperationRef,
  sealBootstrapState,
  sealMaintenanceJournal,
  type BootstrapStateBodyV2,
  type MaintenanceJournalBodyV1,
  type MaintenanceJournalRecoveryHead,
  type MaintenanceOperationId,
  type MaintenanceStage,
} from "@heptalogos/bootstrap-state";
import type { BootstrapLocatorV1 } from "./locator.js";
import type { PrivatePostgresMaintenanceDescriptor } from "./private-postgres-bootstrap.js";
import type { BootstrapOwnershipLease } from "./bootstrap-ownership.js";

const mocks = vi.hoisted(() => ({
  inspectRecovery: vi.fn(),
  acquireRecoveryLease: vi.fn(),
  openMaintenanceStateAccess: vi.fn(),
  openMaintenanceController: vi.fn(),
  inspectAdvisory: vi.fn(),
  inspectSnapshot: vi.fn(),
  acquireHostLeaseConnection: vi.fn(),
  revoke: vi.fn(),
  publish: vi.fn(),
}));

vi.mock("./bootstrap-recovery.js", async () => {
  const actual = await vi.importActual<typeof import("./bootstrap-recovery.js")>(
    "./bootstrap-recovery.js",
  );
  return {
    ...actual,
    inspectBootstrapRecovery: mocks.inspectRecovery,
    acquireBootstrapRecoveryLease: mocks.acquireRecoveryLease,
  };
});

vi.mock("./maintenance-state-access.js", () => ({
  openMaintenanceStateAccess: mocks.openMaintenanceStateAccess,
}));

vi.mock("@heptalogos/private-postgres", async () => {
  const actual = await vi.importActual<typeof import("@heptalogos/private-postgres")>(
    "@heptalogos/private-postgres",
  );
  return {
    ...actual,
    openPrivatePostgresMaintenanceController: mocks.openMaintenanceController,
  };
});

vi.mock("@heptalogos/host-ownership", async () => {
  const actual = await vi.importActual<typeof import("@heptalogos/host-ownership")>(
    "@heptalogos/host-ownership",
  );
  return {
    ...actual,
    acquireHostLeaseConnection: mocks.acquireHostLeaseConnection,
    inspectHostAdvisoryLease: mocks.inspectAdvisory,
    inspectHostOwnershipCanonicalSnapshot: mocks.inspectSnapshot,
    publishHostOwnershipToken: mocks.publish,
    revokeHostOwnershipTokenForBootstrap: mocks.revoke,
  };
});

const { recoverInterruptedHostMaintenance } =
  await import("./host-maintenance-recovery.js");

const directories: string[] = [];

function makeState(
  installationId: ReturnType<typeof createInstallationId>,
  instanceId: ReturnType<typeof createInstanceId>,
  descriptor: PrivatePostgresMaintenanceDescriptor,
  operationId?: MaintenanceOperationId,
) {
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
    ...(operationId === undefined
      ? {}
      : { lastCommittedOperationRef: maintenanceOperationRef(operationId) }),
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
      persistedPort: descriptor.expectedIdentity.persistedPort,
      clusterSystemIdentifier: descriptor.expectedIdentity.clusterSystemIdentifier,
      initializationProfileRevision:
        descriptor.expectedIdentity.initializationProfileRevision,
    },
  };
  return sealBootstrapState(state);
}

async function makeFixture() {
  const anchorRoot = await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-"));
  directories.push(anchorRoot);
  const roots = {
    PROGRAM: anchorRoot,
    INSTANCE: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-instance-")),
    CONFIGURATION: await mkdtemp(
      join(tmpdir(), "heptalogos-recovery-executor-configuration-"),
    ),
    DATA: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-data-")),
    SECRET: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-secret-")),
    BLOB: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-blob-")),
    BACKUP: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-backup-")),
    LOG: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-log-")),
    CACHE: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-cache-")),
    TEMP: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-temp-")),
    RUN: await mkdtemp(join(tmpdir(), "heptalogos-recovery-executor-run-")),
    PACKAGE_STAGING: await mkdtemp(
      join(tmpdir(), "heptalogos-recovery-executor-package-staging-"),
    ),
  } as const;
  directories.push(...Object.values(roots).filter((root) => root !== anchorRoot));
  const locator: BootstrapLocatorV1 = {
    schemaVersion: 1,
    installationId: createInstallationId(),
    instanceId: createInstanceId(),
    roots,
  };
  await writeFile(
    join(anchorRoot, "heptalogos.bootstrap.json"),
    JSON.stringify(locator),
  );

  const descriptor: PrivatePostgresMaintenanceDescriptor = {
    toolchain: {
      version: "18.6",
      major: 18,
      binDirectory: roots.PROGRAM,
      postgres: join(roots.PROGRAM, "postgres"),
      initdb: join(roots.PROGRAM, "initdb"),
      pgCtl: join(roots.PROGRAM, "pg_ctl"),
      pgControldata: join(roots.PROGRAM, "pg_controldata"),
      pgIsReady: join(roots.PROGRAM, "pg_isready"),
    },
    placement: {
      rootId: "DATA",
      relativePath: "private-postgres",
      dataLayoutVersion: 1,
      canonicalDataDirectory: join(roots.DATA, "private-postgres"),
    },
    expectedIdentity: {
      installationId: locator.installationId,
      instanceId: locator.instanceId,
      postgresMajor: 18,
      bootstrapRoleName: "heptalogos_bootstrap",
      placement: {
        rootId: "DATA",
        relativePath: "private-postgres",
        dataLayoutVersion: 1,
      },
      persistedPort: 55432,
      clusterSystemIdentifier: "12345678901234567890",
      initializationProfileRevision: asContentDigest(
        "PrivatePostgresInitializationProfileRevision",
        digestCanonicalJson("test.private-postgres-profile/v1", { profile: "m5b" }),
      ),
    },
    logFilePath: join(roots.LOG, "private-postgres.log"),
    lifecycle: {
      startupTimeoutMs: 1_000,
      shutdownTimeoutMs: 1_000,
      readinessPollIntervalMs: 10,
    },
  };

  return { anchorRoot, locator, roots, descriptor };
}

function makeLease(trace: string[]) {
  let state: BootstrapOwnershipLease["state"] = "HELD";
  return {
    get state() {
      return state;
    },
    signal: new AbortController().signal,
    assertHeld() {
      if (state !== "HELD") throw new Error(`lease ${state}`);
    },
    async release() {
      trace.push("bootstrap.release");
      state = "RELEASED";
    },
  } satisfies BootstrapOwnershipLease;
}

function makeHostConnection(trace: string[]) {
  return {
    state: "ACTIVE" as const,
    signal: new AbortController().signal,
    assertActive() {},
    async close() {
      trace.push("host-lease.close");
    },
  };
}

function configure(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  stage: MaintenanceStage,
  operationType: "PRIVATE_POSTGRES_RESTART" | "PRIVATE_POSTGRES_STOP",
  actualPostgres: "READY" | "STOPPED",
  fenceToken: HostOwnershipToken | null,
) {
  const trace: string[] = [];
  const sourceToken = createHostOwnershipToken();
  const historicalBootId = createBootId();
  const operationId = createUuidV7Id("MaintenanceOperationId");
  const state = makeState(
    fixture.locator.installationId,
    fixture.locator.instanceId,
    fixture.descriptor,
    operationId,
  );
  const body: MaintenanceJournalBodyV1 = {
    schemaVersion: 1,
    revision: 4,
    operationId,
    activityId: createUuidV7Id("ActivityId"),
    installationId: fixture.locator.installationId,
    instanceId: fixture.locator.instanceId,
    bootId: historicalBootId,
    operationType,
    source: {
      hostOwnershipToken: sourceToken,
      hostOwnershipRevision: "7",
      postgresClusterSystemIdentifier:
        fixture.descriptor.expectedIdentity.clusterSystemIdentifier,
      persistedPort: fixture.descriptor.expectedIdentity.persistedPort,
    },
    target: {
      privatePostgres:
        operationType === "PRIVATE_POSTGRES_RESTART"
          ? "RUNNING_SAME_IDENTITY"
          : "STOPPED",
    },
    verifiedPrerequisites: {
      bootstrapStateDigest: state.digest,
      privatePostgresInitializationProfileRevision:
        fixture.descriptor.expectedIdentity.initializationProfileRevision,
    },
    lastCompletedStage: stage,
    updatedAt: "2026-08-22T08:30:00.000Z",
  };
  const current = sealMaintenanceJournal(body);
  const head: MaintenanceJournalRecoveryHead = {
    current,
    effectiveProgressStage: stage,
  };
  const lease = makeLease(trace);
  const connection = makeHostConnection(trace);
  let currentPostgres = actualPostgres;
  const stop = vi.fn().mockImplementation(async () => trace.push("postgres.stop"));
  stop.mockImplementation(async () => {
    trace.push("postgres.stop");
    currentPostgres = "STOPPED";
  });
  const start = vi.fn().mockImplementation(async () => {
    trace.push("postgres.start");
    currentPostgres = "READY";
  });
  const stateAccess = {
    state: {
      async load() {
        trace.push("state.load");
        return { status: "CURRENT", value: state } as const;
      },
    },
    journal: {
      advancedBodies: [] as MaintenanceJournalBodyV1[],
      async loadRecoveryHead() {
        trace.push("journal.head");
        return head;
      },
      async advance(next: MaintenanceJournalBodyV1) {
        this.advancedBodies.push(next);
        trace.push(`journal.advance:${next.lastCompletedStage}`);
        return sealMaintenanceJournal(next);
      },
    },
  };
  mocks.inspectRecovery.mockResolvedValue({
    anchorRoot: fixture.anchorRoot,
    installationId: fixture.locator.installationId,
    instanceId: fixture.locator.instanceId,
    instanceRoot: fixture.roots.INSTANCE,
    recoveryBootId: createBootId(),
    recoveryActivityId: createUuidV7Id("ActivityId"),
    disposition: "ABANDONED_OWNER_ELIGIBLE",
    lockPresent: true,
    attempts: [],
    attemptProcessStatuses: [],
    bootstrapState: { status: "CURRENT", value: state },
    operationId: body.operationId,
    maintenance: { status: "CURRENT", value: current },
  });
  mocks.acquireRecoveryLease.mockResolvedValue(lease);
  mocks.openMaintenanceStateAccess.mockReturnValue(stateAccess);
  mocks.openMaintenanceController.mockResolvedValue({
    get state() {
      return currentPostgres;
    },
    stop,
    start,
  });
  mocks.inspectSnapshot.mockResolvedValue({
    roles: [],
    database: [],
    schema: [],
    table: [],
    fence: [
      {
        instance_id: fixture.locator.instanceId,
        ownership_revision: "7",
        host_ownership_token: fenceToken,
        boot_id: fenceToken === null ? null : historicalBootId,
      },
    ],
  });
  mocks.acquireHostLeaseConnection.mockResolvedValue(connection);
  mocks.revoke.mockImplementation(async () => {
    trace.push("fence.revoke");
    return { previousRevision: "7", revokedRevision: "8" };
  });
  mocks.publish.mockImplementation(async () => {
    trace.push("fence.publish");
    return { previousRevision: "8", publishedRevision: "9" };
  });

  return {
    body,
    current,
    lease,
    connection,
    stop,
    start,
    trace,
    state,
    sourceToken,
    advancedBodies: stateAccess.journal.advancedBodies,
  };
}

function options(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  createHostToken?: () => HostOwnershipToken,
) {
  return {
    anchorRoot: fixture.anchorRoot,
    principal: {} as never,
    keyProvider: {
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
    },
    timing: {
      connectionTimeoutMs: 1_000,
      statementTimeoutMs: 1_000,
      fenceLockTimeoutMs: 1_000,
      keepAliveInitialDelayMs: 1_000,
    },
    privatePostgres: fixture.descriptor,
    createHostToken,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.inspectAdvisory.mockResolvedValue({ live: false, backendPids: [] });
});

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("fixed M5B host-maintenance recovery", () => {
  it("blocks a live advisory Host before PostgreSQL stop or fence mutation", async () => {
    const fixture = await makeFixture();
    const configured = configure(
      fixture,
      "HOST_LEASE_CLOSED",
      "PRIVATE_POSTGRES_STOP",
      "READY",
      null,
    );
    mocks.inspectSnapshot.mockResolvedValue({
      roles: [],
      database: [],
      schema: [],
      table: [],
      fence: [
        {
          instance_id: fixture.locator.instanceId,
          ownership_revision: "7",
          host_ownership_token: configured.sourceToken,
          boot_id: configured.body.bootId,
        },
      ],
    });
    mocks.acquireHostLeaseConnection.mockRejectedValue(
      new ProblemError({
        schemaVersion: 1,
        problemCode: "host-ownership.lease.busy",
        category: "host-ownership",
        retryClass: "after-change",
        title: "busy",
        detail: "live Host",
      }),
    );
    mocks.inspectAdvisory.mockResolvedValue({ live: true, backendPids: [1234] });

    await expect(
      recoverInterruptedHostMaintenance(options(fixture)),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.recovery.live_host_owner" },
    });
    expect(configured.stop).not.toHaveBeenCalled();
    expect(mocks.revoke).not.toHaveBeenCalled();
    expect(configured.lease.state).toBe("RELEASED");
  });

  it("blocks an unexpected fence token before lifecycle mutation", async () => {
    const fixture = await makeFixture();
    const configured = configure(
      fixture,
      "HOST_LEASE_CLOSED",
      "PRIVATE_POSTGRES_STOP",
      "READY",
      createHostOwnershipToken(),
    );

    await expect(
      recoverInterruptedHostMaintenance(options(fixture)),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.recovery.unexpected_fence_token" },
    });
    expect(configured.stop).not.toHaveBeenCalled();
    expect(mocks.acquireHostLeaseConnection).not.toHaveBeenCalled();
    expect(configured.lease.state).toBe("RELEASED");
  });

  it("blocks a wrong cluster identity before opening a lifecycle mutation", async () => {
    const fixture = await makeFixture();
    configure(fixture, "HOST_LEASE_CLOSED", "PRIVATE_POSTGRES_STOP", "READY", null);
    mocks.openMaintenanceController.mockRejectedValue(
      new ProblemError({
        schemaVersion: 1,
        problemCode: "private-postgres.cluster.identity_mismatch",
        category: "integrity",
        retryClass: "manual",
        title: "identity mismatch",
        detail: "wrong cluster",
      }),
    );

    await expect(
      recoverInterruptedHostMaintenance(options(fixture)),
    ).rejects.toMatchObject({
      problem: { problemCode: "private-postgres.cluster.identity_mismatch" },
    });
    expect(mocks.acquireHostLeaseConnection).not.toHaveBeenCalled();
    expect(mocks.revoke).not.toHaveBeenCalled();
  });

  it("does not perform a second restart after POSTGRES_STOPPED", async () => {
    const fixture = await makeFixture();
    const configured = configure(
      fixture,
      "POSTGRES_STOPPED",
      "PRIVATE_POSTGRES_RESTART",
      "STOPPED",
      null,
    );

    const result = await recoverInterruptedHostMaintenance(options(fixture));

    expect(result.kind).toBe("RESTARTED");
    expect(configured.start).toHaveBeenCalledOnce();
    expect(configured.stop).not.toHaveBeenCalled();
    expect(mocks.publish).toHaveBeenCalledOnce();
    expect(configured.trace).toContain("fence.publish");
    expect(configured.lease.state).toBe("RELEASED");
  });

  it("arms the fresh token before publication and preserves source BootId in recovery revisions", async () => {
    const fixture = await makeFixture();
    const configured = configure(
      fixture,
      "POSTGRES_STOPPED",
      "PRIVATE_POSTGRES_RESTART",
      "STOPPED",
      null,
    );

    await recoverInterruptedHostMaintenance(options(fixture));

    const recoveryBootId = (
      mocks.acquireRecoveryLease.mock.calls[0]?.[2] as {
        bootId: ReturnType<typeof createBootId>;
      }
    ).bootId;
    const armedIndex = configured.trace.indexOf(
      "journal.advance:HOST_TOKEN_PUBLICATION_ARMED",
    );
    const publishIndex = configured.trace.indexOf("fence.publish");
    expect(armedIndex).toBeGreaterThanOrEqual(0);
    expect(armedIndex).toBeLessThan(publishIndex);

    const armed = configured.advancedBodies.find(
      (body) => body.lastCompletedStage === "HOST_TOKEN_PUBLICATION_ARMED",
    );
    expect(armed?.target.hostOwnershipToken).toBeDefined();
    expect(armed?.target.hostBootId).toBe(recoveryBootId);
    expect(armed?.target.hostOwnershipRevision).toBeUndefined();
    expect(configured.advancedBodies).not.toHaveLength(0);
    expect(
      configured.advancedBodies.every((body) => body.bootId === configured.body.bootId),
    ).toBe(true);
  });

  it("rejects a source-token reuse attempt and retains bootstrap ownership after mutation", async () => {
    const fixture = await makeFixture();
    const configured = configure(
      fixture,
      "POSTGRES_STOPPED",
      "PRIVATE_POSTGRES_RESTART",
      "STOPPED",
      null,
    );

    await expect(
      recoverInterruptedHostMaintenance(options(fixture, () => configured.sourceToken)),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.recovery.fresh_token_invalid" },
    });
    expect(configured.start).toHaveBeenCalledOnce();
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(configured.lease.state).toBe("HELD");
  });
});
