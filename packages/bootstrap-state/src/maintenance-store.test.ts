import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createUuidV7Id,
  digestCanonicalJson,
} from "@heptalogos/foundation-contracts";
import {
  parseMaintenanceJournal,
  sealMaintenanceJournal,
} from "./maintenance-codec.js";
import { MaintenanceJournalStore } from "./maintenance-store.js";
import type { MaintenanceJournalBodyV1 } from "./maintenance-model.js";

const directories: string[] = [];

async function directory(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "heptalogos-maintenance-journal-"));
  directories.push(path);
  return path;
}

function body(
  operationId = createUuidV7Id("MaintenanceOperationId"),
  revision = 1,
): MaintenanceJournalBodyV1 {
  return {
    schemaVersion: 1,
    revision,
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
      bootstrapStateDigest: digestCanonicalJson("heptalogos.bootstrap-state/v2", {
        state: true,
      }),
      privatePostgresInitializationProfileRevision: digestCanonicalJson(
        "heptalogos.private-postgres.initialization-profile/v2",
        { profile: true },
      )
        .hex as MaintenanceJournalBodyV1["verifiedPrerequisites"]["privatePostgresInitializationProfileRevision"],
    },
    lastCompletedStage: "POSTGRES_STOPPED",
    updatedAt: "2026-08-22T08:30:00.000Z",
  };
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("MaintenanceJournalStore", () => {
  it("returns EMPTY before creation and creates revision 1", async () => {
    const root = await directory();
    const store = new MaintenanceJournalStore(root);
    const operationId = createUuidV7Id("MaintenanceOperationId");

    await expect(store.load(operationId)).resolves.toEqual({ status: "EMPTY" });
    await expect(store.create(body(operationId))).resolves.toMatchObject({
      state: { revision: 1 },
    });
    await expect(store.load(operationId)).resolves.toMatchObject({
      status: "CURRENT",
      value: { state: { revision: 1 } },
    });
  });

  it("requires exact next revisions and recovers a valid previous file", async () => {
    const root = await directory();
    const store = new MaintenanceJournalStore(root);
    const operationId = createUuidV7Id("MaintenanceOperationId");
    await store.create(body(operationId));
    await store.advance(body(operationId, 2));

    await expect(store.advance(body(operationId, 2))).rejects.toMatchObject({
      problem: { problemCode: "maintenance.journal.revision_conflict" },
    });

    const currentPath = join(
      root,
      "maintenance-journal",
      operationId,
      "maintenance-state.json",
    );
    await writeFile(currentPath, "corrupt");
    await expect(store.load(operationId)).resolves.toMatchObject({
      status: "RECOVERED_PREVIOUS",
      value: { state: { revision: 1 } },
    });
  });

  it("returns CORRUPT when both revisions are invalid and rejects future schemas", async () => {
    const root = await directory();
    const store = new MaintenanceJournalStore(root);
    const operationId = createUuidV7Id("MaintenanceOperationId");
    const path = join(root, "maintenance-journal", operationId);
    await store.create(body(operationId));
    const currentPath = join(path, "maintenance-state.json");
    const previousPath = join(path, "maintenance-state.previous.json");
    await writeFile(
      currentPath,
      JSON.stringify({ state: { schemaVersion: 2 }, digest: {} }),
    );
    await writeFile(
      previousPath,
      JSON.stringify({ state: { schemaVersion: 2 }, digest: {} }),
    );
    await expect(store.load(operationId)).resolves.toMatchObject({
      status: "CORRUPT",
      problem: { problemCode: "maintenance.journal.no_valid_revision" },
    });

    const future = sealMaintenanceJournal(body(operationId));
    await rm(previousPath, { force: true });
    await writeFile(
      currentPath,
      JSON.stringify({ ...future, state: { ...future.state, schemaVersion: 2 } }),
    );
    await expect(store.load(operationId)).resolves.toMatchObject({
      status: "CORRUPT",
      problem: { problemCode: "maintenance.journal.no_valid_revision" },
    });
  });

  it("rejects a valid envelope stored under the wrong operation path", async () => {
    const root = await directory();
    const store = new MaintenanceJournalStore(root);
    const requested = createUuidV7Id("MaintenanceOperationId");
    const actual = createUuidV7Id("MaintenanceOperationId");
    const path = join(root, "maintenance-journal", requested);
    await import("node:fs/promises").then(({ mkdir }) =>
      mkdir(path, { recursive: true }),
    );
    await writeFile(
      join(path, "maintenance-state.json"),
      JSON.stringify(sealMaintenanceJournal(body(actual))),
    );
    await expect(store.load(requested)).resolves.toMatchObject({
      status: "CORRUPT",
      problem: { problemCode: "maintenance.journal.operation_id_mismatch" },
    });
  });

  it("serializes concurrent advances and leaves a parseable current revision", async () => {
    const root = await directory();
    const store = new MaintenanceJournalStore(root);
    const operationId = createUuidV7Id("MaintenanceOperationId");
    await store.create(body(operationId));
    const results = await Promise.allSettled([
      store.advance(body(operationId, 2)),
      store.advance(body(operationId, 2)),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const currentPath = join(
      root,
      "maintenance-journal",
      operationId,
      "maintenance-state.json",
    );
    const parsed = parseMaintenanceJournal(await readFile(currentPath, "utf8"));
    expect(parsed).toMatchObject({ ok: true, value: { state: { revision: 2 } } });
  });
});
