import type {
  CapabilityLease,
  CapabilityProvisionDescriptor,
  CapabilityRequirement,
} from "./contracts.js";
import { ContractCompatibilityRegistry } from "./contract-compatibility.js";
import { GenerationFence } from "./generation-fence.js";
import { RuntimeKernelProblem } from "./problems.js";
import type { ProviderId } from "@heptalogos/foundation-contracts";

interface CapabilityBinding {
  readonly descriptor: CapabilityProvisionDescriptor;
  readonly implementation: object;
  readonly priority: number;
  readonly fence: GenerationFence;
}

function operationIdFor(providerId: ProviderId, property: PropertyKey): string {
  return `${providerId}.${String(property)}`.slice(0, 256);
}

function createFencedProxy<TContract extends object>(
  implementation: TContract,
  fence: GenerationFence,
  providerId: ProviderId,
): TContract {
  const proxies = new WeakMap<object, object>();
  const wrap = <T extends object>(value: T): T => {
    const previous = proxies.get(value);
    if (previous !== undefined) return previous as T;
    const proxy = new Proxy(value, {
      get(target, property, receiver) {
        fence.assertActive();
        const member = Reflect.get(target, property, receiver);
        if (typeof member !== "function") {
          if (member !== null && typeof member === "object") {
            return wrap(member as object);
          }
          return member;
        }
        return (...args: readonly unknown[]) =>
          fence.invoke(operationIdFor(providerId, property), () =>
            Reflect.apply(member, proxy, args),
          );
      },
    });
    proxies.set(value, proxy);
    return proxy;
  };
  return wrap(implementation);
}

export class CapabilityRegistry {
  private readonly bindings = new Map<ProviderId, CapabilityBinding>();
  private readonly compatibility = new ContractCompatibilityRegistry();

  register<TContract extends object>(
    descriptor: CapabilityProvisionDescriptor,
    implementation: TContract,
    priority = 0,
    fence = new GenerationFence(),
  ): GenerationFence {
    if (!Number.isSafeInteger(priority)) {
      throw new RuntimeKernelProblem(
        "runtime.capability.invalid_priority",
        "Capability provider priority must be a safe integer",
      );
    }
    if (this.bindings.has(descriptor.providerId)) {
      throw new RuntimeKernelProblem(
        "runtime.capability.duplicate_provider",
        `Capability provider '${descriptor.providerId}' is already registered`,
      );
    }
    this.bindings.set(descriptor.providerId, {
      descriptor,
      implementation,
      priority,
      fence,
    });
    return fence;
  }

  hasEligible(
    requirement: CapabilityRequirement,
    explicitProviderId?: ProviderId,
  ): boolean {
    return this.selectBinding(requirement, explicitProviderId, false) !== undefined;
  }

  resolve<TContract extends object>(
    requirement: CapabilityRequirement,
    explicitProviderId?: ProviderId,
  ): CapabilityLease<TContract> | undefined {
    const binding = this.selectBinding(requirement, explicitProviderId, true);
    if (binding === undefined) return undefined;
    const proxy = createFencedProxy(
      binding.implementation,
      binding.fence,
      binding.descriptor.providerId,
    ) as TContract;
    return Object.freeze({
      capabilityId: binding.descriptor.capabilityId,
      providerId: binding.descriptor.providerId,
      contractVersion: binding.descriptor.contractVersion,
      async invoke<TResult>(
        operationId: string,
        call: (capability: TContract) => TResult | Promise<TResult>,
      ): Promise<TResult> {
        return binding.fence.invoke(operationId, () => call(proxy));
      },
    });
  }

  providerIds(
    capabilityId: CapabilityProvisionDescriptor["capabilityId"],
  ): readonly ProviderId[] {
    return [...this.bindings.values()]
      .filter((binding) => binding.descriptor.capabilityId === capabilityId)
      .map((binding) => binding.descriptor.providerId)
      .sort();
  }

  async retireProvider(providerId: ProviderId, settleTimeoutMs: number): Promise<void> {
    const binding = this.bindings.get(providerId);
    if (binding === undefined) return;
    this.bindings.delete(providerId);
    await binding.fence.retire(settleTimeoutMs);
  }

  private selectBinding(
    requirement: CapabilityRequirement,
    explicitProviderId: ProviderId | undefined,
    throwOnFailure: boolean,
  ): CapabilityBinding | undefined {
    const candidates = [...this.bindings.values()].filter(
      (binding) =>
        binding.descriptor.capabilityId === requirement.capabilityId &&
        binding.fence.state === "ACTIVE" &&
        this.compatibility.isCompatible(
          requirement.contract,
          binding.descriptor.contractVersion,
        ),
    );
    if (explicitProviderId !== undefined) {
      const explicit = candidates.find(
        (candidate) => candidate.descriptor.providerId === explicitProviderId,
      );
      if (explicit !== undefined) return explicit;
      if (throwOnFailure) {
        throw new RuntimeKernelProblem(
          "runtime.capability.explicit_unavailable",
          `Explicit Capability provider '${explicitProviderId}' is unavailable or incompatible`,
        );
      }
      return undefined;
    }
    const selected = candidates.sort((left, right) => {
      if (left.priority !== right.priority) return right.priority - left.priority;
      return left.descriptor.providerId.localeCompare(right.descriptor.providerId);
    })[0];
    if (selected !== undefined) return selected;
    if (requirement.required && throwOnFailure) {
      throw new RuntimeKernelProblem(
        "runtime.capability.missing",
        `No eligible provider exists for Capability '${requirement.capabilityId}'`,
      );
    }
    return undefined;
  }
}
