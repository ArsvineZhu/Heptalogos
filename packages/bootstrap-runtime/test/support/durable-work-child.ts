import { appendFile } from "node:fs/promises";
import {
  asContentDigest,
  asDurableCodeVersion,
  createContributionId,
  createMicroSystemId,
  digestCanonicalJson,
  type ProductGenerationId,
  type PackageGenerationId,
  type WorkItemId,
} from "@heptalogos/foundation-contracts";
import { createCanonicalSchemaInitializer } from "@heptalogos/canonical-schema";
import {
  createDbosAttemptInspectionPort,
  createDurableExecutionRuntime,
  createDurableExecutionSchemaProvisioner,
  createDurableDispatchPort,
} from "@heptalogos/durable-execution";
import {
  prepareBootstrapPrelude,
  type BootstrapKeyProvider,
  type OwnedBootstrapPrelude,
} from "@heptalogos/bootstrap-runtime";
import {
  createExecutionContextRuntime,
  createExecutionLineageService,
  createPersistenceExecutionContextProvider,
} from "@heptalogos/execution-lineage";
import { createPersistenceService } from "@heptalogos/persistence";
import {
  createRuntimeLifecycleLineage,
  MicroSystemSupervisor,
  type MicroSystemDefinition,
  type WorkHandlerPayloadContract,
  type WorkHandlerProvisionDescriptor,
  type WorkHandlerTarget,
  type RuntimeWorkHandler,
  type WorkQueueProfileId,
  type ResourceAdmissionClassId,
} from "@heptalogos/runtime-kernel";
import { createRuntimeSubstrate } from "@heptalogos/runtime-substrate";
import { createSystemTimeService } from "@heptalogos/time-service";
import {
  createDispatchAttemptId,
  createWorkAttemptExecutor,
  createWorkQueueProfileCatalog,
  createWorkQueueRecoveryCoordinator,
  createWorkQueueReconciler,
  createWorkQueueService,
  type WorkAttemptExecutor,
  type WorkErrorClassifier,
  type WorkQueueRuntimeOptions,
} from "@heptalogos/work-queue";
import { createWorkQueueRepository } from "@heptalogos/work-queue/foundation-repository";
import {
  createPostgresSignalService,
  postgresSignalPublisher,
} from "@heptalogos/signal";
const BOOTSTRAP_PASSWORD = "CANONICAL_PG_TEST_BOOTSTRAP_PASSWORD_0123456789";
const HOST_LEASE_PASSWORD = "CANONICAL_PG_TEST_HOST_LEASE_PASSWORD_0123456789";
const RUNTIME_PASSWORD = "CANONICAL_PG_TEST_RUNTIME_PASSWORD_0123456789";
const MIGRATION_PASSWORD = "CANONICAL_PG_TEST_MIGRATION_PASSWORD_0123456789";
const DURABLE_EXECUTION_PASSWORD =
  "CANONICAL_PG_TEST_DURABLE_EXECUTION_PASSWORD_0123456789";
const CANONICAL_OPTIONS = {
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  lockTimeoutMs: 10_000,
  idleInTransactionSessionTimeoutMs: 30_000,
  onBackgroundError() {},
} as const;
const HOST_TIMING = {
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  fenceLockTimeoutMs: 10_000,
  keepAliveInitialDelayMs: 1_000,
} as const;

const [
  anchorRoot,
  pgBin,
  portText,
  mode,
  counterPath,
  versionLabel = "current",
  expectedWorkItemIdText,
] = process.argv.slice(2);
if (!anchorRoot || !pgBin || !portText || !mode || !counterPath) {
  throw new Error(
    "usage: durable-work-child.ts <anchor> <pg-bin> <port> <mode> <counter-file> [version]",
  );
}

const port = Number(portText);
if (!Number.isSafeInteger(port) || port <= 0) {
  throw new Error("durable-work-child port must be a positive safe integer");
}

