import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
  BootstrapStateStore,
  MaintenanceJournalStore,
  maintenanceOperationRef,
  type BootstrapStateBodyV1,
  type MaintenanceJournalBodyV1,
} from "@heptalogos/bootstrap-state";
import { inspectMaintenanceObligation } from "../../src/maintenance-obligation.js";

const directories: string[] = [];

function makeState(revision: number): BootstrapStateBodyV1 {
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
    continuityEpochId:
      "0197cfe0-0000-7000-8000-000000000001" as BootstrapStateBodyV1["continuityEpochId"],
  };
}

function makeMaintenanceBody(
  operationId: MaintenanceJournalBodyV1["operationId"],
  lastCompletedStage: MaintenanceJournalBodyV1["lastCompletedStage"],
  terminalOutcome: MaintenanceJournalBodyV1["terminalOutcome"],
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
    lastCompletedStage,
    updatedAt: "2026-08-23T00:00:00.000Z",
    ...(terminalOutcome === undefined ? {} : { terminalOutcome }),
  };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("shared maintenance obligation inspection", () => {
  it("returns a current-authority problem for RECOVERED_PREVIOUS BootstrapState", async () => {
    const instanceRoot = await mkdtemp(
      join(tmpdir(), "heptalogos-maintenance-obligation-"),
    );
    directories.push(instanceRoot);
    const store = new BootstrapStateStore(join(instanceRoot, "bootstrap-state"));
    await store.commit(makeState(1));
    await store.commit(makeState(2));
    await writeFile(
      join(instanceRoot, "bootstrap-state", "bootstrap-state.json"),
      "corrupt",
    );

    const loaded = await store.load();
    expect(loaded.status).toBe("RECOVERED_PREVIOUS");

    await expect(
      inspectMaintenanceObligation(instanceRoot, loaded),
    ).resolves.toMatchObject({
      incomplete: false,
      problem: { problemCode: "bootstrap.state.current_authority_required" },
    });
  });

  it.each([
    ["BOOTSTRAP_RELEASE_ARMED", "SUCCEEDED", false],
    ["ABORTED", "ABORTED", false],
    ["POSTGRES_STOPPED", undefined, true],
    ["RECOVERY_REQUIRED", "FAILED", true],
    ["RECOVERY_REQUIRED", "UNCERTAIN", true],
  ] as const)(
    "classifies %s/%s as incomplete=%s",
    async (lastCompletedStage, terminalOutcome, incomplete) => {
      const instanceRoot = await mkdtemp(
        join(tmpdir(), "heptalogos-maintenance-obligation-"),
      );
      directories.push(instanceRoot);
      const stateStore = new BootstrapStateStore(join(instanceRoot, "bootstrap-state"));
      const operationId = createUuidV7Id("MaintenanceOperationId");
      const current = await stateStore.commit({
        ...makeState(1),
        lastCommittedOperationRef: maintenanceOperationRef(operationId),
      });
      await new MaintenanceJournalStore(instanceRoot).create(
        makeMaintenanceBody(operationId, lastCompletedStage, terminalOutcome),
      );

      await expect(
        inspectMaintenanceObligation(instanceRoot, {
          status: "CURRENT",
          value: current,
        }),
      ).resolves.toMatchObject({ incomplete });
    },
  );
});
