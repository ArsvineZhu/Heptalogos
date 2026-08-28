import { describe, expect, it, vi } from "vitest";
import {
  asContentDigest,
  createActivityId,
  createContinuityEpochId,
  createContributionId,
  createInstanceId,
  createMicroSystemId,
  createUuidV7Id,
  createWorkItemId,
  digestCanonicalJson,
  type ActivityId,
  type ContinuityEpochId,
  type Instant,
  type PackageGenerationId,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import type {
  ExecutionContext,
  ExecutionContextRuntime,
  ExecutionLineageService,
  LineageContextRefV1,
} from "@heptalogos/execution-lineage";
import type { RuntimeExecutionOrigin } from "@heptalogos/execution-lineage/runtime-kernel";
import type {
  PersistenceExecutionMetadata,
  PersistenceMutationTransactionContext,
  PersistenceService,
} from "@heptalogos/persistence";
import type {
  ContractVersion,
  ResourceAdmissionClassId,
  RuntimeWorkHandlerLease,
  WorkHandlerProvisionDescriptor,
  WorkQueueProfileId,
} from "@heptalogos/runtime-kernel";
import type { TimeService } from "@heptalogos/time-service";
import {
  createWorkQueueService,
  type WorkCreationAdmissionDecision,
  type WorkAdmissionPort,
  type WorkHandlerTarget,
  type WorkItem,
  type WorkQueueRepository,
  type WorkQueueRuntimeOptions,
} from "../../src/index.js";

const now = "2026-08-26T12:00:00.000Z" as Instant;
const delayed = "2026-08-26T12:05:00.000Z" as Instant;

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

const target: WorkHandlerTarget = {
  productGenerationId: digest("ProductGenerationId", "product-a"),
  microSystemId: createMicroSystemId("subject"),
  contributionId: createContributionId("subject.reply"),
  packageGenerationId: digest("PackageGenerationId", "package-a"),
  payloadVersion: 1,
};

const queueProfileId = createMicroSystemId(
  "default-work",
) as unknown as WorkQueueProfileId;
const resourceAdmissionClass = createMicroSystemId(
  "normal",
) as unknown as ResourceAdmissionClassId;

function origin(): RuntimeExecutionOrigin {
  return {
    productGenerationId: target.productGenerationId,
    packageGenerationId: target.packageGenerationId,
    microSystemId: target.microSystemId,
    microSystemInstanceId: createUuidV7Id("MicroSystemInstanceId"),
    contributionId: target.contributionId,
  };
}

function executionContext(
  activityId: ActivityId = createActivityId(),
): ExecutionContext {
  const installationId = createUuidV7Id("InstallationId");
  const instanceId = createInstanceId();
  const bootId = createUuidV7Id("BootId");
  const continuityEpochId = createContinuityEpochId();
  const token = createUuidV7Id("HostOwnershipToken");
  return {
    activityId,
    kind: "test.source",
    startedAt: now,
    links: [],
    origin: {
      installationId,
      instanceId,
      bootId,
      continuityEpochId,
      hostOwnershipToken: token,
      runtime: origin(),
    },
    semantic: {},
    importance: "routine",
    retentionClass: "operational",
    sensitivity: "operational",
  };
}

function lineageRef(context: ExecutionContext): LineageContextRefV1 {
  return {
    schemaVersion: 1,
    sourceActivityId: context.activityId,
    sourceInstanceId: context.origin.instanceId,
    sourceContinuityEpochId: context.origin.continuityEpochId,
  };
}

function fakePersistence(): PersistenceService {
  const execution: PersistenceExecutionMetadata = {
    activityId: createActivityId(),
    installationId: createUuidV7Id("InstallationId"),
    instanceId: createInstanceId(),
    bootId: createUuidV7Id("BootId"),
    continuityEpochId: createContinuityEpochId(),
    hostOwnershipToken: createUuidV7Id("HostOwnershipToken"),
  };
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

function fakeRepository(
  inserted: WorkItem,
  onInsert: (
    item: WorkItem,
    options:
      | {
          readonly onWithinTransaction?: (
            result: {
              readonly status: "INSERTED" | "EXISTING";
              readonly item: WorkItem;
            },
            transaction: PersistenceMutationTransactionContext,
          ) => Promise<void>;
        }
      | undefined,
    status: "INSERTED" | "EXISTING",
  ) => Promise<void> = async () => undefined,
  status: "INSERTED" | "EXISTING" = "INSERTED",
): WorkQueueRepository {
  return {
    insertWorkItem: (item, options) =>
      onInsert(item, options, status).then(() => ({ status, item: inserted })),
    getWorkItem: async () => undefined,
    findNonTerminalDedup: async () => undefined,
    snapshotProjectionCeiling: async () => undefined,
    listProjectionCandidates: async () => [],
    listDueRetry: async () => [],
    snapshotWaitingDependencyCeiling: async () => undefined,
    listWaitingDependency: async () => [],
    markRunning: async () => ({ status: "NOT_FOUND" }),
    markWaitingDependency: async () => ({ status: "NOT_FOUND" }),
    wakeDependency: async () => ({ status: "NOT_FOUND" }),
    markRetryWait: async () => ({ status: "NOT_FOUND" }),
    wakeDueRetry: async () => ({ status: "NOT_FOUND" }),
    requestCancel: async () => ({ status: "NOT_FOUND" }),
    requestSupersede: async () => ({ status: "NOT_FOUND" }),
    commitTerminal: async () => ({ status: "NOT_FOUND" }),
  };
}

function workItem(
  context: ExecutionContext,
  overrides: Partial<WorkItem> = {},
): WorkItem {
  const continuityEpochId: ContinuityEpochId = context.origin.continuityEpochId;
  return {
    schemaVersion: 1,
    workItemId: createWorkItemId(),
    handler: target,
    payload: { value: "hello" },
    queueProfileId,
    resourceAdmissionClass,
    priority: 100,
    createdContinuityEpochId: continuityEpochId,
    lineageContextRef: lineageRef(context),
    configurationBinding: { policy: "LATEST_COMPATIBLE_AT_ATTEMPT" },
    restoreReplayClass: "RECONCILE_REQUIRED",
    dispatchRevision: 1,
    state: "PENDING",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function serviceFixture(
  decision: WorkCreationAdmissionDecision,
  insertStatus: "INSERTED" | "EXISTING" = "INSERTED",
) {
  const source = executionContext();
  const activity = executionContext();
  const inserted = workItem(activity);
  const retainCurrent = vi.fn(async () => undefined);
  const completeCurrent = vi.fn(async () => undefined);
  const publish = vi.fn(async () => undefined);
  const backgroundErrors: unknown[] = [];
  const insertedItems: WorkItem[] = [];
  const transaction: PersistenceMutationTransactionContext = {
    mode: "MUTATION",
    execution: {
      activityId: activity.activityId,
      installationId: activity.origin.installationId,
      instanceId: activity.origin.instanceId,
      bootId: activity.origin.bootId,
      continuityEpochId: activity.origin.continuityEpochId,
      hostOwnershipToken: activity.origin.hostOwnershipToken,
    },
  };
  const repository = fakeRepository(
    inserted,
    async (item, options, status) => {
      insertedItems.push(item);
      await options?.onWithinTransaction?.({ status, item: inserted }, transaction);
    },
    insertStatus,
  );
  const admission: WorkAdmissionPort = {
    beforeCreate: vi.fn(async () => decision),
    beforeDispatch: vi.fn(async () => ({ decision: "ALLOW" as const })),
  };
  const descriptor: WorkHandlerProvisionDescriptor = {
    contributionId: target.contributionId,
    contractVersion: "v1" as ContractVersion,
    payloadContracts: [{ version: 1, schema: {} }],
    outcomeSchema: {},
    queueProfileId,
    resourceAdmissionClass,
    configurationBindingPolicy: "LATEST_COMPATIBLE_AT_ATTEMPT",
    restoreReplayClass: "RECONCILE_REQUIRED",
  };
  const lease: RuntimeWorkHandlerLease = {
    target,
    descriptor,
    validatePayload: vi.fn((version: number, payload: unknown) => {
      expect(version).toBe(1);
      return payload as never;
    }),
    reserveInvocation: vi.fn(() => ({
      execute: vi.fn(async () => ({ outcome: { ok: true } as never })),
      release: vi.fn(),
    })),
  };
  const runtime: ExecutionContextRuntime = {
    current: () => source,
    createLineageContextRef: () => lineageRef(source),
    runActivity: vi.fn(async (_request, operation) => operation(activity)),
    capture: (callback) => callback as never,
    runFromLineageContextRef: async (_ref, _request, operation) => operation(activity),
  };
  const time: TimeService = {
    now: () => now,
    monotonicNow: () => 0n as never,
    elapsedSince: () => 0n as never,
  };
  const lineage: ExecutionLineageService = {
    retainCurrent,
    completeCurrent,
    retainBootstrapReference: async () => undefined,
  };
  const resolve = vi.fn(() => lease);
  const handlerRegistry = { resolve };
  const service = createWorkQueueService({
    persistence: fakePersistence(),
    repository,
    handlerRegistry,
    execution: runtime,
    lineage,
    time,
    signalPublisher: { publish },
    admission,
    runtimeOptions: {
      maxInlinePayloadBytes: 1024,
      maxOutcomeBytes: 1024,
      reconciliationBatchSize: 10,
      antiEntropyIntervalMs: 1_000,
    } satisfies WorkQueueRuntimeOptions,
    onBackgroundError: (error) => backgroundErrors.push(error),
  });
  return {
    service,
    source,
    activity,
    admission,
    lease,
    handlerRegistry,
    runtime,
    lineage,
    retainCurrent,
    completeCurrent,
    publish,
    backgroundErrors,
    insertedItems,
  };
}

describe("WorkQueue creation service", () => {
  it("validates the exact lease, retains lineage, inserts, and publishes only after admission", async () => {
    const fixture = serviceFixture({ decision: "ALLOW" });

    const result = await fixture.service.create({
      target,
      payload: { value: "hello" },
      queueProfileId,
      resourceAdmissionClass,
      priority: 100,
    });

    expect(result.status).toBe("CREATED");
    expect(Reflect.get(fixture.admission, "beforeCreate")).toHaveBeenCalledTimes(1);
    expect(Reflect.get(fixture.lease, "validatePayload")).toHaveBeenCalledWith(1, {
      value: "hello",
    });
    expect(fixture.retainCurrent).toHaveBeenCalledTimes(1);
    expect(fixture.publish).toHaveBeenCalledTimes(1);
    expect(fixture.completeCurrent).toHaveBeenCalledWith(
      expect.anything(),
      fixture.activity,
      { endedAt: now, outcome: "SUCCEEDED", outcomeRef: "CREATED" },
    );
    expect(fixture.insertedItems[0]).toMatchObject({
      state: "PENDING",
      handler: target,
    });
    expect(fixture.insertedItems[0]).not.toHaveProperty("notBefore");
  });

  it("completes a deduplicated work.create Activity as EXISTING", async () => {
    const fixture = serviceFixture({ decision: "ALLOW" }, "EXISTING");

    const result = await fixture.service.create({
      target,
      payload: { value: "hello" },
      queueProfileId,
      resourceAdmissionClass,
      priority: 100,
    });

    expect(result.status).toBe("EXISTING");
    expect(fixture.retainCurrent).toHaveBeenCalledTimes(1);
    expect(fixture.publish).not.toHaveBeenCalled();
    expect(fixture.completeCurrent).toHaveBeenCalledWith(
      expect.anything(),
      fixture.activity,
      { endedAt: now, outcome: "SUCCEEDED", outcomeRef: "EXISTING" },
    );
  });

  it("retains DELAY and THROTTLE items with their explicit due time", async () => {
    for (const decision of [
      { decision: "DELAY", notBefore: delayed, reasonCode: "delay" },
      { decision: "THROTTLE", notBefore: delayed, reasonCode: "throttle" },
    ] as const) {
      const fixture = serviceFixture(decision);
      const result = await fixture.service.create({
        target,
        payload: { value: "hello" },
        queueProfileId,
        resourceAdmissionClass,
        priority: 100,
      });
      expect(result.status).toBe("CREATED");
      expect(fixture.insertedItems[0]?.notBefore).toBe(delayed);
    }
  });

  it("detaches the payload before admission can mutate the caller object", async () => {
    const fixture = serviceFixture({ decision: "ALLOW" });
    const sourcePayload = { nested: { value: 1 } };
    const beforeCreate = Reflect.get(fixture.admission, "beforeCreate") as ReturnType<
      typeof vi.fn
    >;
    beforeCreate.mockImplementationOnce(() => {
      sourcePayload.nested.value = 9;
      return { decision: "ALLOW" };
    });

    await fixture.service.create({
      target,
      payload: sourcePayload,
      queueProfileId,
      resourceAdmissionClass,
      priority: 100,
    });

    expect(sourcePayload.nested.value).toBe(9);
    expect(fixture.insertedItems[0]?.payload).toEqual({ nested: { value: 1 } });
    expect(Object.isFrozen(fixture.insertedItems[0]?.payload)).toBe(true);
  });

  it("snapshots the complete creation envelope before asynchronous admission", async () => {
    const fixture = serviceFixture({ decision: "ALLOW" });
    const originalTarget: WorkHandlerTarget = { ...target };
    const mutableTarget = { ...originalTarget };
    const mutatedTarget: WorkHandlerTarget = {
      ...originalTarget,
      productGenerationId: digest("ProductGenerationId", "product-mutated"),
      microSystemId: target.microSystemId,
      contributionId: createContributionId("subject.mutated"),
      packageGenerationId: digest("PackageGenerationId", "package-mutated"),
      payloadVersion: 2,
    };
    let admissionEntered!: () => void;
    const entered = new Promise<void>((resolve) => {
      admissionEntered = resolve;
    });
    let releaseAdmission!: () => void;
    const admissionGate = new Promise<WorkCreationAdmissionDecision>((resolve) => {
      releaseAdmission = () => resolve({ decision: "ALLOW" });
    });
    fixture.admission.beforeCreate = () => {
      admissionEntered();
      return admissionGate;
    };

    const createPromise = fixture.service.create({
      target: mutableTarget,
      payload: { value: "original" },
      queueProfileId,
      resourceAdmissionClass,
      partitionKey: "original-partition",
      priority: 100,
      notBefore: delayed,
      dedupKey: "original-dedup",
    });
    await entered;
    Object.assign(mutableTarget, mutatedTarget);
    releaseAdmission();
    const result = await createPromise;

    expect(result.status).toBe("CREATED");
    expect(fixture.insertedItems[0]).toMatchObject({
      handler: originalTarget,
      queueProfileId,
      resourceAdmissionClass,
      partitionKey: "original-partition",
      priority: 100,
      notBefore: delayed,
      dedupKey: "original-dedup",
    });
  });

  it("does not insert for either rejection decision", async () => {
    for (const decision of [
      { decision: "REJECT_OPTIONAL", reasonCode: "optional" },
      { decision: "REJECT_NEW_WORK", reasonCode: "new" },
    ] as const) {
      const fixture = serviceFixture(decision);
      await expect(
        fixture.service.create({
          target,
          payload: { value: "hello" },
          queueProfileId,
          resourceAdmissionClass,
          priority: 100,
        }),
      ).rejects.toMatchObject({
        problem: {
          problemCode: expect.stringContaining(
            decision.decision === "REJECT_OPTIONAL"
              ? "rejected_optional"
              : "rejected_new_work",
          ),
        },
      });
      expect(fixture.insertedItems).toHaveLength(0);
      expect(Reflect.get(fixture.runtime, "runActivity")).not.toHaveBeenCalled();
    }
  });

  it("fails closed for missing exact handlers, pinned configuration, and oversized payloads", async () => {
    const fixture = serviceFixture({ decision: "ALLOW" });
    fixture.handlerRegistry.resolve.mockReturnValueOnce(undefined as never);
    await expect(
      fixture.service.create({
        target,
        payload: { value: "hello" },
        queueProfileId,
        resourceAdmissionClass,
        priority: 100,
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "work.handler.unavailable" },
    });

    const pinned = serviceFixture({ decision: "ALLOW" });
    await expect(
      pinned.service.create({
        target,
        payload: { value: "hello" },
        queueProfileId,
        resourceAdmissionClass,
        priority: 100,
        configurationBinding: {
          policy: "CONFIG_PINNED",
          configRevisionRef: "caller-ref",
        },
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "work.configuration.binding_unavailable" },
    });
    expect(pinned.insertedItems).toHaveLength(0);

    const oversized = serviceFixture({ decision: "ALLOW" });
    await expect(
      oversized.service.create({
        target,
        payload: { value: "x".repeat(2_000) },
        queueProfileId,
        resourceAdmissionClass,
        priority: 100,
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "work.payload.too_large" },
    });
  });

  it("rejects payload versions outside the PostgreSQL integer range", async () => {
    const fixture = serviceFixture({ decision: "ALLOW" });
    await expect(
      fixture.service.create({
        target: { ...target, payloadVersion: 2_147_483_648 },
        payload: { value: "hello" },
        queueProfileId,
        resourceAdmissionClass,
        priority: 100,
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "work.request.invalid" },
    });
    expect(fixture.handlerRegistry.resolve).not.toHaveBeenCalled();
  });

  it("propagates a transaction-time Signal publication failure", async () => {
    const fixture = serviceFixture({ decision: "ALLOW" });
    fixture.publish.mockRejectedValueOnce(new Error("secret-sentinel"));

    await expect(
      fixture.service.create({
        target,
        payload: { value: "hello" },
        queueProfileId,
        resourceAdmissionClass,
        priority: 100,
      }),
    ).rejects.toThrow("secret-sentinel");
    expect(fixture.insertedItems).toHaveLength(1);
    expect(fixture.backgroundErrors).toHaveLength(0);
  });
});
