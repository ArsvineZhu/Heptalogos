import type {
  CanonicalJsonValue,
  ContentDigest,
  ContinuityEpochId,
  Instant,
  WorkItemId,
} from "@heptalogos/foundation-contracts";
import type { LineageContextRefV1 } from "@heptalogos/execution-lineage";
import type {
  ResourceAdmissionClassId as RuntimeResourceAdmissionClassId,
  WorkHandlerConfigurationBindingPolicy,
  WorkHandlerRestoreReplayClass,
  WorkHandlerTarget,
  WorkQueueProfileId as RuntimeWorkQueueProfileId,
} from "@heptalogos/runtime-kernel";

export type WorkQueueProfileId = RuntimeWorkQueueProfileId;
export type ResourceAdmissionClassId = RuntimeResourceAdmissionClassId;

export type {
  WorkHandlerConfigurationBindingPolicy,
  WorkHandlerRestoreReplayClass,
  WorkHandlerTarget,
};

export type WorkRetryClass =
  | "transient"
  | "rate-limited"
  | "dependency-unavailable"
  | "not-configured"
  | "policy-blocked"
  | "invalid"
  | "permanent"
  | "external-effect-uncertain";

export type WorkItemState =
  | "PENDING"
  | "RUNNING"
  | "WAITING_DEPENDENCY"
  | "RETRY_WAIT"
  | "WAITING_RESTORE_RECONCILIATION"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "SUPERSEDED";

export type WorkConfigurationBinding =
  | {
      readonly policy: "LATEST_COMPATIBLE_AT_ATTEMPT";
      readonly configRevisionRef?: undefined;
    }
  | {
      readonly policy: "CONFIG_PINNED";
      readonly configRevisionRef: string;
    };

export interface WorkItemOutcomeSucceeded {
  readonly schemaVersion: 1;
  readonly kind: "SUCCEEDED";
  readonly value: CanonicalJsonValue;
}

export interface WorkItemOutcomeFailed {
  readonly schemaVersion: 1;
  readonly kind: "FAILED";
  readonly retryClass: WorkRetryClass;
  readonly reasonCode: string;
}

export interface WorkItemOutcomeCancelled {
  readonly schemaVersion: 1;
  readonly kind: "CANCELLED";
  readonly reasonCode: string;
}

export interface WorkItemOutcomeSuperseded {
  readonly schemaVersion: 1;
  readonly kind: "SUPERSEDED";
  readonly reasonCode: string;
  readonly supersededBy?: WorkItemId;
}

export type WorkItemOutcome =
  | WorkItemOutcomeSucceeded
  | WorkItemOutcomeFailed
  | WorkItemOutcomeCancelled
  | WorkItemOutcomeSuperseded;

export interface WorkItem {
  readonly schemaVersion: 1;
  readonly workItemId: WorkItemId;
  readonly handler: WorkHandlerTarget;
  readonly payload: CanonicalJsonValue;
  readonly queueProfileId: WorkQueueProfileId;
  readonly resourceAdmissionClass: ResourceAdmissionClassId;
  readonly partitionKey?: string;
  readonly priority: number;
  readonly notBefore?: Instant;
  readonly dedupKey?: string;
  readonly createdContinuityEpochId: ContinuityEpochId;
  readonly lineageContextRef: LineageContextRefV1;
  readonly configurationBinding: WorkConfigurationBinding;
  readonly restoreReplayClass: WorkHandlerRestoreReplayClass;
  readonly dispatchRevision: number;
  readonly activeAttemptId?: DispatchAttemptId;
  readonly state: WorkItemState;
  readonly retryClass?: WorkRetryClass;
  readonly stateReasonCode?: string;
  readonly cancelRequestedAt?: Instant;
  readonly cancellationReasonCode?: string;
  readonly supersededBy?: WorkItemId;
  readonly outcome?: WorkItemOutcome;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
}

export type WorkCreationAdmissionDecision =
  | { readonly decision: "ALLOW" }
  | {
      readonly decision: "DELAY";
      readonly notBefore: Instant;
      readonly reasonCode: string;
    }
  | {
      readonly decision: "THROTTLE";
      readonly reasonCode: string;
      readonly notBefore?: Instant;
    }
  | { readonly decision: "REJECT_OPTIONAL"; readonly reasonCode: string }
  | { readonly decision: "REJECT_NEW_WORK"; readonly reasonCode: string };

export type WorkDispatchAdmissionDecision =
  | { readonly decision: "ALLOW" }
  | { readonly decision: "DELAY"; readonly reasonCode: string }
  | { readonly decision: "THROTTLE"; readonly reasonCode: string };

export interface DurableDispatchRequest {
  readonly workItemId: WorkItemId;
  readonly dispatchRevision: number;
  readonly dispatchAttemptId: DispatchAttemptId;
  readonly queueProfileId: WorkQueueProfileId;
  readonly priority: number;
  readonly partitionKey?: string;
  readonly notBefore?: Instant;
}

export interface DurableDispatchPort {
  dispatch(request: DurableDispatchRequest): Promise<void>;
}

export interface NormalizedWorkFailure {
  readonly reasonCode: string;
  readonly detail?: string;
}

export interface WorkErrorClassificationInput {
  readonly workItem: WorkItem;
  readonly failure: NormalizedWorkFailure;
}

export type WorkErrorDecision =
  | {
      readonly kind: "TERMINAL";
      readonly retryClass: WorkRetryClass;
      readonly reasonCode: string;
    }
  | {
      readonly kind: "RETRY";
      readonly retryClass: WorkRetryClass;
      readonly reasonCode: string;
      readonly notBefore: Instant;
    };

export interface WorkErrorClassifier {
  classify(input: WorkErrorClassificationInput): WorkErrorDecision;
}

export interface WorkQueueRuntimeOptions {
  readonly maxInlinePayloadBytes: number;
  readonly maxOutcomeBytes: number;
  readonly reconciliationBatchSize: number;
  readonly antiEntropyIntervalMs: number;
}

export type DispatchAttemptId = ContentDigest<"DispatchAttemptId">;
