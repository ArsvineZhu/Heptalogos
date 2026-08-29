import { afterEach, describe, expect, it } from "vitest";
import {
  asDurableCodeVersion,
  asContentDigest,
  createContributionId,
  createMicroSystemId,
  createProviderId,
  createServiceId,
  digestCanonicalJson,
  parseInstant,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import { deriveHostAdvisoryKey } from "@heptalogos/host-ownership";
import {
  createExecutionContextRuntime,
  createExecutionLineageService,
  createPersistenceExecutionContextProvider,
} from "@heptalogos/execution-lineage";
import { createPersistenceService } from "@heptalogos/persistence";
import { createFakeTimeService } from "@heptalogos/time-service";
import { createRuntimeSubstrate } from "@heptalogos/runtime-substrate";
import { createCanonicalSchemaInitializer } from "@heptalogos/canonical-schema";
import {
  createDbosAttemptInspectionPort,
  createDurableDispatchPort,
  createDurableExecutionRuntime,
  createDurableExecutionSchemaProvisioner,
  type DurableExecutionRuntime,
} from "@heptalogos/durable-execution";
import { openPrivatePostgresMaintenanceController } from "@heptalogos/private-postgres";
import {
  createContractVersion,
  createRuntimeLifecycleLineage,
  exactContract,
  MicroSystemSupervisor,
  type MicroSystemDefinition,
  type ResourceAdmissionClassId,
  type RuntimeWorkHandler,
  type RuntimeWorkHandlerInvocation,
  type RuntimeQuiescenceLease,
  type ServiceProvisionDescriptor,
  type ServiceLease,
  type WorkHandlerPayloadContract,
  type WorkHandlerProvisionDescriptor,
  type WorkHandlerTarget,
  type WorkQueueProfileId,
} from "@heptalogos/runtime-kernel";
import {
  createDispatchAttemptId,
  createWorkAttemptExecutor,
  createWorkQueueProfileCatalog,
  createWorkQueueRecoveryCoordinator,
  createWorkQueueReconciler,
  createWorkQueueService,
  type WorkAdmissionPort,
  type WorkErrorClassifier,
  type WorkQueueRuntimeOptions,
} from "@heptalogos/work-queue";
import { createWorkQueueRepository } from "@heptalogos/work-queue/foundation-repository";
import {
  createPostgresSignalService,
  postgresSignalPublisher,
} from "@heptalogos/signal";
import {
  BOOTSTRAP_PASSWORD,
  CANONICAL_OPTIONS,
  boot,
  cleanupCanonicalPostgresFixtures,
  describeRealPostgres,
  makeFixture,
  queryAs,
  stopManagedHostWithoutRuntime,
  type BootResult,
} from "../support/canonical-postgres.js";
import type { HostMaintenanceQuiescence } from "../../src/managed-host.js";
import { acquireBootstrapOwnership } from "../../src/bootstrap-ownership.js";
import { prepareBootstrapPrelude } from "../../src/bootstrap-prelude.js";
import { getPrivatePostgresMaintenanceDescriptor } from "../../src/private-postgres-bootstrap.js";

const describePostgres = describeRealPostgres === undefined ? describe.skip : describe;
const contractV1 = createContractVersion("v1");
const settleTimeoutMs = 100;
const allOperatingModes = [
  "NORMAL",
  "SAFE",
  "MAINTENANCE",
  "EMERGENCY_READ_ONLY",
] as const;

afterEach(async () => {
  await cleanupCanonicalPostgresFixtures();
});

function productGenerationId(label: string): ProductGenerationId {
  return asContentDigest(
    "ProductGenerationId",
    digestCanonicalJson(`runtime-host-lifecycle/${label}/v1`, { label }),
  );
}

function serviceRequirement(serviceId: ReturnType<typeof createServiceId>) {
  return { serviceId, contract: exactContract(contractV1) };
}

function desired(systems: readonly MicroSystemDefinition[]) {
  return {
    revision: 1,
    operatingMode: "NORMAL" as const,
    desired: new Map(
      systems.map((definition) => [definition.microSystemId, "RUNNING" as const]),
    ),
    serviceBindings: new Map(),
    capabilityBindings: new Map(),
  };
}

function provider(
  id: string,
  productGeneration: ProductGenerationId,
  serviceId: ReturnType<typeof createServiceId>,
  activate?: MicroSystemDefinition["activate"],
): MicroSystemDefinition {
  const descriptor: ServiceProvisionDescriptor = {
    serviceId,
    providerId: createProviderId(`provider.${id}`),
    contractVersion: contractV1,
  };
  return {
    microSystemId: createMicroSystemId(`system.${id}`),
    role: "provider",
    generation: { productGenerationId: productGeneration },
    operatingModes: allOperatingModes,
    serviceRequirements: [],
    capabilityRequirements: [],
    serviceProvisions: [descriptor],
    capabilityProvisions: [],
    activate:
      activate ??
      (async (context) => {
        context.publishService(descriptor, { read: () => id });
      }),
  };
}

function consumer(
  id: string,
  productGeneration: ProductGenerationId,
  serviceId: ReturnType<typeof createServiceId>,
  activate: MicroSystemDefinition["activate"],
): MicroSystemDefinition {
  return {
    microSystemId: createMicroSystemId(`system.${id}`),
    role: "feature",
    generation: { productGenerationId: productGeneration },
    operatingModes: allOperatingModes,
    serviceRequirements: [serviceRequirement(serviceId)],
    capabilityRequirements: [],
    serviceProvisions: [],
    capabilityProvisions: [],
    activate,
  };
}

function independent(
  id: string,
  productGeneration: ProductGenerationId,
  activate: MicroSystemDefinition["activate"] = async () => undefined,
): MicroSystemDefinition {
  return {
    microSystemId: createMicroSystemId(`system.${id}`),
    role: "feature",
    generation: { productGenerationId: productGeneration },
    operatingModes: allOperatingModes,
    serviceRequirements: [],
    capabilityRequirements: [],
    serviceProvisions: [],
    capabilityProvisions: [],
    activate,
  };
}

interface RuntimeComposition {
  readonly bootResult: BootResult;
  readonly persistence: ReturnType<typeof createPersistenceService>;
  readonly supervisor: MicroSystemSupervisor;
  readonly runtime: ReturnType<typeof createExecutionContextRuntime>;
  readonly terminalFailures: unknown[];
}

async function createRuntimeComposition(
  bootResult: BootResult,
  productGeneration: ProductGenerationId,
  definitions: readonly MicroSystemDefinition[],
): Promise<RuntimeComposition> {
  const time = createFakeTimeService(parseInstant("2026-08-26T00:00:00.000Z")!);
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
    {
      maxConnections: 1,
      idleTimeoutMs: 5_000,
      connectionTimeoutMs: 10_000,
      statementTimeoutMs: 10_000,
      lockTimeoutMs: 10_000,
      idleInTransactionSessionTimeoutMs: 30_000,
      onBackgroundError() {},
    },
    createPersistenceExecutionContextProvider(runtime),
  );
  const lineage = createExecutionLineageService();
  const lifecycleLineage = createRuntimeLifecycleLineage({
    execution: runtime,
    persistence,
    lineage,
    time,
  });
  const terminalFailures: unknown[] = [];
  const supervisor = new MicroSystemSupervisor({
    substrate: createRuntimeSubstrate({ settleTimeoutMs }),
    settleTimeoutMs,
    definitions,
    lifecycleLineage,
    rootRuntimeOrigin: { productGenerationId: productGeneration },
    ownerLifecycle: {
      signal: bootResult.host.signal,
      onTerminalFailure: (error) => terminalFailures.push(error),
    },
  });
  return { bootResult, persistence, supervisor, runtime, terminalFailures };
}

