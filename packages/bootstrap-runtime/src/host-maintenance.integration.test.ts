import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import {
  BootstrapJournal,
  BootstrapStateStore,
  MaintenanceJournalStore,
  type BootstrapStateBodyV1,
} from "@heptalogos/bootstrap-state";
import {
  asContentDigest,
  createInstallationId,
  createInstanceId,
  digestCanonicalJson,
  LIFECYCLE_ROOT_IDS,
  type LifecycleRootId,
} from "@heptalogos/foundation-contracts";
import {
  deriveHostAdvisoryKey,
  inspectHostOwnershipCanonicalSnapshot,
  type BootstrapAdminPasswordProvider,
} from "@heptalogos/host-ownership";
import {
  resolvePrivatePostgresPlacement,
  resolvePrivatePostgresToolchain,
  validateExistingCluster,
  type PrivatePostgresToolchain,
} from "@heptalogos/private-postgres";
import type {
  BootstrapKeyProvider,
  BootstrapKeyRequestContext,
} from "./bootstrap-key-provider.js";
import { prepareBootstrapPrelude } from "./bootstrap-prelude.js";
import type { ReadyPrivatePostgres } from "./private-postgres-bootstrap.js";
import {
  type BootstrapManagedHostContext,
  type HostMaintenanceQuiescence,
} from "./managed-host.js";

const qualifiedPgBin: string =
  process.env.HEPTALOGOS_TEST_PG_BIN ??
  (() => {
    throw new Error(
      "BLOCKED: HEPTALOGOS_TEST_PG_BIN is required for M5A PostgreSQL maintenance qualification",
    );
  })();

const execFileAsync = promisify(execFile);
const directories: string[] = [];
const LIFECYCLE = {
  startupTimeoutMs: 60_000,
  shutdownTimeoutMs: 30_000,
  readinessPollIntervalMs: 100,
} as const;
const HOST_TIMING = {
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  fenceLockTimeoutMs: 10_000,
  keepAliveInitialDelayMs: 1_000,
} as const;

