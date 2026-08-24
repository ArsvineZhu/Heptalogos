import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import { createCanonicalSchemaInitializer } from "@heptalogos/canonical-schema";
import {
  BootstrapStateStore,
  BOOTSTRAP_STATE_DIGEST_DOMAIN,
  type BootstrapStateBodyV1,
} from "@heptalogos/bootstrap-state";
import {
  asContentDigest,
  createContinuityEpochId,
  createInstallationId,
  createInstanceId,
  digestCanonicalJson,
  LIFECYCLE_ROOT_IDS,
  type CanonicalJsonValue,
  type LifecycleRootId,
} from "@heptalogos/foundation-contracts";
import {
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_RUNTIME_ROLE,
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
import { prepareBootstrapPrelude } from "./bootstrap-prelude.js";
import type { BootstrapManagedHostContext } from "./managed-host.js";

const qualifiedPgBin = process.env.HEPTALOGOS_TEST_PG_BIN;
const execFileAsync = promisify(execFile);
const directories: string[] = [];
const postgresDataDirectories: string[] = [];
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
const CANONICAL_OPTIONS = {
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  lockTimeoutMs: 10_000,
  idleInTransactionSessionTimeoutMs: 30_000,
  onBackgroundError() {},
} as const;
const BOOTSTRAP_PASSWORD = "H2A2_TEST_BOOTSTRAP_PASSWORD_0123456789";
const HOST_LEASE_PASSWORD = "H2A2_TEST_HOST_LEASE_PASSWORD_0123456789";
const RUNTIME_PASSWORD = "H2A2_TEST_RUNTIME_PASSWORD_0123456789";
const MIGRATION_PASSWORD = "H2A2_TEST_MIGRATION_PASSWORD_0123456789";

interface Fixture {
  readonly anchorRoot: string;
  readonly roots: Readonly<Record<LifecycleRootId, string>>;
  readonly installationId: ReturnType<typeof createInstallationId>;
  readonly instanceId: ReturnType<typeof createInstanceId>;
  readonly port: number;
}

type OwnedPrelude = Awaited<
  ReturnType<Awaited<ReturnType<typeof prepareBootstrapPrelude>>["acquireOwnership"]>
>;
type ReadyPostgres = Awaited<ReturnType<OwnedPrelude["preparePrivatePostgres"]>>;

interface BootResult {
  readonly fixture: Fixture;
  readonly owned: OwnedPrelude;
  readonly ready: ReadyPostgres;
  readonly host: BootstrapManagedHostContext;
  readonly epoch: BootstrapStateBodyV1["continuityEpochId"];
}

const describeRealPostgres = qualifiedPgBin === undefined ? describe.skip : describe;

function selection() {
  return {
    activeBootstrapRuntimeGeneration: asContentDigest(
      "BootstrapRuntimeGenerationId",
      digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "bootstrap" }),
    ),
    activeProductGeneration: asContentDigest(
      "ProductGenerationId",
      digestCanonicalJson("test.product-generation/v1", { generation: "product" }),
    ),
  } as const;
}

function makeKeyProvider(): BootstrapKeyProvider {
  return {
    async withPrivatePostgresBootstrapPassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      return use(new TextEncoder().encode(BOOTSTRAP_PASSWORD));
    },
    async withPrivatePostgresHostLeasePassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      return use(new TextEncoder().encode(HOST_LEASE_PASSWORD));
    },
    async withPrivatePostgresRuntimePassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      return use(new TextEncoder().encode(RUNTIME_PASSWORD));
    },
    async withPrivatePostgresMigrationPassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      return use(new TextEncoder().encode(MIGRATION_PASSWORD));
    },
  };
}

async function freePort(): Promise<number> {
  const { createServer } = await import("node:net");
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    throw new Error("could not allocate a PostgreSQL test port");
  }
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

async function makeFixture(): Promise<Fixture> {
  const anchorRoot = await mkdtemp(join(tmpdir(), "heptalogos-h2a2-canonical-anchor-"));
  directories.push(anchorRoot);
  const roots = {} as Record<LifecycleRootId, string>;
  for (const id of LIFECYCLE_ROOT_IDS) {
    roots[id] =
      id === "PROGRAM"
        ? anchorRoot
        : await mkdtemp(
            join(tmpdir(), `heptalogos-h2a2-canonical-${id.toLowerCase()}-`),
          );
    if (id !== "PROGRAM") directories.push(roots[id]);
  }
  const installationId = createInstallationId();
  const instanceId = createInstanceId();
  await writeFile(
    join(anchorRoot, "heptalogos.bootstrap.json"),
    JSON.stringify({ schemaVersion: 1, installationId, instanceId, roots }),
  );
  return { anchorRoot, roots, installationId, instanceId, port: await freePort() };
}

