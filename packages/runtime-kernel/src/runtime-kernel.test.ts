import { describe, expect, it } from "vitest";
import {
  asContentDigest,
  createCapabilityId,
  createMicroSystemId,
  createProviderId,
  createServiceId,
  digestCanonicalJson,
  type CapabilityId,
  type MicroSystemId,
  type ProviderId,
  type ServiceId,
} from "@heptalogos/foundation-contracts";
import type { ActivityRequest } from "@heptalogos/execution-lineage";
import type { RuntimeActivityRunner } from "@heptalogos/execution-lineage/runtime-kernel";
import {
  CapabilityRegistry,
  createContractVersion,
  createGenerationFence,
  exactContract,
  evaluateReadiness,
  RuntimeGraph,
  runtimeKernelProblem,
  ServiceRegistry,
  type CapabilityProvisionDescriptor,
  type CapabilityRequirement,
  type MicroSystemDefinition,
  type ServiceProvisionDescriptor,
  type ServiceRequirement,
} from "./index.js";
import { ProblemError } from "@heptalogos/foundation-contracts";

const contractV1 = createContractVersion("v1");
const contractV2 = createContractVersion("v2");
const generation = {
  productGenerationId: asContentDigest(
    "ProductGenerationId",
    digestCanonicalJson("runtime-kernel/test-generation/v1", { id: "test" }),
  ),
};

function serviceRequirement(serviceId: ServiceId): ServiceRequirement {
  return { serviceId, contract: exactContract(contractV1) };
}

function capabilityRequirement(
  capabilityId: CapabilityId,
  required: boolean,
): CapabilityRequirement {
  return { capabilityId, contract: exactContract(contractV1), required };
}

function serviceProvision(
  serviceId: ServiceId,
  providerId: ProviderId,
  contractVersion: typeof contractV1 = contractV1,
): ServiceProvisionDescriptor {
  return { serviceId, providerId, contractVersion };
}

function capabilityProvision(
  capabilityId: CapabilityId,
  providerId: ProviderId,
  priority = 0,
): CapabilityProvisionDescriptor {
  return { capabilityId, providerId, contractVersion: contractV1, priority };
}

function recordingActivityRunner(requests: ActivityRequest[]): RuntimeActivityRunner {
  return {
    current: () => undefined,
    runActivity: async <T>(
      request: ActivityRequest,
      operation: (context: never) => Promise<T>,
    ) => {
      requests.push(request);
      return operation(undefined as never);
    },
  };
}

function definition(
  microSystemId: MicroSystemId,
  options: Partial<
    Pick<
      MicroSystemDefinition,
      | "serviceRequirements"
      | "serviceProvisions"
      | "capabilityRequirements"
      | "capabilityProvisions"
    >
  > = {},
): MicroSystemDefinition {
  return {
    microSystemId,
    role: "provider",
    generation,
    operatingModes: ["NORMAL", "SAFE", "MAINTENANCE", "EMERGENCY_READ_ONLY"],
    serviceRequirements: options.serviceRequirements ?? [],
    capabilityRequirements: options.capabilityRequirements ?? [],
    serviceProvisions: options.serviceProvisions ?? [],
    capabilityProvisions: options.capabilityProvisions ?? [],
    activate: async () => undefined,
  };
}

