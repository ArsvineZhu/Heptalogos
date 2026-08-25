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
import {
  CapabilityRegistry,
  createContractVersion,
  exactContract,
  evaluateReadiness,
  RuntimeGraph,
  RuntimeKernelProblem,
  ServiceRegistry,
  type CapabilityProvisionDescriptor,
  type CapabilityRequirement,
  type MicroSystemDefinition,
  type ServiceProvisionDescriptor,
  type ServiceRequirement,
} from "./index.js";

const contractV1 = createContractVersion("v1");
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
): ServiceProvisionDescriptor {
  return { serviceId, providerId, contractVersion: contractV1 };
}

function capabilityProvision(
  capabilityId: CapabilityId,
  providerId: ProviderId,
): CapabilityProvisionDescriptor {
  return { capabilityId, providerId, contractVersion: contractV1 };
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
      expect.objectContaining({ problemCode: "runtime.service.missing" }),
    );
  });

  it("S3 rejects ambiguous providers without using registration order", () => {
    const registry = new ServiceRegistry();
    const serviceId = createServiceId("test.ambiguous");
    registry.register(serviceProvision(serviceId, createProviderId("provider.b")), {});
    registry.register(serviceProvision(serviceId, createProviderId("provider.a")), {});
    expect(() => registry.resolve(serviceRequirement(serviceId))).toThrow(
      expect.objectContaining({ problemCode: "runtime.service.ambiguous_provider" }),
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
      expect.objectContaining({ problemCode: "runtime.service.explicit_unavailable" }),
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
      problemCode: "runtime.generation.retired",
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
      problemCode: "runtime.generation.settlement_timeout",
    });
    released.resolve("late");
    await call;
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
      expect.objectContaining({ problemCode: "runtime.generation.retired" }),
    );
  });

  it("S10 fences nested provider method access during retirement", async () => {
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
    await expect(call).rejects.toMatchObject({
      problemCode: "runtime.generation.retired",
    });
    await expect(retirement).resolves.toBeUndefined();
  });
});

describe("Capability registry and readiness", () => {
  it("K1 selects the highest-priority eligible Capability provider", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.capability");
    const low = createProviderId("provider.low");
    const high = createProviderId("provider.high");
    registry.register(capabilityProvision(capabilityId, low), {}, 1);
    registry.register(capabilityProvision(capabilityId, high), {}, 10);
    expect(
      registry.resolve(capabilityRequirement(capabilityId, true))?.providerId,
    ).toBe(high);
  });

  it("K2 uses lexical ProviderId order for equal Capability priority", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.tie");
    const providerA = createProviderId("provider.a");
    const providerB = createProviderId("provider.b");
    registry.register(capabilityProvision(capabilityId, providerB), {}, 1);
    registry.register(capabilityProvision(capabilityId, providerA), {}, 1);
    expect(
      registry.resolve(capabilityRequirement(capabilityId, true))?.providerId,
    ).toBe(providerA);
  });

  it("K3 explicit eligible Capability binding wins", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.explicit");
    const providerA = createProviderId("provider.a");
    const providerB = createProviderId("provider.b");
    registry.register(capabilityProvision(capabilityId, providerA), {}, 10);
    registry.register(capabilityProvision(capabilityId, providerB), {}, 1);
    expect(
      registry.resolve(capabilityRequirement(capabilityId, true), providerB)
        ?.providerId,
    ).toBe(providerB);
  });

  it("K4 unavailable explicit Capability binding never silently falls back", () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.explicit-unavailable");
    registry.register(
      capabilityProvision(capabilityId, createProviderId("provider.available")),
      {},
      10,
    );
    expect(() =>
      registry.resolve(
        capabilityRequirement(capabilityId, false),
        createProviderId("provider.missing"),
      ),
    ).toThrow(
      expect.objectContaining({
        problemCode: "runtime.capability.explicit_unavailable",
      }),
    );
  });

  it("K5 withdrawal selects the next eligible Capability provider", async () => {
    const registry = new CapabilityRegistry();
    const capabilityId = createCapabilityId("test.withdrawal");
    const high = createProviderId("provider.high");
    const low = createProviderId("provider.low");
    registry.register(capabilityProvision(capabilityId, high), {}, 10);
    registry.register(capabilityProvision(capabilityId, low), {}, 1);
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

  it("K7 fences nested Capability method access during retirement", async () => {
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
    await expect(call).rejects.toMatchObject({
      problemCode: "runtime.generation.retired",
    });
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
      expect.objectContaining({ problemCode: "runtime.generation.retired" }),
    );
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
      expect.objectContaining({ problemCode: "runtime.graph.hard_service_cycle" }),
    );
  });
});
