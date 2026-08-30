import { describe, expect, it, vi } from "vitest";
import {
  asDurableCodeVersion,
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
const durableCodeVersion = asDurableCodeVersion(
  digestCanonicalJson("test/recovery-durable-code/v1", { version: "current" }),
);

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

function runningItem(overrides: Partial<WorkItem> = {}): WorkItem {
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
    ...overrides,
  };
}

function cursor(item: WorkItem) {
  return { createdAt: item.createdAt, workItemId: item.workItemId };
}

function repository(items: readonly WorkItem[]): WorkQueueRepository {
  return {
    snapshotRunningCeiling: vi.fn(async () => cursor(items.at(-1)!)),
    listRunning: vi.fn(async ({ after, through, limit }) =>
      [...items]
        .sort((left, right) =>
          `${left.createdAt}\u0000${left.workItemId}`.localeCompare(
            `${right.createdAt}\u0000${right.workItemId}`,
          ),
        )
        .filter((item) => {
          const itemKey = `${item.createdAt}\u0000${item.workItemId}`;
          const afterKey =
            after === undefined
              ? undefined
              : `${after.createdAt}\u0000${after.workItemId}`;
          const throughKey = `${through.createdAt}\u0000${through.workItemId}`;
          return (
            (afterKey === undefined || itemKey > afterKey) && itemKey <= throughKey
          );
        })
        .slice(0, limit),
    ),
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
        repository: repository([item]),
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
      repository: repository([item]),
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
      repository: repository([inconsistent]),
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

  it("advances a fair RUNNING page and keeps one stable ceiling per cycle", async () => {
    const items = [
      runningItem({ createdAt: "2026-08-29T00:00:00.000Z" as Instant }),
      runningItem({ createdAt: "2026-08-29T00:00:01.000Z" as Instant }),
      runningItem({ createdAt: "2026-08-29T00:00:02.000Z" as Instant }),
    ];
    const errors: unknown[] = [];
    const inspection: DurableAttemptInspectionPort = {
      inspect: vi.fn(async () => ({
        kind: "ACTIVE" as const,
        applicationVersion: durableCodeVersion,
      })),
    };
    const repo = repository(items);
    const coordinator = createWorkQueueRecoveryCoordinator({
      repository: repo,
      durableInspection: inspection,
      onBackgroundError: (error) => errors.push(error),
      batchSize: 2,
    });

    await expect(coordinator.scan()).resolves.toMatchObject({ scanned: 2 });
    await expect(coordinator.scan()).resolves.toMatchObject({ scanned: 1 });

    expect(Reflect.get(repo, "snapshotRunningCeiling")).toHaveBeenCalledTimes(1);
    expect(Reflect.get(repo, "listRunning")).toHaveBeenNthCalledWith(1, {
      through: cursor(items[2]!),
      limit: 2,
    });
    expect(Reflect.get(repo, "listRunning")).toHaveBeenNthCalledWith(2, {
      after: cursor(items[1]!),
      through: cursor(items[2]!),
      limit: 2,
    });
    expect(Reflect.get(inspection, "inspect")).toHaveBeenCalledTimes(3);
    expect(errors).toHaveLength(0);
  });

  it("does not move a running cycle ceiling when a new tail row arrives", async () => {
    const items = [
      runningItem({ createdAt: "2026-08-29T00:00:00.000Z" as Instant }),
      runningItem({ createdAt: "2026-08-29T00:00:01.000Z" as Instant }),
      runningItem({ createdAt: "2026-08-29T00:00:02.000Z" as Instant }),
    ];
    const tail = runningItem({ createdAt: "2026-08-29T00:01:00.000Z" as Instant });
    let rows = [...items];
    const errors: unknown[] = [];
    const inspection: DurableAttemptInspectionPort = {
      inspect: vi.fn(async () => ({
        kind: "ACTIVE" as const,
        applicationVersion: durableCodeVersion,
      })),
    };
    const repo = {
      ...repository(rows),
      snapshotRunningCeiling: vi.fn(async () => cursor(rows.at(-1)!)),
      listRunning: vi.fn(async ({ after, through, limit }) =>
        repository(rows).listRunning({ after, through, limit }),
      ),
    } as unknown as WorkQueueRepository & {
      readonly snapshotRunningCeiling: ReturnType<typeof vi.fn>;
      readonly listRunning: ReturnType<typeof vi.fn>;
    };
    const coordinator = createWorkQueueRecoveryCoordinator({
      repository: repo,
      durableInspection: inspection,
      onBackgroundError: (error) => errors.push(error),
      batchSize: 2,
    });

    await coordinator.scan();
    rows = [...items, tail];
    await coordinator.scan();

    expect(Reflect.get(repo, "snapshotRunningCeiling")).toHaveBeenCalledTimes(1);
    expect(Reflect.get(inspection, "inspect")).toHaveBeenCalledTimes(3);
    expect(errors).toHaveLength(0);
  });

  it("resets the fair RUNNING lane so the next scan starts a new cycle", async () => {
    const items = [
      runningItem({ createdAt: "2026-08-29T00:00:00.000Z" as Instant }),
      runningItem({ createdAt: "2026-08-29T00:00:01.000Z" as Instant }),
      runningItem({ createdAt: "2026-08-29T00:00:02.000Z" as Instant }),
    ];
    const inspection: DurableAttemptInspectionPort = {
      inspect: vi.fn(async () => ({
        kind: "ACTIVE" as const,
        applicationVersion: durableCodeVersion,
      })),
    };
    const repo = repository(items);
    const coordinator = createWorkQueueRecoveryCoordinator({
      repository: repo,
      durableInspection: inspection,
      onBackgroundError: () => undefined,
      batchSize: 2,
    });

    await coordinator.scan();
    coordinator.reset();
    await coordinator.scan();

    expect(Reflect.get(repo, "snapshotRunningCeiling")).toHaveBeenCalledTimes(2);
    expect(Reflect.get(repo, "listRunning")).toHaveBeenNthCalledWith(2, {
      through: cursor(items[2]!),
      limit: 2,
    });
  });
});
