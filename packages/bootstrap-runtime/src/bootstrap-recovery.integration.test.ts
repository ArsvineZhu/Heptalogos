import { execFile } from "node:child_process";
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import {
  BootstrapOwnerWitnessStore,
  BootstrapStateStore,
  MaintenanceJournalStore,
  type BootstrapStateBodyV2,
  type BootstrapStateBodyV1,
  type BootstrapStateEnvelopeV2,
  type MaintenanceJournalBodyV1,
} from "@heptalogos/bootstrap-state";
import {
  asContentDigest,
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createUuidV7Id,
  digestCanonicalJson,
  LIFECYCLE_ROOT_IDS,
  type LifecycleRootId,
  type HostOwnershipToken,
} from "@heptalogos/foundation-contracts";
import {
  acquireHostLeaseConnection,
  deriveHostAdvisoryKey,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  inspectHostOwnershipCanonicalSnapshot,
  publishHostOwnershipToken,
  type BootstrapAdminPasswordProvider,
  type HostOwnershipTimingOptions,
} from "@heptalogos/host-ownership";
import {
  resolvePrivatePostgresToolchain,
  type PrivatePostgresToolchain,
} from "@heptalogos/private-postgres";
import type {
  BootstrapKeyProvider,
  BootstrapKeyRequestContext,
} from "./bootstrap-key-provider.js";
import { recoverInterruptedHostMaintenance } from "./host-maintenance-recovery.js";
import { acquireBootstrapOwnership } from "./bootstrap-ownership.js";
import { openMaintenanceStateAccess } from "./maintenance-state-access.js";
import { prepareBootstrapPrelude } from "./bootstrap-prelude.js";
import {
  getPrivatePostgresMaintenanceDescriptor,
  type ReadyPrivatePostgres,
} from "./private-postgres-bootstrap.js";
import type { BootstrapManagedHostContext } from "./managed-host.js";
import { proveLocalInstallationOwner } from "./local-installation-owner.js";
import { loadBootstrapLocator } from "./locator.js";
import { resolveBootstrapPathProfile } from "./roots.js";

const qualifiedPgBin =
  process.env.HEPTALOGOS_TEST_PG_BIN ??
  (() => {
    throw new Error(
      "BLOCKED: HEPTALOGOS_TEST_PG_BIN is required for M5B PostgreSQL recovery qualification",
    );
  })();
const execFileAsync = promisify(execFile);
const directories: string[] = [];
const postgresDataDirectories: string[] = [];
const LOCK_DIRECTORY = ".heptalogos-bootstrap.lock";
const LIFECYCLE = {
  startupTimeoutMs: 60_000,
  shutdownTimeoutMs: 30_000,
  readinessPollIntervalMs: 100,
} as const;
const HOST_TIMING: HostOwnershipTimingOptions = {
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  fenceLockTimeoutMs: 10_000,
  keepAliveInitialDelayMs: 1_000,
};

interface Fixture {
  readonly anchorRoot: string;
  readonly roots: Readonly<Record<LifecycleRootId, string>>;
  readonly installationId: ReturnType<typeof createInstallationId>;
  readonly instanceId: ReturnType<typeof createInstanceId>;
}

interface InterruptedOperation {
  readonly fixture: Fixture;
  readonly host: BootstrapManagedHostContext;
  readonly ready: ReadyPrivatePostgres;
  readonly operationId: MaintenanceJournalBodyV1["operationId"];
  readonly state: BootstrapStateEnvelopeV2;
}

function makeState(): BootstrapStateBodyV1 {
  return {
    schemaVersion: 1,
    revision: 1,
    activeBootstrapRuntimeGeneration: asContentDigest(
      "BootstrapRuntimeGenerationId",
      digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "bootstrap" }),
    ),
    activeProductGeneration: asContentDigest(
      "ProductGenerationId",
      digestCanonicalJson("test.product-generation/v1", { generation: "product" }),
    ),
  };
}

