import { execFile, spawn, type ChildProcess } from "node:child_process";
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
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import {
  BootstrapJournal,
  BootstrapOwnerWitnessStore,
  BootstrapStateStore,
  MaintenanceJournalStore,
  type BootstrapStateBodyV1,
  type BootstrapStateEnvelopeV1,
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
  parseBootId,
  type LifecycleRootId,
  type HostOwnershipToken,
} from "@heptalogos/foundation-contracts";
import {
  acquireHostLeaseConnection,
  deriveHostAdvisoryKey,
  HOST_LEASE_ROLE,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  inspectHostAdvisoryLease,
  inspectHostOwnershipCanonicalSnapshot,
  publishHostOwnershipToken,
  type BootstrapAdminPasswordProvider,
  type HostOwnershipTimingOptions,
} from "@heptalogos/host-ownership";
import {
  classifyClusterDirectory,
  resolvePrivatePostgresPlacement,
  resolvePrivatePostgresToolchain,
  type PrivatePostgresToolchain,
} from "@heptalogos/private-postgres";
import type {
  BootstrapKeyProvider,
  BootstrapKeyRequestContext,
} from "./bootstrap-key-provider.js";
import { executeBootstrapRecoveryCommand } from "./bootstrap-recovery-command.js";
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
const BOOTSTRAP_PROCESS_FIXTURE = new URL(
  "../test/fixtures/recovery-bootstrap-process.mjs",
  import.meta.url,
);
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

type BootstrapProcessMessage = {
  readonly type: string;
  readonly bootId?: string;
  readonly pid?: number;
  readonly processStartedAtMs?: number;
  readonly clusterSystemIdentifier?: string;
  readonly port?: number;
  readonly startupDisposition?: string;
  readonly problemCode?: string;
  readonly message?: string;
};

class BootstrapProcessController {
  readonly process: ChildProcess;
  #messages: BootstrapProcessMessage[] = [];
  #waiters: Array<{
    readonly types: ReadonlySet<string>;
    readonly resolve: (message: BootstrapProcessMessage) => void;
    readonly reject: (error: Error) => void;
    readonly timer: NodeJS.Timeout;
  }> = [];

  constructor(
    anchorRoot: string,
    role: "before-postgres" | "ready-before-handoff",
    pgBin: string,
    port: number,
  ) {
    this.process = spawn(
      process.execPath,
      [fileURLToPath(BOOTSTRAP_PROCESS_FIXTURE), anchorRoot, role, pgBin, String(port)],
      { stdio: ["ignore", "ignore", "ignore", "ipc"], env: process.env },
    );
    this.process.on("message", (message: BootstrapProcessMessage) => {
      const index = this.#waiters.findIndex((waiter) => waiter.types.has(message.type));
      if (index < 0) {
        this.#messages.push(message);
        return;
      }
      const [waiter] = this.#waiters.splice(index, 1);
      clearTimeout(waiter.timer);
      waiter.resolve(message);
    });
  }

  waitFor(...types: string[]): Promise<BootstrapProcessMessage> {
    const index = this.#messages.findIndex((message) => types.includes(message.type));
    if (index >= 0) return Promise.resolve(this.#messages.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const waiterIndex = this.#waiters.findIndex((waiter) => waiter.timer === timer);
        if (waiterIndex >= 0) this.#waiters.splice(waiterIndex, 1);
        reject(new Error(`Timed out waiting for ${types.join(" or ")}`));
      }, 120_000);
      this.#waiters.push({ types: new Set(types), resolve, reject, timer });
    });
  }

  async kill(): Promise<void> {
    if (this.process.exitCode === null && this.process.signalCode === null) {
      this.process.kill("SIGKILL");
    }
    await Promise.race([
      once(this.process, "exit").then(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
    ]);
  }
}

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
  readonly state: BootstrapStateEnvelopeV1;
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
    continuityEpochId:
      "0197cfe0-0000-7000-8000-000000000001" as BootstrapStateBodyV1["continuityEpochId"],
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
    async withPrivatePostgresRuntimePassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      const password = new TextEncoder().encode("M5A_TEST_RUNTIME_PASSWORD_0123456789");
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
    async withPrivatePostgresMigrationPassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      const password = new TextEncoder().encode(
        "M5A_TEST_MIGRATION_PASSWORD_0123456789",
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
    withRuntimePassword(use) {
      return keyProvider.withPrivatePostgresRuntimePassword(
        {
          installationId,
          instanceId,
          bootId,
          purpose: "private-postgres-runtime-role",
        },
        use,
      );
    },
    withMigrationPassword(use) {
      return keyProvider.withPrivatePostgresMigrationPassword(
        {
          installationId,
          instanceId,
          bootId,
          purpose: "private-postgres-migration-role",
        },
        use,
      );
    },
  };
}

