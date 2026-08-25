import type {
  CapabilityLease,
  CapabilityProvisionDescriptor,
  CapabilityRequirement,
} from "./contracts.js";
import { ContractCompatibilityRegistry } from "./contract-compatibility.js";
import { GenerationFence } from "./generation-fence.js";
import { createFencedProxy } from "./fenced-proxy.js";
import { runtimeKernelProblem } from "./problems.js";
import type { ProviderId } from "@heptalogos/foundation-contracts";
import type { RuntimeActivityRunner } from "@heptalogos/execution-lineage/runtime-kernel";

interface CapabilityBinding {
  readonly descriptor: CapabilityProvisionDescriptor;
  readonly implementation: object;
  readonly fence: GenerationFence;
  readonly runtimeActivity?: RuntimeActivityRunner;
}

function bindingKey(
  capabilityId: CapabilityProvisionDescriptor["capabilityId"],
  providerId: ProviderId,
): string {
  return `${capabilityId}\u0000${providerId}`;
}

export class CapabilityRegistry {
  private readonly bindings = new Map<string, CapabilityBinding>();
  private readonly compatibility = new ContractCompatibilityRegistry();

  register<TContract extends object>(
    descriptor: CapabilityProvisionDescriptor,
    implementation: TContract,
    fence = new GenerationFence(),
    runtimeActivity?: RuntimeActivityRunner,
  ): GenerationFence {
    if (!Number.isSafeInteger(descriptor.priority)) {
      throw runtimeKernelProblem(
        "runtime.capability.invalid_priority",
        "Capability provider priority must be a safe integer",
      );
    }
    const key = bindingKey(descriptor.capabilityId, descriptor.providerId);
    if (this.bindings.has(key)) {
      throw runtimeKernelProblem(
        "runtime.capability.duplicate_provider",
        `Capability provider '${descriptor.providerId}' is already registered`,
      );
    }
    this.bindings.set(key, {
      descriptor,
      implementation,
      fence,
      runtimeActivity,
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
        const invoke = () => binding.fence.invoke(operationId, () => call(proxy));
        binding.fence.assertActive();
        if (binding.runtimeActivity === undefined) return invoke();
        return binding.runtimeActivity.runActivity(
          {
            kind: "capability.invoke",
            importance: "routine",
            retentionClass: "ephemeral",
            sensitivity: "operational",
            semantic: {
              operationId,
              capabilityId: binding.descriptor.capabilityId,
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
    capabilityId: CapabilityProvisionDescriptor["capabilityId"],
  ): readonly ProviderId[] {
    return [...this.bindings.values()]
      .filter((binding) => binding.descriptor.capabilityId === capabilityId)
      .map((binding) => binding.descriptor.providerId)
      .sort();
  }

  async retireProvider(providerId: ProviderId, settleTimeoutMs: number): Promise<void> {
    const bindings = [...this.bindings.entries()].filter(
      ([, binding]) => binding.descriptor.providerId === providerId,
    );
    if (bindings.length === 0) return;
    for (const [key] of bindings) this.bindings.delete(key);
    await Promise.all(
      bindings.map(([, binding]) => binding.fence.retire(settleTimeoutMs)),
    );
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
        throw runtimeKernelProblem(
          "runtime.capability.explicit_unavailable",
          `Explicit Capability provider '${explicitProviderId}' is unavailable or incompatible`,
        );
      }
      return undefined;
    }
    const selected = candidates.sort((left, right) => {
      if (left.descriptor.priority !== right.descriptor.priority) {
        return right.descriptor.priority - left.descriptor.priority;
      }
      return left.descriptor.providerId.localeCompare(right.descriptor.providerId);
    })[0];
    if (selected !== undefined) return selected;
    return undefined;
  }
}