async function makeFixture(port: number): Promise<Fixture> {
  const anchorRoot = await mkdtemp(join(tmpdir(), "heptalogos-m5b-recovery-anchor-"));
  directories.push(anchorRoot);
  const roots = {} as Record<LifecycleRootId, string>;
  for (const id of LIFECYCLE_ROOT_IDS) {
    roots[id] =
      id === "PROGRAM"
        ? anchorRoot
        : await mkdtemp(join(tmpdir(), `heptalogos-m5b-recovery-${id.toLowerCase()}-`));
    if (id !== "PROGRAM") directories.push(roots[id]);
  }
  const installationId = createInstallationId();
  const instanceId = createInstanceId();
  await writeFile(
    join(anchorRoot, "heptalogos.bootstrap.json"),
    JSON.stringify({
      schemaVersion: 1,
      installationId,
      instanceId,
      roots,
    }),
  );
  await new BootstrapStateStore(join(roots.INSTANCE, "bootstrap-state")).commit(
    makeState(),
  );
  return { anchorRoot, roots, installationId, instanceId };
}

function makeKeyProvider(): BootstrapKeyProvider {
  return {
    async withPrivatePostgresBootstrapPassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      const password = new TextEncoder().encode(
        "M5A_TEST_BOOTSTRAP_PASSWORD_0123456789",
      );
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
    async withPrivatePostgresHostLeasePassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      const password = new TextEncoder().encode(
        "M5A_TEST_HOST_LEASE_PASSWORD_0123456789",
      );
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
  };
}

function passwordProvider(
  keyProvider: BootstrapKeyProvider,
  installationId: Fixture["installationId"],
  instanceId: Fixture["instanceId"],
  bootId: ReturnType<typeof createBootId>,
): BootstrapAdminPasswordProvider {
  return {
    withBootstrapPassword(use) {
      return keyProvider.withPrivatePostgresBootstrapPassword(
        {
          installationId,
          instanceId,
          bootId,
          purpose: "private-postgres-bootstrap-superuser",
        },
        use,
      );
    },
    withHostLeasePassword(use) {
      return keyProvider.withPrivatePostgresHostLeasePassword(
        {
          installationId,
          instanceId,
          bootId,
          purpose: "private-postgres-host-lease-role",
        },
        use,
      );
    },
  };
}

async function makeInterruptedOperation(
  fixture: Fixture,
  port: number,
  operationType: MaintenanceJournalBodyV1["operationType"],
): Promise<InterruptedOperation> {
  const keyProvider = makeKeyProvider();
  const postgresDataDirectory = join(fixture.roots.DATA, "private-postgres");
  postgresDataDirectories.push(postgresDataDirectory);
  const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
  const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
  const ready = await owned.preparePrivatePostgres({
    toolchainBinDirectory: qualifiedPgBin,
    initialPort: port,
    lifecycle: LIFECYCLE,
    keyProvider,
  });
  const host = await owned.handoffPrivatePostgresToHost(ready, {
    keyProvider,
    timing: HOST_TIMING,
  });

  const locator = await loadBootstrapLocator(fixture.anchorRoot);
  const profile = await resolveBootstrapPathProfile(locator);
  const operationBootId = host.bootId;
  const lease = await acquireBootstrapOwnership(profile.resolve("INSTANCE"), {
    heartbeatMs: 1_000,
    bootId: operationBootId,
  });
  try {
    const access = openMaintenanceStateAccess(profile, lease);
    const loaded = await access.state.load();
    if (
      loaded.status !== "CURRENT" ||
      loaded.value.state.schemaVersion !== 2 ||
      loaded.value.state.privatePostgres.schemaVersion !== 2
    ) {
      throw new Error("M5B fixture BootstrapState V2 was not available");
    }
    const state = loaded.value as BootstrapStateEnvelopeV2;
    const snapshot = await inspectHostOwnershipCanonicalSnapshot({
      port,
      passwordProvider: passwordProvider(
        keyProvider,
        fixture.installationId,
        fixture.instanceId,
        operationBootId,
      ),
    });
    const row = snapshot.fence[0];
    if (row === undefined || row.host_ownership_token === null) {
      throw new Error("M5B fixture did not observe source Host token");
    }
    const operationId = createUuidV7Id("MaintenanceOperationId");
    const body: MaintenanceJournalBodyV1 = {
      schemaVersion: 1,
      revision: 1,
      operationId,
      activityId: createUuidV7Id("ActivityId"),
      installationId: fixture.installationId,
      instanceId: fixture.instanceId,
      bootId: operationBootId,
      operationType,
      source: {
        hostOwnershipToken: row.host_ownership_token as never,
        hostOwnershipRevision: String(row.ownership_revision),
        postgresClusterSystemIdentifier:
          state.state.privatePostgres.clusterSystemIdentifier,
        persistedPort: state.state.privatePostgres.persistedPort,
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
          state.state.privatePostgres.initializationProfileRevision,
      },
      lastCompletedStage: "HOST_QUIESCED",
      updatedAt: new Date().toISOString(),
    };
    await access.journal.create(body);
    await access.commitOperationPointer(operationId);
    return { fixture, host, ready, operationId, state };
  } finally {
    await lease.release();
  }
}

