import { afterEach, describe, expect, it, vi } from "vitest";
import {
  asContentDigest,
  createContributionId,
  createMicroSystemId,
  createUuidV7Id,
  digestCanonicalJson,
  parseInstant,
  type Instant,
  type PackageGenerationId,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import {
  createExecutionContextRuntime,
  createExecutionLineageService,
  createPersistenceExecutionContextProvider,
  type ExecutionContext,
} from "@heptalogos/execution-lineage";
import { createPersistenceService } from "@heptalogos/persistence";
import { createFakeTimeService, type FakeTimeService } from "@heptalogos/time-service";
import {
  createGenerationFence,
  createRuntimeLifecycleLineage,
  MicroSystemSupervisor,
  WorkHandlerRegistry,
  type MicroSystemDefinition,
  type RuntimeWorkHandler,
  type RuntimeWorkHandlerInvocation,
  type WorkHandlerPayloadContract,
  type WorkHandlerProvisionDescriptor,
  type WorkHandlerTarget,
  type WorkQueueProfileId,
  type ResourceAdmissionClassId,
} from "@heptalogos/runtime-kernel";
import { createRuntimeSubstrate } from "@heptalogos/runtime-substrate";
import {
  createWorkAttemptExecutor,
  createDispatchAttemptId,
  createWorkQueueReconciler,
  createWorkQueueRepository,
  createWorkQueueService,
  type WorkAdmissionPort,
  type WorkErrorClassifier,
  type WorkItem,
  type WorkQueueRuntimeOptions,
} from "@heptalogos/work-queue";
import {
  createPostgresSignalService,
  postgresSignalPublisher,
  type SignalService,
} from "@heptalogos/signal";
import {
  BOOTSTRAP_PASSWORD,
  boot,
  cleanupCanonicalPostgresFixtures,
  describeRealPostgres,
  makeFixture,
  queryAs,
  stopManagedHostWithoutRuntime,
} from "./test-support/canonical-postgres.js";

const describePostgres = describeRealPostgres === undefined ? describe.skip : describe;
const initialTime = "2026-08-26T12:00:00.000Z" as Instant;
const futureTime = "2026-08-26T12:05:00.000Z" as Instant;
const settleTimeoutMs = 100;
const queueProfileId = createMicroSystemId(
  "work.default",
) as unknown as WorkQueueProfileId;
const resourceAdmissionClass = createMicroSystemId(
  "work.default",
) as unknown as ResourceAdmissionClassId;

const PERSISTENCE_OPTIONS = {
  maxConnections: 2,
  idleTimeoutMs: 5_000,
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  lockTimeoutMs: 10_000,
  idleInTransactionSessionTimeoutMs: 30_000,
  onBackgroundError() {},
} as const;

const WORK_OPTIONS: WorkQueueRuntimeOptions = {
  maxInlinePayloadBytes: 4_096,
  maxOutcomeBytes: 4_096,
  reconciliationBatchSize: 32,
  antiEntropyIntervalMs: 100,
};

const SIGNAL_OPTIONS = {
  connectionTimeoutMs: 10_000,
  reconnectBaseDelayMs: 25,
  reconnectMaxDelayMs: 200,
  onBackgroundError() {},
} as const;

function generation<T extends "ProductGenerationId" | "PackageGenerationId">(
  brand: T,
  label: string,
): T extends "ProductGenerationId" ? ProductGenerationId : PackageGenerationId {
  return asContentDigest(
    brand,
    digestCanonicalJson(`durable-work/${label}/v1`, { label }),
  ) as unknown as T extends "ProductGenerationId"
    ? ProductGenerationId
    : PackageGenerationId;
}

function executionOriginContext(
  activityId = createUuidV7Id("ActivityId"),
): ExecutionContext {
  const continuityEpochId = createUuidV7Id("ContinuityEpochId");
  return {
    activityId,
    kind: "qualification.source",
    startedAt: initialTime,
    links: [],
    origin: {
      installationId: createUuidV7Id("InstallationId"),
      instanceId: createUuidV7Id("InstanceId"),
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

interface Composition {
  readonly fixture: Awaited<ReturnType<typeof makeFixture>>;
  readonly bootResult: Awaited<ReturnType<typeof boot>>;
  readonly time: FakeTimeService;
  readonly runtime: ReturnType<typeof createExecutionContextRuntime>;
  readonly persistence: ReturnType<typeof createPersistenceService>;
  readonly lineage: ReturnType<typeof createExecutionLineageService>;
  readonly supervisor: MicroSystemSupervisor;
  readonly signal: SignalService;
  readonly repository: ReturnType<typeof createWorkQueueRepository>;
  readonly work: ReturnType<typeof createWorkQueueService>;
  readonly reconciler: ReturnType<typeof createWorkQueueReconciler>;
  readonly executor: ReturnType<typeof createWorkAttemptExecutor>;
  readonly target: WorkHandlerTarget;
  readonly descriptor: WorkHandlerProvisionDescriptor;
  readonly handlerCalls: RuntimeWorkHandlerInvocation[];
  readonly contributionContexts: ExecutionContext[];
  readonly dispatches: Array<{
    readonly workItemId: WorkItem["workItemId"];
    readonly dispatchRevision: number;
    readonly dispatchAttemptId: string;
  }>;
  readonly setDispatchUnavailable: (value: boolean) => void;
}

async function createComposition(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
): Promise<Composition> {
  const bootResult = await boot(fixture);
  const time = createFakeTimeService(parseInstant(initialTime)!);
  const runtime = createExecutionContextRuntime(
    {
      installationId: bootResult.host.installationId,
      instanceId: bootResult.host.instanceId,
      bootId: bootResult.host.bootId,
      continuityEpochId: bootResult.host.continuityEpochId,
      hostOwnershipToken: bootResult.host.token,
    },
    time,
  );
  const persistence = createPersistenceService(
    bootResult.host.persistence,
    PERSISTENCE_OPTIONS,
    createPersistenceExecutionContextProvider(runtime),
  );
  const lineage = createExecutionLineageService();
  const lifecycleLineage = createRuntimeLifecycleLineage({
    execution: runtime,
    persistence,
    lineage,
    time,
  });
  const productGenerationId = generation("ProductGenerationId", "product-a");
  const packageGenerationId = generation("PackageGenerationId", "package-a");
  const microSystemId = createMicroSystemId("qualification.work");
  const contributionId = createContributionId("qualification.work.execute");
  const target: WorkHandlerTarget = {
    productGenerationId,
    microSystemId,
    contributionId,
    packageGenerationId,
    payloadVersion: 1,
  };
  const contributionContexts: ExecutionContext[] = [];
  let observeRuntime: typeof runtime | undefined;
  const handlerCalls: RuntimeWorkHandlerInvocation[] = [];
  const handler: RuntimeWorkHandler = {
    async execute(input) {
      handlerCalls.push(input);
      const current = observeRuntime?.current();
      if (current !== undefined) contributionContexts.push(current);
      return { outcome: { accepted: true } };
    },
  };
  const payloadContracts: readonly WorkHandlerPayloadContract[] = [
    {
      version: 1,
      schema: {
        type: "object",
        properties: { value: { type: "string" } },
        required: ["value"],
        additionalProperties: false,
      },
    },
  ];
  const descriptor: WorkHandlerProvisionDescriptor = {
    contributionId,
    contractVersion: "v1" as never,
    payloadContracts,
    outcomeSchema: {
      type: "object",
      properties: { accepted: { type: "boolean" } },
      required: ["accepted"],
      additionalProperties: false,
    },
    queueProfileId,
    resourceAdmissionClass,
    configurationBindingPolicy: "LATEST_COMPATIBLE_AT_ATTEMPT",
    restoreReplayClass: "RECONCILE_REQUIRED",
  };
  const definition: MicroSystemDefinition = {
    microSystemId,
    role: "system-service",
    generation: { productGenerationId, packageGenerationId },
    operatingModes: ["NORMAL", "SAFE", "MAINTENANCE", "EMERGENCY_READ_ONLY"],
    serviceRequirements: [],
    capabilityRequirements: [],
    serviceProvisions: [],
    capabilityProvisions: [],
    workHandlerProvisions: [descriptor],
    activate: async (context) => {
      context.publishWorkHandler(descriptor, handler);
    },
  };
  const supervisor = new MicroSystemSupervisor({
    substrate: createRuntimeSubstrate({ settleTimeoutMs }),
    settleTimeoutMs,
    definitions: [definition],
    lifecycleLineage,
    rootRuntimeOrigin: { productGenerationId },
  });
  await supervisor.reconcile({
    revision: 1,
    operatingMode: "NORMAL",
    desired: new Map([[microSystemId, "RUNNING"]]),
    serviceBindings: new Map(),
    capabilityBindings: new Map(),
  });
  observeRuntime = runtime;
  const signal = createPostgresSignalService(
    bootResult.host.persistence,
    SIGNAL_OPTIONS,
  );
  const repository = createWorkQueueRepository(persistence);
  const dispatches: Composition["dispatches"] = [];
  let dispatchUnavailable = false;
  const durableDispatch = {
    async dispatch(request: {
      readonly workItemId: WorkItem["workItemId"];
      readonly dispatchRevision: number;
      readonly dispatchAttemptId: string;
    }) {
      dispatches.push(request);
      if (dispatchUnavailable) throw new Error("dispatch adapter unavailable");
    },
  };
  const admission: WorkAdmissionPort = {
    beforeCreate: async () => ({ decision: "ALLOW" }),
  };
  const classifier: WorkErrorClassifier = {
    classify: () => ({
      kind: "TERMINAL",
      retryClass: "permanent",
      reasonCode: "handler-exception",
    }),
  };
  const work = createWorkQueueService({
    persistence,
    repository,
    handlerRegistry: supervisor.workHandlers,
    execution: runtime,
    lineage,
    time,
    signalPublisher: postgresSignalPublisher,
    admission,
    runtimeOptions: WORK_OPTIONS,
    onBackgroundError() {},
  });
  const reconciler = createWorkQueueReconciler({
    repository,
    durableDispatch,
    handlerRegistry: supervisor.workHandlers,
    signal,
    execution: runtime,
    time,
    runtimeOptions: WORK_OPTIONS,
    onBackgroundError() {},
  });
  const executor = createWorkAttemptExecutor({
    repository,
    handlerRegistry: supervisor.workHandlers,
    execution: runtime,
    lineage,
    time,
    classifier,
    runtimeOptions: WORK_OPTIONS,
  });
  return {
    fixture,
    bootResult,
    time,
    runtime,
    persistence,
    lineage,
    supervisor,
    signal,
    repository,
    work,
    reconciler,
    executor,
    target,
    descriptor,
    handlerCalls,
    contributionContexts,
    dispatches,
    setDispatchUnavailable: (value) => {
      dispatchUnavailable = value;
    },
  };
}

async function createWork(
  composition: Composition,
  target: WorkHandlerTarget = composition.target,
  options: {
    readonly dedupKey?: string;
    readonly notBefore?: Instant;
  } = {},
) {
  return composition.runtime.runActivity(
    {
      kind: "qualification.work.request",
      importance: "significant",
      retentionClass: "operational",
      sensitivity: "operational",
    },
    () =>
      composition.work.create({
        target,
        payload: { value: "work-qualification" },
        queueProfileId,
        resourceAdmissionClass,
        priority: 100,
        ...(options.dedupKey === undefined ? {} : { dedupKey: options.dedupKey }),
        ...(options.notBefore === undefined ? {} : { notBefore: options.notBefore }),
      }),
  );
}

async function runCanonicalMutation<T>(
  composition: Composition,
  kind: string,
  operation: () => Promise<T>,
): Promise<T> {
  return composition.runtime.runActivity(
    {
      kind,
      importance: "significant",
      retentionClass: "operational",
      sensitivity: "operational",
    },
    operation,
  );
}

async function waitUntil(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 20));
  }
  throw new Error("qualification condition was not reached before timeout");
}

async function closeComposition(composition: Composition): Promise<void> {
  await composition.reconciler.stop().catch(() => undefined);
  await composition.supervisor.close().catch(() => undefined);
  await composition.persistence.close().catch(() => undefined);
  await stopManagedHostWithoutRuntime(composition.bootResult.host).catch(
    () => undefined,
  );
}

let activeComposition: Composition | undefined;

afterEach(async () => {
  const composition = activeComposition;
  activeComposition = undefined;
  if (composition !== undefined) await closeComposition(composition);
  await cleanupCanonicalPostgresFixtures();
});

describePostgres.sequential("Canonical durable WorkItem qualification", () => {
  it("W1 canonical creation commits lineage and wakes dispatch reconciliation", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    await composition.reconciler.start();

    const created = await createWork(composition);
    await waitUntil(() =>
      composition.dispatches.some(
        (dispatch) => dispatch.workItemId === created.item.workItemId,
      ),
    );
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT state, dispatch_revision FROM "heptalogos"."work_item" WHERE work_item_id = $1`,
        [created.item.workItemId],
      ),
    ).resolves.toMatchObject({ rows: [{ state: "PENDING", dispatch_revision: "1" }] });
    expect(composition.dispatches[0]?.dispatchAttemptId).toBe(
      createDispatchAttemptId(created.item.workItemId, 1),
    );
  }, 180_000);

  it("W2 discovers a committed item after Signal listener termination and reconnect rescan", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    await composition.reconciler.start();
    await queryAs(
      fixture,
      "heptalogos_bootstrap",
      BOOTSTRAP_PASSWORD,
      `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
        WHERE application_name = 'heptalogos-signal-listener'
          AND pid <> pg_backend_pid()`,
    );
    const created = await createWork(composition, composition.target, {
      dedupKey: "w2-reconnect",
    });
    await waitUntil(() =>
      composition.dispatches.some(
        (dispatch) => dispatch.workItemId === created.item.workItemId,
      ),
    );
    await expect(
      composition.repository.getWorkItem(created.item.workItemId),
    ).resolves.toMatchObject({
      state: "PENDING",
    });
  }, 180_000);

  it("W3-W4 redispatches lost projection with the same revision attempt identity", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    composition.setDispatchUnavailable(true);
    await composition.reconciler.start();
    const created = await createWork(composition, composition.target, {
      dedupKey: "w3-lost-dispatch",
    });
    await waitUntil(() => composition.dispatches.length >= 1);
    const firstAttempt = composition.dispatches[0]!.dispatchAttemptId;
    composition.setDispatchUnavailable(false);
    await composition.reconciler.scan();
    await waitUntil(() => composition.dispatches.length >= 2);
    expect(composition.dispatches[1]!.dispatchRevision).toBe(1);
    expect(composition.dispatches[1]!.dispatchAttemptId).toBe(firstAttempt);
    expect(firstAttempt).toBe(createDispatchAttemptId(created.item.workItemId, 1));
  }, 180_000);

  it("W5 advances retry revision before an old attempt can execute", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "w5-revision",
    });
    const initial = await composition.repository.getWorkItem(created.item.workItemId);
    if (initial === undefined) throw new Error("created WorkItem was not found");
    await runCanonicalMutation(composition, "qualification.work.retry", () =>
      composition.repository.markRetryWait({
        workItemId: initial.workItemId,
        expectedDispatchRevision: initial.dispatchRevision,
        expectedState: "PENDING",
        retryClass: "transient",
        reasonCode: "qualification.retry",
        notBefore: futureTime,
        updatedAt: initialTime,
      }),
    );
    await expect(
      composition.executor.execute(initial.workItemId, initial.dispatchRevision),
    ).resolves.toMatchObject({ status: "STALE_NOOP" });
    composition.time.advanceWallClock(5 * 60 * 1_000);
    await composition.reconciler.scan();
    await expect(
      composition.repository.getWorkItem(initial.workItemId),
    ).resolves.toMatchObject({
      state: "PENDING",
      dispatchRevision: 2,
    });
  }, 180_000);

  it("W6 keeps generation B out while A is unavailable, then restores exact A", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "w6-generation",
    });
    const registry = new WorkHandlerRegistry();
    const packageB = generation("PackageGenerationId", "package-b");
    const targetB = { ...composition.target, packageGenerationId: packageB };
    const handlerB: RuntimeWorkHandler = {
      execute: vi.fn(async () => ({ outcome: { accepted: true } })),
    };
    registry.register(
      {
        microSystemId: composition.target.microSystemId,
        productGenerationId: composition.target.productGenerationId,
        packageGenerationId: packageB,
      },
      composition.descriptor,
      handlerB,
      createGenerationFence(),
    );
    const alternateExecutor = createWorkAttemptExecutor({
      repository: composition.repository,
      handlerRegistry: registry,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      classifier: {
        classify: () => ({
          kind: "TERMINAL" as const,
          retryClass: "permanent" as const,
          reasonCode: "qualification.failure",
        }),
      },
      runtimeOptions: WORK_OPTIONS,
    });
    await expect(
      alternateExecutor.execute(created.item.workItemId, 1),
    ).resolves.toMatchObject({ status: "WAITING_DEPENDENCY" });
    expect(handlerB.execute).not.toHaveBeenCalled();
    const handlerA: RuntimeWorkHandler = {
      execute: vi.fn(async () => ({ outcome: { accepted: true } })),
    };
    registry.register(
      {
        microSystemId: composition.target.microSystemId,
        productGenerationId: composition.target.productGenerationId,
        packageGenerationId: composition.target.packageGenerationId,
      },
      composition.descriptor,
      handlerA,
      createGenerationFence(),
    );
    await runCanonicalMutation(composition, "qualification.work.dependency", () =>
      composition.repository.wakeDependency({
        workItemId: created.item.workItemId,
        expectedDispatchRevision: 1,
        updatedAt: initialTime,
      }),
    );
    await expect(
      alternateExecutor.execute(created.item.workItemId, 2),
    ).resolves.toMatchObject({ status: "SUCCEEDED" });
    expect(handlerA.execute).toHaveBeenCalledTimes(1);
    void targetB;
  }, 180_000);

  it("W7 makes cancellation win both before invoke and during cooperative running", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const pending = await createWork(composition, composition.target, {
      dedupKey: "w7-pending-cancel",
    });
    await runCanonicalMutation(composition, "qualification.work.cancel", () =>
      composition.repository.requestCancel({
        workItemId: pending.item.workItemId,
        expectedDispatchRevision: 1,
        expectedState: "PENDING",
        requestedAt: initialTime,
        reasonCode: "qualification.cancel",
      }),
    );
    await expect(
      composition.executor.execute(pending.item.workItemId, 1),
    ).resolves.toMatchObject({ status: "CANCELLED" });
    expect(composition.handlerCalls).toHaveLength(0);

    const runningItem = await createWork(composition, composition.target, {
      dedupKey: "w7-running-cancel",
    });
    const registry = new WorkHandlerRegistry();
    let aborted = false;
    const cooperative: RuntimeWorkHandler = {
      execute: vi.fn(
        ({ signal }: { readonly signal: AbortSignal }) =>
          new Promise<{ readonly outcome: { readonly accepted: boolean } }>(
            (resolve) => {
              signal.addEventListener(
                "abort",
                () => {
                  aborted = true;
                  resolve({ outcome: { accepted: true } });
                },
                { once: true },
              );
            },
          ),
      ),
    };
    registry.register(
      {
        microSystemId: composition.target.microSystemId,
        productGenerationId: composition.target.productGenerationId,
        packageGenerationId: composition.target.packageGenerationId,
      },
      composition.descriptor,
      cooperative,
      createGenerationFence(),
    );
    const runningExecutor = createWorkAttemptExecutor({
      repository: composition.repository,
      handlerRegistry: registry,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      classifier: {
        classify: () => ({
          kind: "TERMINAL" as const,
          retryClass: "permanent" as const,
          reasonCode: "qualification.cancelled-handler",
        }),
      },
      runtimeOptions: WORK_OPTIONS,
    });
    const execution = runningExecutor.execute(runningItem.item.workItemId, 1);
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(runningItem.item.workItemId))
          ?.state === "RUNNING",
    );
    await runCanonicalMutation(composition, "qualification.work.cancel.running", () =>
      composition.repository.requestCancel({
        workItemId: runningItem.item.workItemId,
        expectedDispatchRevision: 1,
        expectedState: "RUNNING",
        expectedActiveAttemptId: createDispatchAttemptId(
          runningItem.item.workItemId,
          1,
        ),
        requestedAt: initialTime,
        reasonCode: "qualification.cancel",
      }),
    );
    await expect(execution).resolves.toMatchObject({ status: "CANCELLED" });
    expect(aborted).toBe(true);
  }, 180_000);

  it("W8 fences mutations when the authentic Host lease closes", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "w8-host-loss",
    });
    await composition.bootResult.host.shutdownKeepingPrivatePostgres({
      async quiesce() {
        await composition.reconciler.stop();
        return composition.supervisor.quiesce();
      },
    });
    expect(composition.bootResult.host.state).toBe("CLOSED");
    await expect(
      composition.repository.markWaitingDependency({
        workItemId: created.item.workItemId,
        expectedDispatchRevision: 1,
        updatedAt: initialTime,
      }),
    ).rejects.toBeDefined();
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT state FROM "heptalogos"."work_item" WHERE work_item_id = $1`,
        [created.item.workItemId],
      ),
    ).resolves.toMatchObject({ rows: [{ state: "PENDING" }] });
  }, 180_000);

  it("W9 deduplicates non-terminal work and permits the key after terminalization", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const [first, second] = await Promise.all([
      createWork(composition, composition.target, { dedupKey: "w9-dedup" }),
      createWork(composition, composition.target, { dedupKey: "w9-dedup" }),
    ]);
    expect(new Set([first.status, second.status])).toEqual(
      new Set(["CREATED", "EXISTING"]),
    );
    const created = first.status === "CREATED" ? first : second;
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT count(*)::int AS count FROM "heptalogos"."work_item"
          WHERE handler_micro_system_id = $1 AND handler_contribution_id = $2 AND dedup_key = $3`,
        [
          composition.target.microSystemId,
          composition.target.contributionId,
          "w9-dedup",
        ],
      ),
    ).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(
      composition.executor.execute(created.item.workItemId, 1),
    ).resolves.toMatchObject({ status: "SUCCEEDED" });
    await expect(
      createWork(composition, composition.target, { dedupKey: "w9-dedup" }),
    ).resolves.toMatchObject({ status: "CREATED" });
  }, 180_000);

  it("W10 reconstructs work.create to work.execute to contribution.invoke origin", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition);
    await expect(
      composition.executor.execute(created.item.workItemId, 1),
    ).resolves.toMatchObject({ status: "SUCCEEDED" });
    const activities = await queryAs(
      fixture,
      "heptalogos_bootstrap",
      BOOTSTRAP_PASSWORD,
      `SELECT activity_id, kind, causation_activity_id,
              product_generation_id, package_generation_id,
              micro_system_id, micro_system_instance_id, contribution_id
         FROM "heptalogos"."activity_record"
        WHERE kind IN ('work.create', 'work.execute')
        ORDER BY started_at, activity_id`,
    );
    const workCreate = activities.rows.find((row) => row.kind === "work.create");
    const workExecute = activities.rows.find((row) => row.kind === "work.execute");
    expect(workCreate).toBeDefined();
    expect(workExecute).toMatchObject({
      causation_activity_id: workCreate?.activity_id,
      product_generation_id: composition.target.productGenerationId,
      package_generation_id: composition.target.packageGenerationId,
      micro_system_id: composition.target.microSystemId,
    });
    expect(composition.contributionContexts).toContainEqual(
      expect.objectContaining({
        kind: "contribution.invoke",
        parentActivityId: workExecute?.activity_id,
        origin: expect.objectContaining({
          runtime: expect.objectContaining({
            productGenerationId: composition.target.productGenerationId,
            packageGenerationId: composition.target.packageGenerationId,
            microSystemId: composition.target.microSystemId,
            contributionId: composition.target.contributionId,
          }),
        }),
      }),
    );
  }, 180_000);
});