async function createComposition(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  productGeneration: ProductGenerationId,
  definitions: readonly MicroSystemDefinition[],
): Promise<RuntimeComposition> {
  return createRuntimeComposition(await boot(fixture), productGeneration, definitions);
}

async function closeComposition(composition: RuntimeComposition): Promise<void> {
  await composition.supervisor.close().catch(() => undefined);
  await composition.persistence.close().catch(() => undefined);
  await stopManagedHostWithoutRuntime(composition.bootResult.host).catch(
    () => undefined,
  );
}

async function findHostLeaseBackend(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  instanceId: BootResult["host"]["instanceId"],
): Promise<number> {
  const key = deriveHostAdvisoryKey(instanceId);
  const rows = await queryAs(
    fixture,
    "heptalogos_bootstrap",
    BOOTSTRAP_PASSWORD,
    `SELECT activity.pid, locks.classid::text, locks.objid::text
       FROM pg_locks AS locks
       JOIN pg_stat_activity AS activity ON activity.pid = locks.pid
      WHERE locks.locktype = 'advisory'
        AND activity.usename = 'heptalogos_host_lease'
        AND activity.datname = 'heptalogos'`,
  );
  const asUnsigned = (value: number): number => value >>> 0;
  const matching = rows.rows.find((row) => {
    const classid = Number(row.classid);
    const objid = Number(row.objid);
    return (
      Number.isInteger(classid) &&
      Number.isInteger(objid) &&
      ((classid === key.key1 && objid === key.key2) ||
        (classid === asUnsigned(key.key1) && objid === asUnsigned(key.key2)))
    );
  });
  if (matching?.pid === undefined) throw new Error("Host lease backend was not found");
  return Number(matching.pid);
}

async function terminateAuthenticHost(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  host: BootResult["host"],
): Promise<void> {
  const backendPid = await findHostLeaseBackend(fixture, host.instanceId);
  const result = await queryAs(
    fixture,
    "heptalogos_bootstrap",
    BOOTSTRAP_PASSWORD,
    "SELECT pg_terminate_backend($1::integer) AS terminated",
    [backendPid],
  );
  expect(result.rows[0]?.terminated).toBe(true);
  const deadline = Date.now() + 10_000;
  while (!host.signal.aborted && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!host.signal.aborted)
    throw new Error("Host signal did not abort after backend termination");
}