async function markBootstrapLockStaleForProcessRecovery(
  fixture: Fixture,
): Promise<void> {
  const lockPath = join(fixture.roots.INSTANCE, LOCK_DIRECTORY);
  await mkdir(lockPath, { recursive: true });
  const staleAt = new Date(Date.now() - 31_000);
  await utimes(lockPath, staleAt, staleAt);
}

async function assertBootstrapProcessOwnerWitness(
  fixture: Fixture,
  child: BootstrapProcessController,
  message: BootstrapProcessMessage,
): Promise<void> {
  if (
    message.bootId === undefined ||
    message.pid === undefined ||
    message.processStartedAtMs === undefined
  ) {
    throw new Error("bootstrap process boundary message omitted owner identity");
  }
  expect(message.pid).toBe(child.process.pid);
  const owner = await new BootstrapOwnerWitnessStore(
    fixture.roots.INSTANCE,
  ).readOwner();
  if (owner === undefined) throw new Error("bootstrap owner witness is missing");
  expect(owner.witness.phase).toBe("OWNER");
  expect(owner.witness.pid).toBe(message.pid);
  expect(owner.witness.processStartedAtMs).toBe(message.processStartedAtMs);
  expect(owner.witness.bootId).toBe(message.bootId);
}

function requireBootstrapProcessBootId(
  message: BootstrapProcessMessage,
): ReturnType<typeof createBootId> {
  if (message.bootId === undefined) {
    throw new Error("bootstrap process boundary omitted BootId");
  }
  const bootId = parseBootId(message.bootId);
  if (bootId === undefined)
    throw new Error("bootstrap process boundary BootId is invalid");
  return bootId;
}

