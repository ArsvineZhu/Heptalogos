import { describe, expect, it } from "vitest";
import {
  asContentDigest,
  createCapabilityId,
  createMicroSystemId,
  createProviderId,
  createServiceId,
  digestCanonicalJson,
  type CapabilityId,
  type ProviderId,
  type ServiceId,
} from "@heptalogos/foundation-contracts";
import {
  createRuntimeSubstrate,
  type RuntimeSubstrate,
} from "@heptalogos/runtime-substrate";
import {
  createContractVersion,
  exactContract,
  MicroSystemSupervisor,
  type RuntimeLifecycleLineage,
  type MicroSystemDesiredState,
  type MicroSystemDefinition,
  type CapabilityProvisionDescriptor,
  type CapabilityRequirement,
  type ServiceProvisionDescriptor,
} from "./index.js";

const contractV1 = createContractVersion("v1");
const contractV2 = createContractVersion("v2");
const generation = {
  productGenerationId: asContentDigest(
    "ProductGenerationId",
    digestCanonicalJson("supervisor-test-generation/v1", { id: "test" }),
  ),
};

function serviceRequirement(serviceId: ServiceId) {
  return { serviceId, contract: exactContract(contractV1) };
}

function serviceProvision(
  serviceId: ServiceId,
  providerId: ProviderId,
  contractVersion: typeof contractV1 = contractV1,
): ServiceProvisionDescriptor {
  return { serviceId, providerId, contractVersion };
}

function capabilityRequirement(
  capabilityId: CapabilityId,
  required = false,
): CapabilityRequirement {
  return { capabilityId, contract: exactContract(contractV1), required };
}

function capabilityProvision(
  capabilityId: CapabilityId,
  providerId: ProviderId,
  priority = 0,
): CapabilityProvisionDescriptor {
  return { capabilityId, providerId, contractVersion: contractV1, priority };
}

function desired(
  systems: readonly MicroSystemDefinition[],
  operatingMode: "NORMAL" | "SAFE" = "NORMAL",
  serviceBindings = new Map<ServiceId, ProviderId>(),
  capabilityBindings = new Map(),
) {
  return {
    revision: 1,
    operatingMode,
    desired: new Map<MicroSystemDefinition["microSystemId"], MicroSystemDesiredState>(
      systems.map((system) => [system.microSystemId, "RUNNING" as const]),
    ),
    serviceBindings,
    capabilityBindings,
  };
}

function system(
  id: string,
  activate: MicroSystemDefinition["activate"],
  options: Partial<
    Pick<
      MicroSystemDefinition,
      | "operatingModes"
      | "serviceRequirements"
      | "serviceProvisions"
      | "capabilityRequirements"
      | "capabilityProvisions"
    >
  > = {},
): MicroSystemDefinition {
  return {
    microSystemId: createMicroSystemId(id),
    role: "provider",
    generation,
    operatingModes: options.operatingModes ?? ["NORMAL", "SAFE"],
    serviceRequirements: options.serviceRequirements ?? [],
    capabilityRequirements: options.capabilityRequirements ?? [],
    serviceProvisions: options.serviceProvisions ?? [],
    capabilityProvisions: options.capabilityProvisions ?? [],
    activate,
  };
}

function provider(
  id: string,
  serviceId: ServiceId,
  activate: MicroSystemDefinition["activate"] = async (context) => {
    context.publishService(
      serviceProvision(serviceId, createProviderId(`provider.${id}`)),
      {
        read: () => id,
      },
    );
  },
): MicroSystemDefinition {
  const providerId = createProviderId(`provider.${id}`);
  const descriptor = serviceProvision(serviceId, providerId);
  return system(`system.${id}`, activate, { serviceProvisions: [descriptor] });
}

function consumer(
  id: string,
  serviceId: ServiceId,
  activate: MicroSystemDefinition["activate"] = async (context) => {
    const lease = context.requireService<{ read(): string }>(
      serviceRequirement(serviceId),
    );
    await lease.invoke("read", (service) => service.read());
  },
): MicroSystemDefinition {
  return system(`system.${id}`, activate, {
    serviceRequirements: [serviceRequirement(serviceId)],
  });
}

function createSupervisorWithSubstrate(
  definitions: readonly MicroSystemDefinition[],
  substrate: RuntimeSubstrate,
) {
  return new MicroSystemSupervisor({
    substrate,
    settleTimeoutMs: 50,
    definitions,
  });
}