async function leaveAbandonedLock(
  fixture: Fixture,
  bootId: ReturnType<typeof createBootId>,
) {
  const lockPath = join(fixture.roots.INSTANCE, LOCK_DIRECTORY);
  await mkdir(lockPath);
  const staleAt = new Date(Date.now() - 31_000);
  await utimes(lockPath, staleAt, staleAt);
  await new BootstrapOwnerWitnessStore(fixture.roots.INSTANCE).createAttempt({
    schemaVersion: 1,
    phase: "ATTEMPT",
    lockGenerationId: createUuidV7Id("BootstrapLockGenerationId"),
    bootId,
    pid: 999_999,
    processStartedAtMs: 0,
    heartbeatMs: 1_000,
    createdAt: new Date().toISOString(),
  });
}

async function stopPostgres(
  toolchain: PrivatePostgresToolchain,
  dataDirectory: string,
) {
  try {
    await access(join(dataDirectory, "postmaster.pid"));
  } catch {
    return;
  }
  await execFileAsync(
    toolchain.pgCtl,
    ["stop", "--pgdata", dataDirectory, "--mode=fast", "--wait", "--timeout", "60"],
    { timeout: 70_000 },
  ).catch(() => undefined);
}

async function postmasterPid(dataDirectory: string): Promise<string> {
  const text = await readFile(join(dataDirectory, "postmaster.pid"), "utf8");
  const pid = text.split("\n", 1)[0]?.trim();
  if (pid === undefined || pid.length === 0) throw new Error("postmaster.pid is empty");
  return pid;
}

async function clusterSystemIdentifier(
  toolchain: PrivatePostgresToolchain,
  dataDirectory: string,
): Promise<string> {
  const result = await execFileAsync(toolchain.pgControldata, [
    "--pgdata",
    dataDirectory,
  ]);
  const identifier = result.stdout.match(/Database system identifier:\s+(\d+)/u)?.[1];
  if (identifier === undefined) throw new Error("pg_controldata identity was missing");
  return identifier;
}

async function postmasterStartTime(
  fixture: Fixture,
  port: number,
  keyProvider: BootstrapKeyProvider,
  bootId: ReturnType<typeof createBootId>,
): Promise<string> {
  let client: Client | undefined;
  await keyProvider.withPrivatePostgresBootstrapPassword(
    {
      installationId: fixture.installationId,
      instanceId: fixture.instanceId,
      bootId,
      purpose: "private-postgres-bootstrap-superuser",
    },
    async (passwordUtf8) => {
      client = new Client({
        host: "127.0.0.1",
        port,
        database: "heptalogos",
        user: "heptalogos_bootstrap",
        password: new TextDecoder().decode(passwordUtf8),
        connectionTimeoutMillis: 10_000,
      });
      await client.connect();
    },
  );
  if (client === undefined)
    throw new Error("PostgreSQL admin client was not connected");
  try {
    const result = await client.query<{ readonly started_at: string }>(
      "SELECT pg_postmaster_start_time()::text AS started_at",
    );
    const startedAt = result.rows[0]?.started_at;
    if (startedAt === undefined)
      throw new Error("postmaster start time was not returned");
    return startedAt;
  } finally {
    await client.end();
  }
}