type ChildEvent = {
  readonly type: string;
  readonly installationId?: string;
  readonly workItemId?: WorkItemId;
  readonly dispatchRevision?: number;
  readonly dispatchAttemptId?: string;
  readonly bootId?: string;
  readonly instanceId?: string;
  readonly continuityEpochId?: string;
  readonly hostOwnershipToken?: string;
  readonly state?: string;
  readonly message?: string;
  readonly problemCode?: string;
  readonly workflowId?: string;
  readonly applicationVersion?: string;
  readonly attemptCount?: number;
  readonly activeWorkAttemptInvocations?: number;
};

const expectedWorkItemId = expectedWorkItemIdText as WorkItemId | undefined;

function emit(event: ChildEvent): void {
  process.stdout.write(`HEPTALOGOS_EVENT ${JSON.stringify(event)}\n`);
}

const pendingCommands = new Set<string>();
const commandWaiters = new Map<string, Array<() => void>>();

function waitForCommand(command: string): Promise<void> {
  if (pendingCommands.delete(command)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const waiters = commandWaiters.get(command) ?? [];
    waiters.push(resolve);
    commandWaiters.set(command, waiters);
  });
}

function acceptCommand(command: string): void {
  const waiters = commandWaiters.get(command);
  const waiter = waiters?.shift();
  if (waiter !== undefined) {
    waiter();
    if (waiters?.length === 0) commandWaiters.delete(command);
  } else {
    pendingCommands.add(command);
  }
}

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  for (const command of chunk.split(/\r?\n/u).map((line) => line.trim())) {
    if (command !== "") acceptCommand(command);
  }
});

const releaseRequested = waitForCommand("RELEASE");
const commitRequested = waitForCommand("COMMIT");

/* Keep the child alive while a semantic barrier is held. */
process.stdin.resume();