function deferred<T>(): {
  readonly promise: Promise<T>;
  resolve(value: T): void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

describe("RuntimeKernel contract compatibility and Service registry", () => {
  it("uses the canonical ProblemError contract for stable runtime failures", () => {
    const error = runtimeKernelProblem(
      "runtime.generation.retired",
      "provider retired",
    );
    expect(error).toBeInstanceOf(ProblemError);
    expect(error.constructor).toBe(ProblemError);
    expect(error.name).toBe("ProblemError");
    expect(error.problem).toMatchObject({
      schemaVersion: 1,
      problemCode: "runtime.generation.retired",
      category: "conflict",
      retryClass: "after-change",
    });
  });

  it("S1 binds one eligible Service provider", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.service");
    const providerId = createProviderId("provider.a");
    registry.register(serviceProvision(serviceId, providerId), {
      read: () => "A",
    });
    const lease = registry.resolve<{ read(): string }>(serviceRequirement(serviceId));
    expect(lease.providerId).toBe(providerId);
    await expect(lease.invoke("read", (service) => service.read())).resolves.toBe("A");
  });

  it("S2 blocks a hard Service with no provider", () => {
    const registry = new ServiceRegistry();
    const requirement = serviceRequirement(createServiceId("test.missing"));
    expect(() => registry.resolve(requirement)).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({ problemCode: "runtime.service.missing" }),
      }),
    );
  });

  it("S3 rejects ambiguous providers without using registration order", () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.ambiguous");
    registry.register(serviceProvision(serviceId, createProviderId("provider.b")), {});
    registry.register(serviceProvision(serviceId, createProviderId("provider.a")), {});
    expect(() => registry.resolve(serviceRequirement(serviceId))).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({
          problemCode: "runtime.service.ambiguous_provider",
        }),
      }),
    );
  });

  it("S4 lets an explicit eligible provider win", () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.explicit");
    const providerA = createProviderId("provider.a");
    const providerB = createProviderId("provider.b");
    registry.register(serviceProvision(serviceId, providerB), {});
    registry.register(serviceProvision(serviceId, providerA), {});
    expect(registry.resolve(serviceRequirement(serviceId), providerA).providerId).toBe(
      providerA,
    );
  });

  it("S5 fails closed for unavailable explicit Service binding", () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.explicit-unavailable");
    registry.register(serviceProvision(serviceId, createProviderId("provider.a")), {});
    expect(() =>
      registry.resolve(
        serviceRequirement(serviceId),
        createProviderId("provider.missing"),
      ),
    ).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({
          problemCode: "runtime.service.explicit_unavailable",
        }),
      }),
    );
  });

  it("S6 retires a Service binding and rejects new lease calls", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.retire");
    const providerId = createProviderId("provider.retiring");
    registry.register(serviceProvision(serviceId, providerId), {
      read: () => "retiring",
    });
    const lease = registry.resolve<{ read(): string }>(serviceRequirement(serviceId));
    await registry.retireProvider(providerId, 50);
    await expect(
      lease.invoke("read", (service) => service.read()),
    ).rejects.toMatchObject({
      problem: { problemCode: "runtime.generation.retired" },
    });
  });

  it("S7 allows an in-flight Service call to settle before retirement", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.in-flight");
    const providerId = createProviderId("provider.in-flight");
    const started = deferred<void>();
    const released = deferred<string>();
    registry.register(serviceProvision(serviceId, providerId), {
      async read() {
        started.resolve();
        return released.promise;
      },
    });
    const lease = registry.resolve<{ read(): Promise<string> }>(
      serviceRequirement(serviceId),
    );
    const call = lease.invoke("read", (service) => service.read());
    await started.promise;
    const retirement = registry.retireProvider(providerId, 100);
    released.resolve("settled");
    await expect(call).resolves.toBe("settled");
    await expect(retirement).resolves.toBeUndefined();
  });

  it("S8 reports GenerationFence settlement timeout", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.timeout");
    const providerId = createProviderId("provider.timeout");
    const released = deferred<string>();
    registry.register(serviceProvision(serviceId, providerId), {
      async read() {
        return released.promise;
      },
    });
    const lease = registry.resolve<{ read(): Promise<string> }>(
      serviceRequirement(serviceId),
    );
    const call = lease.invoke("read", (service) => service.read());
    await Promise.resolve();
    await expect(registry.retireProvider(providerId, 5)).rejects.toMatchObject({
      problem: { problemCode: "runtime.generation.settlement_timeout" },
    });
    released.resolve("late");
    await call;
  });

  it("keeps a timed-out generation RETIRING until its call settles", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.timeout-state");
    const providerId = createProviderId("provider.timeout-state");
    const released = deferred<string>();
    const fence = registry.register(serviceProvision(serviceId, providerId), {
      async read() {
        return released.promise;
      },
    });
    const lease = registry.resolve<{ read(): Promise<string> }>(
      serviceRequirement(serviceId),
    );
    const call = lease.invoke("read", (service) => service.read());
    await Promise.resolve();

    await expect(registry.retireProvider(providerId, 5)).rejects.toMatchObject({
      problem: { problemCode: "runtime.generation.settlement_timeout" },
    });
    expect(fence.state).toBe("RETIRING");

    released.resolve("late");
    await expect(call).resolves.toBe("late");
    expect(fence.state).toBe("RETIRED");
  });

  it("S9 retained fenced Proxy cannot call after retirement", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.proxy");
    const providerId = createProviderId("provider.proxy");
    registry.register(serviceProvision(serviceId, providerId), {
      read: () => "proxy",
    });
    const lease = registry.resolve<{ read(): Promise<string> }>(
      serviceRequirement(serviceId),
    );
    let retained: { read(): Promise<string> } | undefined;
    await lease.invoke("capture", (service) => {
      retained = service;
    });
    await registry.retireProvider(providerId, 50);
    expect(() => retained!.read()).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({ problemCode: "runtime.generation.retired" }),
      }),
    );
  });

  it("lets an admitted provider call drain through the real provider identity", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.nested-proxy");
    const providerId = createProviderId("provider.nested-proxy");
    const started = deferred<void>();
    const released = deferred<void>();
    registry.register(serviceProvision(serviceId, providerId), {
      async read() {
        started.resolve();
        await released.promise;
        return this.nested();
      },
      nested() {
        return "nested";
      },
    });
    const lease = registry.resolve<{ read(): Promise<string> }>(
      serviceRequirement(serviceId),
    );
    const call = lease.invoke("read", (service) => service.read());
    await started.promise;
    const retirement = registry.retireProvider(providerId, 50);
    released.resolve();
    await expect(call).resolves.toBe("nested");
    await expect(retirement).resolves.toBeUndefined();
  });

  it("F1 preserves synchronous Service method return semantics", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.sync-service");
    const providerId = createProviderId("provider.sync-service");
    registry.register(serviceProvision(serviceId, providerId), {
      now: () => "sync",
    });
    const lease = registry.resolve<{ now(): string }>(serviceRequirement(serviceId));
    let observed: unknown;
    await lease.invoke("capture", (service) => {
      observed = service.now();
      return service.now().toUpperCase();
    });
    expect(observed).toBe("sync");
  });

  it("F2 preserves synchronous Capability method return semantics", async () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.sync-capability");
    const providerId = createProviderId("provider.sync-capability");
    registry.register(capabilityProvision(capabilityId, providerId), {
      now: () => "sync",
    });
    const lease = registry.resolve<{ now(): string }>(
      capabilityRequirement(capabilityId, true),
    );
    let observed: unknown;
    await lease!.invoke("capture", (capability) => {
      observed = capability.now();
      return capability.now().toUpperCase();
    });
    expect(observed).toBe("sync");
  });

  it("F3 fences objects returned by provider methods after retirement", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.returned-object");
    const providerId = createProviderId("provider.returned-object");
    registry.register(serviceProvision(serviceId, providerId), {
      getSession: () => ({ read: () => "session" }),
    });
    const lease = registry.resolve<{
      getSession(): { read(): string };
    }>(serviceRequirement(serviceId));
    let session!: { read(): string };
    await lease.invoke("capture", (service) => {
      session = service.getSession();
    });
    await registry.retireProvider(providerId, 50);
    expect(() => session.read()).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({ problemCode: "runtime.generation.retired" }),
      }),
    );
  });

  it("F4 fences retained nested Service objects after retirement", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.retained-nested-object");
    const providerId = createProviderId("provider.retained-nested-object");
    registry.register(serviceProvision(serviceId, providerId), {
      session: { read: () => "session" },
    });
    const lease = registry.resolve<{
      readonly session: { read(): string };
    }>(serviceRequirement(serviceId));
    let session!: { read(): string };
    await lease.invoke("capture", (service) => {
      session = service.session;
    });
    await registry.retireProvider(providerId, 50);
    expect(() => session.read()).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({ problemCode: "runtime.generation.retired" }),
      }),
    );
  });

  it("preserves provider identity for private fields and native internal slots", async () => {
    class PrivateClient {
      #state = "ok";
      #date = new Date(0);

      read(): string {
        return `${this.#state}:${this.#date.getTime()}`;
      }
    }

    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.class-provider");
    const providerId = createProviderId("provider.class-provider");
    registry.register(serviceProvision(serviceId, providerId), new PrivateClient());
    const lease = registry.resolve<{ read(): string }>(serviceRequirement(serviceId));

    await expect(lease.invoke("read", (service) => service.read())).resolves.toBe(
      "ok:0",
    );
  });

  it("fences retained provider property mutation after retirement", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.mutable-provider");
    const providerId = createProviderId("provider.mutable-provider");
    registry.register(serviceProvision(serviceId, providerId), { value: 0 });
    const lease = registry.resolve<{ value: number }>(serviceRequirement(serviceId));
    let retained!: { value: number };
    await lease.invoke("capture", (service) => {
      retained = service;
    });

    await registry.retireProvider(providerId, 50);
    expect(() => {
      retained.value = 1;
    }).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({
          problemCode: "runtime.generation.retired",
        }),
      }),
    );
  });

  it("S11 records transient Service call Activity semantics", async () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.activity-service");
    const providerId = createProviderId("provider.activity-service");
    const requests: ActivityRequest[] = [];
    registry.register(
      serviceProvision(serviceId, providerId),
      { read: () => "activity" },
      createGenerationFence(),
      recordingActivityRunner(requests),
    );
    const lease = registry.resolve<{ read(): string }>(serviceRequirement(serviceId));
    await expect(lease.invoke("read", (service) => service.read())).resolves.toBe(
      "activity",
    );
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      kind: "service.call",
      importance: "routine",
      retentionClass: "ephemeral",
      sensitivity: "operational",
      semantic: {
        operationId: "read",
        serviceId,
        providerId,
        contractVersion: contractV1,
      },
    });
  });
});