describePostgres.sequential("Runtime and authentic Host lifecycle", () => {
  it("PG1 proves normal Runtime composition identity coherence", async () => {
    const fixture = await makeFixture();
    const productGeneration = productGenerationId("pg1");
    const serviceId = createServiceId("runtime.pg1.service");
    const a = provider("pg1-provider", productGeneration, serviceId);
    const b = consumer(
      "pg1-dependent",
      productGeneration,
      serviceId,
      async (context) => {
        await context
          .requireService<{ read(): string }>(serviceRequirement(serviceId))
          .invoke("pg1-read", (service) => service.read());
      },
    );
    const c = independent("pg1-independent", productGeneration);
    const composition = await createComposition(fixture, productGeneration, [a, b, c]);
    try {
      await composition.supervisor.reconcile(desired([a, b, c]));
      expect(composition.supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
      const activityRows = await queryAs(
        fixture,
        "heptalogos_bootstrap",
        BOOTSTRAP_PASSWORD,
        `SELECT installation_id, instance_id, boot_id, continuity_epoch_id,
                host_ownership_token, product_generation_id, micro_system_id
           FROM "heptalogos"."activity_record"
          WHERE kind LIKE 'runtime.%'
          ORDER BY started_at, activity_id`,
      );
      expect(activityRows.rows.length).toBeGreaterThanOrEqual(4);
      expect(activityRows.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            installation_id: composition.bootResult.host.installationId,
            instance_id: composition.bootResult.host.instanceId,
            boot_id: composition.bootResult.host.bootId,
            continuity_epoch_id: composition.bootResult.host.continuityEpochId,
            host_ownership_token: composition.bootResult.host.token,
            product_generation_id: productGeneration,
            micro_system_id: a.microSystemId,
          }),
        ]),
      );
    } finally {
      await closeComposition(composition);
    }
  }, 180_000);

  it("PG2 propagates authentic Host terminality to Persistence and Runtime", async () => {
    const fixture = await makeFixture();
    const productGeneration = productGenerationId("pg2");
    const serviceId = createServiceId("runtime.pg2.service");
    const definition = provider("pg2-provider", productGeneration, serviceId);
    const composition = await createComposition(fixture, productGeneration, [
      definition,
    ]);
    let lease: ServiceLease<{ read(): string }> | undefined;
    try {
      await composition.supervisor.reconcile(desired([definition]));
      lease = composition.supervisor.services.resolve<{ read(): string }>(
        serviceRequirement(serviceId),
      );
      await terminateAuthenticHost(fixture, composition.bootResult.host);
      await expect(composition.supervisor.close()).resolves.toBeUndefined();
      await expect(
        composition.persistence.mutate(async () => undefined),
      ).rejects.toBeDefined();
      await expect(
        lease.invoke("pg2-after-host-loss", (service) => service.read()),
      ).rejects.toBeDefined();
      await expect(
        composition.supervisor.reconcile(desired([definition])),
      ).rejects.toMatchObject({
        problem: { problemCode: "runtime.supervisor.not_active" },
      });
      expect(composition.bootResult.host.state).not.toBe("ACTIVE");
      expect(() => composition.bootResult.host.assertActive()).toThrow();
    } finally {
      await closeComposition(composition);
    }
  }, 180_000);

  it("PG3 uses real Runtime quiescence before planned Host STOP and PostgreSQL stop", async () => {
    const fixture = await makeFixture();
    const productGeneration = productGenerationId("pg3");
    const serviceId = createServiceId("runtime.pg3.service");
    const events: string[] = [];
    const providerId = createProviderId("provider.pg3-provider");
    const a = provider(
      "pg3-provider",
      productGeneration,
      serviceId,
      async (context) => {
        const descriptor: ServiceProvisionDescriptor = {
          serviceId,
          providerId,
          contractVersion: contractV1,
        };
        context.publishService(descriptor, { read: () => "pg3" });
        context.scope.defer("pg3-runtime-dispose", () => {
          events.push("runtime-disposed");
        });
      },
    );
    const b = consumer(
      "pg3-dependent",
      productGeneration,
      serviceId,
      async (context) => {
        await context
          .requireService<{ read(): string }>(serviceRequirement(serviceId))
          .invoke("pg3-read", (service) => service.read());
      },
    );
    const composition = await createComposition(fixture, productGeneration, [a, b]);
    let oldLease: ServiceLease<{ read(): string }> | undefined;
    try {
      await composition.supervisor.reconcile(desired([a, b]));
      oldLease = composition.supervisor.services.resolve<{ read(): string }>(
        serviceRequirement(serviceId),
      );
      const runtimeQuiescence: HostMaintenanceQuiescence = {
        async quiesce() {
          events.push("runtime-quiesce-requested");
          const lease = await composition.supervisor.quiesce();
          events.push("runtime-quiesced");
          return lease;
        },
      };
      const maintenance =
        await composition.bootResult.host.preparePrivatePostgresMaintenance({
          kind: "STOP_PRIVATE_POSTGRES",
        });
      await expect(maintenance.execute(runtimeQuiescence)).resolves.toEqual({
        kind: "STOPPED",
      });
      expect(composition.bootResult.host.state).toBe("CLOSED");
      events.push("host-terminal-observed");
      expect(events.indexOf("runtime-quiesce-requested")).toBeGreaterThanOrEqual(0);
      expect(composition.supervisor.getActualState(a.microSystemId)).toBe("STOPPED");
      expect(composition.supervisor.getActualState(b.microSystemId)).toBe("STOPPED");
      expect(events.indexOf("runtime-quiesced")).toBeLessThan(
        events.indexOf("host-terminal-observed"),
      );
      await expect(
        oldLease!.invoke("pg3-old-lease", (service) => service.read()),
      ).rejects.toBeDefined();
      await expect(
        queryAs(fixture, "heptalogos_bootstrap", BOOTSTRAP_PASSWORD, "SELECT 1"),
      ).rejects.toBeDefined();
    } finally {
      await closeComposition(composition);
    }
  }, 180_000);

  it("PG4 restarts with continuity preserved and fresh Runtime generations", async () => {
    const fixture = await makeFixture();
    const productGeneration = productGenerationId("pg4");
    const serviceId = createServiceId("runtime.pg4.service");
    const instanceIds: string[] = [];
    const providerId = createProviderId("provider.pg4-provider");
    const definition = provider(
      "pg4-provider",
      productGeneration,
      serviceId,
      async (context) => {
        instanceIds.push(context.microSystemInstanceId);
        const descriptor: ServiceProvisionDescriptor = {
          serviceId,
          providerId,
          contractVersion: contractV1,
        };
        context.publishService(descriptor, {
          read: () => context.microSystemInstanceId,
        });
      },
    );
    const compositionA = await createComposition(fixture, productGeneration, [
      definition,
    ]);
    let oldLease: ServiceLease<{ read(): string }> | undefined;
    let oldRuntimeLease: RuntimeQuiescenceLease | undefined;
    let compositionB: RuntimeComposition | undefined;
    try {
      await compositionA.supervisor.reconcile(desired([definition]));
      oldLease = compositionA.supervisor.services.resolve<{ read(): string }>(
        serviceRequirement(serviceId),
      );
      const runtimeQuiescenceA: HostMaintenanceQuiescence = {
        async quiesce() {
          const lease = await compositionA.supervisor.quiesce();
          oldRuntimeLease = lease;
          return lease;
        },
      };
      const maintenance =
        await compositionA.bootResult.host.preparePrivatePostgresMaintenance({
          kind: "RESTART_PRIVATE_POSTGRES",
        });
      const restarted = await maintenance.execute(runtimeQuiescenceA);
      expect(restarted.kind).toBe("RESTARTED");
      if (restarted.kind !== "RESTARTED")
        throw new Error("PG4 restart did not return a Host");
      const restartedBoot: BootResult = {
        ...compositionA.bootResult,
        host: restarted.host,
        epoch: restarted.host.continuityEpochId,
      };
      expect(restarted.host.installationId).toBe(
        compositionA.bootResult.host.installationId,
      );
      expect(restarted.host.instanceId).toBe(compositionA.bootResult.host.instanceId);
      expect(restarted.host.continuityEpochId).toBe(
        compositionA.bootResult.host.continuityEpochId,
      );
      expect(restarted.host.bootId).not.toBe(compositionA.bootResult.host.bootId);
      expect(restarted.host.token).not.toBe(compositionA.bootResult.host.token);
      await expect(compositionA.supervisor.close()).resolves.toBeUndefined();
      await expect(oldRuntimeLease!.resumeAfterAbort()).rejects.toBeDefined();

      compositionB = await createRuntimeComposition(restartedBoot, productGeneration, [
        definition,
      ]);
      await compositionB.supervisor.reconcile(desired([definition]));
      const newLease = compositionB.supervisor.services.resolve<{ read(): string }>(
        serviceRequirement(serviceId),
      );
      expect(instanceIds).toHaveLength(2);
      expect(instanceIds[1]).not.toBe(instanceIds[0]);
      expect(await newLease.invoke("pg4-new-lease", (service) => service.read())).toBe(
        instanceIds[1],
      );
      await expect(
        oldLease!.invoke("pg4-old-lease", (service) => service.read()),
      ).rejects.toBeDefined();
    } finally {
      if (compositionB !== undefined) await closeComposition(compositionB);
      await closeComposition(compositionA);
    }
  }, 180_000);

  it("PG5 proves HostMaintenanceQuiescence structural compatibility with Runtime lease", async () => {
    const fixture = await makeFixture();
    const productGeneration = productGenerationId("pg5");
    const serviceId = createServiceId("runtime.pg5.service");
    const definition = provider("pg5-provider", productGeneration, serviceId);
    const composition = await createComposition(fixture, productGeneration, [
      definition,
    ]);
    try {
      await composition.supervisor.reconcile(desired([definition]));
      const quiescence: HostMaintenanceQuiescence = {
        quiesce: () => composition.supervisor.quiesce(),
      };
      const lease = await quiescence.quiesce();
      await expect(lease.resumeAfterAbort()).resolves.toBeUndefined();
      expect(composition.supervisor.getActualState(definition.microSystemId)).toBe(
        "RUNNING",
      );
    } finally {
      await closeComposition(composition);
    }
  }, 180_000);

  it("PG6 keeps PostgreSQL running after Host terminal shutdown and forbids Runtime resume", async () => {
    const fixture = await makeFixture();
    const productGeneration = productGenerationId("pg6");
    const serviceId = createServiceId("runtime.pg6.service");
    const definition = provider("pg6-provider", productGeneration, serviceId);
    const composition = await createComposition(fixture, productGeneration, [
      definition,
    ]);
    let runtimeLease: RuntimeQuiescenceLease | undefined;
    let oldLease: ServiceLease<{ read(): string }> | undefined;
    try {
      await composition.supervisor.reconcile(desired([definition]));
      oldLease = composition.supervisor.services.resolve<{ read(): string }>(
        serviceRequirement(serviceId),
      );
      const quiescence: HostMaintenanceQuiescence = {
        async quiesce() {
          const lease = await composition.supervisor.quiesce();
          runtimeLease = lease;
          return lease;
        },
      };
      await composition.bootResult.host.shutdownKeepingPrivatePostgres(quiescence);
      expect(composition.bootResult.host.state).toBe("CLOSED");
      await expect(
        queryAs(fixture, "heptalogos_bootstrap", BOOTSTRAP_PASSWORD, "SELECT 1"),
      ).resolves.toMatchObject({ rows: [{ "?column?": 1 }] });
      await expect(composition.supervisor.close()).resolves.toBeUndefined();
      await expect(runtimeLease!.resumeAfterAbort()).rejects.toBeDefined();
      await expect(
        oldLease!.invoke("pg6-old-lease", (service) => service.read()),
      ).rejects.toBeDefined();

      const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
      const bootstrapOwnership = await acquireBootstrapOwnership(
        prepared.paths.resolve("INSTANCE"),
        { heartbeatMs: 1_000, bootId: prepared.bootId },
      );
      try {
        expect(bootstrapOwnership.state).toBe("HELD");
        const controller = await openPrivatePostgresMaintenanceController({
          ...getPrivatePostgresMaintenanceDescriptor(composition.bootResult.ready),
          assertControlAuthority: () => bootstrapOwnership.assertHeld(),
        });
        expect(controller.state).toBe("READY");
        await expect(controller.stop()).resolves.toBeUndefined();
        expect(controller.state).toBe("STOPPED");
        await expect(
          queryAs(fixture, "heptalogos_bootstrap", BOOTSTRAP_PASSWORD, "SELECT 1"),
        ).rejects.toBeDefined();
      } finally {
        await bootstrapOwnership.release();
      }
    } finally {
      await closeComposition(composition);
    }
  }, 180_000);
});

