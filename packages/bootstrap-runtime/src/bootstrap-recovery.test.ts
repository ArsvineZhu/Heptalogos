import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  createInstallationId,
  createInstanceId,
  createBootId,
} from "@heptalogos/foundation-contracts";
import {
  BootstrapJournal,
  BootstrapOwnerWitnessStore,
  createBootstrapLockGenerationId,
} from "@heptalogos/bootstrap-state";
import { currentBootstrapProcessIdentity } from "./bootstrap-process-identity.js";
import type { BootstrapLocatorV1 } from "./locator.js";
import {
  inspectBootstrapRecovery,
  reclaimAbandonedBootstrapOwnership,
  type BootstrapRecoveryDisposition,
} from "./bootstrap-recovery.js";
import { proveLocalInstallationOwner } from "./local-installation-owner.js";

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

async function expectDisposition(
  anchorRoot: string,
  disposition: BootstrapRecoveryDisposition,
) {
  const inspection = await inspectBootstrapRecovery(anchorRoot);
  expect(inspection.disposition).toBe(disposition);
  const entries = await new BootstrapJournal(inspection.instanceRoot).read(
    inspection.recoveryBootId,
  );
  expect(entries.map((entry) => entry.outcome)).toEqual(["STARTED", "SUCCEEDED"]);
  return inspection;
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

    await expectDisposition(fixture.anchorRoot, "NO_RECOVERY_REQUIRED");
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