async function stopCluster(
  toolchain: PrivatePostgresToolchain,
  dataDirectory: string,
): Promise<void> {
  await execFileAsync(
    toolchain.pgCtl,
    ["stop", "--pgdata", dataDirectory, "--mode=fast", "--wait", "--timeout", "60"],
    { windowsHide: true, timeout: 120_000 },
  ).catch(() => undefined);
}

async function prepareOwned(fixture: Fixture) {
  if (qualifiedPgBin === undefined)
    throw new Error("HEPTALOGOS_TEST_PG_BIN is required");
  const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
  const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
  const state = await owned.ensureBootstrapStateInitialized(selection());
  const ready = await owned.preparePrivatePostgres({
    toolchainBinDirectory: qualifiedPgBin,
    initialPort: fixture.port,
    lifecycle: LIFECYCLE,
    keyProvider: makeKeyProvider(),
  });
  return { prepared, owned, ready, epoch: state.state.continuityEpochId };
}

async function boot(
  fixture: Fixture,
  initializeCanonicalHost = createCanonicalSchemaInitializer(CANONICAL_OPTIONS),
): Promise<BootResult> {
  const prepared = await prepareOwned(fixture);
  const host = await prepared.owned.handoffPrivatePostgresToHost(prepared.ready, {
    initializeCanonicalHost,
    keyProvider: makeKeyProvider(),
    timing: HOST_TIMING,
  });
  return {
    fixture,
    owned: prepared.owned,
    ready: prepared.ready,
    host,
    epoch: prepared.epoch,
  };
}

async function stopManagedHost(host: BootstrapManagedHostContext): Promise<void> {
  if (host.state !== "ACTIVE") return;
  const maintenance = await host.preparePrivatePostgresMaintenance({
    kind: "STOP_PRIVATE_POSTGRES",
  });
  await maintenance.execute({
    async quiesce() {
      return { async resumeAfterAbort() {} };
    },
  });
}