const durableLifecycleQueueProfileId = createMicroSystemId(
  "runtime-lifecycle.durable",
) as unknown as WorkQueueProfileId;
const durableLifecycleResourceClass = createMicroSystemId(
  "runtime-lifecycle.durable",
) as unknown as ResourceAdmissionClassId;
const durableLifecycleProfiles = createWorkQueueProfileCatalog([
  { profileId: durableLifecycleQueueProfileId, minPollingIntervalMs: 50 },
]);
const durableLifecycleCodeVersion = asDurableCodeVersion(
  digestCanonicalJson("runtime-lifecycle.durable-code/v1", { version: "current" }),
);
const durableLifecycleProductGeneration = productGenerationId("durable-lifecycle");
const durableLifecyclePackageGeneration = asContentDigest(
  "PackageGenerationId",
  digestCanonicalJson("runtime-lifecycle.durable-package/v1", { version: "current" }),
);
const durableLifecycleTarget: WorkHandlerTarget = {
  productGenerationId: durableLifecycleProductGeneration,
  microSystemId: createMicroSystemId("runtime-lifecycle.durable-work"),
  contributionId: createContributionId("runtime-lifecycle.durable-work.execute"),
  packageGenerationId: durableLifecyclePackageGeneration,
  payloadVersion: 1,
};
const durableLifecyclePayloadContracts: readonly WorkHandlerPayloadContract[] = [
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
const durableLifecycleDescriptor: WorkHandlerProvisionDescriptor = {
  contributionId: durableLifecycleTarget.contributionId,
  contractVersion: "v1" as never,
  payloadContracts: durableLifecyclePayloadContracts,
  outcomeSchema: {
    type: "object",
    properties: { accepted: { type: "boolean" } },
    required: ["accepted"],
    additionalProperties: false,
  },
  queueProfileId: durableLifecycleQueueProfileId,
  resourceAdmissionClass: durableLifecycleResourceClass,
  configurationBindingPolicy: "LATEST_COMPATIBLE_AT_ATTEMPT",
  restoreReplayClass: "RECONCILE_REQUIRED",
};
const durableLifecycleWorkOptions: WorkQueueRuntimeOptions = {
  maxInlinePayloadBytes: 4_096,
  maxOutcomeBytes: 4_096,
  reconciliationBatchSize: 32,
  antiEntropyIntervalMs: 50,
};
const durableLifecycleSchemaProvisioner = createDurableExecutionSchemaProvisioner({
  processTimeoutMs: 120_000,
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
});
const durableLifecycleCanonicalInitializer =
  createCanonicalSchemaInitializer(CANONICAL_OPTIONS);
const initializeDurableLifecycleSchemas = async (
  context: Parameters<typeof durableLifecycleCanonicalInitializer>[0],
): Promise<void> => {
  await durableLifecycleCanonicalInitializer(context);
  await durableLifecycleSchemaProvisioner.ensureCurrent(context.authority);
};

function durableLifecycleOptions(shutdownDrainTimeoutMs: number) {
  return {
    durableCodeVersion: durableLifecycleCodeVersion,
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
    shutdownDrainTimeoutMs,
    profiles: durableLifecycleProfiles,
    onBackgroundError() {},
  } as const;
}

interface DurableLifecycleComposition {
  readonly bootResult: BootResult;
  readonly runtime: ReturnType<typeof createExecutionContextRuntime>;
  readonly persistence: ReturnType<typeof createPersistenceService>;
  readonly supervisor: MicroSystemSupervisor;
  readonly signal: ReturnType<typeof createPostgresSignalService>;
  readonly repository: ReturnType<typeof createWorkQueueRepository>;
  readonly work: ReturnType<typeof createWorkQueueService>;
  readonly executor: ReturnType<typeof createWorkAttemptExecutor>;
  readonly durable: DurableExecutionRuntime;
  readonly durableDispatch: ReturnType<typeof createDurableDispatchPort>;
  readonly reconciler: ReturnType<typeof createWorkQueueReconciler>;
  readonly handlerStarted: Promise<RuntimeWorkHandlerInvocation>;
  readonly handlerInvocations: RuntimeWorkHandlerInvocation[];
  readonly releaseHandler: () => void;
}

async function createDurableLifecycleComposition(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  options: {
    readonly blockHandler?: boolean;
    readonly shutdownDrainTimeoutMs?: number;
  } = {},
): Promise<DurableLifecycleComposition> {
  const bootResult = await boot(fixture, initializeDurableLifecycleSchemas);
  const time = createFakeTimeService(parseInstant("2026-08-26T00:00:00.000Z")!);
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
    {
      maxConnections: 2,
      idleTimeoutMs: 5_000,
      connectionTimeoutMs: 10_000,
      statementTimeoutMs: 10_000,
      lockTimeoutMs: 10_000,
      idleInTransactionSessionTimeoutMs: 30_000,
      onBackgroundError() {},
    },
    createPersistenceExecutionContextProvider(runtime),
  );
  const lineage = createExecutionLineageService();
  const lifecycleLineage = createRuntimeLifecycleLineage({
    execution: runtime,
    persistence,
    lineage,
    time,
  });
  const handlerInvocations: RuntimeWorkHandlerInvocation[] = [];
  let resolveHandlerStarted!: (invocation: RuntimeWorkHandlerInvocation) => void;
  const handlerStarted = new Promise<RuntimeWorkHandlerInvocation>((resolve) => {
    resolveHandlerStarted = resolve;
  });
  let releaseHandler!: () => void;
  const handlerRelease = new Promise<void>((resolve) => {
    releaseHandler = resolve;
  });
  const handler: RuntimeWorkHandler = {
    async execute(input) {
      handlerInvocations.push(input);
      if (handlerInvocations.length === 1) resolveHandlerStarted(input);
      if (options.blockHandler === true) await handlerRelease;
      return { outcome: { accepted: true } };
    },
  };
  const definition: MicroSystemDefinition = {
    microSystemId: durableLifecycleTarget.microSystemId,
    role: "system-service",
    generation: {
      productGenerationId: durableLifecycleTarget.productGenerationId,
      packageGenerationId: durableLifecycleTarget.packageGenerationId,
    },
    operatingModes: allOperatingModes,
    serviceRequirements: [],
    capabilityRequirements: [],
    serviceProvisions: [],
    capabilityProvisions: [],
    workHandlerProvisions: [durableLifecycleDescriptor],
    activate: async (context) => {
      context.publishWorkHandler(durableLifecycleDescriptor, handler);
    },
  };
  const terminalFailures: unknown[] = [];
  const supervisor = new MicroSystemSupervisor({
    substrate: createRuntimeSubstrate({ settleTimeoutMs }),
    settleTimeoutMs,
    definitions: [definition],
    lifecycleLineage,
    rootRuntimeOrigin: { productGenerationId: durableLifecycleProductGeneration },
    ownerLifecycle: {
      signal: bootResult.host.signal,
      onTerminalFailure: (error) => terminalFailures.push(error),
    },
  });
  await supervisor.reconcile(desired([definition]));
  const signal = createPostgresSignalService(bootResult.host.persistence, {
    connectionTimeoutMs: 10_000,
    reconnectBaseDelayMs: 25,
    reconnectMaxDelayMs: 200,
    onBackgroundError() {},
  });
  const repository = createWorkQueueRepository(persistence);
  const admission: WorkAdmissionPort = {
    beforeCreate: async () => ({ decision: "ALLOW" }),
    beforeDispatch: async () => ({ decision: "ALLOW" }),
  };
  const classifier: WorkErrorClassifier = {
    classify: () => ({
      kind: "TERMINAL",
      retryClass: "permanent",
      reasonCode: "runtime-lifecycle-handler-failure",
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
    profiles: durableLifecycleProfiles,
    runtimeOptions: durableLifecycleWorkOptions,
    onBackgroundError() {},
  });
  const executor = createWorkAttemptExecutor({
    repository,
    handlerRegistry: supervisor.workHandlers,
    execution: runtime,
    lineage,
    time,
    classifier,
    runtimeOptions: durableLifecycleWorkOptions,
  });
  const durable = createDurableExecutionRuntime(
    bootResult.host.durableExecution,
    durableLifecycleOptions(options.shutdownDrainTimeoutMs ?? 10_000),
    executor,
  );
  const durableInspection = createDbosAttemptInspectionPort({
    durableCodeVersion: durableLifecycleCodeVersion,
  });
  const recovery = createWorkQueueRecoveryCoordinator({
    repository,
    durableInspection,
    onBackgroundError() {},
    batchSize: durableLifecycleWorkOptions.reconciliationBatchSize,
  });
  const durableDispatch = createDurableDispatchPort({
    authority: bootResult.host.durableExecution,
    lifecycle: durable,
    durableCodeVersion: durableLifecycleCodeVersion,
    profiles: durableLifecycleProfiles,
    now: () => time.now(),
  });
  const reconciler = createWorkQueueReconciler({
    repository,
    durableDispatch,
    handlerRegistry: supervisor.workHandlers,
    admission,
    signal,
    execution: runtime,
    time,
    runtimeOptions: durableLifecycleWorkOptions,
    recovery,
    onBackgroundError() {},
  });
  return {
    bootResult,
    runtime,
    persistence,
    supervisor,
    signal,
    repository,
    work,
    executor,
    durable,
    durableDispatch,
    reconciler,
    handlerStarted,
    handlerInvocations,
    releaseHandler,
  };
}

async function closeDurableLifecycleComposition(
  composition: DurableLifecycleComposition,
): Promise<void> {
  composition.releaseHandler();
  await composition.reconciler.stop().catch(() => undefined);
  await composition.durable.close().catch(() => undefined);
  await composition.supervisor.close().catch(() => undefined);
  await composition.persistence.close().catch(() => undefined);
  await stopManagedHostWithoutRuntime(composition.bootResult.host).catch(
    () => undefined,
  );
}

async function createDurableLifecycleWork(composition: DurableLifecycleComposition) {
  return composition.runtime.runActivity(
    {
      kind: "runtime-lifecycle.work.create",
      importance: "significant",
      retentionClass: "operational",
      sensitivity: "operational",
    },
    () =>
      composition.work.create({
        target: durableLifecycleTarget,
        payload: { value: "runtime-lifecycle" },
        queueProfileId: durableLifecycleQueueProfileId,
        resourceAdmissionClass: durableLifecycleResourceClass,
        priority: 100,
      }),
  );
}

async function dispatchDurableLifecycleWork(
  composition: DurableLifecycleComposition,
  item: Awaited<ReturnType<typeof createDurableLifecycleWork>>["item"],
): Promise<void> {
  await composition.durableDispatch.dispatch({
    workItemId: item.workItemId,
    dispatchRevision: item.dispatchRevision,
    dispatchAttemptId: createDispatchAttemptId(item.workItemId, item.dispatchRevision),
    queueProfileId: item.queueProfileId,
    priority: item.priority,
  });
}

async function waitForDurableLifecycleState(
  composition: DurableLifecycleComposition,
  workItemId: Awaited<
    ReturnType<typeof createDurableLifecycleWork>
  >["item"]["workItemId"],
  state: "PENDING" | "RUNNING" | "SUCCEEDED",
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await composition.repository.getWorkItem(workItemId))?.state === state) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`WorkItem did not reach ${state} before the test timeout`);
}

