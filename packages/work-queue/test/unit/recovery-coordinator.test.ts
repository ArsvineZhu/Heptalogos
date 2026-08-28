import { describe, expect, it, vi } from "vitest";
import {
  asContentDigest,
  createActivityId,
  createContinuityEpochId,
  createContributionId,
  createInstanceId,
  createMicroSystemId,
  createWorkItemId,
  digestCanonicalJson,
  type Instant,
  type PackageGenerationId,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import {
  createDispatchAttemptId,
  createWorkQueueRecoveryCoordinator,
  type DurableAttemptInspectionPort,
  type WorkItem,
  type WorkQueueRepository,
  type WorkQueueProfileId,
  type ResourceAdmissionClassId,
} from "../../src/index.js";

const now = "2026-08-29T00:00:00.000Z" as Instant;

function digest<T extends "ProductGenerationId" | "PackageGenerationId">(
  brand: T,
  value: string,
): T extends "ProductGenerationId" ? ProductGenerationId : PackageGenerationId {
  return asContentDigest(
    brand,
    digestCanonicalJson(`test/${value}`, { value }),
  ) as unknown as T extends "ProductGenerationId"
    ? ProductGenerationId
    : PackageGenerationId;
}

function runningItem(): WorkItem {
  const workItemId = createWorkItemId();
  const dispatchRevision = 1;
  const continuityEpochId = createContinuityEpochId();
  return {
    schemaVersion: 1,
    workItemId,
    handler: {
      productGenerationId: digest("ProductGenerationId", "product"),
      microSystemId: createMicroSystemId("subject"),
      contributionId: createContributionId("subject.reply"),
      packageGenerationId: digest("PackageGenerationId", "package"),
      payloadVersion: 1,
    },
    payload: { value: "hello" },
    queueProfileId: createMicroSystemId(
      "default-work",
    ) as unknown as WorkQueueProfileId,
    resourceAdmissionClass: createMicroSystemId(
      "normal",
    ) as unknown as ResourceAdmissionClassId,
    priority: 1,
    createdContinuityEpochId: continuityEpochId,
    lineageContextRef: {
      schemaVersion: 1,
      sourceActivityId: createActivityId(),
      sourceInstanceId: createInstanceId(),
      sourceContinuityEpochId: continuityEpochId,
    },
    configurationBinding: { policy: "LATEST_COMPATIBLE_AT_ATTEMPT" },
    restoreReplayClass: "RECONCILE_REQUIRED",
    dispatchRevision,
    activeAttemptId: createDispatchAttemptId(workItemId, dispatchRevision),
    state: "RUNNING",
    createdAt: now,
    updatedAt: now,
  };
}

function repository(item: WorkItem): WorkQueueRepository {
  const through = { createdAt: item.createdAt, workItemId: item.workItemId };
  return {
    snapshotRunningCeiling: vi.fn(async () => through),
    listRunning: vi.fn(async () => [item]),
  } as unknown as WorkQueueRepository;
}

describe("WorkQueue RUNNING recovery coordinator", () => {
  it("reports every engine projection contradiction without mutating WorkItem state", async () => {
    for (const kind of [
      "ABSENT",
      "ENGINE_SUCCESS",
      "ENGINE_ERROR",
      "ENGINE_CANCELLED",
      "RECOVERY_EXHAUSTED",
      "VERSION_MISMATCH",
    ] as const) {
      const item = runningItem();
      const errors: unknown[] = [];
      const inspection: DurableAttemptInspectionPort = {
        inspect: vi.fn(async () =>
          kind === "VERSION_MISMATCH" ? { kind, applicationVersion: "b" } : { kind },
        ),
      };
      const coordinator = createWorkQueueRecoveryCoordinator({
        repository: repository(item),
        durableInspection: inspection,
        onBackgroundError: (error) => errors.push(error),
        batchSize: 10,
      });

      await expect(coordinator.scan()).resolves.toEqual({
        scanned: 1,
        healthy: 0,
        reported: 1,
      });
      expect(errors).toHaveLength(1);
      expect(Reflect.get(inspection, "inspect")).toHaveBeenCalledWith({
        workItemId: item.workItemId,
        dispatchRevision: item.dispatchRevision,
        dispatchAttemptId: item.activeAttemptId,
        queueProfileId: item.queueProfileId,
      });
    }
  });

  it("treats an active projection as healthy and rejects an inconsistent attempt id", async () => {
    const item = runningItem();
    const errors: unknown[] = [];
    const inspection: DurableAttemptInspectionPort = {
      inspect: vi.fn(async () => ({
        kind: "ACTIVE" as const,
        applicationVersion: digest(
          "ProductGenerationId",
          "not-a-durable-version",
        ) as never,
      })),
    };
    const coordinator = createWorkQueueRecoveryCoordinator({
      repository: repository(item),
      durableInspection: inspection,
      onBackgroundError: (error) => errors.push(error),
      batchSize: 10,
    });
    await expect(coordinator.scan()).resolves.toEqual({
      scanned: 1,
      healthy: 1,
      reported: 0,
    });

    const inconsistent = {
      ...item,
      activeAttemptId: createDispatchAttemptId(item.workItemId, 2),
    };
    const inconsistentCoordinator = createWorkQueueRecoveryCoordinator({
      repository: repository(inconsistent),
      durableInspection: inspection,
      onBackgroundError: (error) => errors.push(error),
      batchSize: 10,
    });
    await expect(inconsistentCoordinator.scan()).resolves.toEqual({
      scanned: 1,
      healthy: 0,
      reported: 1,
    });
    expect(Reflect.get(inspection, "inspect")).toHaveBeenCalledTimes(1);
  });
});
