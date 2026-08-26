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
  ProblemError,
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
import type { PersistenceMutationTransactionContext } from "@heptalogos/persistence";
import type {
  ContractVersion,
  ResourceAdmissionClassId,
  RuntimeWorkHandlerLease,
  WorkHandlerProvisionDescriptor,
  WorkQueueProfileId,
} from "@heptalogos/runtime-kernel";
import type { TimeService } from "@heptalogos/time-service";
import {
  createWorkAttemptExecutor,
  type WorkErrorClassifier,
  type WorkHandlerResolver,
  type WorkItem,
  type WorkQueueRepository,
  type WorkQueueRuntimeOptions,
} from "./index.js";

const now = "2026-08-26T12:00:00.000Z" as Instant;
const future = "2026-08-26T12:05:00.000Z" as Instant;
const queueProfileId = createMicroSystemId(
  "default-work",
) as unknown as WorkQueueProfileId;
const resourceAdmissionClass = createMicroSystemId(
  "normal",
) as unknown as ResourceAdmissionClassId;

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

function target(packageName = "package-a") {
  return {
    productGenerationId: digest("ProductGenerationId", "product-a"),
    microSystemId: createMicroSystemId("subject"),
    contributionId: createContributionId("subject.reply"),
    packageGenerationId: digest("PackageGenerationId", packageName),
    payloadVersion: 1,
  };
}

function context(): ExecutionContext {
  const continuityEpochId = createContinuityEpochId();
  return {
    activityId: createActivityId(),
    kind: "test.attempt",
    startedAt: now,
    links: [],
    origin: {
      installationId: createUuidV7Id("InstallationId"),
      instanceId: createInstanceId(),
      bootId: createUuidV7Id("BootId"),
      continuityEpochId,
      hostOwnershipToken: createUuidV7Id("HostOwnershipToken"),
    },
    semantic: {},
    importance: "routine",
    retentionClass: "operational",
    sensitivity: "operational",
  };
}

function refFor(value: ExecutionContext): LineageContextRefV1 {
  return {
    schemaVersion: 1,
    sourceActivityId: value.activityId,
    sourceInstanceId: value.origin.instanceId,
    sourceContinuityEpochId: value.origin.continuityEpochId,
  };
}

