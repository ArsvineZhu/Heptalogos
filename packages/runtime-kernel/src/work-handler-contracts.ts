import type {
  ContributionId,
  MicroSystemId,
  NamespacedId,
  PackageGenerationId,
  ProductGenerationId,
  WorkItemId,
} from "@heptalogos/foundation-contracts";
import type { ContractVersion, RuntimeContractData } from "./contracts.js";
import type { RuntimeActivityRunner } from "@heptalogos/execution-lineage/runtime-kernel";
import type { GenerationFence } from "./generation-fence.js";

export type WorkQueueProfileId = NamespacedId<"WorkQueueProfileId">;
export type ResourceAdmissionClassId = NamespacedId<"ResourceAdmissionClassId">;

export type WorkHandlerConfigurationBindingPolicy =
  "CONFIG_PINNED" | "LATEST_COMPATIBLE_AT_ATTEMPT";
export type WorkHandlerRestoreReplayClass = "RECONCILE_REQUIRED" | "RESTORE_SAFE";

export interface WorkHandlerPayloadContract {
  readonly version: number;
  readonly schema: Readonly<Record<string, unknown>>;
}

export interface WorkHandlerProvisionDescriptor {
  readonly contributionId: ContributionId;
  readonly contractVersion: ContractVersion;
  readonly payloadContracts: readonly WorkHandlerPayloadContract[];
  readonly outcomeSchema: Readonly<Record<string, unknown>>;
  readonly queueProfileId: WorkQueueProfileId;
  readonly resourceAdmissionClass: ResourceAdmissionClassId;
  readonly configurationBindingPolicy: WorkHandlerConfigurationBindingPolicy;
  readonly restoreReplayClass: WorkHandlerRestoreReplayClass;
}

export interface RuntimeWorkHandlerInvocation {
  readonly workItemId: WorkItemId;
  readonly dispatchRevision: number;
  readonly payloadVersion: number;
  readonly payload: RuntimeContractData;
  readonly signal: AbortSignal;
}

export interface RuntimeWorkHandlerResult {
  readonly outcome: RuntimeContractData;
}

export interface RuntimeWorkHandler {
  execute(input: RuntimeWorkHandlerInvocation): Promise<RuntimeWorkHandlerResult>;
}

export interface WorkHandlerTarget {
  readonly productGenerationId: ProductGenerationId;
  readonly microSystemId: MicroSystemId;
  readonly contributionId: ContributionId;
  readonly packageGenerationId: PackageGenerationId;
  readonly payloadVersion: number;
}

export interface WorkHandlerRegistrationOwner {
  readonly microSystemId: MicroSystemId;
  readonly productGenerationId: ProductGenerationId;
  readonly packageGenerationId: PackageGenerationId;
}

export interface RuntimeWorkHandlerLease {
  readonly target: WorkHandlerTarget;
  readonly descriptor: WorkHandlerProvisionDescriptor;
  validatePayload(version: number, value: unknown): RuntimeContractData;
  validateOutcome(value: unknown): RuntimeContractData;
  execute(input: RuntimeWorkHandlerInvocation): Promise<RuntimeWorkHandlerResult>;
}

export interface WorkHandlerRegistration {
  readonly owner: WorkHandlerRegistrationOwner;
  readonly descriptor: WorkHandlerProvisionDescriptor;
  readonly implementation: RuntimeWorkHandler;
  readonly fence: GenerationFence;
  readonly runtimeActivity?: RuntimeActivityRunner;
}
