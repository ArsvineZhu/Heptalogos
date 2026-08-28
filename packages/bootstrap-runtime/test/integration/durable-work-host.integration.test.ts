import { afterEach, describe, expect, it, vi } from "vitest";
import {
  asDurableCodeVersion,
  asContentDigest,
  createContributionId,
  createMicroSystemId,
  createWorkItemId,
  digestCanonicalJson,
  parseInstant,
  type Instant,
  type PackageGenerationId,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import {
  createDurableExecutionRuntime,
  createDurableExecutionSchemaProvisioner,
  createDurableDispatchPort,
  createDbosAttemptInspectionPort,
  type DurableExecutionRuntime,
} from "@heptalogos/durable-execution";
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
  type RuntimeWorkHandlerLease,
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
  createWorkQueueProfileCatalog,
  createWorkQueueReconciler,
  createWorkQueueService,
  type WorkAdmissionPort,
  type DurableDispatchRequest,
  type DurableAttemptInspectionPort,
  type WorkErrorClassifier,
  type WorkItem,
  type WorkQueueProfileCatalog,
  type WorkQueueRepository,
  type WorkQueueRuntimeOptions,
} from "@heptalogos/work-queue";
import { createWorkQueueRepository } from "@heptalogos/work-queue/foundation-repository";
import {
  createPostgresSignalService,
  postgresSignalPublisher,
  type SignalPublisher,
  type SignalService,
} from "@heptalogos/signal";
import {
  BOOTSTRAP_PASSWORD,
  CANONICAL_OPTIONS,
  DURABLE_EXECUTION_PASSWORD,
  MIGRATION_PASSWORD,
  boot,
  cleanupCanonicalPostgresFixtures,
  describeRealPostgres,
  makeFixture,
  queryAs,
  stopManagedHostWithoutRuntime,
} from "../support/canonical-postgres.js";
import { createCanonicalSchemaInitializer } from "@heptalogos/canonical-schema";

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
const PROFILE_CATALOG = createWorkQueueProfileCatalog([
  { profileId: queueProfileId, minPollingIntervalMs: 100 },
]);
const DURABLE_CODE_VERSION = asDurableCodeVersion(
  digestCanonicalJson("test.durable-execution-code/v1", { version: "current" }),
);
const DURABLE_OPTIONS = {
  durableCodeVersion: DURABLE_CODE_VERSION,
  systemPool: {
    maxConnections: 4,
    idleTimeoutMs: 5_000,
    connectionTimeoutMs: 10_000,
    statementTimeoutMs: 10_000,
    idleInTransactionSessionTimeoutMs: 30_000,
  },
  systemDatabasePollingConcurrency: 2,
  maxConcurrentQueueDispatches: 4,
  workflowMaxRecoveryAttempts: 4,
  shutdownDrainTimeoutMs: 10_000,
  profiles: PROFILE_CATALOG,
  onBackgroundError() {},
} as const;
const durableSchemaProvisioner = createDurableExecutionSchemaProvisioner({
  processTimeoutMs: 120_000,
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
});
const canonicalInitializer = createCanonicalSchemaInitializer(CANONICAL_OPTIONS);
const initializeCanonicalAndDurable = async (
  context: Parameters<typeof canonicalInitializer>[0],
): Promise<void> => {
  await canonicalInitializer(context);
  await durableSchemaProvisioner.ensureCurrent(context.authority);
};

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
  readonly durable?: DurableExecutionRuntime;
  readonly durableDispatch: {
    dispatch(request: DurableDispatchRequest): Promise<void>;
  };
  readonly durableInspection?: DurableAttemptInspectionPort;
  readonly target: WorkHandlerTarget;
  readonly descriptor: WorkHandlerProvisionDescriptor;
  readonly handlerCalls: RuntimeWorkHandlerInvocation[];
  readonly contributionContexts: ExecutionContext[];
  readonly admission: WorkAdmissionPort;
  readonly dispatches: Array<{
    readonly workItemId: WorkItem["workItemId"];
    readonly dispatchRevision: number;
    readonly dispatchAttemptId: string;
  }>;
  readonly setDispatchUnavailable: (value: boolean) => void;
}