function item(value: ExecutionContext, overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    schemaVersion: 1,
    workItemId: createWorkItemId(),
    handler: target(),
    payload: { value: "hello" },
    queueProfileId,
    resourceAdmissionClass,
    priority: 100,
    createdContinuityEpochId: value.origin.continuityEpochId,
    lineageContextRef: refFor(value),
    configurationBinding: { policy: "LATEST_COMPATIBLE_AT_ATTEMPT" },
    restoreReplayClass: "RECONCILE_REQUIRED",
    dispatchRevision: 1,
    state: "PENDING",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function terminalItem(
  value: WorkItem,
  kind: "SUCCEEDED" | "FAILED" | "CANCELLED" | "SUPERSEDED" = "SUCCEEDED",
): WorkItem {
  const outcome =
    kind === "SUCCEEDED"
      ? { schemaVersion: 1 as const, kind, value: { ok: true } }
      : kind === "FAILED"
        ? {
            schemaVersion: 1 as const,
            kind,
            retryClass: "permanent" as const,
            reasonCode: "failed",
          }
        : kind === "CANCELLED"
          ? { schemaVersion: 1 as const, kind, reasonCode: "cancelled" }
          : { schemaVersion: 1 as const, kind, reasonCode: "superseded" };
  return {
    ...value,
    state: kind,
    activeAttemptId: undefined,
    retryClass: kind === "FAILED" ? "permanent" : undefined,
    outcome,
    updatedAt: now,
  };
}

function leaseFor(
  value: WorkItem,
  execute: RuntimeWorkHandlerLease["execute"] = vi.fn(async () => ({
    outcome: { ok: true } as never,
  })),
): RuntimeWorkHandlerLease {
  const descriptor: WorkHandlerProvisionDescriptor = {
    contributionId: value.handler.contributionId,
    contractVersion: "v1" as ContractVersion,
    payloadContracts: [{ version: 1, schema: {} }],
    outcomeSchema: {},
    queueProfileId,
    resourceAdmissionClass,
    configurationBindingPolicy: "LATEST_COMPATIBLE_AT_ATTEMPT",
    restoreReplayClass: "RECONCILE_REQUIRED",
  };
  return {
    target: value.handler,
    descriptor,
    validatePayload: (_version, payload) => payload as never,
    validateOutcome: (outcome) => outcome as never,
    execute,
  };
}

function fixture(
  value: WorkItem = item(context()),
  execute: RuntimeWorkHandlerLease["execute"] = vi.fn(async () => ({
    outcome: { ok: true } as never,
  })),
) {
  const executionContext = context();
  const activity = context();
  const lease = leaseFor(value, execute);
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
  const repository: WorkQueueRepository = {
    getWorkItem: vi.fn(async () => value),
    markRunning: vi.fn(async (input) => {
      const running = {
        ...value,
        state: "RUNNING" as const,
        activeAttemptId: input.activeAttemptId,
      };
      await input.onApplied?.(transaction, running);
      return { status: "APPLIED" as const, item: running };
    }),
    markWaitingDependency: vi.fn(async () => ({
      status: "APPLIED" as const,
      item: { ...value, state: "WAITING_DEPENDENCY" as const },
    })),
    markRetryWait: vi.fn(async (input) => {
      const waiting = {
        ...value,
        state: "RETRY_WAIT" as const,
        retryClass: input.retryClass,
        stateReasonCode: input.reasonCode,
        notBefore: input.notBefore,
      };
      await input.onApplied?.(transaction, waiting);
      return { status: "APPLIED" as const, item: waiting };
    }),
    commitTerminal: vi.fn(async (input) => {
      const completed = terminalItem(value, input.outcome.kind);
      await input.onApplied?.(transaction, completed);
      return { status: "APPLIED" as const, item: completed };
    }),
    insertWorkItem: vi.fn(),
    findNonTerminalDedup: vi.fn(),
    listDispatchable: vi.fn(),
    listDueRetry: vi.fn(),
    listWaitingDependency: vi.fn(),
    wakeDependency: vi.fn(),
    wakeDueRetry: vi.fn(),
    requestCancel: vi.fn(),
    requestSupersede: vi.fn(),
  } as unknown as WorkQueueRepository;
  const handlerRegistry: WorkHandlerResolver = {
    resolve: vi.fn(() => lease),
  };
  const runtime: ExecutionContextRuntime = {
    current: () => executionContext,
    runActivity: vi.fn(async (_request, operation) => operation(activity)),
    runFromLineageContextRef: vi.fn(async (_ref, _request, operation) =>
      operation(activity),
    ),
    capture: (callback) => callback as never,
    createLineageContextRef: () => refFor(executionContext),
  };
  const retainCurrent = vi.fn(async () => undefined);
  const completeCurrent = vi.fn(async () => undefined);
  const lineage: ExecutionLineageService = {
    retainCurrent,
    completeCurrent,
    retainBootstrapReference: async () => undefined,
  };
  const classifier: WorkErrorClassifier = {
    classify: vi.fn(() => ({
      kind: "TERMINAL" as const,
      retryClass: "permanent" as const,
      reasonCode: "handler-failed",
    })),
  };
  const time: TimeService = {
    now: () => now,
    monotonicNow: () => 0n as never,
    elapsedSince: () => 0n as never,
  };
  const runtimeOptions: WorkQueueRuntimeOptions = {
    maxInlinePayloadBytes: 1024,
    maxOutcomeBytes: 1024,
    reconciliationBatchSize: 10,
    antiEntropyIntervalMs: 100,
  };
  const executor = createWorkAttemptExecutor({
    repository,
    handlerRegistry,
    execution: runtime,
    lineage,
    time,
    classifier,
    runtimeOptions,
  });
  return {
    executor,
    value,
    repository,
    handlerRegistry,
    lease,
    runtime,
    lineage,
    retainCurrent,
    completeCurrent,
    classifier,
    time,
  };
}

describe("engine-neutral WorkAttemptExecutor", () => {
  it("replays a terminal outcome and no-ops stale revisions", async () => {
    const value = item(context());
    const terminal = terminalItem(value);
    const terminalFixture = fixture(terminal);
    await expect(
      terminalFixture.executor.execute(value.workItemId, 1),
    ).resolves.toMatchObject({ status: "TERMINAL_REPLAY", outcome: terminal.outcome });

    const stale = fixture(value);
    stale.repository.getWorkItem = vi.fn(async () => ({
      ...value,
      dispatchRevision: 2,
    }));
    await expect(stale.executor.execute(value.workItemId, 1)).resolves.toMatchObject({
      status: "STALE_NOOP",
    });
    expect(stale.lease.execute).not.toHaveBeenCalled();
  });

  it("claims and invokes only the exact generation, outside any product transaction", async () => {
    let inTransaction = false;
    const value = item(context());
    const handler = vi.fn(async () => {
      expect(inTransaction).toBe(false);
      return { outcome: { ok: true } as never };
    });
    const attempt = fixture(value, handler);
    attempt.repository.markRunning = vi.fn(async (input) => {
      inTransaction = true;
      const running = {
        ...value,
        state: "RUNNING" as const,
        activeAttemptId: input.activeAttemptId,
      };
      await input.onApplied?.(inTransactionContext(value), running);
      inTransaction = false;
      return { status: "APPLIED" as const, item: running };
    });

    const result = await attempt.executor.execute(value.workItemId, 1);

    expect(result.status).toBe("SUCCEEDED");
    expect(handler).toHaveBeenCalledTimes(1);
    const invocation = (
      handler as unknown as { readonly mock: { readonly calls: readonly unknown[][] } }
    ).mock.calls[0]?.[0];
    expect(invocation).toMatchObject({
      workItemId: value.workItemId,
      dispatchRevision: 1,
      payloadVersion: 1,
      payload: value.payload,
    });
    expect(attempt.retainCurrent).toHaveBeenCalledTimes(1);
  });

  it("does not fall forward from a missing exact generation to another package", async () => {
    const value = item(context());
    const other = leaseFor({ ...value, handler: target("package-b") });
    const attempt = fixture(value);
    const resolve = vi.fn(() => undefined);
    attempt.handlerRegistry.resolve = resolve;
    await expect(attempt.executor.execute(value.workItemId, 1)).resolves.toMatchObject({
      status: "WAITING_DEPENDENCY",
    });
    expect(resolve).toHaveBeenCalledWith(value.handler);
    expect(other.execute).not.toHaveBeenCalled();
  });

  it("lets cancellation and supersession win a stale handler result", async () => {
    for (const kind of ["CANCELLED", "SUPERSEDED"] as const) {
      const value = item(context());
      const attempt = fixture(value, async () => ({ outcome: { ok: true } as never }));
      attempt.repository.commitTerminal = vi.fn(async (input) => ({
        status: "APPLIED" as const,
        item: terminalItem(value, kind),
      }));
      await expect(
        attempt.executor.execute(value.workItemId, 1),
      ).resolves.toMatchObject({
        status: kind,
      });
      expect(attempt.repository.commitTerminal).toHaveBeenCalledTimes(1);
    }
  });

  it("does not turn a retry classification into work without an exact notBefore", async () => {
    const value = item(context());
    const attempt = fixture(value, async () => {
      throw new Error("handler failed");
    });
    attempt.classifier.classify = vi.fn(
      () =>
        ({
          kind: "RETRY" as const,
          retryClass: "transient" as const,
          reasonCode: "retry-without-deadline",
        }) as never,
    );

    await expect(attempt.executor.execute(value.workItemId, 1)).resolves.toMatchObject({
      status: "FAILED",
    });
    expect(attempt.repository.markRetryWait).not.toHaveBeenCalled();
  });

  it("revalidates notBefore before claiming and preserves it in RETRY_WAIT", async () => {
    const value = item(context(), { notBefore: future });
    const attempt = fixture(value);

    await expect(attempt.executor.execute(value.workItemId, 1)).resolves.toMatchObject({
      status: "RETRY_WAIT",
    });
    expect(attempt.lease.execute).not.toHaveBeenCalled();
    expect(attempt.repository.markRetryWait).toHaveBeenCalledWith(
      expect.objectContaining({
        retryClass: "transient",
        reasonCode: "not-before-not-yet-due",
        notBefore: future,
      }),
    );
  });

  it("blocks external-effect-uncertain classification in H3A", async () => {
    const value = item(context());
    const attempt = fixture(value, async () => {
      throw new Error("handler failed");
    });
    attempt.classifier.classify = vi.fn(() => ({
      kind: "RETRY" as const,
      retryClass: "external-effect-uncertain" as const,
      reasonCode: "effect-uncertain",
      notBefore: future,
    }));

    await expect(attempt.executor.execute(value.workItemId, 1)).rejects.toMatchObject({
      problem: { problemCode: "work.external_effect_uncertain_unsupported" },
    });
    expect(attempt.repository.markRetryWait).not.toHaveBeenCalled();
  });

  it("validates and bounds handler output before terminal persistence", async () => {
    const value = item(context());
    const attempt = fixture(value, async () => ({
      outcome: { value: "x".repeat(2_000) } as never,
    }));

    await expect(attempt.executor.execute(value.workItemId, 1)).resolves.toMatchObject({
      status: "FAILED",
    });
    expect(attempt.repository.commitTerminal).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: expect.objectContaining({
          kind: "FAILED",
          retryClass: "permanent",
        }),
      }),
    );
  });

  it("keeps secret handler diagnostics out of canonical failure details", async () => {
    const value = item(context());
    const attempt = fixture(value, async () => {
      throw new Error("secret-sentinel");
    });
    attempt.classifier.classify = vi.fn(({ failure }) => {
      expect(failure.detail).not.toContain("secret-sentinel");
      return {
        kind: "TERMINAL" as const,
        retryClass: "permanent" as const,
        reasonCode: "handler-exception",
      };
    });

    const result = await attempt.executor.execute(value.workItemId, 1);
    expect(JSON.stringify(result)).not.toContain("secret-sentinel");
  });

  it("propagates a Host fence loss when Tx B cannot commit", async () => {
    const value = item(context());
    const attempt = fixture(value);
    attempt.repository.commitTerminal = vi.fn(async () => {
      throw new ProblemError({
        schemaVersion: 1,
        problemCode: "persistence.host_fence.stale_owner",
        category: "conflict",
        retryClass: "after-change",
        title: "Host ownership fence belongs to another owner",
      });
    });

    await expect(attempt.executor.execute(value.workItemId, 1)).rejects.toMatchObject({
      problem: { problemCode: "persistence.host_fence.stale_owner" },
    });
  });
});

function inTransactionContext(value: WorkItem): PersistenceMutationTransactionContext {
  const activityId: ActivityId = createActivityId();
  const continuityEpochId: ContinuityEpochId = value.createdContinuityEpochId;
  return {
    mode: "MUTATION",
    execution: {
      activityId,
      installationId: createUuidV7Id("InstallationId"),
      instanceId: createInstanceId(),
      bootId: createUuidV7Id("BootId"),
      continuityEpochId,
      hostOwnershipToken: createUuidV7Id("HostOwnershipToken"),
    },
  };
}