interface Fixture {
  readonly anchorRoot: string;
  readonly roots: Readonly<Record<LifecycleRootId, string>>;
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

async function makeFixture(): Promise<Fixture> {
  const anchorRoot = await mkdtemp(join(tmpdir(), "heptalogos-m5a-anchor-"));
  directories.push(anchorRoot);
  const roots = {} as Record<LifecycleRootId, string>;
  for (const id of LIFECYCLE_ROOT_IDS) {
    roots[id] =
      id === "PROGRAM"
        ? anchorRoot
        : await mkdtemp(join(tmpdir(), `heptalogos-m5a-${id.toLowerCase()}-`));
    if (id !== "PROGRAM") directories.push(roots[id]);
  }
  await writeFile(
    join(anchorRoot, "heptalogos.bootstrap.json"),
    JSON.stringify({
      schemaVersion: 1,
      installationId: createInstallationId(),
      instanceId: createInstanceId(),
      roots,
    }),
  );
  await new BootstrapStateStore(join(roots.INSTANCE, "bootstrap-state")).commit(
    makeState(),
  );
  return { anchorRoot, roots };
}

function makeKeyProvider(): BootstrapKeyProvider {
  return {
    async withPrivatePostgresBootstrapPassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (password: Uint8Array) => Promise<T>,
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
      use: (password: Uint8Array) => Promise<T>,
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

function maintenanceQuiescence(): HostMaintenanceQuiescence {
  return {
    async quiesce() {
      return { async resumeAfterAbort() {} };
    },
  };
}

async function hostOwnershipSnapshot(
  host: BootstrapManagedHostContext,
  keyProvider: BootstrapKeyProvider,
  port: number,
): Promise<Awaited<ReturnType<typeof inspectHostOwnershipCanonicalSnapshot>>> {
  const passwordProvider: BootstrapAdminPasswordProvider = {
    withBootstrapPassword(use) {
      return keyProvider.withPrivatePostgresBootstrapPassword(
        {
          installationId: host.installationId,
          instanceId: host.instanceId,
          bootId: host.bootId,
          purpose: "private-postgres-bootstrap-superuser",
        },
        use,
      );
    },
    withHostLeasePassword(use) {
      return keyProvider.withPrivatePostgresHostLeasePassword(
        {
          installationId: host.installationId,
          instanceId: host.instanceId,
          bootId: host.bootId,
          purpose: "private-postgres-host-lease-role",
        },
        use,
      );
    },
  };
  return inspectHostOwnershipCanonicalSnapshot({
    port,
    passwordProvider,
  });
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

async function postmasterPid(dataDirectory: string): Promise<string> {
  const contents = await readFile(join(dataDirectory, "postmaster.pid"), "utf8");
  const pid = contents.split("\n", 1)[0]?.trim();
  if (pid === undefined || pid.length === 0) {
    throw new Error("postmaster.pid did not contain a PID");
  }
  return pid;
}

async function connectBootstrapClient(
  host: BootstrapManagedHostContext,
  keyProvider: BootstrapKeyProvider,
  port: number,
): Promise<Client> {
  let client: Client | undefined;
  await keyProvider.withPrivatePostgresBootstrapPassword(
    {
      installationId: host.installationId,
      instanceId: host.instanceId,
      bootId: host.bootId,
      purpose: "private-postgres-bootstrap-superuser",
    },
    async (passwordUtf8) => {
      const candidate = new Client({
        host: "127.0.0.1",
        port,
        database: "heptalogos",
        user: "heptalogos_bootstrap",
        password: new TextDecoder().decode(passwordUtf8),
        connectionTimeoutMillis: 10_000,
      });
      await candidate.connect();
      client = candidate;
    },
  );
  if (client === undefined) throw new Error("bootstrap admin client was not connected");
  return client;
}

async function findHostLeaseBackend(
  client: Client,
  instanceId: BootstrapManagedHostContext["instanceId"],
): Promise<number> {
  const key = deriveHostAdvisoryKey(instanceId);
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const result = await client.query<{
      readonly pid: number;
      readonly classid: string | null;
      readonly objid: string | null;
    }>(
      `
SELECT activity.pid, locks.classid::text, locks.objid::text
FROM pg_locks AS locks
JOIN pg_stat_activity AS activity ON activity.pid = locks.pid
WHERE locks.locktype = 'advisory'
  AND activity.usename = 'heptalogos_host_lease'
  AND activity.datname = 'heptalogos'
`,
    );
    const asUnsigned = (value: number): number => value >>> 0;
    const matching = result.rows.find(
      (row) =>
        row.classid !== null &&
        row.objid !== null &&
        ((Number(row.classid) === key.key1 && Number(row.objid) === key.key2) ||
          (Number(row.classid) === asUnsigned(key.key1) &&
            Number(row.objid) === asUnsigned(key.key2))),
    );
    const pid = matching?.pid;
    if (pid !== undefined) return pid;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("dedicated Host lease backend was not found");
}

async function waitForHostLeaseLoss(host: BootstrapManagedHostContext): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (host.signal.aborted) return;
    try {
      host.assertActive();
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Host lease did not report loss after backend termination");
}

async function postmasterStartTime(client: Client): Promise<string> {
  const result = await client.query<{ readonly started_at: string }>(
    "SELECT pg_postmaster_start_time()::text AS started_at",
  );
  const startedAt = result.rows[0]?.started_at;
  if (startedAt === undefined)
    throw new Error("postmaster start time was not returned");
  return startedAt;
}

async function stopPostgres(
  toolchain: PrivatePostgresToolchain,
  dataDirectory: string,
): Promise<void> {
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

async function getToolchain(): Promise<PrivatePostgresToolchain> {
  return resolvePrivatePostgresToolchain(qualifiedPgBin);
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("M5A reverse-handoff PostgreSQL qualification", () => {
  it("restarts the same cluster and publishes a fresh Host token", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const toolchain = await getToolchain();
    const port = 55520;
    let ready: ReadyPrivatePostgres | undefined;
    let hostA: BootstrapManagedHostContext | undefined;
    let hostB: BootstrapManagedHostContext | undefined;

    try {
      ready = await owned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        initialPort: port,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      const activeHostA = await owned.handoffPrivatePostgresToHost(ready, {
        keyProvider,
        timing: HOST_TIMING,
      });
      hostA = activeHostA;
      const before = await hostOwnershipSnapshot(activeHostA, keyProvider, ready.port);
      const preparedMaintenance = await activeHostA.preparePrivatePostgresMaintenance({
        kind: "RESTART_PRIVATE_POSTGRES",
      });

      const result = await preparedMaintenance.execute(maintenanceQuiescence());
      expect(result.kind).toBe("RESTARTED");
      if (result.kind !== "RESTARTED") throw new Error("restart result missing Host");
      const activeHostB = result.host;
      hostB = activeHostB;

      expect(activeHostA.state).toBe("CLOSED");
      expect(() => activeHostA.assertActive()).toThrow();
      expect(activeHostB.state).toBe("ACTIVE");
      expect(activeHostB.token).not.toBe(activeHostA.token);
      await expect(assertReady(toolchain, ready.port)).resolves.toBeUndefined();

      const persisted = await new BootstrapStateStore(
        join(fixture.roots.INSTANCE, "bootstrap-state"),
      ).load();
      expect(persisted.status).toBe("CURRENT");
      if (persisted.status !== "CURRENT" || persisted.value.state.schemaVersion !== 1) {
        throw new Error("canonical private PostgreSQL state was not persisted");
      }
      const persistedPostgres = persisted.value.state.privatePostgres;
      if (persistedPostgres === undefined || persistedPostgres.schemaVersion !== 1) {
        throw new Error("canonical private PostgreSQL identity was not persisted");
      }
      expect(persisted.value.state.lastCommittedOperationRef).toBe(
        `maintenance-journal/v1/${preparedMaintenance.operationId}`,
      );
      expect(persistedPostgres.clusterSystemIdentifier).toBe(
        ready.clusterSystemIdentifier,
      );
      expect(persistedPostgres.persistedPort).toBe(ready.port);
      const validated = await validateExistingCluster({
        toolchain,
        placement: resolvePrivatePostgresPlacement(fixture.roots.DATA),
        expectedIdentity: {
          installationId: persistedPostgres.installationId,
          instanceId: persistedPostgres.instanceId,
          postgresMajor: persistedPostgres.postgresMajor,
          bootstrapRoleName: persistedPostgres.bootstrapRoleName,
          placement: persistedPostgres.dataPlacement,
          persistedPort: persistedPostgres.persistedPort,
          clusterSystemIdentifier: persistedPostgres.clusterSystemIdentifier,
          initializationProfileRevision:
            persistedPostgres.initializationProfileRevision,
        },
        timeoutMs: LIFECYCLE.startupTimeoutMs,
      });
      expect(validated.identity.clusterSystemIdentifier).toBe(
        ready.clusterSystemIdentifier,
      );
      expect(validated.port).toBe(ready.port);

      const after = await hostOwnershipSnapshot(activeHostB, keyProvider, ready.port);
      expect(after.fence).toHaveLength(1);
      expect(after.fence[0]).toMatchObject({
        instance_id: activeHostB.instanceId,
        host_ownership_token: activeHostB.token,
        boot_id: activeHostB.bootId,
        ownership_revision: String(BigInt(before.fence[0].ownership_revision) + 2n),
      });

      const journal = await new MaintenanceJournalStore(fixture.roots.INSTANCE).load(
        preparedMaintenance.operationId,
      );
      expect(journal.status).toBe("CURRENT");
      if (journal.status !== "CURRENT") throw new Error("maintenance journal missing");
      expect(journal.value.state).toMatchObject({
        lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
        operationType: "PRIVATE_POSTGRES_RESTART",
        target: {
          privatePostgres: "RUNNING_SAME_IDENTITY",
          hostOwnershipToken: hostB.token,
        },
      });
      expect(owned.ownershipState).toBe("RELEASED");
    } finally {
      if (hostB?.state === "ACTIVE") {
        await hostB
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      if (hostA?.state === "ACTIVE") {
        await hostA
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      await ready?.stop().catch(() => undefined);
      await stopPostgres(toolchain, join(fixture.roots.DATA, "private-postgres"));
      if (owned.ownershipState !== "RELEASED") {
        await owned.close().catch(() => undefined);
      }
    }
  }, 180_000);

  it("continues normal bootstrap after successful restart maintenance", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const toolchain = await getToolchain();
    const port = 55525;
    let ready: ReadyPrivatePostgres | undefined;
    let hostA: BootstrapManagedHostContext | undefined;
    let hostB: BootstrapManagedHostContext | undefined;
    let hostC: BootstrapManagedHostContext | undefined;
    let secondOwned:
      | Awaited<ReturnType<typeof prepared.acquireOwnership>>
      | undefined;
    let secondReady: ReadyPrivatePostgres | undefined;

    try {
      ready = await owned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        initialPort: port,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      const expectedClusterSystemIdentifier = ready.clusterSystemIdentifier;
      hostA = await owned.handoffPrivatePostgresToHost(ready, {
        keyProvider,
        timing: HOST_TIMING,
      });

      const maintenance = await hostA.preparePrivatePostgresMaintenance({
        kind: "RESTART_PRIVATE_POSTGRES",
      });
      const result = await maintenance.execute(maintenanceQuiescence());
      expect(result.kind).toBe("RESTARTED");
      if (result.kind !== "RESTARTED") throw new Error("restart result missing Host");
      hostB = result.host;

      expect(hostA.state).toBe("CLOSED");
      expect(hostB.state).toBe("ACTIVE");
      await expect(assertReady(toolchain, port)).resolves.toBeUndefined();

      const journal = await new MaintenanceJournalStore(fixture.roots.INSTANCE).load(
        maintenance.operationId,
      );
      expect(journal).toMatchObject({
        status: "CURRENT",
        value: {
          state: {
            lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
            terminalOutcome: "SUCCEEDED",
          },
        },
      });

      await hostB.shutdownKeepingPrivatePostgres(maintenanceQuiescence());
      expect(hostB.state).toBe("CLOSED");

      const secondPrepared = await prepareBootstrapPrelude(fixture.anchorRoot);
      secondOwned = await secondPrepared.acquireOwnership({ heartbeatMs: 1_000 });
      secondReady = await secondOwned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      expect(secondReady.clusterSystemIdentifier).toBe(expectedClusterSystemIdentifier);
      expect(secondReady.startupDisposition).toBe("ALREADY_RUNNING");
      await expect(assertReady(toolchain, port)).resolves.toBeUndefined();

      hostC = await secondOwned.handoffPrivatePostgresToHost(secondReady, {
        keyProvider,
        timing: HOST_TIMING,
      });
      const stop = await hostC.preparePrivatePostgresMaintenance({
        kind: "STOP_PRIVATE_POSTGRES",
      });
      await expect(stop.execute(maintenanceQuiescence())).resolves.toEqual({
        kind: "STOPPED",
      });
      expect(hostC.state).toBe("CLOSED");
    } finally {
      if (hostC?.state === "ACTIVE") {
        await hostC
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      if (hostB?.state === "ACTIVE") {
        await hostB
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      if (hostA?.state === "ACTIVE") {
        await hostA
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      await secondReady?.stop().catch(() => undefined);
      await ready?.stop().catch(() => undefined);
      await stopPostgres(toolchain, join(fixture.roots.DATA, "private-postgres"));
      if (secondOwned !== undefined && secondOwned.ownershipState !== "RELEASED") {
        await secondOwned.close().catch(() => undefined);
      }
      if (owned.ownershipState !== "RELEASED") {
        await owned.close().catch(() => undefined);
      }
    }
  }, 180_000);

  it("continues normal bootstrap after successful stop maintenance", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const toolchain = await getToolchain();
    const port = 55526;
    let ready: ReadyPrivatePostgres | undefined;
    let host: BootstrapManagedHostContext | undefined;
    let secondOwned:
      | Awaited<ReturnType<typeof prepared.acquireOwnership>>
      | undefined;
    let secondReady: ReadyPrivatePostgres | undefined;

    try {
      ready = await owned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        initialPort: port,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      const expectedClusterSystemIdentifier = ready.clusterSystemIdentifier;
      host = await owned.handoffPrivatePostgresToHost(ready, {
        keyProvider,
        timing: HOST_TIMING,
      });

      const maintenance = await host.preparePrivatePostgresMaintenance({
        kind: "STOP_PRIVATE_POSTGRES",
      });
      await expect(maintenance.execute(maintenanceQuiescence())).resolves.toEqual({
        kind: "STOPPED",
      });
      expect(host.state).toBe("CLOSED");

      const journal = await new MaintenanceJournalStore(fixture.roots.INSTANCE).load(
        maintenance.operationId,
      );
      expect(journal).toMatchObject({
        status: "CURRENT",
        value: {
          state: {
            lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
            terminalOutcome: "SUCCEEDED",
          },
        },
      });

      const secondPrepared = await prepareBootstrapPrelude(fixture.anchorRoot);
      secondOwned = await secondPrepared.acquireOwnership({ heartbeatMs: 1_000 });
      secondReady = await secondOwned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      expect(secondReady.clusterSystemIdentifier).toBe(expectedClusterSystemIdentifier);
      expect(secondReady.startupDisposition).toBe("STARTED_BY_THIS_BOOTSTRAP");
      await expect(assertReady(toolchain, port)).resolves.toBeUndefined();
      await secondReady.stop();
      secondReady = undefined;
      await secondOwned.close();
      secondOwned = undefined;
    } finally {
      if (host?.state === "ACTIVE") {
        await host
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      await secondReady?.stop().catch(() => undefined);
      await ready?.stop().catch(() => undefined);
      await stopPostgres(toolchain, join(fixture.roots.DATA, "private-postgres"));
      if (secondOwned !== undefined && secondOwned.ownershipState !== "RELEASED") {
        await secondOwned.close().catch(() => undefined);
      }
      if (owned.ownershipState !== "RELEASED") {
        await owned.close().catch(() => undefined);
      }
    }
  }, 180_000);

  it("blocks a competing bootstrap before lock acquisition when maintenance is incomplete", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const toolchain = await getToolchain();
    const port = 55522;
    let ready: ReadyPrivatePostgres | undefined;
    let host: BootstrapManagedHostContext | undefined;
    let maintenance:
      | Awaited<
          ReturnType<BootstrapManagedHostContext["preparePrivatePostgresMaintenance"]>
        >
      | undefined;
    let postOwned: Awaited<ReturnType<typeof prepared.acquireOwnership>> | undefined;
    let postReady: ReadyPrivatePostgres | undefined;

    try {
      ready = await owned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        initialPort: port,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      host = await owned.handoffPrivatePostgresToHost(ready, {
        keyProvider,
        timing: HOST_TIMING,
      });
      maintenance = await host.preparePrivatePostgresMaintenance({
        kind: "RESTART_PRIVATE_POSTGRES",
      });

      await expect(prepareBootstrapPrelude(fixture.anchorRoot)).rejects.toMatchObject({
        problem: { problemCode: "bootstrap.recovery.maintenance_required" },
      });
      expect(host.state).toBe("ACTIVE");
      await expect(assertReady(toolchain, ready.port)).resolves.toBeUndefined();

      await maintenance.abortBeforeEntry();
      expect(maintenance.state).toBe("ABORTED");
      expect(host.state).toBe("ACTIVE");

      const postPrepared = await prepareBootstrapPrelude(fixture.anchorRoot);
      postOwned = await postPrepared.acquireOwnership({ heartbeatMs: 1_000 });
      postReady = await postOwned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      expect(postReady.startupDisposition).toBe("ALREADY_RUNNING");
      await expect(
        postOwned.handoffPrivatePostgresToHost(postReady, {
          keyProvider,
          timing: HOST_TIMING,
        }),
      ).rejects.toMatchObject({
        problem: { problemCode: "bootstrap.host.existing_owner_detected" },
      });
      expect(host.state).toBe("ACTIVE");
    } finally {
      if (host?.state === "ACTIVE") {
        await host
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      await postReady?.stop().catch(() => undefined);
      if (postOwned !== undefined && postOwned.ownershipState !== "RELEASED") {
        await postOwned.close().catch(() => undefined);
      }
      await ready?.stop().catch(() => undefined);
      await stopPostgres(toolchain, join(fixture.roots.DATA, "private-postgres"));
      if (owned.ownershipState !== "RELEASED") {
        await owned.close().catch(() => undefined);
      }
    }
  }, 180_000);

  it("keeps PostgreSQL running during managed shutdown and publishes a later fresh token", async () => {
    const fixture = await makeFixture();
    const firstPrepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const firstOwned = await firstPrepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const toolchain = await getToolchain();
    const port = 55523;
    let firstReady: ReadyPrivatePostgres | undefined;
    let hostA: BootstrapManagedHostContext | undefined;
    let secondOwned:
      Awaited<ReturnType<typeof firstPrepared.acquireOwnership>> | undefined;
    let secondReady: ReadyPrivatePostgres | undefined;
    let hostB: BootstrapManagedHostContext | undefined;

    try {
      firstReady = await firstOwned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        initialPort: port,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      hostA = await firstOwned.handoffPrivatePostgresToHost(firstReady, {
        keyProvider,
        timing: HOST_TIMING,
      });
      const before = await hostOwnershipSnapshot(hostA, keyProvider, port);
      await hostA.shutdownKeepingPrivatePostgres(maintenanceQuiescence());
      expect(hostA.state).toBe("CLOSED");
      await expect(assertReady(toolchain, port)).resolves.toBeUndefined();

      const historical = await hostOwnershipSnapshot(hostA, keyProvider, port);
      expect(historical.fence[0]?.host_ownership_token).toBe(
        before.fence[0]?.host_ownership_token,
      );

      const secondPrepared = await prepareBootstrapPrelude(fixture.anchorRoot);
      secondOwned = await secondPrepared.acquireOwnership({ heartbeatMs: 1_000 });
      secondReady = await secondOwned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      expect(secondReady.startupDisposition).toBe("ALREADY_RUNNING");
      hostB = await secondOwned.handoffPrivatePostgresToHost(secondReady, {
        keyProvider,
        timing: HOST_TIMING,
      });
      expect(hostB.state).toBe("ACTIVE");
      expect(hostB.token).not.toBe(before.fence[0]?.host_ownership_token);
      const after = await hostOwnershipSnapshot(hostB, keyProvider, port);
      expect(after.fence[0]?.ownership_revision).toBe(
        String(BigInt(before.fence[0]?.ownership_revision ?? "0") + 1n),
      );
    } finally {
      if (hostB?.state === "ACTIVE") {
        await hostB
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      if (hostA?.state === "ACTIVE") {
        await hostA
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      await secondReady?.stop().catch(() => undefined);
      await firstReady?.stop().catch(() => undefined);
      await stopPostgres(toolchain, join(fixture.roots.DATA, "private-postgres"));
      if (secondOwned !== undefined && secondOwned.ownershipState !== "RELEASED") {
        await secondOwned.close().catch(() => undefined);
      }
      if (firstOwned.ownershipState !== "RELEASED") {
        await firstOwned.close().catch(() => undefined);
      }
    }
  }, 180_000);

  it("fails closed when PostgreSQL terminates the dedicated Host lease during entry", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const toolchain = await getToolchain();
    const port = 55524;
    let ready: ReadyPrivatePostgres | undefined;
    let host: BootstrapManagedHostContext | undefined;
    let admin: Client | undefined;

    try {
      ready = await owned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        initialPort: port,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      host = await owned.handoffPrivatePostgresToHost(ready, {
        keyProvider,
        timing: HOST_TIMING,
      });
      const maintenance = await host.preparePrivatePostgresMaintenance({
        kind: "RESTART_PRIVATE_POSTGRES",
      });

      const beforeFence = await hostOwnershipSnapshot(host, keyProvider, port);
      const dataDirectory = join(fixture.roots.DATA, "private-postgres");
      const postmasterPidBefore = await postmasterPid(dataDirectory);
      admin = await connectBootstrapClient(host, keyProvider, port);
      const postmasterStartedBefore = await postmasterStartTime(admin);

      const quiescence: HostMaintenanceQuiescence = {
        async quiesce() {
          const backendPid = await findHostLeaseBackend(
            admin as Client,
            host!.instanceId,
          );
          const terminated = await (admin as Client).query<{
            readonly terminated: boolean;
          }>("SELECT pg_terminate_backend($1::integer) AS terminated", [backendPid]);
          expect(terminated.rows[0]?.terminated).toBe(true);
          await waitForHostLeaseLoss(host as BootstrapManagedHostContext);
          await (admin as Client).end();
          admin = undefined;
          return { async resumeAfterAbort() {} };
        },
      };

      await expect(maintenance.execute(quiescence)).rejects.toMatchObject({
        problem: { problemCode: "bootstrap.maintenance.abort_resume_failed" },
      });
      expect(maintenance.state).toBe("RECOVERY_REQUIRED");
      expect(() => host!.assertActive()).toThrow();
      expect(host!.state).toBe("CLOSED");
      await expect(assertReady(toolchain, port)).resolves.toBeUndefined();
      expect(await postmasterPid(dataDirectory)).toBe(postmasterPidBefore);
      admin = await connectBootstrapClient(host, keyProvider, port);
      await expect(postmasterStartTime(admin)).resolves.toBe(postmasterStartedBefore);

      const afterFence = await hostOwnershipSnapshot(host, keyProvider, port);
      expect(afterFence.fence[0]).toMatchObject({
        host_ownership_token: beforeFence.fence[0]?.host_ownership_token,
        ownership_revision: beforeFence.fence[0]?.ownership_revision,
      });
      const journal = await new MaintenanceJournalStore(fixture.roots.INSTANCE).load(
        maintenance.operationId,
      );
      expect(journal.status).toBe("CURRENT");
      if (journal.status !== "CURRENT") throw new Error("maintenance journal missing");
      expect(journal.value.state).toMatchObject({
        lastCompletedStage: "RECOVERY_REQUIRED",
        terminalOutcome: "FAILED",
      });

      await expect(prepareBootstrapPrelude(fixture.anchorRoot)).rejects.toMatchObject({
        problem: { problemCode: "bootstrap.recovery.maintenance_required" },
      });
    } finally {
      await admin?.end().catch(() => undefined);
      await ready?.stop().catch(() => undefined);
      await stopPostgres(toolchain, join(fixture.roots.DATA, "private-postgres"));
      if (owned.ownershipState !== "RELEASED") {
        await owned.close().catch(() => undefined);
      }
    }
  }, 180_000);

  it("stops and exits with a release-armed non-success journal", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const toolchain = await getToolchain();
    const port = 55521;
    let ready: ReadyPrivatePostgres | undefined;
    let host: BootstrapManagedHostContext | undefined;

    try {
      ready = await owned.preparePrivatePostgres({
        toolchainBinDirectory: qualifiedPgBin,
        initialPort: port,
        lifecycle: LIFECYCLE,
        keyProvider,
      });
      host = await owned.handoffPrivatePostgresToHost(ready, {
        keyProvider,
        timing: HOST_TIMING,
      });
      const preparedMaintenance = await host.preparePrivatePostgresMaintenance({
        kind: "STOP_PRIVATE_POSTGRES",
      });
      await expect(
        preparedMaintenance.execute(maintenanceQuiescence()),
      ).resolves.toEqual({ kind: "STOPPED" });

      expect(host.state).toBe("CLOSED");
      await expect(
        access(join(fixture.roots.DATA, "private-postgres", "postmaster.pid")),
      ).rejects.toThrow();
      const journal = await new MaintenanceJournalStore(fixture.roots.INSTANCE).load(
        preparedMaintenance.operationId,
      );
      expect(journal.status).toBe("CURRENT");
      if (journal.status !== "CURRENT") throw new Error("maintenance journal missing");
      expect(journal.value.state).toMatchObject({
        lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
        operationType: "PRIVATE_POSTGRES_STOP",
        terminalOutcome: "SUCCEEDED",
      });
      const bootstrapStages = await new BootstrapJournal(fixture.roots.INSTANCE).read(
        prepared.bootId,
      );
      expect(bootstrapStages.map((entry) => entry.stage)).toContain(
        "bootstrap.maintenance.completed",
      );
      expect(owned.ownershipState).toBe("RELEASED");
    } finally {
      if (host?.state === "ACTIVE") {
        await host
          .shutdownKeepingPrivatePostgres(maintenanceQuiescence())
          .catch(() => undefined);
      }
      await ready?.stop().catch(() => undefined);
      await stopPostgres(toolchain, join(fixture.roots.DATA, "private-postgres"));
      if (owned.ownershipState !== "RELEASED") {
        await owned.close().catch(() => undefined);
      }
    }
  }, 180_000);
});
