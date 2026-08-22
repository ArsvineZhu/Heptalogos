import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  asContentDigest,
  createInstallationId,
  createInstanceId,
  createBootId,
  createHostOwnershipToken,
  createUuidV7Id,
  digestCanonicalJson,
} from "@heptalogos/foundation-contracts";
import {
  BootstrapOwnerWitnessStore,
  BootstrapStateStore,
  createBootstrapLockGenerationId,
  MaintenanceJournalStore,
  maintenanceOperationRef,
  type BootstrapStateBodyV1,
  type MaintenanceJournalBodyV1,
} from "@heptalogos/bootstrap-state";
import { currentBootstrapProcessIdentity } from "./bootstrap-process-identity.js";
import type { BootstrapLocatorV1 } from "./locator.js";
import { loadBootstrapLocator } from "./locator.js";
import {
  inspectBootstrapRecovery,
  reclaimAbandonedBootstrapOwnership,
  type BootstrapRecoveryDisposition,
} from "./bootstrap-recovery.js";
import { proveLocalInstallationOwner } from "./local-installation-owner.js";
import { resolveBootstrapPathProfile } from "./roots.js";

const directories: string[] = [];
const LOCK_DIRECTORY = ".heptalogos-bootstrap.lock";

async function makeFixture() {
  const anchorRoot = await mkdtemp(join(tmpdir(), "heptalogos-recovery-inspect-"));
  directories.push(anchorRoot);
  const roots = {
    PROGRAM: anchorRoot,
    INSTANCE: await mkdtemp(join(tmpdir(), "heptalogos-inspect-instance-")),
    CONFIGURATION: await mkdtemp(join(tmpdir(), "heptalogos-inspect-configuration-")),
    DATA: await mkdtemp(join(tmpdir(), "heptalogos-inspect-data-")),
    SECRET: await mkdtemp(join(tmpdir(), "heptalogos-inspect-secret-")),
    BLOB: await mkdtemp(join(tmpdir(), "heptalogos-inspect-blob-")),
    BACKUP: await mkdtemp(join(tmpdir(), "heptalogos-inspect-backup-")),
    LOG: await mkdtemp(join(tmpdir(), "heptalogos-inspect-log-")),
    CACHE: await mkdtemp(join(tmpdir(), "heptalogos-inspect-cache-")),
    TEMP: await mkdtemp(join(tmpdir(), "heptalogos-inspect-temp-")),
    RUN: await mkdtemp(join(tmpdir(), "heptalogos-inspect-run-")),
    PACKAGE_STAGING: await mkdtemp(
      join(tmpdir(), "heptalogos-inspect-package-staging-"),
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
  return { anchorRoot, locator, instanceRoot: roots.INSTANCE };
}

async function makeLock(instanceRoot: string, ageMs: number): Promise<string> {
  const lock = join(instanceRoot, LOCK_DIRECTORY);
  await mkdir(lock);
  const at = new Date(Date.now() - ageMs);
  await utimes(lock, at, at);
  return lock;
}

async function writeMaintenancePointer(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  terminalOutcome?: "SUCCEEDED" | "FAILED",
): Promise<void> {
  const operationId = createUuidV7Id("MaintenanceOperationId");
  const state: BootstrapStateBodyV1 = {
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
    lastCommittedOperationRef: maintenanceOperationRef(operationId),
  };
  const body: MaintenanceJournalBodyV1 = {
    schemaVersion: 1,
    revision: 1,
    operationId,
    activityId: createUuidV7Id("ActivityId"),
    installationId: fixture.locator.installationId,
    instanceId: fixture.locator.instanceId,
    bootId: createBootId(),
    operationType: "PRIVATE_POSTGRES_STOP",
    source: {
      hostOwnershipToken: createHostOwnershipToken(),
      hostOwnershipRevision: "7",
      postgresClusterSystemIdentifier: "123",
      persistedPort: 55432,
    },
    target: { privatePostgres: "STOPPED" },
    verifiedPrerequisites: {
      bootstrapStateDigest: digestCanonicalJson("test.bootstrap-state/v1", {
        state: true,
      }),
      privatePostgresInitializationProfileRevision: asContentDigest(
        "PrivatePostgresInitializationProfileRevision",
        digestCanonicalJson("test.private-postgres-profile/v1", { profile: true }),
      ),
    },
    lastCompletedStage: "POSTGRES_STOPPED",
    updatedAt: "2026-08-22T08:30:00.000Z",
    ...(terminalOutcome === undefined ? {} : { terminalOutcome }),
  };
  await new BootstrapStateStore(join(fixture.instanceRoot, "bootstrap-state")).commit(
    state,
  );
  await new MaintenanceJournalStore(fixture.instanceRoot).create(body);
}

async function expectDisposition(
  anchorRoot: string,
  disposition: BootstrapRecoveryDisposition,
) {
  const locator = await loadBootstrapLocator(anchorRoot);
  const paths = await resolveBootstrapPathProfile(locator);
  const instanceRoot = paths.resolve("INSTANCE").canonicalPath;
  const before = await snapshotInstanceRoot(instanceRoot);
  const inspection = await inspectBootstrapRecovery(anchorRoot);
  expect(inspection.disposition).toBe(disposition);
  await expect(snapshotInstanceRoot(instanceRoot)).resolves.toEqual(before);
  return inspection;
}

async function snapshotInstanceRoot(
  instanceRoot: string,
): Promise<readonly [string, unknown][]> {
  const entries: Array<[string, unknown]> = [];
  async function visit(path: string, relativePath: string): Promise<void> {
    const metadata = await lstat(path);
    const key = relativePath.length === 0 ? "." : relativePath;
    if (metadata.isDirectory()) {
      entries.push([
        key,
        { kind: "directory", mtimeMs: metadata.mtimeMs, size: metadata.size },
      ]);
      const children = await readdir(path);
      for (const child of children.sort()) {
        await visit(
          join(path, child),
          relativePath.length === 0 ? child : join(relativePath, child),
        );
      }
      return;
    }
    if (metadata.isFile()) {
      entries.push([
        key,
        {
          kind: "file",
          contents: (await readFile(path)).toString("base64"),
          mtimeMs: metadata.mtimeMs,
          size: metadata.size,
        },
      ]);
      return;
    }
    entries.push([
      key,
      { kind: "other", mtimeMs: metadata.mtimeMs, size: metadata.size },
    ]);
  }
  await visit(instanceRoot, "");
  return entries;
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("bounded bootstrap recovery inspection", () => {
  it("reports NO_RECOVERY_REQUIRED when no lock or incomplete operation exists", async () => {
    const fixture = await makeFixture();

    const inspection = await expectDisposition(
      fixture.anchorRoot,
      "NO_RECOVERY_REQUIRED",
    );
    expect(inspection.maintenanceIncomplete).toBe(false);
  });

  it("reports ABANDONED_OWNER_ELIGIBLE only for stale lock plus dead evidence", async () => {
    const fixture = await makeFixture();
    await makeLock(fixture.instanceRoot, 31_000);
    const witnessStore = new BootstrapOwnerWitnessStore(fixture.instanceRoot);
    await witnessStore.createAttempt({
      schemaVersion: 1,
      phase: "ATTEMPT",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: 999_999,
      processStartedAtMs: 0,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    const inspection = await expectDisposition(
      fixture.anchorRoot,
      "ABANDONED_OWNER_ELIGIBLE",
    );
    expect(inspection.attemptProcessStatuses).toContain("PROCESS_DEAD");
    expect(inspection.maintenanceIncomplete).toBe(false);
  });

  it("reports abandoned ownership with an incomplete maintenance pointer", async () => {
    const fixture = await makeFixture();
    await writeMaintenancePointer(fixture);
    await makeLock(fixture.instanceRoot, 31_000);
    await new BootstrapOwnerWitnessStore(fixture.instanceRoot).createAttempt({
      schemaVersion: 1,
      phase: "ATTEMPT",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: 999_999,
      processStartedAtMs: 0,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    const inspection = await expectDisposition(
      fixture.anchorRoot,
      "ABANDONED_OWNER_ELIGIBLE",
    );
    expect(inspection.maintenanceIncomplete).toBe(true);
    expect(inspection.operationId).toBeDefined();
  });

  it("reports a completed historical operation as not maintenance-incomplete", async () => {
    const fixture = await makeFixture();
    await writeMaintenancePointer(fixture, "SUCCEEDED");
    await makeLock(fixture.instanceRoot, 31_000);
    await new BootstrapOwnerWitnessStore(fixture.instanceRoot).createAttempt({
      schemaVersion: 1,
      phase: "ATTEMPT",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: 999_999,
      processStartedAtMs: 0,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    const inspection = await expectDisposition(
      fixture.anchorRoot,
      "ABANDONED_OWNER_ELIGIBLE",
    );
    expect(inspection.maintenanceIncomplete).toBe(false);
  });

  it("reports INCOMPLETE_MAINTENANCE without a bootstrap lock", async () => {
    const fixture = await makeFixture();
    await writeMaintenancePointer(fixture);

    const inspection = await expectDisposition(
      fixture.anchorRoot,
      "INCOMPLETE_MAINTENANCE",
    );
    expect(inspection.maintenanceIncomplete).toBe(true);
  });

  it("uses dead RELEASING evidence to explain a stale lock", async () => {
    const fixture = await makeFixture();
    await makeLock(fixture.instanceRoot, 31_000);
    await new BootstrapOwnerWitnessStore(fixture.instanceRoot).publishReleasing({
      schemaVersion: 1,
      phase: "RELEASING",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: 999_999,
      processStartedAtMs: 0,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    const inspection = await expectDisposition(
      fixture.anchorRoot,
      "ABANDONED_OWNER_ELIGIBLE",
    );
    expect(inspection.releasing).toHaveLength(1);
    expect(inspection.releasingProcessStatuses).toContain("PROCESS_DEAD");
  });

  it("does not treat an orphan RELEASING witness as recovery ownership without a lock", async () => {
    const fixture = await makeFixture();
    await new BootstrapOwnerWitnessStore(fixture.instanceRoot).publishReleasing({
      schemaVersion: 1,
      phase: "RELEASING",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: 999_999,
      processStartedAtMs: 0,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    const inspection = await expectDisposition(
      fixture.anchorRoot,
      "NO_RECOVERY_REQUIRED",
    );
    expect(inspection.releasing).toHaveLength(1);
  });

  it("does not let historical RELEASING evidence override a current owner witness", async () => {
    const fixture = await makeFixture();
    await makeLock(fixture.instanceRoot, 31_000);
    const identity = currentBootstrapProcessIdentity();
    const store = new BootstrapOwnerWitnessStore(fixture.instanceRoot);
    await store.publishOwner({
      schemaVersion: 1,
      phase: "OWNER",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: 999_999,
      processStartedAtMs: 0,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });
    await store.publishReleasing({
      schemaVersion: 1,
      phase: "RELEASING",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: identity.pid,
      processStartedAtMs: identity.startedAtMs,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    await expectDisposition(fixture.anchorRoot, "ABANDONED_OWNER_ELIGIBLE");
  });

  it("reports ACTIVE_BOOTSTRAP_OWNER for a live owner witness", async () => {
    const fixture = await makeFixture();
    await makeLock(fixture.instanceRoot, 31_000);
    const identity = currentBootstrapProcessIdentity();
    await new BootstrapOwnerWitnessStore(fixture.instanceRoot).publishOwner({
      schemaVersion: 1,
      phase: "OWNER",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: identity.pid,
      processStartedAtMs: identity.startedAtMs,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    const inspection = await expectDisposition(
      fixture.anchorRoot,
      "ACTIVE_BOOTSTRAP_OWNER",
    );
    expect(inspection.ownerProcessStatus).toBe("SAME_PROCESS");
  });

  it("blocks a fresh lock even when its witness process is dead", async () => {
    const fixture = await makeFixture();
    await makeLock(fixture.instanceRoot, 1_000);
    const witnessStore = new BootstrapOwnerWitnessStore(fixture.instanceRoot);
    await witnessStore.createAttempt({
      schemaVersion: 1,
      phase: "ATTEMPT",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: 999_999,
      processStartedAtMs: 0,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    await expectDisposition(fixture.anchorRoot, "BLOCKED");
  });

  it("blocks corrupt owner evidence", async () => {
    const fixture = await makeFixture();
    await makeLock(fixture.instanceRoot, 31_000);
    await writeFile(
      join(fixture.instanceRoot, ".heptalogos-bootstrap-owner.json"),
      "corrupt",
    );

    await expectDisposition(fixture.anchorRoot, "BLOCKED");
  });

  it("blocks stale ownership when no owner or attempt evidence proves death", async () => {
    const fixture = await makeFixture();
    await makeLock(fixture.instanceRoot, 31_000);

    await expectDisposition(fixture.anchorRoot, "BLOCKED");
  });

  it("reclaims only after authentic local-owner proof and rechecks the lease", async () => {
    const fixture = await makeFixture();
    await makeLock(fixture.instanceRoot, 31_000);
    await new BootstrapOwnerWitnessStore(fixture.instanceRoot).createAttempt({
      schemaVersion: 1,
      phase: "ATTEMPT",
      lockGenerationId: createBootstrapLockGenerationId(),
      bootId: createBootId(),
      pid: 999_999,
      processStartedAtMs: 0,
      heartbeatMs: 1_000,
      createdAt: new Date().toISOString(),
    });

    const principal = await proveLocalInstallationOwner(fixture.anchorRoot);
    const bootId = createBootId();
    const lease = await reclaimAbandonedBootstrapOwnership(
      fixture.anchorRoot,
      principal,
      { heartbeatMs: 1_000, bootId },
    );

    expect(lease.state).toBe("HELD");
    await expect(
      new BootstrapOwnerWitnessStore(fixture.instanceRoot).readOwner(),
    ).resolves.toMatchObject({ witness: { phase: "OWNER", bootId } });
    await lease.release();
  });
});
