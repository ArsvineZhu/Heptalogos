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
  type ContinuityEpochId,
  type Instant,
  type PackageGenerationId,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import type {
  ExecutionContext,
  ExecutionContextRuntime,
  LineageContextRefV1,
} from "@heptalogos/execution-lineage";
import type {
  RuntimeWorkHandlerLease,
  ResourceAdmissionClassId,
  WorkQueueProfileId,
} from "@heptalogos/runtime-kernel";
import type { TimeService } from "@heptalogos/time-service";
import type { SignalService } from "@heptalogos/signal";
import {
  createDispatchAttemptId,
  createWorkQueueReconciler,
  type DurableDispatchRequest,
  type WorkAdmissionPort,
  type WorkDispatchAdmissionDecision,
  type WorkHandlerResolver,
  type WorkItem,
  type WorkQueueRepository,
  type WorkQueueRuntimeOptions,
} from "./index.js";

const now = "2026-08-26T12:00:00.000Z" as Instant;
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

function executionContext(): ExecutionContext {
  const continuityEpochId = createContinuityEpochId();
  return {
    activityId: createActivityId(),
    kind: "test.reconciler",
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

function lineageRef(context: ExecutionContext): LineageContextRefV1 {
  return {
    schemaVersion: 1,
    sourceActivityId: context.activityId,
    sourceInstanceId: context.origin.instanceId,
    sourceContinuityEpochId: context.origin.continuityEpochId,
  };
}

function item(context: ExecutionContext, overrides: Partial<WorkItem> = {}): WorkItem {
  const workItemId = createWorkItemId();
  return {
    schemaVersion: 1,
    workItemId,
    handler: {
      productGenerationId: digest("ProductGenerationId", "product-a"),
      microSystemId: createMicroSystemId("subject"),
      contributionId: createContributionId("subject.reply"),
      packageGenerationId: digest("PackageGenerationId", "package-a"),
      payloadVersion: 1,
    },
    payload: { value: "hello" },
    queueProfileId,
    resourceAdmissionClass,
    priority: 100,
    createdContinuityEpochId: context.origin.continuityEpochId,
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

function executionRuntime(context: ExecutionContext): ExecutionContextRuntime {
  return {
    current: () => context,
    runActivity: vi.fn(async (_request, operation) => operation(context)),
    capture: (callback) => callback as never,
    createLineageContextRef: () => lineageRef(context),
    runFromLineageContextRef: async (_ref, _request, operation) => operation(context),
  };
}

function fakeTime(): TimeService {
  return {
    now: () => now,
    monotonicNow: () => 0n as never,
    elapsedSince: () => 0n as never,
  };
}

function repositoryFor(
  pending: readonly WorkItem[],
  dueRetry: readonly WorkItem[] = [],
  waiting: readonly WorkItem[] = [],
): WorkQueueRepository & {
  readonly wakeDependency: ReturnType<typeof vi.fn>;
  readonly wakeDueRetry: ReturnType<typeof vi.fn>;
  readonly listProjectionCandidates: ReturnType<typeof vi.fn>;
} {
  return {
    insertWorkItem: vi.fn(),
    getWorkItem: vi.fn(),
    findNonTerminalDedup: vi.fn(),
    listProjectionCandidates: vi.fn(async () => pending),
    listDueRetry: vi.fn(async () => dueRetry),
    listWaitingDependency: vi.fn(async () => waiting),
    markRunning: vi.fn(),
    markWaitingDependency: vi.fn(),
    wakeDependency: vi.fn(async () => ({ status: "STALE" as const })),
    markRetryWait: vi.fn(),
    wakeDueRetry: vi.fn(async () => ({ status: "STALE" as const })),
    requestCancel: vi.fn(),
    requestSupersede: vi.fn(),
    commitTerminal: vi.fn(),
  } as unknown as WorkQueueRepository & {
    readonly wakeDependency: ReturnType<typeof vi.fn>;
    readonly wakeDueRetry: ReturnType<typeof vi.fn>;
    readonly listProjectionCandidates: ReturnType<typeof vi.fn>;
  };
}

function signalFixture(): {
  readonly service: SignalService;
  readonly listener: {
    onWakeup(): void | Promise<void>;
    onRescanRequired(): void | Promise<void>;
    onBackgroundError(error: unknown): void;
  };
} {
  let listener:
    | {
        onWakeup(): void | Promise<void>;
        onRescanRequired(): void | Promise<void>;
        onBackgroundError(error: unknown): void;
      }
    | undefined;
  return {
    service: {
      subscribe: vi.fn(async (_topic, value) => {
        listener = value;
        return { close: async () => undefined };
      }),
    },
    get listener() {
      if (listener === undefined) throw new Error("listener not subscribed");
      return listener;
    },
  };
}

function reconcilerFixture(
  pending: readonly WorkItem[] = [],
  dueRetry: readonly WorkItem[] = [],
  waiting: readonly WorkItem[] = [],
  dispatchAdmission: WorkDispatchAdmissionDecision = { decision: "ALLOW" },
) {
  const context = executionContext();
  const repository = repositoryFor(pending, dueRetry, waiting);
  const dispatches: DurableDispatchRequest[] = [];
  const dispatch = vi.fn(async (request: DurableDispatchRequest) => {
    dispatches.push(request);
  });
  const handler: RuntimeWorkHandlerLease = {
    target: pending[0]?.handler ?? item(context).handler,
    descriptor: {} as never,
    validatePayload: (version, value) => value as never,
    validateOutcome: (value) => value as never,
    execute: vi.fn(async () => ({ outcome: {} as never })),
  };
  const handlerRegistry: WorkHandlerResolver = {
    resolve: vi.fn(() => handler),
  };
  const admission = {
    beforeCreate: vi.fn(async () => ({ decision: "ALLOW" as const })),
    beforeDispatch: vi.fn(async () => dispatchAdmission),
  } satisfies WorkAdmissionPort;
  const signal = signalFixture();
  const backgroundErrors: unknown[] = [];
  const reconciler = createWorkQueueReconciler({
    repository,
    durableDispatch: { dispatch },
    handlerRegistry,
    admission,
    signal: signal.service,
    execution: executionRuntime(context),
    time: fakeTime(),
    runtimeOptions: {
      maxInlinePayloadBytes: 1024,
      maxOutcomeBytes: 1024,
      reconciliationBatchSize: 10,
      antiEntropyIntervalMs: 100,
    } satisfies WorkQueueRuntimeOptions,
    onBackgroundError: (error) => backgroundErrors.push(error),
  });
  return {
    context,
    repository,
    dispatch,
    dispatches,
    handler,
    handlerRegistry,
    admission,
    signal,
    reconciler,
    backgroundErrors,
  };
}

describe("WorkQueue reconciliation", () => {
  it("projects PENDING work with deterministic attempt identity and reacts to Signal wakeups", async () => {
    const pending = item(executionContext());
    const fixture = reconcilerFixture([pending]);
    await fixture.reconciler.start();
    await fixture.reconciler.scan();
    await fixture.signal.listener.onWakeup();

    expect(fixture.dispatch).toHaveBeenCalled();
    expect(
      fixture.dispatch.mock.calls.every(
        ([request]) =>
          request.dispatchAttemptId ===
          createDispatchAttemptId(pending.workItemId, pending.dispatchRevision),
      ),
    ).toBe(true);
    expect(fixture.handler.execute).not.toHaveBeenCalled();
    await fixture.reconciler.stop();
  });

  it("projects a future notBefore without waiting for the due instant", async () => {
    const future = "2026-08-26T12:05:00.000Z" as Instant;
    const pending = item(executionContext(), { notBefore: future });
    const fixture = reconcilerFixture([pending]);

    await fixture.reconciler.scan();

    expect(fixture.repository.listProjectionCandidates).toHaveBeenCalledWith({
      limit: 10,
    });
    expect(fixture.dispatches).toEqual([
      expect.objectContaining({
        workItemId: pending.workItemId,
        dispatchRevision: pending.dispatchRevision,
        dispatchAttemptId: createDispatchAttemptId(
          pending.workItemId,
          pending.dispatchRevision,
        ),
        notBefore: future,
      }),
    ]);
  });

  it("does not dispatch when committed-work admission returns DELAY", async () => {
    const pending = item(executionContext());
    const fixture = reconcilerFixture([], [], [], {
      decision: "DELAY",
      reasonCode: "pressure.delayed",
    });
    fixture.repository.listProjectionCandidates.mockResolvedValueOnce([pending]);

    await fixture.reconciler.scan();

    expect(fixture.admission.beforeDispatch).toHaveBeenCalledTimes(1);
    expect(fixture.dispatch).not.toHaveBeenCalled();
  });

  it("does not dispatch when committed-work admission returns THROTTLE", async () => {
    const pending = item(executionContext());
    const fixture = reconcilerFixture([], [], [], {
      decision: "THROTTLE",
      reasonCode: "pressure.throttled",
    });
    fixture.repository.listProjectionCandidates.mockResolvedValueOnce([pending]);

    await fixture.reconciler.scan();

    expect(fixture.admission.beforeDispatch).toHaveBeenCalledTimes(1);
    expect(fixture.dispatch).not.toHaveBeenCalled();
  });

  it("re-evaluates deferred committed work and dispatches the same revision after ALLOW", async () => {
    const pending = item(executionContext());
    const fixture = reconcilerFixture([pending]);
    fixture.admission.beforeDispatch
      .mockResolvedValueOnce({ decision: "DELAY", reasonCode: "pressure.delayed" })
      .mockResolvedValueOnce({ decision: "ALLOW" });

    await fixture.reconciler.scan();
    await fixture.reconciler.scan();

    expect(fixture.dispatches).toHaveLength(1);
    expect(fixture.dispatches[0]).toMatchObject({
      workItemId: pending.workItemId,
      dispatchRevision: pending.dispatchRevision,
      dispatchAttemptId: createDispatchAttemptId(
        pending.workItemId,
        pending.dispatchRevision,
      ),
    });
  });

  it("keeps a canonical item recoverable when the dispatch adapter fails", async () => {
    const pending = item(executionContext());
    const fixture = reconcilerFixture([pending]);
    fixture.dispatch.mockRejectedValueOnce(new Error("adapter unavailable"));

    await fixture.reconciler.scan();
    expect(fixture.backgroundErrors).toHaveLength(1);
    expect(fixture.repository.listProjectionCandidates).toHaveBeenCalledTimes(1);

    await fixture.reconciler.scan();
    expect(fixture.repository.listProjectionCandidates).toHaveBeenCalledTimes(2);
    expect(fixture.dispatch).toHaveBeenCalledTimes(2);
  });

  it("bounds concurrent anti-entropy scans to one in-flight scan", async () => {
    const pending = item(executionContext());
    const fixture = reconcilerFixture([pending]);
    let release!: () => void;
    const blocked = new Promise<readonly WorkItem[]>((resolve) => {
      release = () => resolve([pending]);
    });
    fixture.repository.listProjectionCandidates.mockReturnValueOnce(blocked);

    const first = fixture.reconciler.scan();
    const second = fixture.reconciler.scan();
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 0));
    expect(fixture.repository.listProjectionCandidates).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([first, second]);
  });

  it("wakes due retries and only wakes waiting work after its exact handler is available", async () => {
    const context = executionContext();
    const retry = item(context, {
      state: "RETRY_WAIT",
      notBefore: now,
      retryClass: "transient",
      dispatchRevision: 3,
    });
    const waiting = item(context, { state: "WAITING_DEPENDENCY" });
    const fixture = reconcilerFixture([], [retry], [waiting]);
    const awakenedRetry = item(context, {
      workItemId: retry.workItemId,
      state: "PENDING",
      dispatchRevision: 4,
    });
    const awakenedWaiting = item(context, {
      workItemId: waiting.workItemId,
      state: "PENDING",
      dispatchRevision: 2,
    });
    fixture.repository.wakeDueRetry.mockResolvedValueOnce({
      status: "APPLIED",
      item: awakenedRetry,
    });
    fixture.repository.wakeDependency.mockResolvedValueOnce({
      status: "APPLIED",
      item: awakenedWaiting,
    });
    (fixture.handlerRegistry.resolve as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      undefined,
    );

    await fixture.reconciler.scan();
    expect(fixture.repository.wakeDueRetry).toHaveBeenCalledWith({
      workItemId: retry.workItemId,
      expectedDispatchRevision: retry.dispatchRevision,
      now,
      updatedAt: now,
    });
    expect(fixture.repository.wakeDependency).not.toHaveBeenCalled();
    expect(fixture.dispatches).toHaveLength(1);
    expect(fixture.dispatches[0]?.dispatchRevision).toBe(4);
  });
});