async function queryAs(
  fixture: Fixture,
  user: string,
  password: string,
  text: string,
  values: readonly unknown[] = [],
  options?: string,
): Promise<{ readonly rows: readonly Record<string, unknown>[] }> {
  const client = new Client({
    host: "127.0.0.1",
    port: fixture.port,
    database: HOST_OWNERSHIP_CANONICAL_DATABASE,
    user,
    password,
    options,
  });
  try {
    await client.connect();
    return await client.query<Record<string, unknown>>(text, [...values]);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function expectQueryDenied(
  fixture: Fixture,
  user: string,
  password: string,
  text: string,
  values: readonly unknown[] = [],
): Promise<void> {
  await expect(queryAs(fixture, user, password, text, values)).rejects.toBeDefined();
}

async function mutateAsBootstrap(
  fixture: Fixture,
  text: string,
  values: readonly unknown[] = [],
): Promise<void> {
  await queryAs(fixture, "heptalogos_bootstrap", BOOTSTRAP_PASSWORD, text, values);
}

async function currentState(fixture: Fixture) {
  return new BootstrapStateStore(
    join(fixture.roots.INSTANCE, "bootstrap-state"),
  ).load();
}

afterEach(async () => {
  const toolchain =
    qualifiedPgBin === undefined
      ? undefined
      : await resolvePrivatePostgresToolchain(qualifiedPgBin);
  if (toolchain !== undefined) {
    await Promise.all(
      postgresDataDirectories
        .splice(0)
        .map((directory) => stopCluster(toolchain, directory)),
    );
  }
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describeRealPostgres.sequential(
  "H2A-2 canonical continuity PostgreSQL qualification",
  () => {
    it("C1 materializes the BootstrapState epoch before managed Host exposure", async () => {
      const fixture = await makeFixture();
      const result = await boot(fixture);
      postgresDataDirectories.push(join(fixture.roots.DATA, "private-postgres"));
      expect(result.host.continuityEpochId).toBe(result.epoch);
      expect(result.host.persistence.continuityEpochId).toBe(result.epoch);
      await expect(
        queryAs(
          fixture,
          HOST_RUNTIME_ROLE,
          RUNTIME_PASSWORD,
          `SELECT instance_id, continuity_epoch_id FROM "heptalogos"."instance_continuity"`,
        ),
      ).resolves.toMatchObject({
        rows: [{ instance_id: fixture.instanceId, continuity_epoch_id: result.epoch }],
      });
      await stopManagedHost(result.host);
    }, 180_000);

    it("C2 preserves the epoch across a second boot with a new Host identity", async () => {
      const fixture = await makeFixture();
      const first = await boot(fixture);
      postgresDataDirectories.push(join(fixture.roots.DATA, "private-postgres"));
      const firstBoot = first.host.bootId;
      const firstToken = first.host.token;
      await first.host.shutdownKeepingPrivatePostgres({
        async quiesce() {
          return { async resumeAfterAbort() {} };
        },
      });
      const second = await boot(fixture);
      expect(second.host.bootId).not.toBe(firstBoot);
      expect(second.host.token).not.toBe(firstToken);
      expect(second.epoch).toBe(first.epoch);
      expect(second.host.continuityEpochId).toBe(first.epoch);
      await stopManagedHost(second.host);
    }, 240_000);

    it("C3 retries the committed epoch after authority loss between migration and materialization", async () => {
      const fixture = await makeFixture();
      const realInitializer = createCanonicalSchemaInitializer(CANONICAL_OPTIONS);
      let assertCount = 0;
      const interruptedInitializer = async (
        context: Parameters<typeof realInitializer>[0],
      ) => {
        const authority = {
          ...context.authority,
          assertCurrent() {
            assertCount += 1;
            if (assertCount === 3) {
              throw new Error("test interruption after migration");
            }
            context.authority.assertCurrent();
          },
        };
        await realInitializer({ ...context, authority });
      };
      const prepared = await prepareOwned(fixture);
      await expect(
        prepared.owned.handoffPrivatePostgresToHost(prepared.ready, {
          initializeCanonicalHost: interruptedInitializer,
          keyProvider: makeKeyProvider(),
          timing: HOST_TIMING,
        }),
      ).rejects.toMatchObject({
        problem: { problemCode: "canonical-schema.authority_lost" },
      });
      const state = await currentState(fixture);
      expect(state.status).toBe("CURRENT");
      if (state.status !== "CURRENT") throw new Error("BootstrapState was not current");
      expect(state.value.state.continuityEpochId).toBe(prepared.epoch);
      await prepared.owned.close();
      const retry = await boot(fixture);
      postgresDataDirectories.push(join(fixture.roots.DATA, "private-postgres"));
      expect(retry.epoch).toBe(prepared.epoch);
      await stopManagedHost(retry.host);
    }, 240_000);

    it.each([
      ["C4", "epoch", "canonical-schema.continuity_epoch_mismatch"],
      ["C5", "instance", "canonical-schema.continuity_instance_mismatch"],
    ] as const)(
      "%s rejects a canonical continuity %s mismatch without overwrite",
      async (_name, kind, problemCode) => {
        const fixture = await makeFixture();
        const first = await boot(fixture);
        postgresDataDirectories.push(join(fixture.roots.DATA, "private-postgres"));
        const alternate =
          kind === "epoch" ? createContinuityEpochId() : createInstanceId();
        const statement =
          kind === "epoch"
            ? `UPDATE "heptalogos"."instance_continuity" SET continuity_epoch_id = $1`
            : `UPDATE "heptalogos"."instance_continuity" SET instance_id = $1`;
        await stopManagedHost(first.host);
        const prepared = await prepareOwned(fixture);
        await mutateAsBootstrap(fixture, statement, [alternate]);
        await expect(
          prepared.owned.handoffPrivatePostgresToHost(prepared.ready, {
            initializeCanonicalHost:
              createCanonicalSchemaInitializer(CANONICAL_OPTIONS),
            keyProvider: makeKeyProvider(),
            timing: HOST_TIMING,
          }),
        ).rejects.toMatchObject({ problem: { problemCode } });
        await prepared.owned.close();
        const verification = await prepareOwned(fixture);
        try {
          const row = await queryAs(
            fixture,
            "heptalogos_bootstrap",
            BOOTSTRAP_PASSWORD,
            `SELECT instance_id, continuity_epoch_id FROM "heptalogos"."instance_continuity"`,
          );
          expect(
            row.rows[0]?.[kind === "epoch" ? "continuity_epoch_id" : "instance_id"],
          ).toBe(alternate);
        } finally {
          await verification.ready.stop().catch(() => undefined);
          await verification.owned.close().catch(() => undefined);
        }
      },
      240_000,
    );

    it("C6 and C7 keep migration and runtime authorities distinct and read-only", async () => {
      const fixture = await makeFixture();
      const result = await boot(fixture);
      postgresDataDirectories.push(join(fixture.roots.DATA, "private-postgres"));
      await expect(
        queryAs(
          fixture,
          "heptalogos_migration",
          MIGRATION_PASSWORD,
          "SELECT session_user, current_user",
          [],
          "-c role=heptalogos_owner -c search_path=heptalogos,pg_catalog",
        ),
      ).resolves.toMatchObject({
        rows: [
          { session_user: "heptalogos_migration", current_user: "heptalogos_owner" },
        ],
      });
      await expectQueryDenied(
        fixture,
        HOST_RUNTIME_ROLE,
        RUNTIME_PASSWORD,
        "SET ROLE heptalogos_owner",
      );
      await expectQueryDenied(
        fixture,
        HOST_RUNTIME_ROLE,
        RUNTIME_PASSWORD,
        "SET ROLE heptalogos_migration",
      );
      await expect(
        queryAs(
          fixture,
          HOST_RUNTIME_ROLE,
          RUNTIME_PASSWORD,
          `SELECT instance_id, continuity_epoch_id FROM "heptalogos"."instance_continuity"`,
        ),
      ).resolves.toMatchObject({
        rows: [{ instance_id: fixture.instanceId, continuity_epoch_id: result.epoch }],
      });
      for (const statement of [
        `INSERT INTO "heptalogos"."instance_continuity" (singleton, instance_id, continuity_epoch_id) VALUES (false, $1, $2)`,
        `UPDATE "heptalogos"."instance_continuity" SET instance_id = $1`,
        `DELETE FROM "heptalogos"."instance_continuity"`,
        `CREATE TABLE "heptalogos"."h2a2_runtime_denied" (id integer)`,
      ]) {
        await expectQueryDenied(
          fixture,
          HOST_RUNTIME_ROLE,
          RUNTIME_PASSWORD,
          statement,
          [fixture.instanceId, result.epoch],
        );
      }
      await stopManagedHost(result.host);
    }, 180_000);

    it("C8 rejects corrupted current migration history", async () => {
      const fixture = await makeFixture();
      const first = await boot(fixture);
      postgresDataDirectories.push(join(fixture.roots.DATA, "private-postgres"));
      await stopManagedHost(first.host);
      const prepared = await prepareOwned(fixture);
      await mutateAsBootstrap(
        fixture,
        `DELETE FROM "heptalogos"."foundation_schema_migration"`,
      );
      await expect(
        prepared.owned.handoffPrivatePostgresToHost(prepared.ready, {
          initializeCanonicalHost: createCanonicalSchemaInitializer(CANONICAL_OPTIONS),
          keyProvider: makeKeyProvider(),
          timing: HOST_TIMING,
        }),
      ).rejects.toMatchObject({
        problem: { problemCode: "canonical-schema.migration_failed" },
      });
      await prepared.owned.close();
    }, 180_000);
  },
);

describe("H2A-2 BootstrapState obsolete development shape", () => {
  it("C9 rejects current V1 bytes without ContinuityEpochId", async () => {
    const directory = await mkdtemp(join(tmpdir(), "heptalogos-h2a2-obsolete-state-"));
    try {
      const body = {
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
      } as unknown as CanonicalJsonValue;
      const envelope = {
        state: body,
        digest: digestCanonicalJson(BOOTSTRAP_STATE_DIGEST_DOMAIN, body),
      };
      await writeFile(
        join(directory, "bootstrap-state.json"),
        JSON.stringify(envelope),
      );
      const loaded = await new BootstrapStateStore(directory).load();
      expect(loaded.status).toBe("CORRUPT");
      if (loaded.status === "CORRUPT") {
        expect(loaded.problem.problemCode).toBe("bootstrap.state.invalid_schema");
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
