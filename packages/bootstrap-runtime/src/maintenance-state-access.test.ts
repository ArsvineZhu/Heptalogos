import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  asContentDigest,
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createUuidV7Id,
  digestCanonicalJson,
} from "@heptalogos/foundation-contracts";
import {
  createMaintenanceOperationId,
  type BootstrapStateBodyV1,
  type BootstrapStateBodyV2,
  type MaintenanceJournalBodyV1,
  BootstrapStateStore,
} from "@heptalogos/bootstrap-state";
import {
  acquireBootstrapOwnership,
  type BootstrapOwnershipLease,
} from "./bootstrap-ownership.js";
import {
  openMaintenanceStateAccess,
  type OwnedMaintenanceStateAccess,
} from "./maintenance-state-access.js";
import type { BootstrapPathProfile, ResolvedLifecycleRoot } from "./roots.js";

const directories: string[] = [];

function makeStateV1(revision = 1): BootstrapStateBodyV1 {
  return {
    schemaVersion: 1,
    revision,
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

function makeStateV2(
  installationId: ReturnType<typeof createInstallationId>,
  instanceId: ReturnType<typeof createInstanceId>,
  revision = 1,
): BootstrapStateBodyV2 {
  return {
    ...makeStateV1(revision),
    schemaVersion: 2,
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
      persistedPort: 55432,
      clusterSystemIdentifier: "12345678901234567890",
      initializationProfileRevision: asContentDigest(
        "PrivatePostgresInitializationProfileRevision",
        digestCanonicalJson("test.private-postgres-profile/v1", { profile: "m5a" }),
      ),
    },
  };
}

function makeJournalBody(
  operationId = createMaintenanceOperationId(),
): MaintenanceJournalBodyV1 {
  return {
    schemaVersion: 1,
    revision: 1,
    operationId,
    activityId: createUuidV7Id("ActivityId"),
    installationId: createInstallationId(),
    instanceId: createInstanceId(),
    bootId: createBootId(),
    operationType: "PRIVATE_POSTGRES_STOP",
    source: {
      hostOwnershipToken: createHostOwnershipToken(),
      hostOwnershipRevision: "0",
      postgresClusterSystemIdentifier: "12345678901234567890",
      persistedPort: 55432,
    },
    target: { privatePostgres: "STOPPED" },
    verifiedPrerequisites: {
      bootstrapStateDigest: digestCanonicalJson("heptalogos.bootstrap-state/v2", {
        state: true,
      }),
      privatePostgresInitializationProfileRevision: asContentDigest(
        "PrivatePostgresInitializationProfileRevision",
        digestCanonicalJson("test.private-postgres-profile/v1", { profile: "m5a" }),
      ),
    },
    lastCompletedStage: "BOOTSTRAP_OWNERSHIP_ACQUIRED",
    updatedAt: "2026-08-22T08:30:00.000Z",
  };
}

async function makeFixture(): Promise<{
  readonly profile: BootstrapPathProfile;
  readonly instanceRoot: string;
  readonly lease: BootstrapOwnershipLease;
  readonly access: OwnedMaintenanceStateAccess;
}> {
  const instanceRoot = await mkdtemp(join(tmpdir(), "heptalogos-maintenance-access-"));
  directories.push(instanceRoot);
  const installationId = createInstallationId();
  const instanceId = createInstanceId();
  const resolved: ResolvedLifecycleRoot = {
    id: "INSTANCE",
    configuredPath: instanceRoot,
    canonicalPath: instanceRoot,
  };
  const profile: BootstrapPathProfile = {
    installationId,
    instanceId,
    resolve(root) {
      if (root !== "INSTANCE") throw new Error(`unexpected root ${root}`);
      return resolved;
    },
    list() {
      return [resolved];
    },
  };
  const lease = await acquireBootstrapOwnership(resolved, {
    heartbeatMs: 1000,
    bootId: createBootId(),
  });
  const access = openMaintenanceStateAccess(profile, lease);
  return { profile, instanceRoot, lease, access };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("owned maintenance state access", () => {
  it("rejects a structurally forged lease and scope mismatch", async () => {
    const fixture = await makeFixture();
    const fake: BootstrapOwnershipLease = {
      state: "HELD",
      signal: new AbortController().signal,
      assertHeld() {},
      async release() {},
    };
    expect(() => openMaintenanceStateAccess(fixture.profile, fake)).toThrowError(
      /capability/i,
    );

    const secondRoot = await mkdtemp(
      join(tmpdir(), "heptalogos-maintenance-access-other-"),
    );
    directories.push(secondRoot);
    const secondResolved: ResolvedLifecycleRoot = {
      id: "INSTANCE",
      configuredPath: secondRoot,
      canonicalPath: secondRoot,
    };
    const secondProfile: BootstrapPathProfile = {
      ...fixture.profile,
      resolve() {
        return secondResolved;
      },
    };
    expect(() => openMaintenanceStateAccess(secondProfile, fixture.lease)).toThrowError(
      /different instance/i,
    );
    await fixture.lease.release();
  });

  it("rejects V1 and corrupt BootstrapState before committing an operation pointer", async () => {
    const fixture = await makeFixture();
    const raw = new BootstrapStateStore(join(fixture.instanceRoot, "bootstrap-state"));

    await raw.commit(makeStateV1());
    await expect(
      fixture.access.commitOperationPointer(createMaintenanceOperationId()),
    ).rejects.toMatchObject({
      problem: { problemCode: "maintenance.state.private_postgres_required" },
    });

    await fixture.lease.release();
    await expect(fixture.access.state.load()).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.not_held" },
    });
  });

  it("creates the journal before committing the BootstrapState operation pointer", async () => {
    const fixture = await makeFixture();
    const raw = new BootstrapStateStore(join(fixture.instanceRoot, "bootstrap-state"));
    await raw.commit(
      makeStateV2(fixture.profile.installationId, fixture.profile.instanceId),
    );
    const body = makeJournalBody();

    await expect(fixture.access.journal.create(body)).resolves.toMatchObject({
      state: { revision: 1, operationId: body.operationId },
    });
    await expect(
      fixture.access.commitOperationPointer(body.operationId),
    ).resolves.toMatchObject({
      state: {
        revision: 2,
        lastCommittedOperationRef: `maintenance-journal/v1/${body.operationId}`,
      },
    });
  });

  it("rejects a released or compromised lease for journal mutation", async () => {
    const fixture = await makeFixture();
    await fixture.lease.release();
    await expect(
      fixture.access.journal.create(makeJournalBody()),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.not_held" },
    });
  });
});