function keyProvider(): BootstrapKeyProvider {
  return {
    async withPrivatePostgresBootstrapPassword(_context, use) {
      const password = new TextEncoder().encode(BOOTSTRAP_PASSWORD);
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
    async withPrivatePostgresHostLeasePassword(_context, use) {
      const password = new TextEncoder().encode(HOST_LEASE_PASSWORD);
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
    async withPrivatePostgresRuntimePassword(_context, use) {
      const password = new TextEncoder().encode(RUNTIME_PASSWORD);
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
    async withPrivatePostgresMigrationPassword(_context, use) {
      const password = new TextEncoder().encode(MIGRATION_PASSWORD);
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
    async withPrivatePostgresDurableExecutionPassword(_context, use) {
      const password = new TextEncoder().encode(DURABLE_EXECUTION_PASSWORD);
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
  };
}

function stateSelection() {
  return {
    activeBootstrapRuntimeGeneration: asContentDigest(
      "BootstrapRuntimeGenerationId",
      digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "durable" }),
    ),
    activeProductGeneration: asContentDigest(
      "ProductGenerationId",
      digestCanonicalJson("test.product-generation/v1", { generation: "durable" }),
    ),
  } as const;
}

function generation<T extends "ProductGenerationId" | "PackageGenerationId">(
  brand: T,
  label: string,
): T extends "ProductGenerationId" ? ProductGenerationId : PackageGenerationId {
  return asContentDigest(
    brand,
    digestCanonicalJson(`test.durable-work/${label}/v1`, { label }),
  ) as unknown as T extends "ProductGenerationId"
    ? ProductGenerationId
    : PackageGenerationId;
}

const queueProfileId = createMicroSystemId(
  "durable-work.default",
) as unknown as WorkQueueProfileId;
const resourceAdmissionClass = createMicroSystemId(
  "durable-work.default",
) as unknown as ResourceAdmissionClassId;
const profileCatalog = createWorkQueueProfileCatalog([
  { profileId: queueProfileId, minPollingIntervalMs: 100 },
]);
const durableCodeVersion = asDurableCodeVersion(
  digestCanonicalJson("test.durable-work-code/v1", { version: versionLabel }),
);
const workOptions: WorkQueueRuntimeOptions = {
  maxInlinePayloadBytes: 4_096,
  maxOutcomeBytes: 4_096,
  reconciliationBatchSize: 32,
  antiEntropyIntervalMs: mode === "signal-loss" ? 60_000 : 100,
};
const durableOptions = {
  durableCodeVersion,
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
  profiles: profileCatalog,
  onTerminalFailure() {},
  onBackgroundError(error: unknown) {
    emit({ type: "BACKGROUND_ERROR", message: String(error) });
  },
} as const;

const workItemTarget: WorkHandlerTarget = {
  productGenerationId: generation("ProductGenerationId", "product-a"),
  microSystemId: createMicroSystemId("durable-work.system"),
  contributionId: createContributionId("durable-work.execute"),
  packageGenerationId: generation("PackageGenerationId", "package-a"),
  payloadVersion: 1,
};
const descriptor: WorkHandlerProvisionDescriptor = {
  contributionId: workItemTarget.contributionId,
  contractVersion: "v1" as never,
  payloadContracts: [
    {
      version: 1,
      schema: {
        type: "object",
        properties: { value: { type: "string" } },
        required: ["value"],
        additionalProperties: false,
      },
    } satisfies WorkHandlerPayloadContract,
  ],
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

async function waitUntil(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 120_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("durable-work child condition timed out");
}

async function main(): Promise<void> {
  const canonicalInitializer = createCanonicalSchemaInitializer(CANONICAL_OPTIONS);
  const durableSchemaProvisioner = createDurableExecutionSchemaProvisioner({
    processTimeoutMs: 120_000,
    connectionTimeoutMs: 10_000,
    statementTimeoutMs: 10_000,
  });
  const initializeCanonicalAndDurable = async (
    context: Parameters<typeof canonicalInitializer>[0],
  ): Promise<void> => {
    await canonicalInitializer(context);
    await durableSchemaProvisioner.ensureCurrent(context.authority);
  };

  const prepared = await prepareBootstrapPrelude(anchorRoot);
  const owned: OwnedBootstrapPrelude = await prepared.acquireOwnership({
    heartbeatMs: 1_000,
  });
  await owned.ensureBootstrapStateInitialized(stateSelection());
  const ready = await owned.preparePrivatePostgres({
    toolchainBinDirectory: pgBin,
    initialPort: port,
    lifecycle: {
      startupTimeoutMs: 60_000,
      shutdownTimeoutMs: 30_000,
      readinessPollIntervalMs: 100,
    },
    keyProvider: keyProvider(),
  });
  const host = await owned.handoffPrivatePostgresToHost(ready, {
    initializeCanonicalHost: initializeCanonicalAndDurable,
    keyProvider: keyProvider(),
    timing: HOST_TIMING,
  });
  const time = createSystemTimeService();
  const execution = createExecutionContextRuntime(
    {
      installationId: host.installationId,
      instanceId: host.instanceId,
      bootId: host.bootId,
      continuityEpochId: host.continuityEpochId,
      hostOwnershipToken: host.token,
    },
    time,
  );
  const persistence = createPersistenceService(
    host.persistence,
    {
      maxConnections: 2,
      idleTimeoutMs: 5_000,
      connectionTimeoutMs: 10_000,
      statementTimeoutMs: 10_000,
      lockTimeoutMs: 10_000,
      idleInTransactionSessionTimeoutMs: 30_000,
      onBackgroundError(error: unknown) {
        emit({ type: "BACKGROUND_ERROR", message: String(error) });
      },
    },
    createPersistenceExecutionContextProvider(execution),
  );
  const lineage = createExecutionLineageService();
  const lifecycleLineage = createRuntimeLifecycleLineage({
    execution,
    persistence,
    lineage,
    time,
  });
  let workHandlerInvocations = 0;
  const handler: RuntimeWorkHandler = {
    async execute(input) {
      workHandlerInvocations += 1;
      try {
        await appendFile(
          counterPath,
          `${input.workItemId}:${input.dispatchRevision}\n`,
          "utf8",
        );
        if (mode === "running-before-terminal" || mode === "lease-loss") {
          emit({
            type: "RUNNING_COMMITTED",
            workItemId: input.workItemId,
            dispatchRevision: input.dispatchRevision,
            dispatchAttemptId: createDispatchAttemptId(
              input.workItemId,
              input.dispatchRevision,
            ),
          });
          await releaseRequested;
        }
        return { outcome: { accepted: true } };
      } finally {
        workHandlerInvocations -= 1;
      }
    },
  };
  const definition: MicroSystemDefinition = {
    microSystemId: workItemTarget.microSystemId,
    role: "system-service",
    generation: {
      productGenerationId: workItemTarget.productGenerationId,
      packageGenerationId: workItemTarget.packageGenerationId,
    },
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
    substrate: createRuntimeSubstrate({ settleTimeoutMs: 100 }),
    settleTimeoutMs: 100,
    definitions: [definition],
    lifecycleLineage,
    rootRuntimeOrigin: { productGenerationId: workItemTarget.productGenerationId },
  });
  await supervisor.reconcile({
    revision: 1,
    operatingMode: "NORMAL",
    desired: new Map([[workItemTarget.microSystemId, "RUNNING"]]),
    serviceBindings: new Map(),
    capabilityBindings: new Map(),
  });
  host.signal.addEventListener(
    "abort",
    () => emit({ type: "LEASE_FENCED", message: "managed Host ownership was fenced" }),
    { once: true },
  );
  const signal = createPostgresSignalService(host.persistence, {
    connectionTimeoutMs: 10_000,
    reconnectBaseDelayMs: 25,
    reconnectMaxDelayMs: 200,
    onBackgroundError(error: unknown) {
      emit({ type: "BACKGROUND_ERROR", message: String(error) });
    },
  });
  const repository = createWorkQueueRepository(persistence);
  const admission = {
    beforeCreate: async () => ({ decision: "ALLOW" as const }),
    beforeDispatch: async () => ({ decision: "ALLOW" as const }),
  };
  const classifier: WorkErrorClassifier = {
    classify: () => ({
      kind: "TERMINAL",
      retryClass: "permanent",
      reasonCode: "durable-work-child-handler-failure",
    }),
  };
  const work = createWorkQueueService({
    persistence,
    repository,
    handlerRegistry: supervisor.workHandlers,
    execution,
    lineage,
    time,
    signalPublisher: postgresSignalPublisher,
    admission,
    profiles: profileCatalog,
    runtimeOptions: workOptions,
    onBackgroundError(error: unknown) {
      emit({ type: "BACKGROUND_ERROR", message: String(error) });
    },
  });
  const baseExecutor = createWorkAttemptExecutor({
    repository,
    handlerRegistry: supervisor.workHandlers,
    execution,
    lineage,
    time,
    classifier,
    runtimeOptions: workOptions,
  });
  const executor: WorkAttemptExecutor =
    mode === "engine-before-execution"
      ? {
          async execute(workItemId, dispatchRevision) {
            emit({
              type: "ENGINE_PROJECTED",
              workItemId,
              dispatchRevision,
              dispatchAttemptId: createDispatchAttemptId(workItemId, dispatchRevision),
            });
            await releaseRequested;
            return baseExecutor.execute(workItemId, dispatchRevision);
          },
        }
      : mode === "crash-budget" || mode === "crash-budget-recover"
        ? {
            async execute(workItemId, dispatchRevision) {
              emit({
                type: "CRASH_POINT",
                workItemId,
                dispatchRevision,
                dispatchAttemptId: createDispatchAttemptId(
                  workItemId,
                  dispatchRevision,
                ),
              });
              await releaseRequested;
              return baseExecutor.execute(workItemId, dispatchRevision);
            },
          }
        : mode === "terminal-before-checkpoint"
          ? {
              async execute(workItemId, dispatchRevision) {
                const result = await baseExecutor.execute(workItemId, dispatchRevision);
                if (result.status === "SUCCEEDED") {
                  emit({
                    type: "TERMINAL_COMMITTED",
                    workItemId,
                    dispatchRevision,
                    dispatchAttemptId: createDispatchAttemptId(
                      workItemId,
                      dispatchRevision,
                    ),
                  });
                  await releaseRequested;
                }
                return result;
              },
            }
          : baseExecutor;
  const durable = createDurableExecutionRuntime(
    host.durableExecution,
    durableOptions,
    executor,
  );
  const dispatch = createDurableDispatchPort({
    authority: host.durableExecution,
    lifecycle: durable,
    durableCodeVersion,
    profiles: profileCatalog,
    now: () => time.now(),
  });
  const durableInspection = createDbosAttemptInspectionPort({
    durableCodeVersion,
  });
  const recovery = createWorkQueueRecoveryCoordinator({
    repository,
    durableInspection,
    onBackgroundError(error: unknown) {
      emit({ type: "BACKGROUND_ERROR", message: String(error) });
    },
    batchSize: workOptions.reconciliationBatchSize,
  });
  const reconciler = createWorkQueueReconciler({
    repository,
    durableDispatch: dispatch,
    handlerRegistry: supervisor.workHandlers,
    admission,
    signal,
    execution,
    time,
    runtimeOptions: workOptions,
    recovery,
    onBackgroundError(error: unknown) {
      emit({ type: "BACKGROUND_ERROR", message: String(error) });
    },
  });

  async function clean(): Promise<void> {
    await reconciler.stop().catch(() => undefined);
    await durable.close().catch(() => undefined);
    await supervisor.close().catch(() => undefined);
    await persistence.close().catch(() => undefined);
    const maintenance = await host.preparePrivatePostgresMaintenance({
      kind: "STOP_PRIVATE_POSTGRES",
    });
    await maintenance.execute({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
  }

  async function cleanFoundation(): Promise<void> {
    emit({
      type: "SHUTDOWN_BEGIN",
      state: host.state,
      activeWorkAttemptInvocations: workHandlerInvocations,
    });
    await reconciler.stop();
    await durable.close();
    await supervisor.close();
    await persistence.close();
    const maintenance = await host.preparePrivatePostgresMaintenance({
      kind: "STOP_PRIVATE_POSTGRES",
    });
    await maintenance.execute({
      async quiesce() {
        return { async resumeAfterAbort() {} };
      },
    });
    emit({
      type: "HOST_RELEASED",
      state: host.state,
      activeWorkAttemptInvocations: workHandlerInvocations,
    });
  }

  await durable.start();
  emit({
    type: "READY",
    installationId: host.installationId,
    bootId: host.bootId,
    instanceId: host.instanceId,
    continuityEpochId: host.continuityEpochId,
    hostOwnershipToken: host.token,
    state: host.state,
  });

  const createWorkItem = () =>
    execution.runActivity(
      {
        kind: "durable-work.child.create",
        importance: "significant",
        retentionClass: "operational",
        sensitivity: "operational",
      },
      () =>
        work.create({
          target: workItemTarget,
          payload: { value: "durable-work-child" },
          queueProfileId,
          resourceAdmissionClass,
          priority: 100,
        }),
    );
  const dispatchWorkItem = async (
    created: Awaited<ReturnType<typeof createWorkItem>>,
  ): Promise<void> => {
    await dispatch.dispatch({
      workItemId: created.item.workItemId,
      dispatchRevision: created.item.dispatchRevision,
      dispatchAttemptId: createDispatchAttemptId(
        created.item.workItemId,
        created.item.dispatchRevision,
      ),
      queueProfileId,
      priority: created.item.priority,
    });
  };

  if (mode === "foundation-boot-work-stop" || mode === "foundation-restart-work-stop") {
    await reconciler.start();
    const created = await createWorkItem();
    await waitUntil(async () => {
      const item = await repository.getWorkItem(created.item.workItemId);
      return item?.state === "SUCCEEDED";
    });
    const completed = await repository.getWorkItem(created.item.workItemId);
    if (completed?.state !== "SUCCEEDED") {
      throw new Error("Foundation executable work did not reach SUCCEEDED");
    }
    emit({
      type: "WORK_SUCCEEDED",
      workItemId: completed.workItemId,
      dispatchRevision: completed.dispatchRevision,
      dispatchAttemptId: createDispatchAttemptId(
        completed.workItemId,
        completed.dispatchRevision,
      ),
      state: completed.state,
    });
    await releaseRequested;
    await cleanFoundation();
    emit({ type: "RELEASED", state: host.state });
    return;
  }

  if (mode === "commit-before-dispatch") {
    const created = await createWorkItem();
    emit({
      type: "WORK_COMMITTED",
      workItemId: created.item.workItemId,
      dispatchRevision: created.item.dispatchRevision,
      dispatchAttemptId: createDispatchAttemptId(
        created.item.workItemId,
        created.item.dispatchRevision,
      ),
    });
    await releaseRequested;
    await clean();
    emit({ type: "RELEASED" });
    return;
  }

  if (mode === "engine-before-execution") {
    const created = await createWorkItem();
    await dispatchWorkItem(created);
    await releaseRequested;
    await clean();
    emit({ type: "RELEASED" });
    return;
  }

  if (
    mode === "running-before-terminal" ||
    mode === "terminal-before-checkpoint" ||
    mode === "lease-loss"
  ) {
    const created = await createWorkItem();
    await dispatchWorkItem(created);
    await releaseRequested;
    await clean();
    emit({ type: "RELEASED" });
    return;
  }

  if (mode === "signal-loss") {
    await reconciler.start();
    emit({ type: "SIGNAL_READY" });
    await commitRequested;
    const created = await createWorkItem();
    emit({
      type: "WORK_COMMITTED",
      workItemId: created.item.workItemId,
      dispatchRevision: created.item.dispatchRevision,
      dispatchAttemptId: createDispatchAttemptId(
        created.item.workItemId,
        created.item.dispatchRevision,
      ),
    });
    await releaseRequested;
    await clean();
    emit({ type: "RELEASED" });
    return;
  }

  if (mode === "observe-version") {
    if (expectedWorkItemId === undefined) {
      throw new Error("observe-version requires a WorkItemId");
    }
    await reconciler.start();
    await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
    const observed = await repository.getWorkItem(expectedWorkItemId);
    emit({
      type: "VERSION_OBSERVED",
      workItemId: expectedWorkItemId,
      state: observed?.state ?? "ABSENT",
    });
    await releaseRequested;
    await clean();
    emit({ type: "RELEASED" });
    return;
  }

  if (mode === "crash-budget") {
    const created = await createWorkItem();
    await dispatchWorkItem(created);
    await releaseRequested;
    await clean();
    emit({ type: "RELEASED" });
    return;
  }

  if (mode === "crash-budget-recover") {
    if (expectedWorkItemId === undefined) {
      throw new Error("crash-budget-recover requires a WorkItemId");
    }
    await releaseRequested;
    await clean();
    emit({ type: "RELEASED" });
    return;
  }

  if (mode === "recover") {
    if (expectedWorkItemId === undefined) {
      throw new Error("recover requires a WorkItemId");
    }
    await reconciler.start();
    await waitUntil(async () => {
      const item = await repository.getWorkItem(expectedWorkItemId);
      return item?.state === "SUCCEEDED";
    });
    const recovered = await repository.getWorkItem(expectedWorkItemId);
    emit({
      type: "RECOVERED",
      workItemId: expectedWorkItemId,
      dispatchRevision: recovered?.dispatchRevision,
      dispatchAttemptId:
        recovered === undefined
          ? undefined
          : createDispatchAttemptId(expectedWorkItemId, recovered.dispatchRevision),
      state: recovered?.state,
    });
    await releaseRequested;
    await clean();
    emit({ type: "RELEASED" });
    return;
  }

  throw new Error(`unsupported durable-work child mode: ${mode}`);
}

try {
  await main();
} catch (error) {
  emit({ type: "ERROR", message: String(error), problemCode: "UNKNOWN" });
  process.exitCode = 1;
}
