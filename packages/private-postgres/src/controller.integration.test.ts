import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

const pgBin = process.env.HEPTALOGOS_TEST_PG_BIN;
if (!pgBin) {
  throw new Error(
    "BLOCKED: HEPTALOGOS_TEST_PG_BIN is required for private PostgreSQL integration qualification",
  );
}

const {
  resolvePrivatePostgresToolchain,
} = await import("./toolchain.js");
const { PRIVATE_POSTGRES_QUALIFIED_VERSION } = await import("./contracts.js");
const { resolvePrivatePostgresPlacement } = await import("./cluster-layout.js");
const {
  createPrivatePostgresInitializationProfileRevision,
  initializePrivatePostgresCluster,
} = await import("./controller.js");

describe("private PostgreSQL first initialization", () => {
  it("initializes an absent target with the deterministic M3 profile", async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), "heptalogos-pg-data-"));
    const tempRoot = await mkdtemp(join(tmpdir(), "heptalogos-pg-temp-"));
    const logRoot = await mkdtemp(join(tmpdir(), "heptalogos-pg-log-"));
    const placement = resolvePrivatePostgresPlacement(dataRoot);
    const toolchain = await resolvePrivatePostgresToolchain(pgBin);

    try {
      expect(toolchain.version).toBe(PRIVATE_POSTGRES_QUALIFIED_VERSION);
      const result = await initializePrivatePostgresCluster({
        toolchain,
        placement,
        credentialTempRoot: tempRoot,
        bootstrapPasswordUtf8: new TextEncoder().encode(
          "M3_TEST_SENTINEL_DO_NOT_LEAK_4f88b1c6",
        ),
        port: 55432,
        lifecycle: {
          startupTimeoutMs: 60_000,
          shutdownTimeoutMs: 30_000,
          readinessPollIntervalMs: 100,
        },
      });

      expect(result.identity.postgresMajor).toBe(18);
      expect(result.identity.clusterSystemIdentifier).toMatch(/^[0-9]+$/u);
      expect(result.dataPageChecksumVersion).toBe(1);
      expect(result.initializationProfileRevision).toBe(
        createPrivatePostgresInitializationProfileRevision(55432),
      );
      await expect(readFile(join(placement.canonicalDataDirectory, "PG_VERSION"), "utf8")).resolves.toBe(
        "18\n",
      );
      await expect(
        readFile(join(placement.canonicalDataDirectory, "postgresql.auto.conf"), "utf8"),
      ).resolves.toMatch(/listen_addresses\s*=\s*'127\.0\.0\.1'/u);
      await expect(
        readFile(join(placement.canonicalDataDirectory, "pg_hba.conf"), "utf8"),
      ).resolves.toContain("scram-sha-256");
      expect(JSON.stringify(result)).not.toContain(
        "M3_TEST_SENTINEL_DO_NOT_LEAK_4f88b1c6",
      );
    } finally {
      await Promise.all(
        [dataRoot, tempRoot, logRoot].map((root) => rm(root, { recursive: true, force: true })),
      );
    }
  });

  it("refuses a non-empty target before initdb and leaves it unchanged", async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), "heptalogos-pg-data-"));
    const tempRoot = await mkdtemp(join(tmpdir(), "heptalogos-pg-temp-"));
    const placement = resolvePrivatePostgresPlacement(dataRoot);
    const toolchain = await resolvePrivatePostgresToolchain(pgBin);

    try {
      await import("node:fs/promises").then(({ mkdir }) => mkdir(placement.canonicalDataDirectory));
      await writeFile(join(placement.canonicalDataDirectory, "PG_VERSION"), "18\n");

      await expect(
        initializePrivatePostgresCluster({
          toolchain,
          placement,
          credentialTempRoot: tempRoot,
          bootstrapPasswordUtf8: new TextEncoder().encode("M3_TEST_SENTINEL_DO_NOT_LEAK_4f88b1c6"),
          port: 55432,
          lifecycle: {
            startupTimeoutMs: 60_000,
            shutdownTimeoutMs: 30_000,
            readinessPollIntervalMs: 100,
          },
        }),
      ).rejects.toMatchObject({
        problem: { problemCode: "private-postgres.cluster.non_empty_target" },
      });
      await expect(access(join(placement.canonicalDataDirectory, "PG_VERSION"))).resolves.toBeUndefined();
    } finally {
      await Promise.all(
        [dataRoot, tempRoot].map((root) => rm(root, { recursive: true, force: true })),
      );
    }
  });
});