async function createComposition(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  options: {
    readonly durableExecution?: boolean;
    readonly profiles?: WorkQueueProfileCatalog;
    readonly admission?: WorkAdmissionPort;
    readonly handler?: RuntimeWorkHandler;
  } = {},
): Promise<Composition> {
  const bootResult = await boot(
    fixture,
    options.durableExecution ? initializeCanonicalAndDurable : undefined,
  );
  const profileCatalog = options.profiles ?? PROFILE_CATALOG;
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
  const defaultHandler: RuntimeWorkHandler = {
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
      context.publishWorkHandler(descriptor, options.handler ?? defaultHandler);
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
  const defaultAdmission: WorkAdmissionPort = {
    beforeCreate: async () => ({ decision: "ALLOW" }),
    beforeDispatch: async () => ({ decision: "ALLOW" }),
  };
  const admission = options.admission ?? defaultAdmission;
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
    profiles: profileCatalog,
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
  const durable = options.durableExecution
    ? createDurableExecutionRuntime(
        bootResult.host.durableExecution,
        { ...DURABLE_OPTIONS, profiles: profileCatalog },
        executor,
      )
    : undefined;
  const durableInspection = durable
    ? createDbosAttemptInspectionPort({
        durableCodeVersion: DURABLE_CODE_VERSION,
      })
    : undefined;
  const realDurableDispatch = durable
    ? createDurableDispatchPort({
        authority: bootResult.host.durableExecution,
        lifecycle: durable,
        durableCodeVersion: DURABLE_CODE_VERSION,
        profiles: profileCatalog,
        now: () => time.now(),
      })
    : undefined;
  const dispatches: Composition["dispatches"] = [];
  let dispatchUnavailable = false;
  const durableDispatch = {
    async dispatch(request: DurableDispatchRequest) {
      dispatches.push(request);
      if (dispatchUnavailable) throw new Error("dispatch adapter unavailable");
      await realDurableDispatch?.dispatch(request);
    },
  };
  const reconciler = createWorkQueueReconciler({
    repository,
    durableDispatch,
    handlerRegistry: supervisor.workHandlers,
    admission,
    signal,
    execution: runtime,
    time,
    runtimeOptions: WORK_OPTIONS,
    onBackgroundError() {},
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
    durable,
    durableDispatch,
    durableInspection,
    target,
    descriptor,
    handlerCalls,
    contributionContexts,
    admission,
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
    readonly partitionKey?: string;
    readonly priority?: number;
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
        priority: options.priority ?? 100,
        ...(options.dedupKey === undefined ? {} : { dedupKey: options.dedupKey }),
        ...(options.notBefore === undefined ? {} : { notBefore: options.notBefore }),
        ...(options.partitionKey === undefined
          ? {}
          : { partitionKey: options.partitionKey }),
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
  await composition.durable?.close().catch(() => undefined);
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
}, 180_000);

function durableRequest(item: WorkItem): DurableDispatchRequest {
  return {
    workItemId: item.workItemId,
    dispatchRevision: item.dispatchRevision,
    dispatchAttemptId: createDispatchAttemptId(item.workItemId, item.dispatchRevision),
    queueProfileId: item.queueProfileId,
    priority: item.priority,
    ...(item.partitionKey === undefined ? {} : { partitionKey: item.partitionKey }),
    ...(item.notBefore === undefined ? {} : { notBefore: item.notBefore }),
  };
}

async function durableWorkflowRow(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  workflowID: string,
): Promise<Record<string, unknown> | undefined> {
  return (
    await queryAs(
      fixture,
      "heptalogos_bootstrap",
      BOOTSTRAP_PASSWORD,
      `SELECT workflow_uuid, status, application_version, executor_id, queue_name,
              priority, queue_partition_key, delay_until_epoch_ms
         FROM "dbos"."workflow_status"
        WHERE workflow_uuid = $1`,
      [workflowID],
    )
  ).rows[0];
}

async function requireDurable(
  composition: Composition,
): Promise<DurableExecutionRuntime> {
  if (composition.durable === undefined) {
    throw new Error("durable execution was not enabled for this composition");
  }
  await composition.durable.start();
  return composition.durable;
}

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
    expect(Reflect.get(handlerB, "execute")).not.toHaveBeenCalled();
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
    expect(Reflect.get(handlerA, "execute")).toHaveBeenCalledTimes(1);
    void targetB;
  }, 180_000);

  it("G1 keeps an exact admitted generation alive while retirement waits for settlement", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "generation-reservation-retirement",
    });
    const registry = new WorkHandlerRegistry();
    const fence = createGenerationFence();
    let entered!: () => void;
    const enteredPromise = new Promise<void>((resolve) => {
      entered = resolve;
    });
    let releaseHandler!: () => void;
    const handlerGate = new Promise<void>((resolve) => {
      releaseHandler = resolve;
    });
    const handler: RuntimeWorkHandler = {
      execute: vi.fn(async () => {
        entered();
        await handlerGate;
        return { outcome: { accepted: true } };
      }),
    };
    registry.register(
      {
        microSystemId: composition.target.microSystemId,
        productGenerationId: composition.target.productGenerationId,
        packageGenerationId: composition.target.packageGenerationId,
      },
      composition.descriptor,
      handler,
      fence,
    );
    const classifier = {
      classify: vi.fn(() => ({
        kind: "TERMINAL" as const,
        retryClass: "permanent" as const,
        reasonCode: "unexpected-handler-failure",
      })),
    };
    const executor = createWorkAttemptExecutor({
      repository: composition.repository,
      handlerRegistry: registry,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      classifier,
      runtimeOptions: WORK_OPTIONS,
    });
    const execution = executor.execute(created.item.workItemId, 1);
    await enteredPromise;
    await expect(
      composition.repository.getWorkItem(created.item.workItemId),
    ).resolves.toMatchObject({ state: "RUNNING" });

    const retirement = registry.retireGeneration(fence, 1_000);
    expect(fence.state).toBe("RETIRING");
    let retired = false;
    void retirement.then(() => {
      retired = true;
    });
    await Promise.resolve();
    expect(retired).toBe(false);

    releaseHandler();
    await execution;
    await retirement;
    expect(Reflect.get(handler, "execute")).toHaveBeenCalledTimes(1);
    expect(Reflect.get(classifier, "classify")).not.toHaveBeenCalled();
    expect(fence.state).toBe("RETIRED");
  }, 180_000);

  it("G2 releases a reserved invocation when the RUNNING CAS is lost", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "generation-reservation-cas-loss",
    });
    let reservationReady!: () => void;
    const reservationReadyPromise = new Promise<void>((resolve) => {
      reservationReady = resolve;
    });
    let release: (() => void) | undefined;
    let releaseCount = 0;
    const handlerRegistry = {
      resolve(target: WorkHandlerTarget): RuntimeWorkHandlerLease | undefined {
        const lease = composition.supervisor.workHandlers.resolve(target);
        if (lease === undefined) return undefined;
        return Object.freeze({
          ...lease,
          reserveInvocation() {
            const reservation = lease.reserveInvocation();
            reservationReady();
            release = () => {
              releaseCount += 1;
              reservation.release();
            };
            return {
              execute(input: RuntimeWorkHandlerInvocation) {
                return reservation.execute(input);
              },
              release,
            };
          },
        });
      },
    };
    const repository: WorkQueueRepository = {
      ...composition.repository,
      async markRunning(input) {
        await reservationReadyPromise;
        await runCanonicalMutation(composition, "qualification.work.cancel.cas", () =>
          composition.repository.requestCancel({
            workItemId: input.workItemId,
            expectedDispatchRevision: input.expectedDispatchRevision,
            expectedState: "PENDING",
            requestedAt: initialTime,
            reasonCode: "qualification.cancel.cas",
          }),
        );
        return composition.repository.markRunning(input);
      },
    };
    const executor = createWorkAttemptExecutor({
      repository,
      handlerRegistry,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      classifier: {
        classify: vi.fn(() => ({
          kind: "TERMINAL" as const,
          retryClass: "permanent" as const,
          reasonCode: "must-not-run",
        })),
      },
      runtimeOptions: WORK_OPTIONS,
    });

    await expect(executor.execute(created.item.workItemId, 1)).resolves.toMatchObject({
      status: "TERMINAL_REPLAY",
      outcome: { kind: "CANCELLED" },
    });
    expect(releaseCount).toBe(1);
    expect(composition.handlerCalls).toHaveLength(0);
    await expect(
      composition.repository.getWorkItem(created.item.workItemId),
    ).resolves.toMatchObject({ state: "CANCELLED" });
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
    ).resolves.toMatchObject({
      status: "TERMINAL_REPLAY",
      outcome: { kind: "CANCELLED" },
    });
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

  it("projects future work with its due time while early execution remains fenced", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "future-projection",
      notBefore: futureTime,
    });

    await expect(composition.reconciler.scan()).resolves.toMatchObject({
      dispatched: 1,
    });
    expect(composition.dispatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workItemId: created.item.workItemId,
          dispatchRevision: 1,
          dispatchAttemptId: createDispatchAttemptId(created.item.workItemId, 1),
          notBefore: futureTime,
        }),
      ]),
    );
    await expect(
      composition.executor.execute(created.item.workItemId, 1),
    ).resolves.toMatchObject({ status: "RETRY_WAIT" });
    expect(composition.handlerCalls).toHaveLength(0);
  }, 180_000);

  it("uses the canonical projection index for fair PENDING and dependency scans", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    for (const state of ["PENDING", "WAITING_DEPENDENCY"] as const) {
      const explained = await queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `EXPLAIN (FORMAT JSON, COSTS OFF)
           SELECT work_item_id
             FROM "heptalogos"."work_item"
            WHERE state = '${state}'
              AND (created_at, work_item_id) >
                (TIMESTAMPTZ '1970-01-01 00:00:00+00',
                 '00000000-0000-7000-8000-000000000000'::uuid)
              AND (created_at, work_item_id) <=
                (TIMESTAMPTZ '9999-12-31 23:59:59+00',
                 'ffffffff-ffff-7fff-bfff-ffffffffffff'::uuid)
            ORDER BY created_at ASC, work_item_id ASC
            LIMIT 32`,
        [],
        "-c enable_seqscan=off",
      );
      expect(JSON.stringify(explained.rows)).toContain("work_item_projection_index");
    }
  }, 180_000);

  it("F1 gives a later PENDING WorkItem a projection opportunity past one stable page", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await Promise.all(
      Array.from({ length: WORK_OPTIONS.reconciliationBatchSize + 1 }, (_, index) =>
        createWork(composition, composition.target, {
          dedupKey: `fair-pending-${index}`,
        }),
      ),
    );
    const later = [...created]
      .map((value) => value.item)
      .sort((left, right) =>
        `${left.createdAt}\u0000${left.workItemId}`.localeCompare(
          `${right.createdAt}\u0000${right.workItemId}`,
        ),
      )
      .at(-1)!;

    await expect(composition.reconciler.scan()).resolves.toMatchObject({
      scanned: WORK_OPTIONS.reconciliationBatchSize,
      dispatched: WORK_OPTIONS.reconciliationBatchSize,
    });
    await expect(composition.reconciler.scan()).resolves.toMatchObject({
      dispatched: 1,
    });
    expect(composition.dispatches).toContainEqual(
      expect.objectContaining({
        workItemId: later.workItemId,
        dispatchRevision: 1,
        dispatchAttemptId: createDispatchAttemptId(later.workItemId, 1),
      }),
    );
  }, 180_000);

  it("F2 gives a later available dependency a recheck past one stable unavailable page", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const template = await createWork(composition, composition.target, {
      dedupKey: "fair-waiting-template",
    });
    await runCanonicalMutation(composition, "qualification.work.cancel.template", () =>
      composition.repository.requestCancel({
        workItemId: template.item.workItemId,
        expectedDispatchRevision: 1,
        expectedState: "PENDING",
        requestedAt: initialTime,
        reasonCode: "qualification.template.cancelled",
      }),
    );
    const ids = Array.from({ length: WORK_OPTIONS.reconciliationBatchSize + 1 }, () =>
      createWorkItemId(),
    ).sort();
    const waitingItems: WorkItem[] = ids.map((workItemId, index) => ({
      ...template.item,
      workItemId,
      dedupKey: undefined,
      state: "WAITING_DEPENDENCY",
      stateReasonCode: "handler-unavailable",
      handler:
        index === ids.length - 1
          ? composition.target
          : {
              ...composition.target,
              contributionId: createContributionId(
                `qualification.work.missing.${index}`,
              ),
            },
    }));
    for (const waiting of waitingItems) {
      await runCanonicalMutation(composition, "qualification.work.insert.waiting", () =>
        composition.repository.insertWorkItem(waiting),
      );
    }
    const available = waitingItems.at(-1)!;

    await composition.reconciler.scan();
    await composition.reconciler.scan();

    await expect(
      composition.repository.getWorkItem(available.workItemId),
    ).resolves.toMatchObject({
      state: "PENDING",
      dispatchRevision: 2,
    });
    expect(composition.dispatches).toContainEqual(
      expect.objectContaining({
        workItemId: available.workItemId,
        dispatchRevision: 2,
        dispatchAttemptId: createDispatchAttemptId(available.workItemId, 2),
      }),
    );
  }, 180_000);

  it("J1 detaches a caller payload before an asynchronous admission boundary", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    let admissionStarted!: () => void;
    const admissionStartedPromise = new Promise<void>((resolve) => {
      admissionStarted = resolve;
    });
    let releaseAdmission!: () => void;
    const admissionGate = new Promise<void>((resolve) => {
      releaseAdmission = resolve;
    });
    const admission: WorkAdmissionPort = {
      async beforeCreate() {
        admissionStarted();
        await admissionGate;
        return { decision: "ALLOW" };
      },
      async beforeDispatch() {
        return { decision: "ALLOW" };
      },
    };
    const work = createWorkQueueService({
      persistence: composition.persistence,
      repository: composition.repository,
      handlerRegistry: composition.supervisor.workHandlers,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      signalPublisher: postgresSignalPublisher,
      admission,
      profiles: PROFILE_CATALOG,
      runtimeOptions: WORK_OPTIONS,
      onBackgroundError() {},
    });
    const payload = { value: "before" };
    const creation = composition.runtime.runActivity(
      {
        kind: "qualification.work.snapshot.payload",
        importance: "significant",
        retentionClass: "operational",
        sensitivity: "operational",
      },
      () =>
        work.create({
          target: composition.target,
          payload,
          queueProfileId,
          resourceAdmissionClass,
          priority: 100,
          dedupKey: "payload-snapshot-detachment",
        }),
    );
    await admissionStartedPromise;
    payload.value = "after";
    releaseAdmission();
    const result = await creation;

    expect(result.item.payload).toEqual({ value: "before" });
    await expect(
      composition.repository.getWorkItem(result.item.workItemId),
    ).resolves.toMatchObject({ payload: { value: "before" } });
  }, 180_000);

  it("J2 keeps a handler-held outcome mutation out of terminal WorkItem truth", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "outcome-snapshot-detachment",
    });
    const registry = new WorkHandlerRegistry();
    const customDescriptor: WorkHandlerProvisionDescriptor = {
      ...composition.descriptor,
      outcomeSchema: {
        type: "object",
        properties: {
          nested: {
            type: "object",
            properties: { value: { type: "number" } },
            required: ["value"],
            additionalProperties: false,
          },
        },
        required: ["nested"],
        additionalProperties: false,
      },
    };
    let handlerOutcome!: { nested: { value: number } };
    const handler: RuntimeWorkHandler = {
      execute: vi.fn(async () => {
        handlerOutcome = { nested: { value: 1 } };
        return { outcome: handlerOutcome };
      }),
    };
    registry.register(
      {
        microSystemId: composition.target.microSystemId,
        productGenerationId: composition.target.productGenerationId,
        packageGenerationId: composition.target.packageGenerationId,
      },
      customDescriptor,
      handler,
      createGenerationFence(),
    );
    const executor = createWorkAttemptExecutor({
      repository: composition.repository,
      handlerRegistry: registry,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      classifier: {
        classify: () => ({
          kind: "TERMINAL" as const,
          retryClass: "permanent" as const,
          reasonCode: "unexpected-handler-failure",
        }),
      },
      runtimeOptions: WORK_OPTIONS,
    });

    await expect(executor.execute(created.item.workItemId, 1)).resolves.toMatchObject({
      status: "SUCCEEDED",
    });
    handlerOutcome.nested.value = 9;
    await expect(
      composition.repository.getWorkItem(created.item.workItemId),
    ).resolves.toMatchObject({
      state: "SUCCEEDED",
      outcome: { kind: "SUCCEEDED", value: { nested: { value: 1 } } },
    });
  }, 180_000);

  it("does not wake a waiting item when only its payload version is unavailable", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "payload-version-waiting",
    });
    const unavailable: WorkItem = {
      ...created.item,
      workItemId: createWorkItemId(),
      handler: { ...created.item.handler, payloadVersion: 2 },
      dedupKey: "payload-version-unavailable",
    };
    await runCanonicalMutation(composition, "qualification.work.insert", () =>
      composition.repository.insertWorkItem(unavailable),
    );

    await expect(
      composition.executor.execute(unavailable.workItemId, 1),
    ).resolves.toMatchObject({ status: "WAITING_DEPENDENCY" });
    const before = await composition.repository.getWorkItem(unavailable.workItemId);
    expect(before).toMatchObject({
      state: "WAITING_DEPENDENCY",
      dispatchRevision: 1,
    });
    await composition.reconciler.scan();
    await expect(
      composition.repository.getWorkItem(unavailable.workItemId),
    ).resolves.toMatchObject({
      state: "WAITING_DEPENDENCY",
      dispatchRevision: 1,
    });
  }, 180_000);

  it("terminalizes cancellation for dependency and retry waiting states", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "waiting-cancel",
    });
    const unavailable: WorkItem = {
      ...created.item,
      workItemId: createWorkItemId(),
      handler: { ...created.item.handler, payloadVersion: 2 },
      dedupKey: "waiting-cancel-payload",
    };
    await runCanonicalMutation(composition, "qualification.work.insert", () =>
      composition.repository.insertWorkItem(unavailable),
    );
    await composition.executor.execute(unavailable.workItemId, 1);
    await expect(
      runCanonicalMutation(composition, "qualification.work.cancel.waiting", () =>
        composition.repository.requestCancel({
          workItemId: unavailable.workItemId,
          expectedDispatchRevision: 1,
          expectedState: "WAITING_DEPENDENCY",
          requestedAt: initialTime,
          reasonCode: "qualification.cancel.waiting",
        }),
      ),
    ).resolves.toMatchObject({ status: "APPLIED", item: { state: "CANCELLED" } });

    const retry = await createWork(composition, composition.target, {
      dedupKey: "retry-cancel",
    });
    await runCanonicalMutation(composition, "qualification.work.retry", () =>
      composition.repository.markRetryWait({
        workItemId: retry.item.workItemId,
        expectedDispatchRevision: 1,
        expectedState: "PENDING",
        retryClass: "transient",
        reasonCode: "qualification.retry.waiting",
        notBefore: futureTime,
        updatedAt: initialTime,
      }),
    );
    await expect(
      runCanonicalMutation(composition, "qualification.work.cancel.retry", () =>
        composition.repository.requestCancel({
          workItemId: retry.item.workItemId,
          expectedDispatchRevision: 1,
          expectedState: "RETRY_WAIT",
          requestedAt: initialTime,
          reasonCode: "qualification.cancel.retry",
        }),
      ),
    ).resolves.toMatchObject({ status: "APPLIED", item: { state: "CANCELLED" } });
  }, 180_000);

  it("accepts only the first concurrent cancellation or supersession intent", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "first-terminal-intent",
    });
    const [cancel, supersede] = await Promise.all([
      runCanonicalMutation(composition, "qualification.work.cancel.concurrent", () =>
        composition.repository.requestCancel({
          workItemId: created.item.workItemId,
          expectedDispatchRevision: 1,
          expectedState: "PENDING",
          requestedAt: initialTime,
          reasonCode: "qualification.cancel.first",
        }),
      ),
      runCanonicalMutation(composition, "qualification.work.supersede.concurrent", () =>
        composition.repository.requestSupersede({
          workItemId: created.item.workItemId,
          expectedDispatchRevision: 1,
          expectedState: "PENDING",
          requestedAt: initialTime,
          supersededBy: createWorkItemId(),
        }),
      ),
    ]);
    expect(new Set([cancel.status, supersede.status])).toEqual(
      new Set(["APPLIED", "TERMINAL"]),
    );
    const item = await composition.repository.getWorkItem(created.item.workItemId);
    expect(item?.state === "CANCELLED" || item?.state === "SUPERSEDED").toBe(true);
    expect(item?.cancelRequestedAt !== undefined).not.toBe(
      item?.supersededBy !== undefined,
    );
    expect(item?.activeAttemptId).toBeUndefined();
  }, 180_000);

  it("S1 finalizes a RUNNING supersession with the stable reason and exact target", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "running-supersession-contract",
    });
    const registry = new WorkHandlerRegistry();
    const supersessionHandler: RuntimeWorkHandler = {
      execute: vi.fn(
        ({ signal }: { readonly signal: AbortSignal }) =>
          new Promise<{ readonly outcome: { readonly accepted: boolean } }>(
            (resolve) => {
              signal.addEventListener(
                "abort",
                () => resolve({ outcome: { accepted: true } }),
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
      supersessionHandler,
      createGenerationFence(),
    );
    const executor = createWorkAttemptExecutor({
      repository: composition.repository,
      handlerRegistry: registry,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      classifier: {
        classify: () => ({
          kind: "TERMINAL" as const,
          retryClass: "permanent" as const,
          reasonCode: "unexpected-handler-failure",
        }),
      },
      runtimeOptions: WORK_OPTIONS,
    });
    const supersededBy = createWorkItemId();
    const execution = executor.execute(created.item.workItemId, 1);
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(created.item.workItemId))?.state ===
        "RUNNING",
    );
    await expect(
      runCanonicalMutation(composition, "qualification.work.supersede.running", () =>
        composition.repository.requestSupersede({
          workItemId: created.item.workItemId,
          expectedDispatchRevision: 1,
          expectedState: "RUNNING",
          expectedActiveAttemptId: createDispatchAttemptId(created.item.workItemId, 1),
          requestedAt: initialTime,
          supersededBy,
        }),
      ),
    ).resolves.toMatchObject({ status: "APPLIED" });
    await expect(execution).resolves.toMatchObject({ status: "SUPERSEDED" });
    await expect(
      composition.repository.getWorkItem(created.item.workItemId),
    ).resolves.toMatchObject({
      state: "SUPERSEDED",
      supersededBy,
      outcome: {
        schemaVersion: 1,
        kind: "SUPERSEDED",
        reasonCode: "superseded-by-request",
        supersededBy,
      },
    });
  }, 180_000);

  it("C1 rejects incoherent terminal WorkItem rows on a fresh PostgreSQL baseline", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "terminal-outcome-schema-coherence",
    });
    const cases = [
      {
        state: "SUCCEEDED",
        retryClass: null,
        outcome: {
          schemaVersion: 1,
          kind: "FAILED",
          retryClass: "permanent",
          reasonCode: "x",
        },
      },
      {
        state: "FAILED",
        retryClass: "permanent",
        outcome: { schemaVersion: 1, kind: "SUCCEEDED", value: {} },
      },
      {
        state: "CANCELLED",
        retryClass: null,
        outcome: { schemaVersion: 1, kind: "SUPERSEDED", reasonCode: "x" },
      },
      {
        state: "SUPERSEDED",
        retryClass: null,
        outcome: { schemaVersion: 1, kind: "CANCELLED", reasonCode: "x" },
      },
      {
        state: "FAILED",
        retryClass: "transient",
        outcome: {
          schemaVersion: 1,
          kind: "FAILED",
          retryClass: "permanent",
          reasonCode: "x",
        },
      },
      {
        state: "SUCCEEDED",
        retryClass: null,
        outcome: { schemaVersion: 2, kind: "SUCCEEDED", value: {} },
      },
    ] as const;
    for (const value of cases) {
      await expect(
        queryAs(
          fixture,
          "heptalogos_migration",
          MIGRATION_PASSWORD,
          `UPDATE "heptalogos"."work_item"
              SET state = $2, retry_class = $3, outcome = $4::jsonb
            WHERE work_item_id = $1`,
          [
            created.item.workItemId,
            value.state,
            value.retryClass,
            JSON.stringify(value.outcome),
          ],
          "-c role=heptalogos_owner",
        ),
      ).rejects.toBeDefined();
    }
  }, 180_000);

  it("terminalizes a forbidden external-effect classifier decision without stranded RUNNING state", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const created = await createWork(composition, composition.target, {
      dedupKey: "forbidden-classifier-decision",
    });
    const registry = new WorkHandlerRegistry();
    const failingHandler: RuntimeWorkHandler = {
      execute: vi.fn(async () => {
        throw new Error("handler failure");
      }),
    };
    registry.register(
      {
        microSystemId: composition.target.microSystemId,
        productGenerationId: composition.target.productGenerationId,
        packageGenerationId: composition.target.packageGenerationId,
      },
      composition.descriptor,
      failingHandler,
      createGenerationFence(),
    );
    const executor = createWorkAttemptExecutor({
      repository: composition.repository,
      handlerRegistry: registry,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      classifier: {
        classify: () => ({
          kind: "TERMINAL" as const,
          retryClass: "external-effect-uncertain" as const,
          reasonCode: "forbidden-in-this-stage",
        }),
      },
      runtimeOptions: WORK_OPTIONS,
    });

    await expect(executor.execute(created.item.workItemId, 1)).resolves.toMatchObject({
      status: "FAILED",
      item: { state: "FAILED", retryClass: "invalid" },
    });
    await expect(
      composition.repository.getWorkItem(created.item.workItemId),
    ).resolves.toMatchObject({
      state: "FAILED",
      retryClass: "invalid",
      outcome: {
        kind: "FAILED",
        retryClass: "invalid",
        reasonCode: "work.external_effect_uncertain_unsupported",
      },
    });
  }, 180_000);

  it("rolls back WorkItem creation when transaction-time Signal publication fails", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const failingPublisher: SignalPublisher = {
      async publish() {
        throw new Error("transaction-time signal failure");
      },
    };
    const failingWork = createWorkQueueService({
      persistence: composition.persistence,
      repository: composition.repository,
      handlerRegistry: composition.supervisor.workHandlers,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      signalPublisher: failingPublisher,
      admission: composition.admission,
      profiles: PROFILE_CATALOG,
      runtimeOptions: WORK_OPTIONS,
      onBackgroundError() {},
    });
    const dedupKey = "transaction-signal-rollback";

    await expect(
      runCanonicalMutation(composition, "qualification.work.signal.rollback", () =>
        failingWork.create({
          target: composition.target,
          payload: { value: "work-qualification" },
          queueProfileId,
          resourceAdmissionClass,
          priority: 100,
          dedupKey,
        }),
      ),
    ).rejects.toBeDefined();
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT count(*)::int AS count FROM "heptalogos"."work_item" WHERE dedup_key = $1`,
        [dedupKey],
      ),
    ).resolves.toMatchObject({ rows: [{ count: 0 }] });
  }, 180_000);

  it("L1-L5 closes every significant WorkQueue Activity with its canonical mutation", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture);
    const composition = activeComposition;
    const activity = async (sourceActivityId: string) =>
      (
        await queryAs(
          fixture,
          "heptalogos_bootstrap",
          BOOTSTRAP_PASSWORD,
          `SELECT started_at, ended_at, outcome, outcome_ref
             FROM "heptalogos"."activity_record"
            WHERE kind = 'work.execute' AND causation_activity_id = $1
            ORDER BY started_at DESC, activity_id DESC
            LIMIT 1`,
          [sourceActivityId],
        )
      ).rows[0];

    const successful = await createWork(composition, composition.target, {
      dedupKey: "lineage-success",
    });
    const workCreate = await queryAs(
      fixture,
      "heptalogos_bootstrap",
      BOOTSTRAP_PASSWORD,
      `SELECT ended_at, outcome, outcome_ref
         FROM "heptalogos"."activity_record"
        WHERE activity_id = $1`,
      [successful.item.lineageContextRef.sourceActivityId],
    );
    expect(workCreate.rows[0]).toMatchObject({
      ended_at: expect.anything(),
      outcome: "SUCCEEDED",
      outcome_ref: "CREATED",
    });
    await expect(
      composition.executor.execute(successful.item.workItemId, 1),
    ).resolves.toMatchObject({ status: "SUCCEEDED" });
    await expect(
      activity(successful.item.lineageContextRef.sourceActivityId),
    ).resolves.toMatchObject({
      ended_at: expect.anything(),
      outcome: "SUCCEEDED",
    });

    const waiting = await createWork(composition, composition.target, {
      dedupKey: "lineage-waiting",
    });
    const emptyRegistry = new WorkHandlerRegistry();
    const waitingExecutor = createWorkAttemptExecutor({
      repository: composition.repository,
      handlerRegistry: emptyRegistry,
      execution: composition.runtime,
      lineage: composition.lineage,
      time: composition.time,
      classifier: {
        classify: () => ({
          kind: "TERMINAL" as const,
          retryClass: "permanent" as const,
          reasonCode: "unexpected-handler-failure",
        }),
      },
      runtimeOptions: WORK_OPTIONS,
    });
    await expect(
      waitingExecutor.execute(waiting.item.workItemId, 1),
    ).resolves.toMatchObject({ status: "WAITING_DEPENDENCY" });
    await expect(
      activity(waiting.item.lineageContextRef.sourceActivityId),
    ).resolves.toMatchObject({
      ended_at: expect.anything(),
      outcome: "SUCCEEDED",
      outcome_ref: "WAITING_DEPENDENCY",
    });

    const retry = await createWork(composition, composition.target, {
      dedupKey: "lineage-retry-wait",
      notBefore: futureTime,
    });
    await expect(
      composition.executor.execute(retry.item.workItemId, 1),
    ).resolves.toMatchObject({ status: "RETRY_WAIT" });
    await expect(
      activity(retry.item.lineageContextRef.sourceActivityId),
    ).resolves.toMatchObject({
      ended_at: expect.anything(),
      outcome: "SUCCEEDED",
      outcome_ref: "RETRY_WAIT",
    });

    const invalidBase = await createWork(composition, composition.target, {
      dedupKey: "lineage-invalid-template",
    });
    const invalid: WorkItem = {
      ...invalidBase.item,
      workItemId: createWorkItemId(),
      dedupKey: "lineage-invalid-payload",
      payload: { value: 42 } as never,
    };
    await runCanonicalMutation(composition, "qualification.work.insert.invalid", () =>
      composition.repository.insertWorkItem(invalid),
    );
    await expect(
      composition.executor.execute(invalid.workItemId, 1),
    ).resolves.toMatchObject({ status: "FAILED" });
    await expect(
      activity(invalid.lineageContextRef.sourceActivityId),
    ).resolves.toMatchObject({
      ended_at: expect.anything(),
      outcome: "FAILED",
      outcome_ref: "runtime.work_handler.payload_invalid",
    });
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
      `SELECT activity_id, kind, started_at, ended_at, outcome, outcome_ref,
              causation_activity_id,
              product_generation_id, package_generation_id,
              micro_system_id, micro_system_instance_id, contribution_id
         FROM "heptalogos"."activity_record"
        WHERE kind IN ('work.create', 'work.execute')
        ORDER BY started_at, activity_id`,
    );
    const workCreate = activities.rows.find((row) => row.kind === "work.create");
    const workExecute = activities.rows.find((row) => row.kind === "work.execute");
    expect(workCreate).toMatchObject({
      ended_at: expect.anything(),
      outcome: "SUCCEEDED",
      outcome_ref: "CREATED",
    });
    expect(workExecute).toMatchObject({
      ended_at: expect.anything(),
      outcome: "SUCCEEDED",
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

describePostgres.sequential("Real DBOS durable execution qualification", () => {
  it("D1 recovers a lost immediate projection through anti-entropy", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const composition = activeComposition;
    await requireDurable(composition);
    composition.setDispatchUnavailable(true);
    await composition.reconciler.start();
    const created = await createWork(composition, composition.target, {
      dedupKey: "dbos-d1-lost-projection",
    });
    await waitUntil(() => composition.dispatches.length >= 1);
    composition.setDispatchUnavailable(false);
    await composition.reconciler.scan();

    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(created.item.workItemId))?.state ===
        "SUCCEEDED",
    );
    const attemptId = createDispatchAttemptId(created.item.workItemId, 1);
    const workflowID = `heptalogos.work.${attemptId}`;
    await expect(durableWorkflowRow(fixture, workflowID)).resolves.toMatchObject({
      workflow_uuid: workflowID,
      status: "SUCCESS",
      application_version: DURABLE_CODE_VERSION,
      queue_name: "heptalogos.queue.work.default",
    });
    expect(composition.handlerCalls).toHaveLength(1);
    expect(composition.dispatches.length).toBeGreaterThanOrEqual(2);
  }, 180_000);

  it("D2 collapses duplicate projection of one WorkItem revision", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const composition = activeComposition;
    await requireDurable(composition);
    const created = await createWork(composition, composition.target, {
      dedupKey: "dbos-d2-duplicate",
    });
    const dispatch = durableRequest(created.item);
    await Promise.all([
      composition.durableDispatch.dispatch(dispatch),
      composition.durableDispatch.dispatch(dispatch),
    ]);
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(created.item.workItemId))?.state ===
        "SUCCEEDED",
    );

    const workflowID = `heptalogos.work.${dispatch.dispatchAttemptId}`;
    const rows = await queryAs(
      fixture,
      "heptalogos_bootstrap",
      BOOTSTRAP_PASSWORD,
      `SELECT workflow_uuid, status, application_version
         FROM "dbos"."workflow_status"
        WHERE workflow_uuid = $1`,
      [workflowID],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({
      workflow_uuid: workflowID,
      status: "SUCCESS",
      application_version: DURABLE_CODE_VERSION,
    });
    expect(composition.handlerCalls).toHaveLength(1);
  }, 180_000);

  it("D3 projects notBefore as a DBOS delay while canonical time remains authoritative", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const composition = activeComposition;
    await requireDurable(composition);
    const created = await createWork(composition, composition.target, {
      dedupKey: "dbos-d3-not-before",
      notBefore: futureTime,
    });
    const dispatch = durableRequest(created.item);
    await composition.durableDispatch.dispatch(dispatch);
    const workflowID = `heptalogos.work.${dispatch.dispatchAttemptId}`;
    await waitUntil(
      async () => (await durableWorkflowRow(fixture, workflowID)) !== undefined,
    );

    await expect(durableWorkflowRow(fixture, workflowID)).resolves.toMatchObject({
      status: "DELAYED",
      application_version: DURABLE_CODE_VERSION,
      delay_until_epoch_ms: expect.anything(),
    });
    const delayedRow = await durableWorkflowRow(fixture, workflowID);
    expect(Number(delayedRow?.delay_until_epoch_ms)).toBeGreaterThan(Date.now());
    expect(composition.handlerCalls).toHaveLength(0);
    await expect(
      composition.repository.getWorkItem(created.item.workItemId),
    ).resolves.toMatchObject({ state: "PENDING", dispatchRevision: 1 });
    await expect(
      composition.durableInspection!.inspect(dispatch),
    ).resolves.toMatchObject({
      kind: "ACTIVE",
      applicationVersion: DURABLE_CODE_VERSION,
    });
  }, 180_000);

  it("D4 increments the canonical revision before projecting a retry", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const composition = activeComposition;
    await requireDurable(composition);
    const created = await createWork(composition, composition.target, {
      dedupKey: "dbos-d4-retry-revision",
      notBefore: futureTime,
    });
    const firstDispatch = durableRequest(created.item);
    await composition.durableDispatch.dispatch(firstDispatch);
    const firstWorkflowID = `heptalogos.work.${firstDispatch.dispatchAttemptId}`;
    await waitUntil(
      async () => (await durableWorkflowRow(fixture, firstWorkflowID)) !== undefined,
    );

    await runCanonicalMutation(composition, "qualification.dbos.retry", () =>
      composition.repository.markRetryWait({
        workItemId: created.item.workItemId,
        expectedDispatchRevision: 1,
        expectedState: "PENDING",
        retryClass: "transient",
        reasonCode: "qualification.dbos.retry",
        notBefore: futureTime,
        updatedAt: initialTime,
      }),
    );
    composition.time.advanceWallClock(5 * 60 * 1_000);
    await composition.reconciler.scan();
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(created.item.workItemId))?.state ===
        "SUCCEEDED",
    );

    const secondAttemptId = createDispatchAttemptId(created.item.workItemId, 2);
    const secondWorkflowID = `heptalogos.work.${secondAttemptId}`;
    expect(secondAttemptId).not.toBe(firstDispatch.dispatchAttemptId);
    expect(composition.dispatches).toContainEqual(
      expect.objectContaining({
        dispatchRevision: 2,
        dispatchAttemptId: secondAttemptId,
      }),
    );
    await expect(durableWorkflowRow(fixture, firstWorkflowID)).resolves.toMatchObject({
      status: "DELAYED",
    });
    await expect(durableWorkflowRow(fixture, secondWorkflowID)).resolves.toMatchObject({
      status: "SUCCESS",
      application_version: DURABLE_CODE_VERSION,
    });
    expect(composition.handlerCalls).toHaveLength(1);
  }, 180_000);

  it("D5 never binds a current generation to an item pinned to a missing generation", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const composition = activeComposition;
    const packageB = generation("PackageGenerationId", "package-b");
    const registry = new WorkHandlerRegistry();
    const handlerBExecute = vi.fn(async () => ({ outcome: { accepted: true } }));
    const handlerB: RuntimeWorkHandler = {
      execute: handlerBExecute,
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
          reasonCode: "qualification.dbos.generation",
        }),
      },
      runtimeOptions: WORK_OPTIONS,
    });
    const durable = createDurableExecutionRuntime(
      composition.bootResult.host.durableExecution,
      DURABLE_OPTIONS,
      alternateExecutor,
    );
    const dispatch = createDurableDispatchPort({
      authority: composition.bootResult.host.durableExecution,
      lifecycle: durable,
      durableCodeVersion: DURABLE_CODE_VERSION,
      profiles: PROFILE_CATALOG,
      now: () => composition.time.now(),
    });

    try {
      await durable.start();
      const created = await createWork(composition, composition.target, {
        dedupKey: "dbos-d5-generation",
      });
      await dispatch.dispatch(durableRequest(created.item));
      await waitUntil(
        async () =>
          (await composition.repository.getWorkItem(created.item.workItemId))?.state ===
          "WAITING_DEPENDENCY",
      );
      expect(handlerBExecute).not.toHaveBeenCalled();

      const handlerAExecute = vi.fn(async () => ({ outcome: { accepted: true } }));
      const handlerA: RuntimeWorkHandler = {
        execute: handlerAExecute,
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
      const wake = await runCanonicalMutation(
        composition,
        "qualification.dbos.generation",
        () =>
          composition.repository.wakeDependency({
            workItemId: created.item.workItemId,
            expectedDispatchRevision: 1,
            updatedAt: initialTime,
          }),
      );
      if (wake.item === undefined)
        throw new Error("dependency wake did not return WorkItem");
      expect(wake.item.dispatchRevision).toBe(2);
      await dispatch.dispatch(durableRequest(wake.item));
      await waitUntil(
        async () =>
          (await composition.repository.getWorkItem(created.item.workItemId))?.state ===
          "SUCCEEDED",
      );
      expect(handlerBExecute).not.toHaveBeenCalled();
      expect(handlerAExecute).toHaveBeenCalledTimes(1);
    } finally {
      await durable.close().catch(() => undefined);
    }
  }, 180_000);

  it("D6 keeps DBOS on its dedicated role while WorkAttemptExecutor uses persistence", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const composition = activeComposition;
    await requireDurable(composition);
    const created = await createWork(composition, composition.target, {
      dedupKey: "dbos-d6-role-isolation",
    });
    await composition.durableDispatch.dispatch(durableRequest(created.item));
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(created.item.workItemId))?.state ===
        "SUCCEEDED",
    );

    await expect(
      queryAs(
        fixture,
        "heptalogos_durable_execution",
        DURABLE_EXECUTION_PASSWORD,
        `SELECT count(*)::integer AS workflow_count FROM "dbos"."workflow_status"`,
      ),
    ).resolves.toMatchObject({ rows: [{ workflow_count: expect.anything() }] });
    await expect(
      queryAs(
        fixture,
        "heptalogos_durable_execution",
        DURABLE_EXECUTION_PASSWORD,
        `SELECT count(*) FROM "heptalogos"."work_item"`,
      ),
    ).rejects.toBeDefined();
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT state FROM "heptalogos"."work_item" WHERE work_item_id = $1`,
        [created.item.workItemId],
      ),
    ).resolves.toMatchObject({ rows: [{ state: "SUCCEEDED" }] });
  }, 180_000);

  it("D7 fails closed on a persisted queue-profile mismatch without overwriting it", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const composition = activeComposition;
    await requireDurable(composition);
    await composition.durable!.close();
    await queryAs(
      fixture,
      "heptalogos_migration",
      MIGRATION_PASSWORD,
      `UPDATE "dbos"."queues" SET concurrency = 999
        WHERE name = 'heptalogos.queue.work.default'`,
      [],
      "-c role=heptalogos_owner",
    );

    const restarted = createDurableExecutionRuntime(
      composition.bootResult.host.durableExecution,
      DURABLE_OPTIONS,
      composition.executor,
    );
    try {
      await expect(restarted.start()).rejects.toMatchObject({
        problem: { problemCode: "durable_execution.queue_profile_mismatch" },
      });
      expect(restarted.state).toBe("FAILED");
      await expect(
        queryAs(
          fixture,
          "heptalogos_bootstrap",
          BOOTSTRAP_PASSWORD,
          `SELECT concurrency FROM "dbos"."queues"
            WHERE name = 'heptalogos.queue.work.default'`,
        ),
      ).resolves.toMatchObject({ rows: [{ concurrency: 999 }] });
    } finally {
      await restarted.close().catch(() => undefined);
    }
  }, 180_000);

  it("D8 does not auto-repair a missing vendor schema during normal launch", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const composition = activeComposition;
    if (composition.durable === undefined) throw new Error("durable runtime missing");
    await queryAs(
      fixture,
      "heptalogos_migration",
      MIGRATION_PASSWORD,
      `DROP SCHEMA "dbos" CASCADE`,
      [],
      "-c role=heptalogos_owner",
    );

    await expect(composition.durable.start()).rejects.toBeDefined();
    expect(composition.durable.state).toBe("FAILED");
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT count(*)::integer AS schema_count
           FROM information_schema.schemata
          WHERE schema_name = 'dbos'`,
      ),
    ).resolves.toMatchObject({ rows: [{ schema_count: 0 }] });
  }, 180_000);

  it("D9 persists partition limits and executes work from two explicit partitions", async () => {
    const fixture = await makeFixture();
    const partitionedProfiles = createWorkQueueProfileCatalog([
      {
        profileId: queueProfileId,
        minPollingIntervalMs: 100,
        partition: { concurrency: 1 },
      },
    ]);
    activeComposition = await createComposition(fixture, {
      durableExecution: true,
      profiles: partitionedProfiles,
    });
    const composition = activeComposition;
    await requireDurable(composition);
    const first = await createWork(composition, composition.target, {
      dedupKey: "dbos-d9-partition-a",
      partitionKey: "tenant-a",
    });
    const second = await createWork(composition, composition.target, {
      dedupKey: "dbos-d9-partition-b",
      partitionKey: "tenant-b",
    });
    const firstDispatch = durableRequest(first.item);
    const secondDispatch = durableRequest(second.item);
    await Promise.all([
      composition.durableDispatch.dispatch(firstDispatch),
      composition.durableDispatch.dispatch(secondDispatch),
    ]);
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(first.item.workItemId))?.state ===
          "SUCCEEDED" &&
        (await composition.repository.getWorkItem(second.item.workItemId))?.state ===
          "SUCCEEDED",
    );

    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT partition_queue, partition_concurrency
           FROM "dbos"."queues"
          WHERE name = 'heptalogos.queue.work.default'`,
      ),
    ).resolves.toMatchObject({
      rows: [{ partition_queue: true, partition_concurrency: 1 }],
    });
    const rows = await queryAs(
      fixture,
      "heptalogos_bootstrap",
      BOOTSTRAP_PASSWORD,
      `SELECT queue_partition_key
         FROM "dbos"."workflow_status"
        WHERE workflow_uuid IN ($1, $2)
        ORDER BY queue_partition_key`,
      [
        `heptalogos.work.${firstDispatch.dispatchAttemptId}`,
        `heptalogos.work.${secondDispatch.dispatchAttemptId}`,
      ],
    );
    expect(rows.rows).toEqual([
      { queue_partition_key: "tenant-a" },
      { queue_partition_key: "tenant-b" },
    ]);
    expect(composition.handlerCalls).toHaveLength(2);
  }, 180_000);

  it("D10 keeps DBOS executorID stable across a new BootId", async () => {
    const fixture = await makeFixture();
    activeComposition = await createComposition(fixture, { durableExecution: true });
    const first = activeComposition;
    await requireDurable(first);
    const firstWork = await createWork(first, first.target, {
      dedupKey: "dbos-d10-first-boot",
    });
    const firstDispatch = durableRequest(firstWork.item);
    await first.durableDispatch.dispatch(firstDispatch);
    await waitUntil(
      async () =>
        (await first.repository.getWorkItem(firstWork.item.workItemId))?.state ===
        "SUCCEEDED",
    );
    const firstRow = await durableWorkflowRow(
      fixture,
      `heptalogos.work.${firstDispatch.dispatchAttemptId}`,
    );
    if (firstRow === undefined) throw new Error("first DBOS workflow row missing");
    const firstBootId = first.bootResult.host.bootId;
    await closeComposition(first);
    activeComposition = undefined;

    activeComposition = await createComposition(fixture, { durableExecution: true });
    const second = activeComposition;
    await requireDurable(second);
    const secondWork = await createWork(second, second.target, {
      dedupKey: "dbos-d10-second-boot",
    });
    const secondDispatch = durableRequest(secondWork.item);
    await second.durableDispatch.dispatch(secondDispatch);
    await waitUntil(
      async () =>
        (await second.repository.getWorkItem(secondWork.item.workItemId))?.state ===
        "SUCCEEDED",
    );
    const secondRow = await durableWorkflowRow(
      fixture,
      `heptalogos.work.${secondDispatch.dispatchAttemptId}`,
    );
    if (secondRow === undefined) throw new Error("second DBOS workflow row missing");

    expect(second.bootResult.host.bootId).not.toBe(firstBootId);
    expect(second.bootResult.host.instanceId).toBe(first.bootResult.host.instanceId);
    expect(firstRow.executor_id).toBe(first.bootResult.host.instanceId);
    expect(secondRow.executor_id).toBe(firstRow.executor_id);
  }, 240_000);

  it("T12 rejects new work before it can create a canonical or DBOS row", async () => {
    const fixture = await makeFixture();
    const admission: WorkAdmissionPort = {
      beforeCreate: async () => ({
        decision: "REJECT_NEW_WORK",
        reasonCode: "qualification.reject-new-work",
      }),
      beforeDispatch: async () => ({ decision: "ALLOW" }),
    };
    activeComposition = await createComposition(fixture, {
      durableExecution: true,
      admission,
    });
    const composition = activeComposition;
    await requireDurable(composition);
    const dedupKey = "dbos-t12-reject-new-work";

    await expect(
      createWork(composition, composition.target, { dedupKey }),
    ).rejects.toMatchObject({
      problem: { problemCode: "work.admission.rejected_new_work" },
    });
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT count(*)::int AS count
           FROM "heptalogos"."work_item"
          WHERE dedup_key = $1`,
        [dedupKey],
      ),
    ).resolves.toMatchObject({ rows: [{ count: 0 }] });
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT count(*)::int AS count
           FROM "dbos"."workflow_status"`,
      ),
    ).resolves.toMatchObject({ rows: [{ count: 0 }] });
  }, 180_000);

  it("T12 retains a committed WorkItem across DELAY and THROTTLE dispatch admission", async () => {
    const fixture = await makeFixture();
    const decisions = new Map<string, "DELAY" | "THROTTLE">();
    const beforeDispatchWorkItemIds: string[] = [];
    const admission: WorkAdmissionPort = {
      beforeCreate: async () => ({ decision: "ALLOW" }),
      beforeDispatch: async ({ workItem }) => {
        const workItemId = String(workItem.workItemId);
        beforeDispatchWorkItemIds.push(workItemId);
        const decision = decisions.get(workItemId);
        return decision === undefined
          ? { decision: "ALLOW" as const }
          : { decision, reasonCode: `qualification.${decision.toLowerCase()}` };
      },
    };
    activeComposition = await createComposition(fixture, {
      durableExecution: true,
      admission,
    });
    const composition = activeComposition;
    await requireDurable(composition);
    const delayed = await createWork(composition, composition.target, {
      dedupKey: "dbos-t12-delay",
    });
    const throttled = await createWork(composition, composition.target, {
      dedupKey: "dbos-t12-throttle",
    });
    decisions.set(String(delayed.item.workItemId), "DELAY");
    decisions.set(String(throttled.item.workItemId), "THROTTLE");

    await composition.reconciler.start();
    await waitUntil(
      () =>
        new Set(beforeDispatchWorkItemIds).size === 2 &&
        composition.dispatches.length === 0,
    );
    await expect(
      composition.repository.getWorkItem(delayed.item.workItemId),
    ).resolves.toMatchObject({ state: "PENDING", dispatchRevision: 1 });
    await expect(
      composition.repository.getWorkItem(throttled.item.workItemId),
    ).resolves.toMatchObject({ state: "PENDING", dispatchRevision: 1 });

    const workflowIds = [
      `heptalogos.work.${createDispatchAttemptId(delayed.item.workItemId, 1)}`,
      `heptalogos.work.${createDispatchAttemptId(throttled.item.workItemId, 1)}`,
    ];
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT count(*)::int AS count
           FROM "dbos"."workflow_status"
          WHERE workflow_uuid IN ($1, $2)`,
        workflowIds,
      ),
    ).resolves.toMatchObject({ rows: [{ count: 0 }] });

    decisions.clear();
    await composition.reconciler.scan();
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(delayed.item.workItemId))?.state ===
          "SUCCEEDED" &&
        (await composition.repository.getWorkItem(throttled.item.workItemId))?.state ===
          "SUCCEEDED",
    );
    expect(composition.dispatches.length).toBeGreaterThanOrEqual(2);
  }, 180_000);

  it("T12 applies DBOS worker and global concurrency to actual WorkItem execution", async () => {
    const fixture = await makeFixture();
    const profiles = createWorkQueueProfileCatalog([
      {
        profileId: queueProfileId,
        globalConcurrency: 1,
        workerConcurrency: 1,
        minPollingIntervalMs: 25,
      },
    ]);
    let active = 0;
    let maximumActive = 0;
    const started: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted!: () => void;
    const firstStartedPromise = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });
    const handler: RuntimeWorkHandler = {
      async execute(input) {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        started.push(String(input.workItemId));
        if (started.length === 1) firstStarted();
        try {
          if (started.length === 1) await firstGate;
          return { outcome: { accepted: true } };
        } finally {
          active -= 1;
        }
      },
    };
    activeComposition = await createComposition(fixture, {
      durableExecution: true,
      profiles,
      handler,
    });
    const composition = activeComposition;
    await requireDurable(composition);
    const first = await createWork(composition, composition.target, {
      dedupKey: "dbos-t12-global-concurrency-first",
    });
    const second = await createWork(composition, composition.target, {
      dedupKey: "dbos-t12-global-concurrency-second",
    });
    await Promise.all([
      composition.durableDispatch.dispatch(durableRequest(first.item)),
      composition.durableDispatch.dispatch(durableRequest(second.item)),
    ]);

    try {
      await firstStartedPromise;
      await new Promise<void>((resolve) => setTimeout(resolve, 250));
      expect(started).toHaveLength(1);
      expect(active).toBe(1);
      expect(maximumActive).toBe(1);
    } finally {
      releaseFirst();
    }
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(first.item.workItemId))?.state ===
          "SUCCEEDED" &&
        (await composition.repository.getWorkItem(second.item.workItemId))?.state ===
          "SUCCEEDED",
    );
    expect(maximumActive).toBe(1);
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT concurrency, worker_concurrency
           FROM "dbos"."queues"
          WHERE name = 'heptalogos.queue.work.default'`,
      ),
    ).resolves.toMatchObject({
      rows: [{ concurrency: 1, worker_concurrency: 1 }],
    });
  }, 180_000);

  it("T12 applies the DBOS queue rate limit to actual workflow starts", async () => {
    const fixture = await makeFixture();
    const profiles = createWorkQueueProfileCatalog([
      {
        profileId: queueProfileId,
        rateLimit: { limitPerPeriod: 1, periodSeconds: 1 },
        minPollingIntervalMs: 25,
      },
    ]);
    const startTimes: number[] = [];
    const handler: RuntimeWorkHandler = {
      async execute() {
        startTimes.push(Date.now());
        return { outcome: { accepted: true } };
      },
    };
    activeComposition = await createComposition(fixture, {
      durableExecution: true,
      profiles,
      handler,
    });
    const composition = activeComposition;
    await requireDurable(composition);
    const first = await createWork(composition, composition.target, {
      dedupKey: "dbos-t12-rate-limit-first",
    });
    const second = await createWork(composition, composition.target, {
      dedupKey: "dbos-t12-rate-limit-second",
    });
    await Promise.all([
      composition.durableDispatch.dispatch(durableRequest(first.item)),
      composition.durableDispatch.dispatch(durableRequest(second.item)),
    ]);
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(first.item.workItemId))?.state ===
          "SUCCEEDED" &&
        (await composition.repository.getWorkItem(second.item.workItemId))?.state ===
          "SUCCEEDED",
      15_000,
    );

    expect(startTimes).toHaveLength(2);
    const orderedStartTimes = [...startTimes].sort((left, right) => left - right);
    expect(orderedStartTimes[1]! - orderedStartTimes[0]!).toBeGreaterThanOrEqual(900);
    await expect(
      queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT rate_limit_max, rate_limit_period_sec
           FROM "dbos"."queues"
          WHERE name = 'heptalogos.queue.work.default'`,
      ),
    ).resolves.toMatchObject({
      rows: [{ rate_limit_max: 1, rate_limit_period_sec: 1 }],
    });
  }, 180_000);

  it("T12 bounds actual execution independently within each DBOS partition", async () => {
    const fixture = await makeFixture();
    const profiles = createWorkQueueProfileCatalog([
      {
        profileId: queueProfileId,
        globalConcurrency: 4,
        workerConcurrency: 4,
        partition: { concurrency: 1 },
        minPollingIntervalMs: 25,
      },
    ]);
    const partitionByWorkItem = new Map<string, string>();
    const activeByPartition = new Map<string, number>();
    const maximumActiveByPartition = new Map<string, number>();
    const startedByPartition = new Map<string, string>();
    const gates = new Map<string, Promise<void>>();
    const releases = new Map<string, () => void>();
    for (const partition of ["tenant-a", "tenant-b"]) {
      gates.set(
        partition,
        new Promise<void>((resolve) => {
          releases.set(partition, resolve);
        }),
      );
    }
    let firstPartitionsStarted!: () => void;
    const firstPartitionsStartedPromise = new Promise<void>((resolve) => {
      firstPartitionsStarted = resolve;
    });
    const handler: RuntimeWorkHandler = {
      async execute(input) {
        const workItemId = String(input.workItemId);
        const partition = partitionByWorkItem.get(workItemId);
        if (partition === undefined) {
          throw new Error(`missing test partition for ${workItemId}`);
        }
        const active = (activeByPartition.get(partition) ?? 0) + 1;
        activeByPartition.set(partition, active);
        maximumActiveByPartition.set(
          partition,
          Math.max(maximumActiveByPartition.get(partition) ?? 0, active),
        );
        const firstForPartition = !startedByPartition.has(partition);
        if (firstForPartition) {
          startedByPartition.set(partition, workItemId);
          if (startedByPartition.size === 2) firstPartitionsStarted();
        }
        try {
          if (firstForPartition) await gates.get(partition);
          return { outcome: { accepted: true } };
        } finally {
          activeByPartition.set(partition, (activeByPartition.get(partition) ?? 1) - 1);
        }
      },
    };
    activeComposition = await createComposition(fixture, {
      durableExecution: true,
      profiles,
      handler,
    });
    const composition = activeComposition;
    await requireDurable(composition);
    const items = [
      await createWork(composition, composition.target, {
        dedupKey: "dbos-t12-partition-a-first",
        partitionKey: "tenant-a",
      }),
      await createWork(composition, composition.target, {
        dedupKey: "dbos-t12-partition-a-second",
        partitionKey: "tenant-a",
      }),
      await createWork(composition, composition.target, {
        dedupKey: "dbos-t12-partition-b-first",
        partitionKey: "tenant-b",
      }),
      await createWork(composition, composition.target, {
        dedupKey: "dbos-t12-partition-b-second",
        partitionKey: "tenant-b",
      }),
    ];
    for (const created of items) {
      if (created.item.partitionKey === undefined) {
        throw new Error("partitioned qualification WorkItem lost its partition key");
      }
      partitionByWorkItem.set(
        String(created.item.workItemId),
        created.item.partitionKey,
      );
    }
    await Promise.all(
      items.map((created) =>
        composition.durableDispatch.dispatch(durableRequest(created.item)),
      ),
    );

    try {
      await firstPartitionsStartedPromise;
      await new Promise<void>((resolve) => setTimeout(resolve, 250));
      expect(startedByPartition).toHaveProperty("size", 2);
      expect(activeByPartition.get("tenant-a")).toBe(1);
      expect(activeByPartition.get("tenant-b")).toBe(1);
      expect(maximumActiveByPartition.get("tenant-a")).toBe(1);
      expect(maximumActiveByPartition.get("tenant-b")).toBe(1);
    } finally {
      releases.get("tenant-a")!();
      releases.get("tenant-b")!();
    }
    await waitUntil(async () =>
      (
        await Promise.all(
          items.map((created) =>
            composition.repository.getWorkItem(created.item.workItemId),
          ),
        )
      ).every((item) => item?.state === "SUCCEEDED"),
    );
  }, 180_000);

  it("T12 uses priority for DBOS scheduling after WorkQueue admission", async () => {
    const fixture = await makeFixture();
    const admittedWorkItemIds: string[] = [];
    const admission: WorkAdmissionPort = {
      beforeCreate: async () => ({ decision: "ALLOW" }),
      beforeDispatch: async ({ workItem }) => {
        admittedWorkItemIds.push(String(workItem.workItemId));
        return { decision: "ALLOW" };
      },
    };
    const profiles = createWorkQueueProfileCatalog([
      {
        profileId: queueProfileId,
        globalConcurrency: 1,
        workerConcurrency: 1,
        minPollingIntervalMs: 250,
      },
    ]);
    let highPriorityWorkItemId = "";
    const started: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted!: () => void;
    const firstStartedPromise = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });
    const handler: RuntimeWorkHandler = {
      async execute(input) {
        const workItemId = String(input.workItemId);
        started.push(workItemId);
        if (started.length === 1) {
          firstStarted();
          await firstGate;
        }
        return { outcome: { accepted: true } };
      },
    };
    activeComposition = await createComposition(fixture, {
      durableExecution: true,
      profiles,
      admission,
      handler,
    });
    const composition = activeComposition;
    await requireDurable(composition);
    const lowPriority = await createWork(composition, composition.target, {
      dedupKey: "dbos-t12-priority-low",
      priority: 100,
    });
    const highPriority = await createWork(composition, composition.target, {
      dedupKey: "dbos-t12-priority-high",
      priority: 1,
    });
    highPriorityWorkItemId = String(highPriority.item.workItemId);

    try {
      await composition.reconciler.start();
      await firstStartedPromise;
      await new Promise<void>((resolve) => setTimeout(resolve, 250));
      expect(started).toEqual([highPriorityWorkItemId]);
      expect(new Set(admittedWorkItemIds)).toEqual(
        new Set([String(lowPriority.item.workItemId), highPriorityWorkItemId]),
      );
      const rows = await queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT workflow_uuid, priority
           FROM "dbos"."workflow_status"
          WHERE workflow_uuid IN ($1, $2)`,
        [
          `heptalogos.work.${createDispatchAttemptId(lowPriority.item.workItemId, 1)}`,
          `heptalogos.work.${createDispatchAttemptId(highPriority.item.workItemId, 1)}`,
        ],
      );
      expect(rows.rows).toEqual(
        expect.arrayContaining([
          {
            workflow_uuid: `heptalogos.work.${createDispatchAttemptId(
              lowPriority.item.workItemId,
              1,
            )}`,
            priority: 100,
          },
          {
            workflow_uuid: `heptalogos.work.${createDispatchAttemptId(
              highPriority.item.workItemId,
              1,
            )}`,
            priority: 1,
          },
        ]),
      );
    } finally {
      releaseFirst();
    }
    await waitUntil(
      async () =>
        (await composition.repository.getWorkItem(lowPriority.item.workItemId))
          ?.state === "SUCCEEDED" &&
        (await composition.repository.getWorkItem(highPriority.item.workItemId))
          ?.state === "SUCCEEDED",
    );
    expect(started).toEqual([
      highPriorityWorkItemId,
      String(lowPriority.item.workItemId),
    ]);
  }, 180_000);
});
