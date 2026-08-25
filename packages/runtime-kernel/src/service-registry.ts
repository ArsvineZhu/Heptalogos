import type {
  ContractVersion,
  ServiceLease,
  ServiceProvisionDescriptor,
  ServiceRequirement,
} from "./contracts.js";
import { ContractCompatibilityRegistry } from "./contract-compatibility.js";
import { GenerationFence } from "./generation-fence.js";
import { RuntimeKernelProblem } from "./problems.js";
import type { ProviderId } from "@heptalogos/foundation-contracts";

interface ServiceBinding {
  readonly descriptor: ServiceProvisionDescriptor;
  readonly implementation: object;
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

export class ServiceRegistry {
  private readonly bindings = new Map<ProviderId, ServiceBinding>();
  private readonly compatibility = new ContractCompatibilityRegistry();

  register<TContract extends object>(
    descriptor: ServiceProvisionDescriptor,
    implementation: TContract,
    fence = new GenerationFence(),
  ): GenerationFence {
    if (this.bindings.has(descriptor.providerId)) {
      throw new RuntimeKernelProblem(
        "runtime.service.duplicate_provider",
        `Service provider '${descriptor.providerId}' is already registered`,
      );
    }
    this.bindings.set(descriptor.providerId, {
      descriptor,
      implementation,
      fence,
    });
    return fence;
  }

  hasEligible(
    requirement: ServiceRequirement,
    explicitProviderId?: ProviderId,
  ): boolean {
    return this.selectBinding(requirement, explicitProviderId, false) !== undefined;
  }

  resolve<TContract extends object>(
    requirement: ServiceRequirement,
    explicitProviderId?: ProviderId,
  ): ServiceLease<TContract> {
    const binding = this.selectBinding(requirement, explicitProviderId, true)!;
    const proxy = createFencedProxy(
      binding.implementation,
      binding.fence,
      binding.descriptor.providerId,
    ) as TContract;
    return Object.freeze({
      serviceId: binding.descriptor.serviceId,
      providerId: binding.descriptor.providerId,
      contractVersion: binding.descriptor.contractVersion,
      async invoke<TResult>(
        operationId: string,
        call: (service: TContract) => TResult | Promise<TResult>,
      ): Promise<TResult> {
        return binding.fence.invoke(operationId, () => call(proxy));
      },
    });
  }

  providerIds(
    serviceId: ServiceProvisionDescriptor["serviceId"],
  ): readonly ProviderId[] {
    return [...this.bindings.values()]
      .filter((binding) => binding.descriptor.serviceId === serviceId)
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
    requirement: ServiceRequirement,
    explicitProviderId: ProviderId | undefined,
    throwOnFailure: boolean,
  ): ServiceBinding | undefined {
    const candidates = [...this.bindings.values()].filter(
      (binding) =>
        binding.descriptor.serviceId === requirement.serviceId &&
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
          "runtime.service.explicit_unavailable",
          `Explicit Service provider '${explicitProviderId}' is unavailable or incompatible`,
        );
      }
      return undefined;
    }
    if (candidates.length === 1) return candidates[0];
    if (candidates.length === 0) {
      if (throwOnFailure) {
        throw new RuntimeKernelProblem(
          "runtime.service.missing",
          `No eligible provider exists for Service '${requirement.serviceId}'`,
        );
      }
      return undefined;
    }
    if (throwOnFailure) {
      throw new RuntimeKernelProblem(
        "runtime.service.ambiguous_provider",
        `More than one eligible provider exists for Service '${requirement.serviceId}'`,
      );
    }
    return undefined;
  }
}
