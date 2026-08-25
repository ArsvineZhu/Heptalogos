import { describe, expect, it } from "vitest";
import {
  asContentDigest,
  createCapabilityId,
  createMicroSystemId,
  createProviderId,
  createServiceId,
  digestCanonicalJson,
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
  type MicroSystemDefinition,
  type ServiceProvisionDescriptor,
} from "./index.js";

const contractV1 = createContractVersion("v1");
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
): ServiceProvisionDescriptor {
  return { serviceId, providerId, contractVersion: contractV1 };
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
    desired: new Map(
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
      "operatingModes" | "serviceRequirements" | "serviceProvisions"
    >
  > = {},
): MicroSystemDefinition {
  return {
    microSystemId: createMicroSystemId(id),
    role: "provider",
    generation,
    operatingModes: options.operatingModes ?? ["NORMAL", "SAFE"],
    serviceRequirements: options.serviceRequirements ?? [],
    capabilityRequirements: [],
    serviceProvisions: options.serviceProvisions ?? [],
    capabilityProvisions: [],
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

  it("R5 isolates a provider activation failure from an independent branch", async () => {
    const serviceId = createServiceId("test.failure");
    const a = provider("a", serviceId, async () => {
      throw new Error("provider activation failed");
    });
    const b = consumer("b", serviceId);
    const c = system("system.c", async () => undefined);
    const supervisor = createSupervisor([a, b, c]);
    try {
      await supervisor.reconcile(desired([a, b, c]));
      expect(supervisor.getActualState(a.microSystemId)).toBe("FAILED");
      expect(["FAILED", "BLOCKED"]).toContain(
        supervisor.getActualState(b.microSystemId),
      );
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
      await supervisor.reconcile(desired([failing]));
      expect(events).toContain("runtime.lifecycle.failure");
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
      await supervisor.reconcile(desired([a, b, c]));
      expect(["FAILED", "BLOCKED"]).toContain(
        supervisor.getActualState(b.microSystemId),
      );
      expect(supervisor.getActualState(c.microSystemId)).toBe("RUNNING");
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

  it("R8 SAFE stops mode-ineligible systems without mutating Desired State", async () => {
    const safeOnly = system("system.normal-only", async () => undefined, {
      operatingModes: ["NORMAL"],
    });
    const supervisor = createSupervisor([safeOnly]);
    const normalDesired = desired([safeOnly]);
    try {
      await supervisor.reconcile(normalDesired);
      await supervisor.reconcile(desired([safeOnly], "SAFE"));
      expect(supervisor.getActualState(safeOnly.microSystemId)).toBe("STOPPED");
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
      await supervisor.reconcile(desired([failing]));
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