function createSupervisor(definitions: readonly MicroSystemDefinition[]) {
  return createSupervisorWithSubstrate(
    definitions,
    createRuntimeSubstrate({ settleTimeoutMs: 50 }),
  );
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

describe("MicroSystemSupervisor and RuntimeReconciler", () => {
  it("R1 starts provider before dependent and keeps independent C running", async () => {
    const serviceId = createServiceId("test.x");
    const a = provider("a", serviceId);
    const b = consumer("b", serviceId);
    const c = system("system.c", async () => undefined);
    const supervisor = createSupervisor([a, b, c]);
    try {
      await supervisor.reconcile(desired([a, b, c]));
      expect(supervisor.getActualState(a.microSystemId)).toBe("RUNNING");
      expect(supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
      expect(supervisor.getActualState(c.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("R2 leaves a missing hard Service consumer BLOCKED", async () => {
    const b = consumer("b", createServiceId("test.missing"));
    const supervisor = createSupervisor([b]);
    try {
      const plan = await supervisor.reconcile(desired([b]));
      expect(plan.blocked.get(b.microSystemId)).toBe("runtime.service.missing");
      expect(supervisor.getActualState(b.microSystemId)).toBe("BLOCKED");
    } finally {
      await supervisor.close();
    }
  });

  it("R3 adding a provider later starts the consumer without changing Desired State", async () => {
    const serviceId = createServiceId("test.later");
    const b = consumer("b", serviceId);
    const supervisor = createSupervisor([b]);
    const firstDesired = desired([b]);
    try {
      await supervisor.reconcile(firstDesired);
      const a = provider("a", serviceId);
      supervisor.register(a);
      await supervisor.reconcile(desired([a, b]));
      expect(supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
      expect(firstDesired.desired.get(b.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("R4 replaces a hard Service provider by stopping and restarting dependents", async () => {
    const serviceId = createServiceId("test.replace");
    let bActivations = 0;
    const a = provider("a", serviceId);
    const b = consumer("b", serviceId, async (context) => {
      bActivations += 1;
      await context
        .requireService<{ read(): string }>(serviceRequirement(serviceId))
        .invoke("read", (service) => service.read());
    });
    const d = provider("d", serviceId);
    const supervisor = createSupervisor([a, b, d]);
    try {
      await supervisor.reconcile(desired([a, b]));
      const replacementPlan = await supervisor.reconcile(
        desired(
          [b, d],
          "NORMAL",
          new Map([[serviceId, createProviderId("provider.d")]]),
        ),
      );
      expect(replacementPlan.actions).toContainEqual({
        kind: "START",
        microSystemId: b.microSystemId,
        reason: "desired-running",
      });
      expect(supervisor.getActualState(a.microSystemId)).toBe("STOPPED");
      expect(supervisor.getActualState(d.microSystemId)).toBe("RUNNING");
      expect(supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
      expect(bActivations).toBe(2);
    } finally {
      await supervisor.close();
    }
  });

  it("releases an explicit Service binding when the desired snapshot removes it", async () => {
    const serviceId = createServiceId("test.binding-removal");
    let bActivations = 0;
    const reads: string[] = [];
    const a = provider("a", serviceId);
    const b = consumer("b", serviceId, async (context) => {
      bActivations += 1;
      const value = await context
        .requireService<{ read(): string }>(serviceRequirement(serviceId))
        .invoke("read", (service) => service.read());
      reads.push(value);
    });
    const d = provider("d", serviceId);
    const supervisor = createSupervisor([a, b, d]);
    try {
      await supervisor.reconcile(
        desired(
          [a, b],
          "NORMAL",
          new Map([[serviceId, createProviderId("provider.a")]]),
        ),
      );
      await supervisor.reconcile(desired([b, d]));

      expect(supervisor.getActualState(d.microSystemId)).toBe("RUNNING");
      expect(supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
      expect(bActivations).toBe(2);
      expect(reads.at(-1)).toBe("d");
    } finally {
      await supervisor.close();
    }
  });

  it("uses the Desired Service binding during consumer activation", async () => {
    const serviceId = createServiceId("test.desired-service-binding");
    const reads: string[] = [];
    const a = provider("a", serviceId);
    const d = provider("d", serviceId);
    const b = consumer("b", serviceId, async (context) => {
      const value = await context
        .requireService<{ read(): string }>(serviceRequirement(serviceId))
        .invoke("read", (service) => service.read());
      reads.push(value);
    });
    const supervisor = createSupervisor([a, b, d]);
    try {
      await supervisor.reconcile(
        desired(
          [a, b, d],
          "NORMAL",
          new Map([[serviceId, createProviderId("provider.d")]]),
        ),
      );

      expect(supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
      expect(reads).toEqual(["d"]);
    } finally {
      await supervisor.close();
    }
  });

  it("restarts a dependent when an implicit Service provider is replaced", async () => {
    const serviceId = createServiceId("test.implicit-service-replacement");
    let bActivations = 0;
    const reads: string[] = [];
    const a = provider("a", serviceId);
    const d = provider("d", serviceId);
    const b = consumer("b", serviceId, async (context) => {
      bActivations += 1;
      const value = await context
        .requireService<{ read(): string }>(serviceRequirement(serviceId))
        .invoke("read", (service) => service.read());
      reads.push(value);
    });
    const supervisor = createSupervisor([a, b, d]);
    try {
      await supervisor.reconcile(desired([a, b]));
      await supervisor.reconcile(desired([b, d]));

      expect(supervisor.getActualState(a.microSystemId)).toBe("STOPPED");
      expect(supervisor.getActualState(d.microSystemId)).toBe("RUNNING");
      expect(supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
      expect(bActivations).toBe(2);
      expect(reads).toEqual(["a", "d"]);
    } finally {
      await supervisor.close();
    }
  });

  it("blocks a dependent when a replaced provider generation cannot drain", async () => {
    const serviceId = createServiceId("test.replacement-timeout");
    const started = deferred<void>();
    const released = deferred<string>();
    let holdNextCall = false;
    const a = provider("replacement-timeout-a", serviceId, async (context) => {
      context.publishService(
        serviceProvision(serviceId, createProviderId("provider.replacement-timeout-a")),
        {
          async read() {
            if (!holdNextCall) return "a";
            holdNextCall = false;
            started.resolve();
            return released.promise;
          },
        },
      );
    });
    const b = consumer("replacement-timeout-b", serviceId);
    const d = provider("replacement-timeout-d", serviceId);
    const c = system("system.replacement-timeout-independent", async () => undefined);
    const supervisor = new MicroSystemSupervisor({
      substrate: createRuntimeSubstrate({ settleTimeoutMs: 5 }),
      settleTimeoutMs: 5,
      definitions: [a, b, d, c],
    });

    try {
      await supervisor.reconcile(desired([a, b, d, c]));
      holdNextCall = true;
      const lease = supervisor.services.resolve<{ read(): Promise<string> }>(
        serviceRequirement(serviceId),
        createProviderId("provider.replacement-timeout-a"),
      );
      const oldCall = lease.invoke("held-call", (service) => service.read());
      await started.promise;

      await expect(
        supervisor.reconcile(
          desired(
            [b, d, c],
            "NORMAL",
            new Map([[serviceId, createProviderId("provider.replacement-timeout-d")]]),
          ),
        ),
      ).rejects.toMatchObject({
        problem: expect.objectContaining({
          problemCode: "runtime.generation.settlement_timeout",
        }),
      });
      expect(supervisor.getActualState(d.microSystemId)).toBe("RUNNING");
      expect(supervisor.getActualState(b.microSystemId)).toBe("BLOCKED");
      expect(supervisor.getActualState(c.microSystemId)).toBe("RUNNING");

      released.resolve("late");
      await expect(oldCall).resolves.toBe("late");
    } finally {
      released.resolve("cleanup");
      await supervisor.close();
    }
  });

  it("uses the exact selected Service binding when one MicroSystem has multiple bindings", async () => {
    const serviceId = createServiceId("test.multiple-bindings.one-system");
    const providerA = createProviderId("provider.multiple-bindings.a");
    const providerB = createProviderId("provider.multiple-bindings.b");
    const reads: string[] = [];
    const providerDefinition = system(
      "system.multiple-bindings-provider",
      async (context) => {
        context.publishService(serviceProvision(serviceId, providerA), {
          read: () => "v1",
        });
        context.publishService(serviceProvision(serviceId, providerB, contractV2), {
          read: () => "v2",
        });
      },
      {
        serviceProvisions: [
          serviceProvision(serviceId, providerA),
          serviceProvision(serviceId, providerB, contractV2),
        ],
      },
    );
    const consumerDefinition = system(
      "system.multiple-bindings-consumer",
      async (context) => {
        const lease = context.requireService<{ read(): string }>({
          serviceId,
          contract: exactContract(contractV2),
        });
        reads.push(await lease.invoke("read", (service) => service.read()));
      },
      {
        serviceRequirements: [{ serviceId, contract: exactContract(contractV2) }],
      },
    );
    const supervisor = createSupervisor([providerDefinition, consumerDefinition]);

    try {
      const plan = await supervisor.reconcile(
        desired([providerDefinition, consumerDefinition]),
      );
      expect(plan.serviceBindings.get(serviceId)).toBe(providerB);
      expect(reads).toEqual(["v2"]);
      expect(supervisor.getActualState(consumerDefinition.microSystemId)).toBe(
        "RUNNING",
      );
    } finally {
      await supervisor.close();
    }
  });

  it("forgets a removed explicit Capability binding before reintroducing it", async () => {
    const capabilityId = createCapabilityId("test.binding-removal");
    const providerId = createProviderId("provider.capability");
    const definition = system("system.capability-binding", async () => undefined);
    const supervisor = createSupervisor([definition]);
    const binding = new Map([[capabilityId, providerId]]);
    try {
      await supervisor.reconcile(desired([definition], "NORMAL", new Map(), binding));
      await supervisor.reconcile(desired([definition]));
      const reintroduced = await supervisor.reconcile(
        desired([definition], "NORMAL", new Map(), binding),
      );

      expect(reintroduced.actions).toContainEqual({
        kind: "REBIND_CAPABILITY",
        capabilityId,
        providerId,
      });
    } finally {
      await supervisor.close();
    }
  });

  it("applies a removed Capability binding before a same-reconcile restart", async () => {
    const serviceId = createServiceId("test.capability-unbind.service");
    const capabilityId = createCapabilityId("test.capability-unbind.capability");
    const serviceProviderA = provider("capability-unbind-a", serviceId);
    const serviceProviderD = provider("capability-unbind-d", serviceId);
    const capabilityProviderA = system(
      "system.a-capability",
      async (context) => {
        context.publishCapability(
          capabilityProvision(capabilityId, createProviderId("provider.capability-a")),
          { read: () => "a" },
        );
      },
      {
        capabilityProvisions: [
          capabilityProvision(capabilityId, createProviderId("provider.capability-a")),
        ],
      },
    );
    const capabilityProviderB = system(
      "system.b-capability",
      async (context) => {
        context.publishCapability(
          capabilityProvision(capabilityId, createProviderId("provider.capability-b")),
          { read: () => "b" },
        );
      },
      {
        capabilityProvisions: [
          capabilityProvision(capabilityId, createProviderId("provider.capability-b")),
        ],
      },
    );
    const reads: string[] = [];
    const consumerDefinition = system(
      "system.z-capability-consumer",
      async (context) => {
        await context
          .requireService<{ read(): string }>(serviceRequirement(serviceId))
          .invoke("read", (service) => service.read());
        const lease = context.resolveCapability<{ read(): string }>(
          capabilityRequirement(capabilityId),
        );
        reads.push(
          lease === undefined
            ? "missing"
            : await lease.invoke("read", (capability) => capability.read()),
        );
      },
      {
        serviceRequirements: [serviceRequirement(serviceId)],
        capabilityRequirements: [capabilityRequirement(capabilityId)],
      },
    );
    const supervisor = createSupervisor([
      serviceProviderA,
      serviceProviderD,
      capabilityProviderA,
      capabilityProviderB,
      consumerDefinition,
    ]);

    try {
      await supervisor.reconcile(
        desired(
          [
            serviceProviderA,
            serviceProviderD,
            capabilityProviderA,
            capabilityProviderB,
            consumerDefinition,
          ],
          "NORMAL",
          new Map([[serviceId, createProviderId("provider.capability-unbind-a")]]),
          new Map([[capabilityId, createProviderId("provider.capability-a")]]),
        ),
      );
      const replacementPlan = await supervisor.reconcile(
        desired(
          [serviceProviderD, capabilityProviderB, consumerDefinition],
          "NORMAL",
          new Map([[serviceId, createProviderId("provider.capability-unbind-d")]]),
        ),
      );

      expect(replacementPlan.actions).toContainEqual({
        kind: "REBIND_CAPABILITY",
        capabilityId,
        providerId: undefined,
      });
      expect(reads).toEqual(["a", "b"]);
      expect(supervisor.getActualState(consumerDefinition.microSystemId)).toBe(
        "RUNNING",
      );
    } finally {
      await supervisor.close();
    }
  });

  it("R5 isolates a provider activation failure from an independent branch", async () => {
    const serviceId = createServiceId("test.failure");
    let bActivations = 0;
    const a = provider("a", serviceId, async () => {
      throw new Error("provider activation failed");
    });
    const b = consumer("b", serviceId, async (context) => {
      bActivations += 1;
      await context
        .requireService<{ read(): string }>(serviceRequirement(serviceId))
        .invoke("read", (service) => service.read());
    });
    const c = system("system.c", async () => undefined);
    const supervisor = createSupervisor([a, b, c]);
    try {
      await expect(supervisor.reconcile(desired([a, b, c]))).rejects.toBeDefined();
      expect(supervisor.getActualState(a.microSystemId)).toBe("FAILED");
      expect(supervisor.getActualState(b.microSystemId)).toBe("BLOCKED");
      expect(bActivations).toBe(0);
      expect(supervisor.getActualState(c.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("records a lifecycle failure when activation fails", async () => {
    const events: string[] = [];
    const lifecycleLineage = {
      runner: () => ({
        current: () => undefined,
        runActivity: async <T>(
          _request: never,
          operation: (context: never) => Promise<T>,
        ) => operation(undefined as never),
      }),
      runRetained: async <T>(
        _origin: never,
        request: { kind: string },
        operation: (context: never) => Promise<T>,
      ) => {
        events.push(request.kind);
        return operation(undefined as never);
      },
    } as unknown as RuntimeLifecycleLineage;
    const failing = system("system.lifecycle-failure", async () => {
      throw new Error("activation failed");
    });
    const supervisor = new MicroSystemSupervisor({
      substrate: createRuntimeSubstrate({ settleTimeoutMs: 50 }),
      settleTimeoutMs: 50,
      definitions: [failing],
      lifecycleLineage,
    });

    try {
      await expect(supervisor.reconcile(desired([failing]))).rejects.toBeDefined();
      expect(events).toContain("runtime.lifecycle.failure");
    } finally {
      await supervisor.close();
    }
  });

  it("compensates an activated system when lifecycle success completion fails", async () => {
    let activations = 0;
    let disposals = 0;
    const lifecycleLineage = {
      runner: () => ({
        current: () => undefined,
        runActivity: async <T>(
          _request: never,
          operation: (context: never) => Promise<T>,
        ) => operation(undefined as never),
      }),
      runRetained: async <T>(
        _origin: never,
        request: { kind: string },
        operation: (context: never) => Promise<T>,
      ) => {
        const result = await operation(undefined as never);
        if (request.kind === "runtime.lifecycle.activate") {
          throw new Error("activation completion persistence failed");
        }
        return result;
      },
    } as unknown as RuntimeLifecycleLineage;
    const systemDefinition = system(
      "system.activation-completion-failure",
      async (context) => {
        activations += 1;
        context.scope.defer("resource", () => {
          disposals += 1;
        });
      },
    );
    const supervisor = new MicroSystemSupervisor({
      substrate: createRuntimeSubstrate({ settleTimeoutMs: 50 }),
      settleTimeoutMs: 50,
      definitions: [systemDefinition],
      lifecycleLineage,
    });
    try {
      await expect(supervisor.reconcile(desired([systemDefinition]))).rejects.toThrow(
        "activation completion persistence failed",
      );
      expect(supervisor.getActualState(systemDefinition.microSystemId)).toBe("FAILED");
      expect(activations).toBe(1);
      expect(disposals).toBe(1);

      await expect(supervisor.reconcile(desired([systemDefinition]))).rejects.toThrow(
        "activation completion persistence failed",
      );
      expect(activations).toBe(2);
    } finally {
      await supervisor.close();
    }
  });

  it("preserves STOPPED when deactivation success completion persistence fails", async () => {
    let disposals = 0;
    const lifecycleLineage = {
      runner: () => ({
        current: () => undefined,
        runActivity: async <T>(
          _request: never,
          operation: (context: never) => Promise<T>,
        ) => operation(undefined as never),
      }),
      runRetained: async <T>(
        _origin: never,
        request: { kind: string },
        operation: (context: never) => Promise<T>,
      ) => {
        const result = await operation(undefined as never);
        if (request.kind === "runtime.lifecycle.deactivate") {
          throw new Error("deactivation completion persistence failed");
        }
        return result;
      },
    } as unknown as RuntimeLifecycleLineage;
    const systemDefinition = system(
      "system.deactivation-completion-failure",
      async (context) => {
        context.scope.defer("resource", () => {
          disposals += 1;
        });
      },
    );
    const supervisor = new MicroSystemSupervisor({
      substrate: createRuntimeSubstrate({ settleTimeoutMs: 50 }),
      settleTimeoutMs: 50,
      definitions: [systemDefinition],
      lifecycleLineage,
    });
    try {
      await supervisor.reconcile(desired([systemDefinition]));
      await expect(
        supervisor.reconcile({
          ...desired([systemDefinition]),
          desired: new Map([[systemDefinition.microSystemId, "STOPPED" as const]]),
        }),
      ).rejects.toThrow("deactivation completion persistence failed");
      expect(supervisor.getActualState(systemDefinition.microSystemId)).toBe("STOPPED");
      expect(disposals).toBe(1);
    } finally {
      await supervisor.close();
    }
  });

  it("R6 tracks background failure and withdraws provider bindings", async () => {
    const serviceId = createServiceId("test.background");
    let rejectBackground!: (reason: unknown) => void;
    const background = new Promise<void>((_resolve, reject) => {
      rejectBackground = reject;
    });
    const a = provider("a", serviceId, async (context) => {
      context.scope.track("worker", background);
      context.publishService(
        serviceProvision(serviceId, createProviderId("provider.a")),
        {
          read: () => "a",
        },
      );
    });
    const b = consumer("b", serviceId);
    const c = system("system.c", async () => undefined);
    const supervisor = createSupervisor([a, b, c]);
    try {
      await supervisor.reconcile(desired([a, b, c]));
      rejectBackground(new Error("worker failed"));
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(supervisor.getActualState(a.microSystemId)).toBe("FAILED");
      await expect(supervisor.reconcile(desired([a, b, c]))).rejects.toBeDefined();
      expect(["FAILED", "BLOCKED"]).toContain(
        supervisor.getActualState(b.microSystemId),
      );
      expect(supervisor.getActualState(c.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("recovers a failed provider and its dependent in one later reconcile", async () => {
    const serviceId = createServiceId("test.recover-failed-provider");
    let attempts = 0;
    const a = provider("recover-failed-provider", serviceId, async (context) => {
      attempts += 1;
      if (attempts === 1) throw new Error("transient provider failure");
      context.publishService(
        serviceProvision(
          serviceId,
          createProviderId("provider.recover-failed-provider"),
        ),
        { read: () => "recovered" },
      );
    });
    const b = consumer("recover-failed-consumer", serviceId);
    const supervisor = createSupervisor([a, b]);

    try {
      await expect(supervisor.reconcile(desired([a, b]))).rejects.toBeDefined();
      expect(supervisor.getActualState(b.microSystemId)).toBe("BLOCKED");

      await supervisor.reconcile(desired([a, b]));

      expect(attempts).toBe(2);
      expect(supervisor.getActualState(a.microSystemId)).toBe("RUNNING");
      expect(supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("R7 capability changes are handled without a hard consumer restart", async () => {
    const supervisor = createSupervisor([]);
    const capabilityId = createCapabilityId("test.dynamic");
    const providerId = createProviderId("provider.capability");
    try {
      supervisor.capabilities.register(
        {
          capabilityId,
          providerId,
          contractVersion: contractV1,
          priority: 0,
        },
        { read: () => "capability" },
      );
      expect(supervisor.capabilities.providerIds(capabilityId)).toEqual([providerId]);
      await supervisor.capabilities.retireProvider(providerId, 50);
      expect(supervisor.capabilities.providerIds(capabilityId)).toEqual([]);
    } finally {
      await supervisor.close();
    }
  });

  it("allows one MicroSystem to publish multiple bindings for one provider", async () => {
    const serviceA = createServiceId("test.multi-provider.service.a");
    const serviceB = createServiceId("test.multi-provider.service.b");
    const providerId = createProviderId("provider.multi-binding");
    const definition = system(
      "system.multi-binding",
      async (context) => {
        context.publishService(serviceProvision(serviceA, providerId), {
          read: () => "a",
        });
        context.publishService(serviceProvision(serviceB, providerId), {
          read: () => "b",
        });
      },
      {
        serviceProvisions: [
          serviceProvision(serviceA, providerId),
          serviceProvision(serviceB, providerId),
        ],
      },
    );
    const supervisor = createSupervisor([definition]);
    try {
      await supervisor.reconcile(desired([definition]));
      expect(supervisor.services.providerIds(serviceA)).toEqual([providerId]);
      expect(supervisor.services.providerIds(serviceB)).toEqual([providerId]);
      await supervisor.reconcile({
        ...desired([definition]),
        desired: new Map([[definition.microSystemId, "STOPPED" as const]]),
      });
      expect(supervisor.services.providerIds(serviceA)).toEqual([]);
      expect(supervisor.services.providerIds(serviceB)).toEqual([]);
    } finally {
      await supervisor.close();
    }
  });

  it("R8 SAFE stops mode-ineligible systems without mutating Desired State", async () => {
    const safeOnly = system("system.normal-only", async () => undefined, {
      operatingModes: ["NORMAL"],
    });
    const supervisor = createSupervisor([safeOnly]);
    const normalDesired = desired([safeOnly]);
    try {
      await supervisor.reconcile(normalDesired);
      await supervisor.reconcile(desired([safeOnly], "SAFE"));
      expect(supervisor.getActualState(safeOnly.microSystemId)).toBe("BLOCKED");
      expect(normalDesired.desired.get(safeOnly.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("R9 NORMAL reactivates the original Desired State", async () => {
    const systemDefinition = system("system.resume", async () => undefined, {
      operatingModes: ["NORMAL"],
    });
    const supervisor = createSupervisor([systemDefinition]);
    try {
      await supervisor.reconcile(desired([systemDefinition], "SAFE"));
      await supervisor.reconcile(desired([systemDefinition], "NORMAL"));
      expect(supervisor.getActualState(systemDefinition.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("recovers a SAFE-blocked dependency chain in one NORMAL reconcile", async () => {
    const serviceId = createServiceId("test.safe-recovery-chain");
    const providerId = createProviderId("provider.safe-recovery");
    const a = system(
      "system.safe-recovery-provider",
      async (context) => {
        context.publishService(serviceProvision(serviceId, providerId), {
          read: () => "safe-recovered",
        });
      },
      {
        operatingModes: ["NORMAL"],
        serviceProvisions: [serviceProvision(serviceId, providerId)],
      },
    );
    const b = system(
      "system.safe-recovery-consumer",
      async (context) => {
        await context
          .requireService<{ read(): string }>(serviceRequirement(serviceId))
          .invoke("read", (service) => service.read());
      },
      {
        operatingModes: ["NORMAL"],
        serviceRequirements: [serviceRequirement(serviceId)],
      },
    );
    const supervisor = createSupervisor([a, b]);

    try {
      await supervisor.reconcile(desired([a, b], "SAFE"));
      expect(supervisor.getActualState(a.microSystemId)).toBe("BLOCKED");
      expect(supervisor.getActualState(b.microSystemId)).toBe("BLOCKED");
      await supervisor.reconcile(desired([a, b], "NORMAL"));
      expect(supervisor.getActualState(a.microSystemId)).toBe("RUNNING");
      expect(supervisor.getActualState(b.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("does not commit OperatingMode when planning fails", async () => {
    const serviceA = createServiceId("test.mode-cycle.a");
    const serviceB = createServiceId("test.mode-cycle.b");
    const a = system("system.mode-cycle-a", async () => undefined, {
      serviceRequirements: [serviceRequirement(serviceB)],
      serviceProvisions: [
        serviceProvision(serviceA, createProviderId("provider.mode-cycle-a")),
      ],
    });
    const b = system("system.mode-cycle-b", async () => undefined, {
      serviceRequirements: [serviceRequirement(serviceA)],
      serviceProvisions: [
        serviceProvision(serviceB, createProviderId("provider.mode-cycle-b")),
      ],
    });
    const supervisor = createSupervisor([a, b]);
    try {
      await expect(supervisor.reconcile(desired([a, b], "SAFE"))).rejects.toMatchObject(
        {
          problem: { problemCode: "runtime.graph.hard_service_cycle" },
        },
      );
      expect((supervisor as unknown as { operatingMode: string }).operatingMode).toBe(
        "NORMAL",
      );
    } finally {
      await supervisor.close();
    }
  });

  it("uses current hard dependency topology when desired state removes all systems", async () => {
    const serviceId = createServiceId("test.current-shutdown");
    const order: string[] = [];
    const providerDefinition = provider("a", serviceId, async (context) => {
      context.publishService(
        serviceProvision(serviceId, createProviderId("provider.a")),
        { read: () => "a" },
      );
      context.scope.defer("provider-dispose", () => {
        order.push("provider");
      });
    });
    const consumerDefinition = consumer("z", serviceId, async (context) => {
      context.scope.defer("consumer-dispose", () => {
        order.push("consumer");
      });
      await context
        .requireService<{ read(): string }>(serviceRequirement(serviceId))
        .invoke("read", (service) => service.read());
    });
    const supervisor = createSupervisor([providerDefinition, consumerDefinition]);
    try {
      await supervisor.reconcile(desired([providerDefinition, consumerDefinition]));
      expect(supervisor.getActualState(providerDefinition.microSystemId)).toBe(
        "RUNNING",
      );
      expect(supervisor.getActualState(consumerDefinition.microSystemId)).toBe(
        "RUNNING",
      );
      await supervisor.reconcile({
        ...desired([providerDefinition, consumerDefinition]),
        desired: new Map([
          [providerDefinition.microSystemId, "STOPPED" as const],
          [consumerDefinition.microSystemId, "STOPPED" as const],
        ]),
      });
      expect(order).toEqual(["consumer", "provider"]);
    } finally {
      await supervisor.close();
    }
  });

  it("uses current topology for multi-level shutdown when target graph is empty", async () => {
    const serviceX = createServiceId("test.current-shutdown.x");
    const serviceY = createServiceId("test.current-shutdown.y");
    const order: string[] = [];
    const providerA = provider("a", serviceX, async (context) => {
      context.publishService(
        serviceProvision(serviceX, createProviderId("provider.a")),
        { read: () => "a" },
      );
      context.scope.defer("a-dispose", () => {
        order.push("a");
      });
    });
    const providerB = system(
      "system.b",
      async (context) => {
        await context
          .requireService<{ read(): string }>(serviceRequirement(serviceX))
          .invoke("read", (service) => service.read());
        context.publishService(
          serviceProvision(serviceY, createProviderId("provider.b")),
          { read: () => "b" },
        );
        context.scope.defer("b-dispose", () => {
          order.push("b");
        });
      },
      {
        serviceRequirements: [serviceRequirement(serviceX)],
        serviceProvisions: [serviceProvision(serviceY, createProviderId("provider.b"))],
      },
    );
    const consumerC = consumer("c", serviceY, async (context) => {
      await context
        .requireService<{ read(): string }>(serviceRequirement(serviceY))
        .invoke("read", (service) => service.read());
      context.scope.defer("c-dispose", () => {
        order.push("c");
      });
    });
    const systems = [providerA, providerB, consumerC];
    const supervisor = createSupervisor(systems);
    try {
      await supervisor.reconcile(desired(systems));
      await supervisor.reconcile({
        ...desired(systems),
        desired: new Map(
          systems.map((definition) => [definition.microSystemId, "STOPPED" as const]),
        ),
      });
      expect(order).toEqual(["c", "b", "a"]);
    } finally {
      await supervisor.close();
    }
  });

  it("R10 shutdown disposes scopes in hard dependency order", async () => {
    const serviceId = createServiceId("test.shutdown");
    const order: string[] = [];
    const a = provider("a", serviceId, async (context) => {
      context.publishService(
        serviceProvision(serviceId, createProviderId("provider.a")),
        {
          read: () => "a",
        },
      );
      context.scope.defer("a-dispose", () => {
        order.push("a");
      });
    });
    const b = consumer("b", serviceId, async (context) => {
      context.scope.defer("b-dispose", () => {
        order.push("b");
      });
      await context
        .requireService<{ read(): string }>(serviceRequirement(serviceId))
        .invoke("read", (service) => service.read());
    });
    const supervisor = createSupervisor([a, b]);
    await supervisor.reconcile(desired([a, b]));
    await supervisor.close();
    expect(order).toEqual(["b", "a"]);
  });

  it("R11 does not automatically retry failed activation", async () => {
    let attempts = 0;
    const failing = system("system.once", async () => {
      attempts += 1;
      throw new Error("once");
    });
    const supervisor = createSupervisor([failing]);
    try {
      await expect(supervisor.reconcile(desired([failing]))).rejects.toBeDefined();
      expect(attempts).toBe(1);
    } finally {
      await supervisor.close();
    }
  });

  it("R12 serializes concurrent reconcile requests", async () => {
    let activations = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const systemDefinition = system("system.serial", async () => {
      activations += 1;
      await gate;
    });
    const supervisor = createSupervisor([systemDefinition]);
    try {
      const target = desired([systemDefinition]);
      const first = supervisor.reconcile(target);
      const second = supervisor.reconcile(target);
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(activations).toBe(1);
      release();
      await Promise.all([first, second]);
      expect(activations).toBe(1);
    } finally {
      release();
      await supervisor.close();
    }
  });

  it("R13 preserves a background failure that races activation registration", async () => {
    const failing = system(
      "system.immediate-background-failure",
      async () => undefined,
    );
    const substrate: RuntimeSubstrate = {
      async activate(request) {
        request.onFailure({
          phase: "BACKGROUND",
          label: "immediate-background-failure",
          cause: new Error("background boom"),
        });
        return {
          state: "ACTIVE",
          dispose: async () => undefined,
        };
      },
      close: async () => undefined,
    };
    const supervisor = createSupervisorWithSubstrate([failing], substrate);
    try {
      await supervisor.reconcile(desired([failing]));
      await Promise.resolve();
      await Promise.resolve();
      expect(supervisor.getActualState(failing.microSystemId)).toBe("FAILED");
    } finally {
      await supervisor.close();
    }
  });

  it("captures DesiredRuntimeSnapshot before queued reconciliation reads it", async () => {
    const systemDefinition = system("system.snapshot", async () => undefined);
    const supervisor = createSupervisor([systemDefinition]);
    const snapshot = desired([systemDefinition]);
    try {
      const reconcile = supervisor.reconcile(snapshot);
      snapshot.desired.set(systemDefinition.microSystemId, "STOPPED");
      await reconcile;
      expect(supervisor.getActualState(systemDefinition.microSystemId)).toBe("RUNNING");
    } finally {
      await supervisor.close();
    }
  });

  it("rejects negative or unsafe DesiredRuntimeSnapshot revisions", async () => {
    const systemDefinition = system("system.invalid-revision", async () => undefined);
    const supervisor = createSupervisor([systemDefinition]);
    try {
      await expect(
        supervisor.reconcile({ ...desired([systemDefinition]), revision: -1 }),
      ).rejects.toMatchObject({
        problem: { problemCode: "runtime.supervisor.invalid_revision" },
      });
    } finally {
      await supervisor.close();
    }
  });

  it("R14 contains cleanup failures from asynchronous background failure handling", async () => {
    const failing = system("system.background-cleanup-failure", async () => undefined);
    const substrate: RuntimeSubstrate = {
      async activate(request) {
        setTimeout(() => {
          request.onFailure({
            phase: "BACKGROUND",
            label: "background-cleanup-failure",
            cause: new Error("background boom"),
          });
        }, 0);
        return {
          state: "ACTIVE",
          dispose: async () => {
            throw new Error("cleanup boom");
          },
        };
      },
      close: async () => undefined,
    };
    const supervisor = createSupervisorWithSubstrate([failing], substrate);
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);
    try {
      await supervisor.reconcile(desired([failing]));
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(supervisor.getActualState(failing.microSystemId)).toBe("FAILED");
      expect(unhandled).toEqual([]);
    } finally {
      process.off("unhandledRejection", onUnhandled);
      await supervisor.close();
    }
  });

  it("R15 binds Service call Activities to the provider runtime origin", async () => {
    const serviceId = createServiceId("test.provider-origin-activity");
    const a = provider("activity-a", serviceId);
    const b = consumer("activity-b", serviceId);
    const events: Array<{
      request: { kind: string; semantic?: Record<string, unknown> };
      origin: { microSystemId?: unknown };
    }> = [];
    const lifecycleLineage = {
      runner: (origin: { microSystemId: unknown }) => ({
        current: () => undefined,
        runActivity: async <T>(
          request: { kind: string; semantic?: Record<string, unknown> },
          operation: (context: never) => Promise<T>,
        ) => {
          events.push({ request, origin });
          return operation(undefined as never);
        },
      }),
      runRetained: async <T>(
        _origin: unknown,
        _request: unknown,
        operation: (context: never) => Promise<T>,
      ) => operation(undefined as never),
    } as unknown as RuntimeLifecycleLineage;
    const supervisor = new MicroSystemSupervisor({
      substrate: createRuntimeSubstrate({ settleTimeoutMs: 50 }),
      settleTimeoutMs: 50,
      definitions: [a, b],
      lifecycleLineage,
    });
    try {
      await supervisor.reconcile(desired([a, b]));
      const event = events.find((entry) => entry.request.kind === "service.call");
      expect(event?.request.semantic).toMatchObject({
        serviceId,
        providerId: createProviderId("provider.activity-a"),
      });
      expect(event?.origin.microSystemId).toBe(a.microSystemId);
    } finally {
      await supervisor.close();
    }
  });

  it("R16 does not retain a no-op reconcile Activity", async () => {
    const systemDefinition = system("system.no-op-reconcile", async () => undefined);
    const reconcileKinds: string[] = [];
    const lifecycleLineage = {
      runner: () => ({
        current: () => undefined,
        runActivity: async <T>(
          _request: unknown,
          operation: (context: never) => Promise<T>,
        ) => operation(undefined as never),
      }),
      runRetained: async <T>(
        _origin: unknown,
        request: { kind: string },
        operation: (context: never) => Promise<T>,
      ) => {
        reconcileKinds.push(request.kind);
        return operation(undefined as never);
      },
    } as unknown as RuntimeLifecycleLineage;
    const supervisor = new MicroSystemSupervisor({
      substrate: createRuntimeSubstrate({ settleTimeoutMs: 50 }),
      settleTimeoutMs: 50,
      definitions: [systemDefinition],
      lifecycleLineage,
      rootRuntimeOrigin: { productGenerationId: generation.productGenerationId },
    });
    try {
      await supervisor.reconcile(desired([systemDefinition]));
      await supervisor.reconcile(desired([systemDefinition]));
      expect(
        reconcileKinds.filter((kind) => kind === "runtime.reconcile"),
      ).toHaveLength(1);
    } finally {
      await supervisor.close();
    }
  });
});
