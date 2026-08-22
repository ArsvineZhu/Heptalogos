import { execFile } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
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
  inspectHostOwnershipCanonicalSnapshot,
  type BootstrapAdminPasswordProvider,
} from "@heptalogos/host-ownership";
import {
  resolvePrivatePostgresToolchain,
  type PrivatePostgresToolchain,
} from "@heptalogos/private-postgres";
import type {
  BootstrapKeyProvider,
  BootstrapKeyRequestContext,
} from "./bootstrap-key-provider.js";
import { prepareBootstrapPrelude } from "./bootstrap-prelude.js";
import type { ReadyPrivatePostgres } from "./private-postgres-bootstrap.js";
import type {
  BootstrapManagedHostContext,
  HostMaintenanceQuiescence,
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
      await hostB
        ?.shutdownKeepingPrivatePostgres(maintenanceQuiescence())
        .catch(() => undefined);
      await hostA
        ?.shutdownKeepingPrivatePostgres(maintenanceQuiescence())
        .catch(() => undefined);
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
      });
      expect(journal.value.state.terminalOutcome).toBeUndefined();
      const bootstrapStages = await new BootstrapJournal(fixture.roots.INSTANCE).read(
        prepared.bootId,
      );
      expect(bootstrapStages.map((entry) => entry.stage)).toContain(
        "bootstrap.maintenance.completed",
      );
      expect(owned.ownershipState).toBe("RELEASED");
    } finally {
      await host
        ?.shutdownKeepingPrivatePostgres(maintenanceQuiescence())
        .catch(() => undefined);
      await ready?.stop().catch(() => undefined);
      await stopPostgres(toolchain, join(fixture.roots.DATA, "private-postgres"));
      if (owned.ownershipState !== "RELEASED") {
        await owned.close().catch(() => undefined);
      }
    }
  }, 180_000);
});