async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("durable lifecycle condition was not reached before timeout");
}

async function durablePoolBackendCount(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
): Promise<number> {
  const result = await queryAs(
    fixture,
    "heptalogos_bootstrap",
    BOOTSTRAP_PASSWORD,
    `SELECT count(*)::integer AS count
       FROM pg_stat_activity
      WHERE application_name = 'heptalogos-durable-execution'`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

describePostgres.sequential("Runtime and authentic DurableExecution lifecycle", () => {
  it("Q1 drains DurableExecution before reverse Host handoff and PostgreSQL stop", async () => {
    const fixture = await makeFixture();
    const composition = await createDurableLifecycleComposition(fixture);
    const events: string[] = [];
    try {
      await composition.durable.start();
      const created = await createDurableLifecycleWork(composition);
      expect(created.item.state).toBe("PENDING");
      const maintenance =
        await composition.bootResult.host.preparePrivatePostgresMaintenance({
          kind: "STOP_PRIVATE_POSTGRES",
        });
      await expect(
        maintenance.execute({
          async quiesce() {
            await composition.reconciler.stop();
            events.push("workqueue.reconciliation.stopped");
            const durableQuiesce = composition.durable.quiesce();
            events.push("durable.admission.closed");
            await durableQuiesce;
            events.push("dbos.drain.completed");
            expect(composition.durable.state).toBe("QUIESCED");
            expect(await durablePoolBackendCount(fixture)).toBe(0);
            events.push("dbos.pool.closed");
            await composition.supervisor.close();
            events.push("runtime-kernel.quiesced");
            await composition.persistence.close();
            events.push("persistence.closed");
            return { async resumeAfterAbort() {} };
          },
        }),
      ).resolves.toEqual({ kind: "STOPPED" });
      expect(events).toEqual([
        "workqueue.reconciliation.stopped",
        "durable.admission.closed",
        "dbos.drain.completed",
        "dbos.pool.closed",
        "runtime-kernel.quiesced",
        "persistence.closed",
      ]);
      expect(composition.bootResult.host.state).toBe("CLOSED");
      expect(composition.handlerInvocations).toHaveLength(0);
      await expect(
        queryAs(fixture, "heptalogos_bootstrap", BOOTSTRAP_PASSWORD, "SELECT 1"),
      ).rejects.toBeDefined();
    } finally {
      await closeDurableLifecycleComposition(composition);
      await cleanupCanonicalPostgresFixtures();
    }
  }, 240_000);

  it("Q2 lets an in-flight DBOS step settle before final Runtime quiescence", async () => {
    const fixture = await makeFixture();
    const composition = await createDurableLifecycleComposition(fixture, {
      blockHandler: true,
    });
    try {
      await composition.durable.start();
      await composition.reconciler.start();
      const created = await createDurableLifecycleWork(composition);
      await composition.reconciler.start();
      await dispatchDurableLifecycleWork(composition, created.item);
      await composition.handlerStarted;
      expect(
        (await composition.repository.getWorkItem(created.item.workItemId))?.state,
      ).toBe("RUNNING");
      const durableQuiesce = composition.durable.quiesce();
      expect(composition.durable.state).toBe("QUIESCING");
      composition.releaseHandler();
      await waitForDurableLifecycleState(
        composition,
        created.item.workItemId,
        "SUCCEEDED",
      );
      await durableQuiesce;
      expect(composition.durable.state).toBe("QUIESCED");
      expect(composition.handlerInvocations).toHaveLength(1);
      await composition.supervisor.quiesce();
    } finally {
      await closeDurableLifecycleComposition(composition);
      await cleanupCanonicalPostgresFixtures();
    }
  }, 240_000);

  it("Q3 aborts before maintenance entry and relaunches the same DBOS registration", async () => {
    const fixture = await makeFixture();
    const composition = await createDurableLifecycleComposition(fixture);
    try {
      await composition.durable.start();
      await composition.reconciler.start();
      await composition.reconciler.stop();
      await composition.durable.quiesce();
      expect(composition.durable.state).toBe("QUIESCED");
      const maintenance =
        await composition.bootResult.host.preparePrivatePostgresMaintenance({
          kind: "STOP_PRIVATE_POSTGRES",
        });
      await maintenance.abortBeforeEntry();
      expect(composition.bootResult.host.state).toBe("ACTIVE");
      await composition.durable.resume();
      expect(composition.durable.state).toBe("OPEN");
      await composition.reconciler.start();
      const created = await createDurableLifecycleWork(composition);
      await dispatchDurableLifecycleWork(composition, created.item);
      await waitForDurableLifecycleState(
        composition,
        created.item.workItemId,
        "SUCCEEDED",
      );
      await expect(
        queryAs(fixture, "heptalogos_bootstrap", BOOTSTRAP_PASSWORD, "SELECT 1"),
      ).resolves.toMatchObject({ rows: [{ "?column?": 1 }] });
    } finally {
      await closeDurableLifecycleComposition(composition);
      await cleanupCanonicalPostgresFixtures();
    }
  }, 240_000);

  it("Q4 fences dispatch and old handler leases after authentic Host loss", async () => {
    const fixture = await makeFixture();
    const composition = await createDurableLifecycleComposition(fixture);
    try {
      await composition.durable.start();
      const created = await createDurableLifecycleWork(composition);
      const oldLease =
        composition.supervisor.workHandlers.resolve(durableLifecycleTarget);
      expect(oldLease).toBeDefined();
      await terminateAuthenticHost(fixture, composition.bootResult.host);
      await waitForCondition(() => composition.durable.state === "CLOSED");
      await expect(
        dispatchDurableLifecycleWork(composition, created.item),
      ).rejects.toBeDefined();
      await composition.supervisor.close();
      expect(() => oldLease!.reserveInvocation()).toThrow();
    } finally {
      await closeDurableLifecycleComposition(composition);
      await cleanupCanonicalPostgresFixtures();
    }
  }, 240_000);

  it("Q5 refuses Host success when the bounded DBOS drain fails", async () => {
    const fixture = await makeFixture();
    const composition = await createDurableLifecycleComposition(fixture, {
      blockHandler: true,
      shutdownDrainTimeoutMs: 100,
    });
    try {
      await composition.durable.start();
      await composition.reconciler.start();
      const created = await createDurableLifecycleWork(composition);
      await dispatchDurableLifecycleWork(composition, created.item);
      await composition.handlerStarted;
      const maintenance =
        await composition.bootResult.host.preparePrivatePostgresMaintenance({
          kind: "STOP_PRIVATE_POSTGRES",
        });
      await expect(
        maintenance.execute({
          async quiesce() {
            await composition.reconciler.stop();
            await composition.durable.quiesce();
            return { async resumeAfterAbort() {} };
          },
        }),
      ).rejects.toBeDefined();
      expect(composition.bootResult.host.state).toBe("ACTIVE");
      await expect(
        queryAs(fixture, "heptalogos_bootstrap", BOOTSTRAP_PASSWORD, "SELECT 1"),
      ).resolves.toMatchObject({ rows: [{ "?column?": 1 }] });
      expect(
        (await composition.repository.getWorkItem(created.item.workItemId))?.state,
      ).toBe("RUNNING");
    } finally {
      await closeDurableLifecycleComposition(composition);
      await cleanupCanonicalPostgresFixtures();
    }
  }, 240_000);
});
