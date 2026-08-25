import type {
  ContractVersion,
  ServiceLease,
  ServiceProvisionDescriptor,
  ServiceRequirement,
} from "./contracts.js";
import { ContractCompatibilityRegistry } from "./contract-compatibility.js";
import { GenerationFence } from "./generation-fence.js";
import { createFencedProxy } from "./fenced-proxy.js";
import { validateSupportedContractShape } from "./contract-shape.js";
import { runtimeKernelProblem } from "./problems.js";
import type { ProviderId } from "@heptalogos/foundation-contracts";
import type { RuntimeActivityRunner } from "@heptalogos/execution-lineage/runtime-kernel";

interface ServiceBinding {
  readonly descriptor: ServiceProvisionDescriptor;
  readonly implementation: object;
  readonly fence: GenerationFence;
  readonly runtimeActivity?: RuntimeActivityRunner;
}

function bindingKey(
  serviceId: ServiceProvisionDescriptor["serviceId"],
  providerId: ProviderId,
): string {
  return `${serviceId}\u0000${providerId}`;
}

export class ServiceRegistry {
  private readonly bindings = new Map<string, ServiceBinding>();
  private readonly compatibility = new ContractCompatibilityRegistry();

  register<TContract extends object>(
    descriptor: ServiceProvisionDescriptor,
    implementation: TContract,
    fence = new GenerationFence(),
    runtimeActivity?: RuntimeActivityRunner,
  ): GenerationFence {
    const key = bindingKey(descriptor.serviceId, descriptor.providerId);
    if (this.bindings.has(key)) {
      throw runtimeKernelProblem(
        "runtime.service.duplicate_provider",
        `Service provider '${descriptor.providerId}' is already registered for Service '${descriptor.serviceId}'`,
      );
    }
    validateSupportedContractShape(implementation);
    this.bindings.set(key, {
      descriptor,
      implementation,
      fence,
      runtimeActivity,
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
        const invoke = () => binding.fence.invoke(operationId, () => call(proxy));
        binding.fence.assertActive();
        if (binding.runtimeActivity === undefined) return invoke();
        return binding.runtimeActivity.runActivity(
          {
            kind: "service.call",
            importance: "routine",
            retentionClass: "ephemeral",
            sensitivity: "operational",
            semantic: {
              operationId,
              serviceId: binding.descriptor.serviceId,
              providerId: binding.descriptor.providerId,
              contractVersion: binding.descriptor.contractVersion,
            },
          },
          async () => invoke(),
        );
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

  async retireGeneration(
    ownerFence: GenerationFence,
    settleTimeoutMs: number,
  ): Promise<void> {
    const bindings = [...this.bindings.entries()].filter(
      ([, binding]) => binding.fence === ownerFence,
    );
    if (bindings.length === 0) return;
    for (const [key] of bindings) this.bindings.delete(key);
    await ownerFence.retire(settleTimeoutMs);
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
        throw runtimeKernelProblem(
          "runtime.service.explicit_unavailable",
          `Explicit Service provider '${explicitProviderId}' is unavailable or incompatible`,
        );
      }
      return undefined;
    }
    if (candidates.length === 1) return candidates[0];
    if (candidates.length === 0) {
      if (throwOnFailure) {
        throw runtimeKernelProblem(
          "runtime.service.missing",
          `No eligible provider exists for Service '${requirement.serviceId}'`,
        );
      }
      return undefined;
    }
    if (throwOnFailure) {
      throw runtimeKernelProblem(
        "runtime.service.ambiguous_provider",
        `More than one eligible provider exists for Service '${requirement.serviceId}'`,
      );
    }
    return undefined;
  }
}
