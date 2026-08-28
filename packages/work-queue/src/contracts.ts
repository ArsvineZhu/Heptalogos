/**
 * Defines canonical WorkItem, dispatch, retry, handler, and repository contracts
 * without coupling durable work to DBOS or a particular execution engine.
 * @module contracts
 */

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

/** Runtime-owned queue profile identity used by durable work. */
export type WorkQueueProfileId = RuntimeWorkQueueProfileId;
/** Runtime-owned resource admission class identity used by queue policy. */
export type ResourceAdmissionClassId = RuntimeResourceAdmissionClassId;

export type {
  WorkHandlerConfigurationBindingPolicy,
  WorkHandlerRestoreReplayClass,
  WorkHandlerTarget,
};

/** Stable failure classes that determine retry and terminal behavior. */
export type WorkRetryClass =
  | "transient"
  | "rate-limited"
  | "dependency-unavailable"
  | "not-configured"
  | "policy-blocked"
  | "invalid"
  | "permanent"
  | "external-effect-uncertain";

/** Durable lifecycle states for one WorkItem. */
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

/** Selects whether a handler attempt resolves current or pinned configuration. */
export type WorkConfigurationBinding =
  | {
      readonly policy: "LATEST_COMPATIBLE_AT_ATTEMPT";
      readonly configRevisionRef?: undefined;
    }
  | {
      readonly policy: "CONFIG_PINNED";
      readonly configRevisionRef: string;
    };

/** Durable success outcome containing the bounded handler value. */
export interface WorkItemOutcomeSucceeded {
  readonly schemaVersion: 1;
  readonly kind: "SUCCEEDED";
  readonly value: CanonicalJsonValue;
}

/** Durable failure outcome with the classifier's retry category and reason. */
export interface WorkItemOutcomeFailed {
  readonly schemaVersion: 1;
  readonly kind: "FAILED";
  readonly retryClass: WorkRetryClass;
  readonly reasonCode: string;
}

/** Durable cancellation outcome recorded when work is intentionally stopped. */
export interface WorkItemOutcomeCancelled {
  readonly schemaVersion: 1;
  readonly kind: "CANCELLED";
  readonly reasonCode: string;
}

/** Durable outcome identifying work replaced by another WorkItem. */
export interface WorkItemOutcomeSuperseded {
  readonly schemaVersion: 1;
  readonly kind: "SUPERSEDED";
  readonly reasonCode: string;
  readonly supersededBy?: WorkItemId;
}

/** Union of terminal outcomes persisted for a WorkItem. */
export type WorkItemOutcome =
  | WorkItemOutcomeSucceeded
  | WorkItemOutcomeFailed
  | WorkItemOutcomeCancelled
  | WorkItemOutcomeSuperseded;

/** Canonical durable record for admitted work and its current dispatch state. */
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

/** Policy result applied while creating a WorkItem. */
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

/** Policy result applied immediately before dispatch. */
export type WorkDispatchAdmissionDecision =
  | { readonly decision: "ALLOW" }
  | { readonly decision: "DELAY"; readonly reasonCode: string }
  | { readonly decision: "THROTTLE"; readonly reasonCode: string };

/** Immutable dispatch envelope passed to the durable execution boundary. */
export interface DurableDispatchRequest {
  readonly workItemId: WorkItemId;
  readonly dispatchRevision: number;
  readonly dispatchAttemptId: DispatchAttemptId;
  readonly queueProfileId: WorkQueueProfileId;
  readonly priority: number;
  readonly partitionKey?: string;
  readonly notBefore?: Instant;
}

/** Port used to submit a previously admitted dispatch request. */
export interface DurableDispatchPort {
  /** Submit the request while preserving its revision and attempt identity. */
  dispatch(request: DurableDispatchRequest): Promise<void>;
}

/** Engine-independent failure shape consumed by the work classifier. */
export interface NormalizedWorkFailure {
  readonly reasonCode: string;
  readonly detail?: string;
}

/** Work item and normalized failure supplied to retry classification. */
export interface WorkErrorClassificationInput {
  readonly workItem: WorkItem;
  readonly failure: NormalizedWorkFailure;
}

/** Classifier result selecting terminal completion or a retry time. */
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

/** Converts handler failures into the queue's durable retry decision. */
export interface WorkErrorClassifier {
  /** Classify one failed attempt without mutating queue state. */
  classify(input: WorkErrorClassificationInput): WorkErrorDecision;
}

/** Bounded runtime policy controlling payloads, scans, and anti-entropy. */
export interface WorkQueueRuntimeOptions {
  readonly maxInlinePayloadBytes: number;
  readonly maxOutcomeBytes: number;
  readonly reconciliationBatchSize: number;
  readonly antiEntropyIntervalMs: number;
}

/** Content-derived identity for one WorkItem dispatch revision. */
export type DispatchAttemptId = ContentDigest<"DispatchAttemptId">;
