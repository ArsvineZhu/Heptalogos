import { execFile, spawn } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  asContentDigest,
  createInstallationId,
  createInstanceId,
  digestCanonicalJson,
  LIFECYCLE_ROOT_IDS,
  type LifecycleRootId,
} from "@heptalogos/foundation-contracts";
import {
  BootstrapJournal,
  BootstrapStateStore,
  type BootstrapStateBodyV1,
} from "@heptalogos/bootstrap-state";
import type { HostOwnershipContext } from "@heptalogos/host-ownership";
import type {
  BootstrapKeyProvider,
  BootstrapKeyRequestContext,
} from "./bootstrap-key-provider.js";
import { prepareBootstrapPrelude } from "./bootstrap-prelude.js";
import type { ReadyPrivatePostgres } from "./private-postgres-bootstrap.js";

const qualifiedPgBin: string =
  process.env.HEPTALOGOS_TEST_PG_BIN ??
  (() => {
    throw new Error(
      "BLOCKED: HEPTALOGOS_TEST_PG_BIN is required for bootstrap-to-Host PostgreSQL qualification",
    );
  })();

const execFileAsync = promisify(execFile);
const directories: string[] = [];
const LIFECYCLE = {
  startupTimeoutMs: 60_000,
  shutdownTimeoutMs: 30_000,
  readinessPollIntervalMs: 100,
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
  const anchorRoot = await mkdtemp(join(tmpdir(), "heptalogos-m4-handoff-anchor-"));
  directories.push(anchorRoot);
  const roots = {} as Record<LifecycleRootId, string>;
  for (const id of LIFECYCLE_ROOT_IDS) {
    roots[id] =
      id === "PROGRAM"
        ? anchorRoot
        : await mkdtemp(join(tmpdir(), `heptalogos-m4-handoff-${id.toLowerCase()}-`));
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
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      const password = new TextEncoder().encode(
        "M4_TEST_BOOTSTRAP_PASSWORD_0123456789",
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
      const password = new TextEncoder().encode("H".repeat(32));
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
  };
}

async function stopQualifiedPostgres(dataDirectory: string): Promise<void> {
  try {
    await access(join(dataDirectory, "postmaster.pid"));
  } catch {
    return;
  }
  await new Promise<void>((resolve) => {
    const child = spawn(
      join(qualifiedPgBin, process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl"),
      ["stop", "--pgdata", dataDirectory, "--mode=fast", "--wait", "--timeout", "60"],
      { windowsHide: true, stdio: "ignore" },
    );
    child.once("error", () => resolve());
    child.once("close", () => resolve());
  });
}

async function assertPostgresReady(port: number): Promise<void> {
  await execFileAsync(
    join(
      qualifiedPgBin,
      process.platform === "win32" ? "pg_isready.exe" : "pg_isready",
    ),
    ["--host", "127.0.0.1", "--port", String(port)],
  );
}

async function journalStages(
  fixture: Fixture,
  bootId: ReadyPrivatePostgres["bootId"],
): Promise<readonly string[]> {
  return (await new BootstrapJournal(fixture.roots.INSTANCE).read(bootId)).map(
    (entry) => entry.stage,
  );
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("bootstrap to Host ownership real PostgreSQL 18.6 qualification", () => {
  it("releases bootstrap only after a live Host lease and fresh token are proven", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const options = {
      toolchainBinDirectory: qualifiedPgBin,
      initialPort: 55445,
      lifecycle: LIFECYCLE,
      keyProvider,
    };
    let ready: ReadyPrivatePostgres | undefined;
    let host: HostOwnershipContext | undefined;

    try {
      ready = await owned.preparePrivatePostgres(options);
      host = await owned.handoffPrivatePostgresToHost(ready, {
        keyProvider,
        timing: {
          connectionTimeoutMs: 10_000,
          statementTimeoutMs: 10_000,
          fenceLockTimeoutMs: 10_000,
          keepAliveInitialDelayMs: 1_000,
        },
      });

      expect(host.state).toBe("ACTIVE");
      expect(host.signal.aborted).toBe(false);
      expect(owned.ownershipState).toBe("RELEASED");
      await expect(
        access(join(fixture.roots.DATA, "private-postgres", "postmaster.pid")),
      ).resolves.toBeUndefined();
      await expect(assertPostgresReady(ready.port)).resolves.toBeUndefined();
      await expect(ready.stop()).rejects.toMatchObject({
        problem: { problemCode: "bootstrap.private_postgres.stale_handle" },
      });
      await expect(journalStages(fixture, prepared.bootId)).resolves.toEqual(
        expect.arrayContaining([
          "bootstrap.host.database_validated",
          "bootstrap.host.reservation_acquired",
          "bootstrap.host.fence_validated",
          "bootstrap.host.lease_acquired",
          "bootstrap.host.token_published",
          "bootstrap.host.forward_handoff_completed",
        ]),
      );
    } finally {
      await host?.close().catch(() => undefined);
      await ready?.stop().catch(() => undefined);
      await stopQualifiedPostgres(join(fixture.roots.DATA, "private-postgres"));
      if (owned.ownershipState !== "RELEASED") {
        await owned.close().catch(() => undefined);
      }
    }
  }, 120_000);

  it("yields an already-running PostgreSQL process without disturbing Host A", async () => {
    const fixture = await makeFixture();
    const firstPrepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const firstOwned = await firstPrepared.acquireOwnership({ heartbeatMs: 1_000 });
    const keyProvider = makeKeyProvider();
    const options = {
      toolchainBinDirectory: qualifiedPgBin,
      initialPort: 55446,
      lifecycle: LIFECYCLE,
      keyProvider,
    };
    let firstReady: ReadyPrivatePostgres | undefined;
    let hostA: HostOwnershipContext | undefined;

    try {
      firstReady = await firstOwned.preparePrivatePostgres(options);
      hostA = await firstOwned.handoffPrivatePostgresToHost(firstReady, {
        keyProvider,
        timing: {
          connectionTimeoutMs: 10_000,
          statementTimeoutMs: 10_000,
          fenceLockTimeoutMs: 10_000,
          keepAliveInitialDelayMs: 1_000,
        },
      });

      const secondPrepared = await prepareBootstrapPrelude(fixture.anchorRoot);
      const secondOwned = await secondPrepared.acquireOwnership({ heartbeatMs: 1_000 });
      let secondReady: ReadyPrivatePostgres | undefined;
      try {
        secondReady = await secondOwned.preparePrivatePostgres({
          toolchainBinDirectory: qualifiedPgBin,
          lifecycle: LIFECYCLE,
          keyProvider,
        });
        expect(secondReady.startupDisposition).toBe("ALREADY_RUNNING");
        expect(secondReady.port).toBe(firstReady.port);

        await expect(
          secondOwned.handoffPrivatePostgresToHost(secondReady, {
            keyProvider,
            timing: {
              connectionTimeoutMs: 10_000,
              statementTimeoutMs: 10_000,
              fenceLockTimeoutMs: 10_000,
              keepAliveInitialDelayMs: 1_000,
            },
          }),
        ).rejects.toMatchObject({
          problem: { problemCode: "bootstrap.host.existing_owner_detected" },
        });
        expect(secondOwned.ownershipState).toBe("RELEASED");
        const activeHost = hostA;
        if (activeHost === undefined) throw new Error("Host A was not established");
        expect(activeHost.state).toBe("ACTIVE");
        expect(() => activeHost.assertActive()).not.toThrow();
        await expect(
          access(join(fixture.roots.DATA, "private-postgres", "postmaster.pid")),
        ).resolves.toBeUndefined();
      } finally {
        await secondReady?.stop().catch(() => undefined);
        if (secondOwned.ownershipState !== "RELEASED") {
          await secondOwned.close().catch(() => undefined);
        }
      }
    } finally {
      await hostA?.close().catch(() => undefined);
      await firstReady?.stop().catch(() => undefined);
      await stopQualifiedPostgres(join(fixture.roots.DATA, "private-postgres"));
      if (firstOwned.ownershipState !== "RELEASED") {
        await firstOwned.close().catch(() => undefined);
      }
    }
  }, 120_000);
});