async function assertReady(
  toolchain: PrivatePostgresToolchain,
  port: number,
): Promise<void> {
  await execFileAsync(toolchain.pgIsReady, [
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
  ]);
}

async function advanceJournalStage(
  fixture: Fixture,
  operationId: MaintenanceJournalBodyV1["operationId"],
  stage: MaintenanceJournalBodyV1["lastCompletedStage"],
  changes: Partial<MaintenanceJournalBodyV1> = {},
): Promise<MaintenanceJournalBodyV1> {
  const store = new MaintenanceJournalStore(fixture.roots.INSTANCE);
  const loaded = await store.load(operationId);
  if (loaded.status !== "CURRENT") throw new Error("MaintenanceJournal is not current");
  const next: MaintenanceJournalBodyV1 = {
    ...loaded.value.state,
    ...changes,
    target: { ...loaded.value.state.target, ...(changes.target ?? {}) },
    revision: loaded.value.state.revision + 1,
    lastCompletedStage: stage,
    updatedAt: new Date().toISOString(),
  };
  await store.advance(next);
  return next;
}

async function publishHistoricalTarget(
  fixture: Fixture,
  port: number,
  token: HostOwnershipToken,
  bootId: ReturnType<typeof createBootId>,
): Promise<string> {
  const keyProvider = makeKeyProvider();
  const locator = await loadBootstrapLocator(fixture.anchorRoot);
  const profile = await resolveBootstrapPathProfile(locator);
  const lease = await acquireBootstrapOwnership(profile.resolve("INSTANCE"), {
    heartbeatMs: 1_000,
    bootId,
  });
  let connection: Awaited<ReturnType<typeof acquireHostLeaseConnection>> | undefined;
  try {
    connection = await acquireHostLeaseConnection({
      target: {
        host: "127.0.0.1",
        port,
        database: HOST_OWNERSHIP_CANONICAL_DATABASE,
      },
      advisoryKey: deriveHostAdvisoryKey(fixture.instanceId),
      timing: HOST_TIMING,
      passwordProvider: passwordProvider(
        keyProvider,
        fixture.installationId,
        fixture.instanceId,
        bootId,
      ),
      mutationAuthority: { assertCurrent: () => lease.assertHeld() },
    });
    const publication = await publishHostOwnershipToken({
      connection,
      instanceId: fixture.instanceId,
      bootId,
      token,
      fenceLockTimeoutMs: HOST_TIMING.fenceLockTimeoutMs,
      statementTimeoutMs: HOST_TIMING.statementTimeoutMs,
      mutationAuthority: { assertCurrent: () => lease.assertHeld() },
    });
    return publication.publishedRevision;
  } finally {
    await connection?.close().catch(() => undefined);
    await lease.release().catch(() => undefined);
  }
}