async function inspectPreHostOwnershipState(
  fixture: Fixture,
  port: number,
  bootId: ReturnType<typeof createBootId>,
  keyProvider: BootstrapKeyProvider,
): Promise<{
  readonly hostDatabaseExists: boolean;
  readonly hostLeasePids: readonly number[];
}> {
  const key = deriveHostAdvisoryKey(fixture.instanceId);
  return passwordProvider(
    keyProvider,
    fixture.installationId,
    fixture.instanceId,
    bootId,
  ).withBootstrapPassword(async (passwordUtf8) => {
    const client = new Client({
      host: "127.0.0.1",
      port,
      database: "postgres",
      user: "heptalogos_bootstrap",
      password: new TextDecoder().decode(passwordUtf8),
      connectionTimeoutMillis: 10_000,
    });
    await client.connect();
    try {
      const database = await client.query<{ readonly datname: string }>(
        "SELECT datname FROM pg_catalog.pg_database WHERE datname = $1",
        [HOST_OWNERSHIP_CANONICAL_DATABASE],
      );
      const locks = await client.query<{ readonly pid: number }>(
        `
SELECT activity.pid
FROM pg_locks AS locks
JOIN pg_stat_activity AS activity ON activity.pid = locks.pid
WHERE locks.locktype = 'advisory'
  AND activity.usename = $1
  AND activity.datname = $2
  AND locks.classid::text = $3
  AND locks.objid::text = $4
`,
        [HOST_LEASE_ROLE, HOST_OWNERSHIP_CANONICAL_DATABASE, key.key1, key.key2],
      );
      return {
        hostDatabaseExists: database.rows.length > 0,
        hostLeasePids: locks.rows.map((row) => row.pid),
      };
    } finally {
      await client.end();
    }
  });
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
    initializeCanonicalHost: async ({ authority }) => {
      authority.assertCurrent();
    },
    keyProvider,
    timing: HOST_TIMING,
  });

  const locator = await loadBootstrapLocator(fixture.anchorRoot);
  const profile = await resolveBootstrapPathProfile(locator, ["INSTANCE"]);
  const operationBootId = host.bootId;
  const lease = await acquireBootstrapOwnership(profile.resolve("INSTANCE"), {
    heartbeatMs: 1_000,
    bootId: operationBootId,
  });
  try {
    const access = openMaintenanceStateAccess(profile, lease);
    const loaded = await access.state.load();
    if (loaded.status !== "CURRENT" || loaded.value.state.schemaVersion !== 1) {
      throw new Error("M5B fixture BootstrapState V1 was not available");
    }
    const privatePostgres = loaded.value.state.privatePostgres;
    if (privatePostgres === undefined || privatePostgres.schemaVersion !== 1) {
      throw new Error("M5B fixture private PostgreSQL state was not available");
    }
    const state = loaded.value as BootstrapStateEnvelopeV1;
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
        postgresClusterSystemIdentifier: privatePostgres.clusterSystemIdentifier,
        persistedPort: privatePostgres.persistedPort,
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
          privatePostgres.initializationProfileRevision,
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
  database = "heptalogos",
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
        database,
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
  const profile = await resolveBootstrapPathProfile(locator, ["INSTANCE"]);
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
  it("additional maintenance recovery restarts after PostgreSQL READY interruption", async () => {
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
      initializeCanonicalHost: async ({ authority }) => {
        authority.assertCurrent();
      },
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

  it("PG-1 recovers a killed pre-PostgreSQL bootstrap through bounded RECOVER", async () => {
    const port = 55533;
    const fixture = await makeFixture(port);
    const postgresDataDirectory = join(fixture.roots.DATA, "private-postgres");
    postgresDataDirectories.push(postgresDataDirectory);
    const child = new BootstrapProcessController(
      fixture.anchorRoot,
      "before-postgres",
      qualifiedPgBin,
      port,
    );
    const boundary = await child.waitFor("bootstrap-prelude-owned", "error");
    if (boundary.type === "error") {
      throw new Error(
        boundary.message ?? boundary.problemCode ?? "bootstrap child failed",
      );
    }
    await assertBootstrapProcessOwnerWitness(fixture, child, boundary);
    const bootstrapBootId = requireBootstrapProcessBootId(boundary);
    const stateBefore = await new BootstrapStateStore(
      join(fixture.roots.INSTANCE, "bootstrap-state"),
    ).load();
    expect(stateBefore).toMatchObject({
      status: "CURRENT",
      value: { state: { schemaVersion: 1, revision: 1 } },
    });
    if (stateBefore.status !== "CURRENT")
      throw new Error("BootstrapState is not current");
    expect(stateBefore.value.state.schemaVersion).toBe(1);
    const placement = resolvePrivatePostgresPlacement(fixture.roots.DATA);
    await expect(
      classifyClusterDirectory(placement.canonicalDataDirectory),
    ).resolves.toMatchObject({ kind: expect.stringMatching(/^(ABSENT|EMPTY)$/u) });
    await child.kill();
    await markBootstrapLockStaleForProcessRecovery(fixture);

    const keyProvider = makeKeyProvider();
    const recovered = await executeBootstrapRecoveryCommand(
      fixture.anchorRoot,
      { kind: "RECOVER" },
      {
        kind: "BOOTSTRAP_CONTINUATION",
        continuation: {
          principal: await proveLocalInstallationOwner(fixture.anchorRoot),
          preparePrivatePostgres: {
            toolchainBinDirectory: qualifiedPgBin,
            initialPort: port,
            lifecycle: LIFECYCLE,
            keyProvider,
          },
          handoff: {
            initializeCanonicalHost: async ({ authority }) => {
              authority.assertCurrent();
            },
            keyProvider,
            timing: HOST_TIMING,
          },
        },
      },
    );
    expect(recovered.kind).toBe("RECOVERED");
    if (
      recovered.kind !== "RECOVERED" ||
      recovered.recoveryKind !== "BOOTSTRAP_CONTINUATION"
    ) {
      throw new Error("PG-1 did not use bootstrap-continuation routing");
    }
    const host = recovered.host;
    expect(() => host.assertActive()).not.toThrow();
    expect(host.bootId).not.toBe(bootstrapBootId);

    const stateAfter = await new BootstrapStateStore(
      join(fixture.roots.INSTANCE, "bootstrap-state"),
    ).load();
    expect(stateAfter).toMatchObject({
      status: "CURRENT",
      value: { state: { schemaVersion: 1, revision: 2 } },
    });
    if (stateAfter.status !== "CURRENT" || stateAfter.value.state.schemaVersion !== 1) {
      throw new Error("PG-1 did not persist BootstrapState V1");
    }
    await assertReady(await resolvePrivatePostgresToolchain(qualifiedPgBin), port);
    const preHost = await inspectPreHostOwnershipState(
      fixture,
      port,
      host.bootId,
      keyProvider,
    );
    expect(preHost.hostDatabaseExists).toBe(true);
    await expect(
      inspectHostAdvisoryLease({
        port,
        advisoryKey: deriveHostAdvisoryKey(fixture.instanceId),
        passwordProvider: passwordProvider(
          keyProvider,
          fixture.installationId,
          fixture.instanceId,
          host.bootId,
        ),
      }),
    ).resolves.toMatchObject({ live: true });
    const snapshot = await inspectHostOwnershipCanonicalSnapshot({
      port,
      passwordProvider: passwordProvider(
        keyProvider,
        fixture.installationId,
        fixture.instanceId,
        host.bootId,
      ),
    });
    expect(snapshot.fence[0]).toMatchObject({
      host_ownership_token: host.token,
      boot_id: host.bootId,
    });
    const journal = await new BootstrapJournal(fixture.roots.INSTANCE).read(
      host.bootId,
    );
    expect(journal.map((entry) => entry.stage)).toContain("bootstrap.prelude.owned");
    await expect(
      access(join(fixture.roots.INSTANCE, LOCK_DIRECTORY)),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      new BootstrapOwnerWitnessStore(fixture.roots.INSTANCE).readOwner(),
    ).resolves.toBeUndefined();
    await host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }, 240_000);

  it("PG-2 recovers after READY before Host handoff without restarting PostgreSQL", async () => {
    const port = 55541;
    const fixture = await makeFixture(port);
    const postgresDataDirectory = join(fixture.roots.DATA, "private-postgres");
    postgresDataDirectories.push(postgresDataDirectory);
    const child = new BootstrapProcessController(
      fixture.anchorRoot,
      "ready-before-handoff",
      qualifiedPgBin,
      port,
    );
    const boundary = await child.waitFor("postgres-ready-before-handoff", "error");
    if (boundary.type === "error") {
      throw new Error(
        boundary.message ?? boundary.problemCode ?? "bootstrap child failed",
      );
    }
    await assertBootstrapProcessOwnerWitness(fixture, child, boundary);
    const bootstrapBootId = requireBootstrapProcessBootId(boundary);
    if (boundary.port === undefined || boundary.clusterSystemIdentifier === undefined) {
      throw new Error("PG-2 child omitted PostgreSQL identity");
    }
    expect(boundary.port).toBe(port);
    expect(boundary.startupDisposition).toBe("STARTED_BY_THIS_BOOTSTRAP");
    const toolchain = await resolvePrivatePostgresToolchain(qualifiedPgBin);
    const placement = resolvePrivatePostgresPlacement(fixture.roots.DATA);
    const stateBefore = await new BootstrapStateStore(
      join(fixture.roots.INSTANCE, "bootstrap-state"),
    ).load();
    expect(stateBefore).toMatchObject({
      status: "CURRENT",
      value: {
        state: {
          schemaVersion: 1,
          revision: 2,
          privatePostgres: {
            clusterSystemIdentifier: boundary.clusterSystemIdentifier,
            persistedPort: port,
          },
        },
      },
    });
    await assertReady(toolchain, port);
    const oldPid = await postmasterPid(placement.canonicalDataDirectory);
    const oldStart = await postmasterStartTime(
      fixture,
      port,
      makeKeyProvider(),
      bootstrapBootId,
      "postgres",
    );
    const preHost = await inspectPreHostOwnershipState(
      fixture,
      port,
      bootstrapBootId,
      makeKeyProvider(),
    );
    expect(preHost.hostDatabaseExists).toBe(false);
    expect(preHost.hostLeasePids).toEqual([]);
    await child.kill();
    await markBootstrapLockStaleForProcessRecovery(fixture);

    const keyProvider = makeKeyProvider();
    const recovered = await executeBootstrapRecoveryCommand(
      fixture.anchorRoot,
      { kind: "RECOVER" },
      {
        kind: "BOOTSTRAP_CONTINUATION",
        continuation: {
          principal: await proveLocalInstallationOwner(fixture.anchorRoot),
          preparePrivatePostgres: {
            toolchainBinDirectory: qualifiedPgBin,
            initialPort: port,
            lifecycle: LIFECYCLE,
            keyProvider,
          },
          handoff: {
            initializeCanonicalHost: async ({ authority }) => {
              authority.assertCurrent();
            },
            keyProvider,
            timing: HOST_TIMING,
          },
        },
      },
    );
    expect(recovered.kind).toBe("RECOVERED");
    if (
      recovered.kind !== "RECOVERED" ||
      recovered.recoveryKind !== "BOOTSTRAP_CONTINUATION"
    ) {
      throw new Error("PG-2 did not use bootstrap-continuation routing");
    }
    const host = recovered.host;
    expect(() => host.assertActive()).not.toThrow();
    expect(host.bootId).not.toBe(bootstrapBootId);
    expect(await postmasterPid(placement.canonicalDataDirectory)).toBe(oldPid);
    await expect(
      postmasterStartTime(fixture, port, keyProvider, host.bootId),
    ).resolves.toBe(oldStart);
    await expect(
      clusterSystemIdentifier(toolchain, placement.canonicalDataDirectory),
    ).resolves.toBe(boundary.clusterSystemIdentifier);
    const snapshot = await inspectHostOwnershipCanonicalSnapshot({
      port,
      passwordProvider: passwordProvider(
        keyProvider,
        fixture.installationId,
        fixture.instanceId,
        host.bootId,
      ),
    });
    expect(snapshot.fence[0]).toMatchObject({
      host_ownership_token: host.token,
      boot_id: host.bootId,
    });
    await expect(
      inspectHostAdvisoryLease({
        port,
        advisoryKey: deriveHostAdvisoryKey(fixture.instanceId),
        passwordProvider: passwordProvider(
          keyProvider,
          fixture.installationId,
          fixture.instanceId,
          host.bootId,
        ),
      }),
    ).resolves.toMatchObject({ live: true });
    await host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }, 240_000);

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
      initializeCanonicalHost: async ({ authority }) => {
        authority.assertCurrent();
      },
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
      initializeCanonicalHost: async ({ authority }) => {
        authority.assertCurrent();
      },
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
      initializeCanonicalHost: async ({ authority }) => {
        authority.assertCurrent();
      },
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
      initializeCanonicalHost: async ({ authority }) => {
        authority.assertCurrent();
      },
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
      initializeCanonicalHost: async ({ authority }) => {
        authority.assertCurrent();
      },
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
        initializeCanonicalHost: async ({ authority }) => {
          authority.assertCurrent();
        },
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
      initializeCanonicalHost: async ({ authority }) => {
        authority.assertCurrent();
      },
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
        initializeCanonicalHost: async ({ authority }) => {
          authority.assertCurrent();
        },
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
