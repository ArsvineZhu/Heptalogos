import { describe, expect, it, vi } from "vitest";
import {
  asContentDigest,
  createActivityId,
  createContinuityEpochId,
  createInstanceId,
  createMicroSystemId,
  createContributionId,
  createUuidV7Id,
  createWorkItemId,
  digestCanonicalJson,
  formatInstant,
  type ContinuityEpochId,
  type Instant,
  type ProductGenerationId,
  type PackageGenerationId,
} from "@heptalogos/foundation-contracts";
import type {
  PersistenceExecutionMetadata,
  PersistenceService,
} from "@heptalogos/persistence";
import {
  createDispatchAttemptId,
  createWorkQueueRepository,
  type ResourceAdmissionClassId,
  type WorkItemMutationResult,
  type WorkQueueProfileId,
} from "./index.js";
import type { WorkItem } from "./contracts.js";

const mocks = vi.hoisted(() => ({
  executeQuery: vi.fn(),
}));

vi.mock("@heptalogos/persistence/foundation-repository", () => ({
  useFoundationMutationTransaction: async (
    _context: unknown,
    operation: (transaction: unknown) => Promise<unknown>,
  ) => operation({ executeQuery: mocks.executeQuery }),
  useFoundationReadTransaction: async (
    _context: unknown,
    operation: (transaction: unknown) => Promise<unknown>,
  ) => operation({ executeQuery: mocks.executeQuery }),
}));

const now = "2026-08-26T12:00:00.000Z" as Instant;

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

function executionMetadata(): PersistenceExecutionMetadata {
  return {
    activityId: createActivityId(),
    installationId: createUuidV7Id("InstallationId"),
    instanceId: createInstanceId(),
    bootId: createUuidV7Id("BootId"),
    continuityEpochId: createContinuityEpochId(),
    hostOwnershipToken: createUuidV7Id("HostOwnershipToken"),
  };
}

function fakePersistence(): PersistenceService {
  const execution = executionMetadata();
  return {
    state: "OPEN",
    async read(operation) {
      return operation({ mode: "READ" });
    },
    async mutate(operation) {
      return operation({ mode: "MUTATION", execution });
    },
    async close() {},
  };
}

function sampleWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  const continuityEpochId: ContinuityEpochId = createContinuityEpochId();
  return {
    schemaVersion: 1,
    workItemId: createWorkItemId(),
    handler: {
      productGenerationId: digest("ProductGenerationId", "product-a"),
      microSystemId: createMicroSystemId("subject"),
      contributionId: createContributionId("subject.reply"),
      packageGenerationId: digest("PackageGenerationId", "package-a"),
      payloadVersion: 1,
    },
    payload: { message: "hello" },
    queueProfileId: createMicroSystemId(
      "default-work",
    ) as unknown as WorkQueueProfileId,
    resourceAdmissionClass: createMicroSystemId(
      "normal",
    ) as unknown as ResourceAdmissionClassId,
    priority: 100,
    createdContinuityEpochId: continuityEpochId,
    lineageContextRef: {
      schemaVersion: 1,
      sourceActivityId: createActivityId(),
      sourceInstanceId: createInstanceId(),
      sourceContinuityEpochId: continuityEpochId,
    },
    configurationBinding: { policy: "LATEST_COMPATIBLE_AT_ATTEMPT" },
    restoreReplayClass: "RECONCILE_REQUIRED",
    dispatchRevision: 1,
    state: "PENDING",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function rowFor(item: WorkItem): Record<string, unknown> {
  return {
    work_item_id: item.workItemId,
    target_product_generation_id: item.handler.productGenerationId,
    handler_micro_system_id: item.handler.microSystemId,
    handler_contribution_id: item.handler.contributionId,
    handler_package_generation_id: item.handler.packageGenerationId,
    payload_version: item.handler.payloadVersion,
    payload: item.payload,
    queue_profile_id: item.queueProfileId,
    resource_admission_class: item.resourceAdmissionClass,
    partition_key: item.partitionKey ?? null,
    priority: item.priority,
    not_before: item.notBefore ? new Date(item.notBefore) : null,
    dedup_key: item.dedupKey ?? null,
    created_continuity_epoch_id: item.createdContinuityEpochId,
    lineage_context_ref: item.lineageContextRef,
    configuration_binding_policy: item.configurationBinding.policy,
    config_revision_ref: item.configurationBinding.configRevisionRef ?? null,
    restore_replay_class: item.restoreReplayClass,
    dispatch_revision: item.dispatchRevision,
    active_attempt_id: item.activeAttemptId ?? null,
    state: item.state,
    retry_class: item.retryClass ?? null,
    state_reason_code: item.stateReasonCode ?? null,
    cancel_requested_at: item.cancelRequestedAt
      ? new Date(item.cancelRequestedAt)
      : null,
    cancellation_reason_code: item.cancellationReasonCode ?? null,
    superseded_by: item.supersededBy ?? null,
    outcome: item.outcome ?? null,
    created_at: new Date(item.createdAt),
    updated_at: new Date(item.updatedAt),
  };
}

function prepareRows(...rows: readonly Record<string, unknown>[]): void {
  mocks.executeQuery.mockReset();
  mocks.executeQuery.mockResolvedValue({ rows: [] });
  for (const row of rows) {
    mocks.executeQuery.mockResolvedValueOnce({ rows: [row] });
  }
}

function prepareCasMissThen(...rows: readonly Record<string, unknown>[]): void {
  mocks.executeQuery.mockReset();
  mocks.executeQuery.mockResolvedValueOnce({ rows: [] });
  for (const row of rows) {
    mocks.executeQuery.mockResolvedValueOnce({ rows: [row] });
  }
  mocks.executeQuery.mockResolvedValue({ rows: [] });
}

describe("WorkQueue Persistence repository", () => {
  it("inserts and reads a canonical WorkItem through the Persistence callback", async () => {
    const item = sampleWorkItem({ dedupKey: "dedup-1" });
    prepareRows(rowFor(item));
    const repository = createWorkQueueRepository(fakePersistence());

    const result = await repository.insertWorkItem(item);

    expect(result).toEqual({ status: "INSERTED", item });
    expect(mocks.executeQuery).toHaveBeenCalledTimes(1);
    expect(mocks.executeQuery.mock.calls[0][0].sql).toContain(
      'INSERT INTO "heptalogos"."work_item"',
    );
    expect(mocks.executeQuery.mock.calls[0][0].parameters).toContain(item.workItemId);
  });

  it("returns the existing item when the partial dedup uniqueness race wins elsewhere", async () => {
    const item = sampleWorkItem({ dedupKey: "dedup-race" });
    prepareRows(rowFor(item));
    mocks.executeQuery.mockReset();
    mocks.executeQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [rowFor(item)] });
    const repository = createWorkQueueRepository(fakePersistence());

    const result = await repository.insertWorkItem(item);

    expect(result).toEqual({ status: "EXISTING", item });
    expect(mocks.executeQuery).toHaveBeenCalledTimes(2);
    expect(mocks.executeQuery.mock.calls[1][0].sql).toContain(
      "state IN ('PENDING', 'RUNNING', 'WAITING_DEPENDENCY', 'RETRY_WAIT', 'WAITING_RESTORE_RECONCILIATION')",
    );
    expect(mocks.executeQuery.mock.calls[0][0].sql).toContain(
      "ON CONFLICT (handler_micro_system_id, handler_contribution_id, dedup_key)",
    );
  });

  it("returns typed CAS outcomes instead of boolean ambiguity", async () => {
    const item = sampleWorkItem();
    const runningBase = sampleWorkItem({ state: "RUNNING", dispatchRevision: 2 });
    const running = sampleWorkItem({
      ...runningBase,
      activeAttemptId: createDispatchAttemptId(runningBase.workItemId, 2),
    });
    const terminal = sampleWorkItem({
      state: "SUCCEEDED",
      outcome: {
        schemaVersion: 1,
        kind: "SUCCEEDED",
        value: { ok: true },
      },
    });
    const repository = createWorkQueueRepository(fakePersistence());

    prepareCasMissThen(rowFor(running));
    await expect(
      repository.markWaitingDependency({
        workItemId: item.workItemId,
        expectedDispatchRevision: 1,
        updatedAt: now,
      }),
    ).resolves.toMatchObject({
      status: "STALE",
    } satisfies Partial<WorkItemMutationResult>);

    prepareRows();
    await expect(
      repository.markWaitingDependency({
        workItemId: item.workItemId,
        expectedDispatchRevision: 1,
        updatedAt: now,
      }),
    ).resolves.toMatchObject({
      status: "NOT_FOUND",
    } satisfies Partial<WorkItemMutationResult>);

    prepareCasMissThen(rowFor(terminal));
    await expect(
      repository.markWaitingDependency({
        workItemId: item.workItemId,
        expectedDispatchRevision: 1,
        updatedAt: now,
      }),
    ).resolves.toMatchObject({
      status: "TERMINAL",
    } satisfies Partial<WorkItemMutationResult>);
  });

  it("does not retain a transaction or use one outside the Persistence callback", async () => {
    const item = sampleWorkItem();
    prepareRows(rowFor(item));
    let callbackDepth = 0;
    const persistence = fakePersistence();
    const originalMutate = persistence.mutate;
    persistence.mutate = async (operation) => {
      callbackDepth += 1;
      try {
        return await originalMutate(operation);
      } finally {
        callbackDepth -= 1;
      }
    };
    const repository = createWorkQueueRepository(persistence);

    await repository.insertWorkItem(item);

    expect(callbackDepth).toBe(0);
    expect(mocks.executeQuery.mock.calls.every(() => callbackDepth === 0)).toBe(true);
  });
});