afterEach(async () => {
  const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
  await Promise.all(
    postgresDataDirectories
      .splice(0)
      .map((dataDirectory) => stopPostgres(toolchain, dataDirectory)),
  );
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe.sequential("M5B PostgreSQL 18.6 recovery qualification", () => {
  it("PG-2 recovers after PostgreSQL READY interruption with same cluster identity and fresh Host", async () => {
    const fixture = await makeFixture(55530);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55530,
      "PRIVATE_POSTGRES_RESTART",
    );
    const keyProvider = makeKeyProvider();
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    const oldPid = await postmasterPid(descriptor.placement.canonicalDataDirectory);
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await leaveAbandonedLock(fixture, interrupted.host.bootId);
    const principal = await proveLocalInstallationOwner(fixture.anchorRoot);
    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal,
      expectedOperationId: interrupted.operationId,
      keyProvider,
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result.kind).toBe("RESTARTED");
    if (result.kind !== "RESTARTED") throw new Error("recovery did not return a Host");
    expect(result.host.token).not.toBe(interrupted.host.token);
    expect(await postmasterPid(descriptor.placement.canonicalDataDirectory)).not.toBe(
      oldPid,
    );
    await result.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await stopPostgres(toolchain, descriptor.placement.canonicalDataDirectory);
  }, 180_000);

  it("PG-1 starts the same stopped cluster when the bootstrap owner dies before PostgreSQL start", async () => {
    const fixture = await makeFixture(55533);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55533,
      "PRIVATE_POSTGRES_RESTART",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    const cluster = await clusterSystemIdentifier(
      toolchain,
      descriptor.placement.canonicalDataDirectory,
    );
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await stopPostgres(toolchain, descriptor.placement.canonicalDataDirectory);
    await leaveAbandonedLock(fixture, interrupted.host.bootId);

    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal: await proveLocalInstallationOwner(fixture.anchorRoot),
      expectedOperationId: interrupted.operationId,
      keyProvider: makeKeyProvider(),
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result.kind).toBe("RESTARTED");
    if (result.kind !== "RESTARTED")
      throw new Error("PG-1 recovery did not return Host");
    expect(result.host.token).not.toBe(interrupted.host.token);
    await assertReady(toolchain, 55533);
    await expect(
      clusterSystemIdentifier(toolchain, descriptor.placement.canonicalDataDirectory),
    ).resolves.toBe(cluster);
    await result.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }, 180_000);

  it("PG-3 performs one stop/start recovery before durable POSTGRES_STOPPED", async () => {
    const fixture = await makeFixture(55534);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55534,
      "PRIVATE_POSTGRES_RESTART",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    const oldPid = await postmasterPid(descriptor.placement.canonicalDataDirectory);
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await advanceJournalStage(fixture, interrupted.operationId, "HOST_LEASE_CLOSED");
    await leaveAbandonedLock(fixture, interrupted.host.bootId);

    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal: await proveLocalInstallationOwner(fixture.anchorRoot),
      expectedOperationId: interrupted.operationId,
      keyProvider: makeKeyProvider(),
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result.kind).toBe("RESTARTED");
    if (result.kind !== "RESTARTED")
      throw new Error("PG-3 recovery did not return Host");
    expect(await postmasterPid(descriptor.placement.canonicalDataDirectory)).not.toBe(
      oldPid,
    );
    await result.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }, 180_000);

  it("PG-4 starts exactly the stopped cluster after durable POSTGRES_STOPPED", async () => {
    const fixture = await makeFixture(55535);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55535,
      "PRIVATE_POSTGRES_RESTART",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await stopPostgres(toolchain, descriptor.placement.canonicalDataDirectory);
    await advanceJournalStage(fixture, interrupted.operationId, "POSTGRES_STOPPED");
    await leaveAbandonedLock(fixture, interrupted.host.bootId);

    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal: await proveLocalInstallationOwner(fixture.anchorRoot),
      expectedOperationId: interrupted.operationId,
      keyProvider: makeKeyProvider(),
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result.kind).toBe("RESTARTED");
    if (result.kind !== "RESTARTED")
      throw new Error("PG-4 recovery did not return Host");
    await assertReady(toolchain, 55535);
    await result.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }, 180_000);

  it("PG-5 preserves PID and postmaster start time when READY already satisfies progress", async () => {
    const fixture = await makeFixture(55536);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55536,
      "PRIVATE_POSTGRES_RESTART",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    const keyProvider = makeKeyProvider();
    const oldPid = await postmasterPid(descriptor.placement.canonicalDataDirectory);
    const oldStart = await postmasterStartTime(
      fixture,
      55536,
      keyProvider,
      interrupted.host.bootId,
    );
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await advanceJournalStage(fixture, interrupted.operationId, "POSTGRES_READY");
    await leaveAbandonedLock(fixture, interrupted.host.bootId);

    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal: await proveLocalInstallationOwner(fixture.anchorRoot),
      expectedOperationId: interrupted.operationId,
      keyProvider,
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result.kind).toBe("RESTARTED");
    if (result.kind !== "RESTARTED")
      throw new Error("PG-5 recovery did not return Host");
    expect(await postmasterPid(descriptor.placement.canonicalDataDirectory)).toBe(
      oldPid,
    );
    await expect(
      postmasterStartTime(fixture, 55536, keyProvider, interrupted.host.bootId),
    ).resolves.toBe(oldStart);
    await result.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await stopPostgres(toolchain, descriptor.placement.canonicalDataDirectory);
  }, 180_000);

  it("PG-5B starts actual STOPPED PostgreSQL even when historical progress is HOST_TOKEN_PUBLISHED", async () => {
    const fixture = await makeFixture(55537);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55537,
      "PRIVATE_POSTGRES_RESTART",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    const targetToken = createHostOwnershipToken();
    const targetBootId = createBootId();
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await stopPostgres(toolchain, descriptor.placement.canonicalDataDirectory);
    await advanceJournalStage(
      fixture,
      interrupted.operationId,
      "HOST_TOKEN_PUBLISHED",
      {
        target: {
          privatePostgres: "RUNNING_SAME_IDENTITY",
          hostOwnershipToken: targetToken,
          hostBootId: targetBootId,
          hostOwnershipRevision: "7",
        },
      },
    );
    await leaveAbandonedLock(fixture, interrupted.host.bootId);

    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal: await proveLocalInstallationOwner(fixture.anchorRoot),
      expectedOperationId: interrupted.operationId,
      keyProvider: makeKeyProvider(),
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result.kind).toBe("RESTARTED");
    if (result.kind !== "RESTARTED")
      throw new Error("PG-5B recovery did not return Host");
    await assertReady(toolchain, 55537);
    await result.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }, 180_000);

  it("PG-6A normalizes historical target B and publishes a distinct live target C", async () => {
    const fixture = await makeFixture(55538);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55538,
      "PRIVATE_POSTGRES_RESTART",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    const targetToken = createHostOwnershipToken();
    const targetBootId = interrupted.host.bootId;
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    const targetRevision = await publishHistoricalTarget(
      fixture,
      55538,
      targetToken,
      targetBootId,
    );
    await advanceJournalStage(
      fixture,
      interrupted.operationId,
      "HOST_TOKEN_PUBLISHED",
      {
        target: {
          privatePostgres: "RUNNING_SAME_IDENTITY",
          hostOwnershipToken: targetToken,
          hostBootId: targetBootId,
          hostOwnershipRevision: targetRevision,
        },
      },
    );
    await leaveAbandonedLock(fixture, interrupted.host.bootId);

    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal: await proveLocalInstallationOwner(fixture.anchorRoot),
      expectedOperationId: interrupted.operationId,
      keyProvider: makeKeyProvider(),
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result.kind).toBe("RESTARTED");
    if (result.kind !== "RESTARTED")
      throw new Error("PG-6A recovery did not return Host");
    expect(result.host.token).not.toBe(targetToken);
    await result.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }, 180_000);

  it("PG-6B recognizes a committed publication candidate C exactly", async () => {
    const fixture = await makeFixture(55539);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55539,
      "PRIVATE_POSTGRES_RESTART",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    const keyProvider = makeKeyProvider();
    const candidateToken = createHostOwnershipToken();
    const candidateBootId = createBootId();
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await publishHistoricalTarget(fixture, 55539, candidateToken, candidateBootId);
    await advanceJournalStage(
      fixture,
      interrupted.operationId,
      "HOST_TOKEN_PUBLICATION_ARMED",
      {
        target: {
          privatePostgres: "RUNNING_SAME_IDENTITY",
          hostOwnershipToken: candidateToken,
          hostBootId: candidateBootId,
        },
      },
    );
    await leaveAbandonedLock(fixture, interrupted.host.bootId);

    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal: await proveLocalInstallationOwner(fixture.anchorRoot),
      expectedOperationId: interrupted.operationId,
      keyProvider: makeKeyProvider(),
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result.kind).toBe("RESTARTED");
    if (result.kind !== "RESTARTED")
      throw new Error("PG-6B recovery did not return Host");
    expect(result.host.token).toBe(candidateToken);
    await result.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }, 180_000);

  it("PG-7 blocks a live Host advisory lease without changing PostgreSQL or the fence", async () => {
    const fixture = await makeFixture(55531);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55531,
      "PRIVATE_POSTGRES_RESTART",
    );
    const keyProvider = makeKeyProvider();
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    expect(() => interrupted.host.assertActive()).not.toThrow();
    const beforePid = await postmasterPid(descriptor.placement.canonicalDataDirectory);
    const beforeFence = await inspectHostOwnershipCanonicalSnapshot({
      port: 55531,
      passwordProvider: passwordProvider(
        keyProvider,
        fixture.installationId,
        fixture.instanceId,
        interrupted.host.bootId,
      ),
    });
    await leaveAbandonedLock(fixture, interrupted.host.bootId);
    const principal = await proveLocalInstallationOwner(fixture.anchorRoot);

    await expect(
      recoverInterruptedHostMaintenance({
        anchorRoot: fixture.anchorRoot,
        principal,
        expectedOperationId: interrupted.operationId,
        keyProvider,
        timing: HOST_TIMING,
        privatePostgres: descriptor,
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.recovery.live_host_owner" },
    });
    expect(await postmasterPid(descriptor.placement.canonicalDataDirectory)).toBe(
      beforePid,
    );
    await expect(
      inspectHostOwnershipCanonicalSnapshot({
        port: 55531,
        passwordProvider: passwordProvider(
          keyProvider,
          fixture.installationId,
          fixture.instanceId,
          interrupted.host.bootId,
        ),
      }),
    ).resolves.toEqual(beforeFence);
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await stopPostgres(toolchain, descriptor.placement.canonicalDataDirectory);
  }, 180_000);

  it("PG-8 completes STOP recovery with no target Host ownership", async () => {
    const fixture = await makeFixture(55540);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55540,
      "PRIVATE_POSTGRES_STOP",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    const keyProvider = makeKeyProvider();
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    await leaveAbandonedLock(fixture, interrupted.host.bootId);

    const result = await recoverInterruptedHostMaintenance({
      anchorRoot: fixture.anchorRoot,
      principal: await proveLocalInstallationOwner(fixture.anchorRoot),
      expectedOperationId: interrupted.operationId,
      keyProvider,
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    expect(result).toEqual({ kind: "STOPPED" });
    await expect(
      access(join(descriptor.placement.canonicalDataDirectory, "postmaster.pid")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    const journal = await new MaintenanceJournalStore(fixture.roots.INSTANCE).load(
      interrupted.operationId,
    );
    expect(journal).toMatchObject({
      status: "CURRENT",
      value: {
        state: {
          lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
          target: { privatePostgres: "STOPPED" },
        },
      },
    });
    await stopPostgres(toolchain, descriptor.placement.canonicalDataDirectory);
  }, 180_000);

  it("PG-9 blocks corrupt MaintenanceJournal truth before PostgreSQL lifecycle access", async () => {
    const fixture = await makeFixture(55532);
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const interrupted = await makeInterruptedOperation(
      fixture,
      55532,
      "PRIVATE_POSTGRES_STOP",
    );
    const descriptor = getPrivatePostgresMaintenanceDescriptor(interrupted.ready);
    await interrupted.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    const journalPath = join(
      fixture.roots.INSTANCE,
      "maintenance-journal",
      interrupted.operationId,
      "maintenance-state.json",
    );
    await writeFile(journalPath, "corrupt");
    await leaveAbandonedLock(fixture, interrupted.host.bootId);
    const principal = await proveLocalInstallationOwner(fixture.anchorRoot);

    await expect(
      recoverInterruptedHostMaintenance({
        anchorRoot: fixture.anchorRoot,
        principal,
        expectedOperationId: interrupted.operationId,
        keyProvider: makeKeyProvider(),
        timing: HOST_TIMING,
        privatePostgres: descriptor,
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.recovery.not_eligible" },
    });
    await stopPostgres(toolchain, descriptor.placement.canonicalDataDirectory);
  }, 180_000);
});