describe("Capability registry and readiness", () => {
  it("allows one provider to expose multiple Service bindings", () => {
    const registry = new ServiceRegistry();
    const providerId = createProviderId("provider.multi-service");
    const serviceA = createServiceId("test.multi-service.a");
    const serviceB = createServiceId("test.multi-service.b");
    registry.register(serviceProvision(serviceA, providerId), { read: () => "a" });
    registry.register(serviceProvision(serviceB, providerId), { read: () => "b" });
    expect(registry.providerIds(serviceA)).toEqual([providerId]);
    expect(registry.providerIds(serviceB)).toEqual([providerId]);
  });

  it("allows one provider to expose multiple Capability bindings", () => {
    const registry = new CapabilityRegistry();
    const providerId = createProviderId("provider.multi-capability");
    const capabilityA = createCapabilityId("test.multi-capability.a");
    const capabilityB = createCapabilityId("test.multi-capability.b");
    registry.register(capabilityProvision(capabilityA, providerId), {});
    registry.register(capabilityProvision(capabilityB, providerId), {});
    expect(registry.providerIds(capabilityA)).toEqual([providerId]);
    expect(registry.providerIds(capabilityB)).toEqual([providerId]);
  });

  it("retires every Service and Capability binding owned by one provider", async () => {
    const providerId = createProviderId("provider.multi-binding-retire");
    const serviceRegistry = new ServiceRegistry();
    const serviceA = createServiceId("test.retire.service.a");
    const serviceB = createServiceId("test.retire.service.b");
    serviceRegistry.register(serviceProvision(serviceA, providerId), {});
    serviceRegistry.register(serviceProvision(serviceB, providerId), {});
    await serviceRegistry.retireProvider(providerId, 50);
    expect(serviceRegistry.providerIds(serviceA)).toEqual([]);
    expect(serviceRegistry.providerIds(serviceB)).toEqual([]);

    const capabilityRegistry = new CapabilityRegistry();
    const capabilityA = createCapabilityId("test.retire.capability.a");
    const capabilityB = createCapabilityId("test.retire.capability.b");
    capabilityRegistry.register(capabilityProvision(capabilityA, providerId), {});
    capabilityRegistry.register(capabilityProvision(capabilityB, providerId), {});
    await capabilityRegistry.retireProvider(providerId, 50);
    expect(capabilityRegistry.providerIds(capabilityA)).toEqual([]);
    expect(capabilityRegistry.providerIds(capabilityB)).toEqual([]);
  });

  it("uses static descriptor priority for Capability selection", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.static-priority");
    const low = createProviderId("provider.a");
    const high = createProviderId("provider.z");
    registry.register(capabilityProvision(capabilityId, low, 1), {});
    registry.register(capabilityProvision(capabilityId, high, 10), {});
    expect(
      registry.resolve(capabilityRequirement(capabilityId, true))?.providerId,
    ).toBe(high);
  });

  it("K1 selects the highest-priority eligible Capability provider", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.capability");
    const low = createProviderId("provider.low");
    const high = createProviderId("provider.high");
    registry.register(capabilityProvision(capabilityId, low, 1), {});
    registry.register(capabilityProvision(capabilityId, high, 10), {});
    expect(
      registry.resolve(capabilityRequirement(capabilityId, true))?.providerId,
    ).toBe(high);
  });

  it("K2 uses lexical ProviderId order for equal Capability priority", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.tie");
    const providerA = createProviderId("provider.a");
    const providerB = createProviderId("provider.b");
    registry.register(capabilityProvision(capabilityId, providerB, 1), {});
    registry.register(capabilityProvision(capabilityId, providerA, 1), {});
    expect(
      registry.resolve(capabilityRequirement(capabilityId, true))?.providerId,
    ).toBe(providerA);
  });

  it("K3 explicit eligible Capability binding wins", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.explicit");
    const providerA = createProviderId("provider.a");
    const providerB = createProviderId("provider.b");
    registry.register(capabilityProvision(capabilityId, providerA, 10), {});
    registry.register(capabilityProvision(capabilityId, providerB, 1), {});
    expect(
      registry.resolve(capabilityRequirement(capabilityId, true), providerB)
        ?.providerId,
    ).toBe(providerB);
  });

  it("K4 unavailable explicit Capability binding never silently falls back", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.explicit-unavailable");
    registry.register(
      capabilityProvision(capabilityId, createProviderId("provider.available"), 10),
      {},
    );
    expect(() =>
      registry.resolve(
        capabilityRequirement(capabilityId, false),
        createProviderId("provider.missing"),
      ),
    ).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({
          problemCode: "runtime.capability.explicit_unavailable",
        }),
      }),
    );
  });

  it("returns unavailable for a missing required Capability without throwing", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.required-missing");

    expect(registry.resolve(capabilityRequirement(capabilityId, true))).toBeUndefined();
  });

  it("K5 withdrawal selects the next eligible Capability provider", async () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.withdrawal");
    const high = createProviderId("provider.high");
    const low = createProviderId("provider.low");
    registry.register(capabilityProvision(capabilityId, high, 10), {});
    registry.register(capabilityProvision(capabilityId, low, 1), {});
    await registry.retireProvider(high, 50);
    expect(
      registry.resolve(capabilityRequirement(capabilityId, true))?.providerId,
    ).toBe(low);
  });

  it("K6 Capability changes do not create RuntimeGraph hard edges", () => {
    const capabilityId = createCapabilityId("test.dynamic");
    const a = definition(createMicroSystemId("system.a"), {
      capabilityRequirements: [capabilityRequirement(capabilityId, false)],
    });
    const b = definition(createMicroSystemId("system.b"));
    const plan = new RuntimeGraph([a, b]).plan();
    expect(plan.edges).toEqual([]);
    expect(plan.startOrder).toHaveLength(2);
  });

  it("lets an admitted Capability call drain through the real provider identity", async () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.nested-proxy");
    const providerId = createProviderId("provider.nested-proxy");
    const started = deferred<void>();
    const released = deferred<void>();
    registry.register(capabilityProvision(capabilityId, providerId), {
      async read() {
        started.resolve();
        await released.promise;
        return this.nested();
      },
      nested() {
        return "nested";
      },
    });
    const lease = registry.resolve<{ read(): Promise<string> }>(
      capabilityRequirement(capabilityId, true),
    );
    const call = lease!.invoke("read", (capability) => capability.read());
    await started.promise;
    const retirement = registry.retireProvider(providerId, 50);
    released.resolve();
    await expect(call).resolves.toBe("nested");
    await expect(retirement).resolves.toBeUndefined();
  });

  it("K8 fences retained nested Capability objects after retirement", async () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.nested-object-proxy");
    const providerId = createProviderId("provider.nested-object-proxy");
    registry.register(capabilityProvision(capabilityId, providerId), {
      nested: {
        read() {
          return "nested";
        },
      },
    });
    const lease = registry.resolve<{
      nested: { read(): string };
    }>(capabilityRequirement(capabilityId, true));
    let retained: { read(): string } | undefined;
    await lease!.invoke("capture", (capability) => {
      retained = capability.nested;
    });
    await registry.retireProvider(providerId, 50);
    expect(() => retained!.read()).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({ problemCode: "runtime.generation.retired" }),
      }),
    );
  });

  it("K9 records transient Capability invoke Activity semantics", async () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.activity-capability");
    const providerId = createProviderId("provider.activity-capability");
    const requests: ActivityRequest[] = [];
    registry.register(
      capabilityProvision(capabilityId, providerId, 0),
      { read: () => "activity" },
      createGenerationFence(),
      recordingActivityRunner(requests),
    );
    const lease = registry.resolve<{ read(): string }>(
      capabilityRequirement(capabilityId, true),
    );
    await expect(
      lease!.invoke("read", (capability) => capability.read()),
    ).resolves.toBe("activity");
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      kind: "capability.invoke",
      importance: "routine",
      retentionClass: "ephemeral",
      sensitivity: "operational",
      semantic: {
        operationId: "read",
        capabilityId,
        providerId,
        contractVersion: contractV1,
      },
    });
  });

  it("computes BLOCKED, DEGRADED, and READY independently of Actual State", () => {
    const services = new ServiceRegistry();
    const capabilities = new CapabilityRegistry();
    const serviceId = createServiceId("test.readiness-service");
    const capabilityId = createCapabilityId("test.readiness-capability");
    const profile = {
      profileId: "test.profile",
      requiredServices: [serviceRequirement(serviceId)],
      requiredCapabilities: [],
      optionalCapabilities: [capabilityRequirement(capabilityId, false)],
    };
    expect(evaluateReadiness(profile, services, capabilities).state).toBe("BLOCKED");
    services.register(
      serviceProvision(serviceId, createProviderId("provider.service")),
      {},
    );
    expect(evaluateReadiness(profile, services, capabilities).state).toBe("DEGRADED");
    capabilities.register(
      capabilityProvision(capabilityId, createProviderId("provider.capability")),
      {},
    );
    expect(evaluateReadiness(profile, services, capabilities).state).toBe("READY");
  });
});

