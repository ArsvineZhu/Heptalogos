import { afterEach, describe, expect, it } from "vitest";
import {
  asContentDigest,
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
import { openPrivatePostgresMaintenanceController } from "@heptalogos/private-postgres";
import {
  createContractVersion,
  createRuntimeLifecycleLineage,
  exactContract,
  MicroSystemSupervisor,
  type MicroSystemDefinition,
  type RuntimeQuiescenceLease,
  type ServiceProvisionDescriptor,
  type ServiceLease,
} from "@heptalogos/runtime-kernel";
import {
  BOOTSTRAP_PASSWORD,
  boot,
  cleanupCanonicalPostgresFixtures,
  describeRealPostgres,
  makeFixture,
  queryAs,
  stopManagedHostWithoutRuntime,
  type BootResult,
} from "./test-support/canonical-postgres.js";
import type { HostMaintenanceQuiescence } from "./managed-host.js";
import { acquireBootstrapOwnership } from "./bootstrap-ownership.js";
import { prepareBootstrapPrelude } from "./bootstrap-prelude.js";
import { getPrivatePostgresMaintenanceDescriptor } from "./private-postgres-bootstrap.js";

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
