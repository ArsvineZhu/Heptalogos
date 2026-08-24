import type {
  ActivationResourceScope,
  RuntimeSubstrateFailure,
  SubstrateActivationHandle,
} from "@heptalogos/runtime-substrate";
import type { RuntimeActivityRunner } from "@heptalogos/execution-lineage/runtime-kernel";
import type {
  Branded,
  CapabilityId,
  MicroSystemId,
  MicroSystemInstanceId,
  PackageGenerationId,
  ProductGenerationId,
  ProviderId,
  ServiceId,
} from "@heptalogos/foundation-contracts";

export type {
  CapabilityId,
  MicroSystemId,
  MicroSystemInstanceId,
  PackageGenerationId,
  ProductGenerationId,
  ProviderId,
  ServiceId,
};

export type ContractVersion = Branded<string, "ContractVersion">;
export type ContractVersionRange = {
  readonly kind: "exact";
  readonly version: ContractVersion;
};

export type MicroSystemRole =
  "kernel" | "system-service" | "domain-engine" | "feature" | "driver" | "provider";

export type OperatingMode = "NORMAL" | "SAFE" | "MAINTENANCE" | "EMERGENCY_READ_ONLY";

export interface RuntimeGenerationRef {
  readonly productGenerationId: ProductGenerationId;
  readonly packageGenerationId?: PackageGenerationId;
}

export interface ServiceRequirement {
  readonly serviceId: ServiceId;
  readonly contract: ContractVersionRange;
}

export interface CapabilityRequirement {
  readonly capabilityId: CapabilityId;
  readonly contract: ContractVersionRange;
  readonly required: boolean;
}

export interface ServiceProvisionDescriptor {
  readonly serviceId: ServiceId;
  readonly contractVersion: ContractVersion;
  readonly providerId: ProviderId;
}

export interface CapabilityProvisionDescriptor {
  readonly capabilityId: CapabilityId;
  readonly contractVersion: ContractVersion;
  readonly providerId: ProviderId;
}

export interface ServiceLease<TContract extends object> {
  readonly serviceId: ServiceId;
  readonly providerId: ProviderId;
  readonly contractVersion: ContractVersion;
  invoke<TResult>(
    operationId: string,
    call: (service: TContract) => TResult | Promise<TResult>,
  ): Promise<TResult>;
}

export interface CapabilityLease<TContract extends object> {
  readonly capabilityId: CapabilityId;
  readonly providerId: ProviderId;
  readonly contractVersion: ContractVersion;
  invoke<TResult>(
    operationId: string,
    call: (capability: TContract) => TResult | Promise<TResult>,
  ): Promise<TResult>;
}

export interface MicroSystemActivationContext {
  readonly microSystemId: MicroSystemId;
  readonly microSystemInstanceId: MicroSystemInstanceId;
  readonly generation: RuntimeGenerationRef;
  readonly operatingMode: OperatingMode;
  readonly scope: ActivationResourceScope;
  readonly signal: AbortSignal;
  readonly runtimeActivity?: RuntimeActivityRunner;
  requireService<TContract extends object>(
    requirement: ServiceRequirement,
    explicitProviderId?: ProviderId,
  ): ServiceLease<TContract>;
  resolveCapability<TContract extends object>(
    requirement: CapabilityRequirement,
    explicitProviderId?: ProviderId,
  ): CapabilityLease<TContract> | undefined;
  publishService<TContract extends object>(
    descriptor: ServiceProvisionDescriptor,
    implementation: TContract,
  ): void;
  publishCapability<TContract extends object>(
    descriptor: CapabilityProvisionDescriptor,
    implementation: TContract,
    priority?: number,
  ): void;
}

export interface MicroSystemDefinition {
  readonly microSystemId: MicroSystemId;
  readonly role: MicroSystemRole;
  readonly generation: RuntimeGenerationRef;
  readonly operatingModes: readonly OperatingMode[];
  readonly serviceRequirements: readonly ServiceRequirement[];
  readonly capabilityRequirements: readonly CapabilityRequirement[];
  readonly serviceProvisions: readonly ServiceProvisionDescriptor[];
  readonly capabilityProvisions: readonly CapabilityProvisionDescriptor[];
  readonly activate: (context: MicroSystemActivationContext) => Promise<void>;
}

export type MicroSystemDesiredState = "RUNNING" | "STOPPED";

export interface DesiredRuntimeSnapshot {
  readonly revision: number;
  readonly operatingMode: OperatingMode;
  readonly desired: ReadonlyMap<MicroSystemId, MicroSystemDesiredState>;
  readonly serviceBindings: ReadonlyMap<ServiceId, ProviderId>;
  readonly capabilityBindings: ReadonlyMap<CapabilityId, ProviderId>;
}

export type MicroSystemActualState =
  "STOPPED" | "BLOCKED" | "STARTING" | "RUNNING" | "QUIESCING" | "FAILED";

export interface ReadinessProfileDefinition {
  readonly profileId: string;
  readonly requiredServices: readonly ServiceRequirement[];
  readonly requiredCapabilities: readonly CapabilityRequirement[];
  readonly optionalCapabilities: readonly CapabilityRequirement[];
}

export type ReadinessState = "READY" | "DEGRADED" | "BLOCKED";

export interface ReadinessResult {
  readonly profileId: string;
  readonly state: ReadinessState;
  readonly missingServices: readonly ServiceId[];
  readonly missingRequiredCapabilities: readonly CapabilityId[];
  readonly missingOptionalCapabilities: readonly CapabilityId[];
}

export interface RuntimeSubstrateActivation {
  readonly handle: SubstrateActivationHandle;
  readonly failures: readonly RuntimeSubstrateFailure[];
}