describe("RuntimeGraph", () => {
  it("orders hard Service providers before consumers and keeps independent branches", () => {
    const serviceId = createServiceId("test.graph-service");
    const providerA = createProviderId("provider.a");
    const providerD = createProviderId("provider.d");
    const a = definition(createMicroSystemId("system.a"), {
      serviceProvisions: [serviceProvision(serviceId, providerA)],
    });
    const b = definition(createMicroSystemId("system.b"), {
      serviceRequirements: [serviceRequirement(serviceId)],
    });
    const c = definition(createMicroSystemId("system.c"));
    const d = definition(createMicroSystemId("system.d"), {
      serviceProvisions: [serviceProvision(serviceId, providerD)],
    });
    const plan = new RuntimeGraph(
      [a, b, c, d],
      new Map([[serviceId, providerD]]),
    ).plan();
    const order = plan.startOrder.map((item) => item.microSystemId);
    expect(order.indexOf(d.microSystemId)).toBeLessThan(order.indexOf(b.microSystemId));
    const shutdownOrder = plan.shutdownOrder.map((item) => item.microSystemId);
    expect(shutdownOrder.indexOf(b.microSystemId)).toBeLessThan(
      shutdownOrder.indexOf(d.microSystemId),
    );
    expect(plan.edges).toMatchObject([{ provider: d, consumer: b, serviceId }]);
  });

  it("rejects a hard Service cycle before activation", () => {
    const x = createServiceId("test.x");
    const y = createServiceId("test.y");
    const a = definition(createMicroSystemId("system.a"), {
      serviceRequirements: [serviceRequirement(y)],
      serviceProvisions: [serviceProvision(x, createProviderId("provider.a"))],
    });
    const b = definition(createMicroSystemId("system.b"), {
      serviceRequirements: [serviceRequirement(x)],
      serviceProvisions: [serviceProvision(y, createProviderId("provider.b"))],
    });
    expect(() => new RuntimeGraph([a, b]).plan()).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({
          problemCode: "runtime.graph.hard_service_cycle",
        }),
      }),
    );
  });

  it("counts eligible Service bindings rather than MicroSystems for ambiguity", () => {
    const serviceId = createServiceId("test.binding-ambiguity");
    const provider = definition(createMicroSystemId("system.one-provider"), {
      serviceProvisions: [
        serviceProvision(serviceId, createProviderId("provider.a")),
        serviceProvision(serviceId, createProviderId("provider.b")),
      ],
    });
    const consumer = definition(createMicroSystemId("system.consumer"), {
      serviceRequirements: [serviceRequirement(serviceId)],
    });

    expect(() => new RuntimeGraph([provider, consumer]).plan()).toThrow(
      expect.objectContaining({
        problem: expect.objectContaining({
          problemCode: "runtime.service.ambiguous_provider",
        }),
      }),
    );
  });

  it("carries the exact selected Service binding through a graph edge", () => {
    const serviceId = createServiceId("test.binding-edge");
    const providerB = createProviderId("provider.binding-b");
    const provider = definition(createMicroSystemId("system.binding-provider"), {
      serviceProvisions: [
        serviceProvision(serviceId, createProviderId("provider.binding-a")),
        serviceProvision(serviceId, providerB, contractV2),
      ],
    });
    const consumer = definition(createMicroSystemId("system.binding-consumer"), {
      serviceRequirements: [{ serviceId, contract: exactContract(contractV2) }],
    });

    const plan = new RuntimeGraph([provider, consumer]).plan();

    expect(plan.edges).toContainEqual({
      provider,
      consumer,
      serviceId,
      providerId: providerB,
      contractVersion: contractV2,
    });
  });
});
