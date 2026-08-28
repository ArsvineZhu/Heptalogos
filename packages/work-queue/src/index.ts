/**
 * Public engine-neutral WorkQueue contracts, reconciliation services, and
 * generation-fenced attempt components; the concrete repository is restricted.
 * @packageDocumentation
 */

export {
  createDispatchAttemptId,
  dispatchAttemptIdToWorkflowId,
  parseDispatchAttemptId,
} from "./attempt-identity.js";
export type {
  DispatchAttemptId,
  DurableDispatchPort,
  DurableDispatchRequest,
  DurableAttemptInspectionPort,
  DurableAttemptInspectionRequest,
  DurableAttemptProjection,
  NormalizedWorkFailure,
  ResourceAdmissionClassId,
  WorkCreationAdmissionDecision,
  WorkDispatchAdmissionDecision,
  WorkConfigurationBinding,
  WorkErrorClassificationInput,
  WorkErrorClassifier,
  WorkErrorDecision,
  WorkHandlerConfigurationBindingPolicy,
  WorkHandlerRestoreReplayClass,
  WorkHandlerTarget,
  WorkItem,
  WorkItemOutcome,
  WorkItemOutcomeCancelled,
  WorkItemOutcomeFailed,
  WorkItemOutcomeSucceeded,
  WorkItemOutcomeSuperseded,
  WorkItemState,
  WorkQueueProfileId,
  WorkQueuePartitionLimits,
  WorkQueueProfileCatalog,
  WorkQueueProfileDefinition,
  WorkQueueRateLimit,
  WorkQueueRuntimeOptions,
  WorkRetryClass,
} from "./contracts.js";
export {
  createWorkQueueProfileCatalog,
  isWorkQueueProfilePartitioned,
} from "./contracts.js";
export {
  canTransitionWorkItem,
  createWorkItemStateMachine,
  transitionWorkItemState,
  type WorkItemStateMachine,
  type WorkItemTransitionEvent,
} from "./state-machine.js";
export { workQueueProblem } from "./problems.js";
export {
  applyWorkAdmissionDecision,
  applyWorkDispatchAdmissionDecision,
  type WorkAdmissionPort,
  type WorkAdmissionRequest,
  type WorkDispatchAdmissionRequest,
} from "./admission.js";
export {
  WORK_AVAILABLE_TOPIC,
  createWorkQueueService,
  type WorkCreationRequest,
  type WorkCreationResult,
  type WorkHandlerResolver,
  type WorkQueueService,
  type WorkQueueServiceOptions,
  validateWorkQueueRuntimeOptions,
} from "./service.js";
export {
  createWorkQueueReconciler,
  type ReconciliationScanResult,
  type WorkQueueReconciler,
  type WorkQueueReconcilerOptions,
} from "./reconciler.js";
export {
  createWorkAttemptExecutor,
  type WorkAttemptExecutionResult,
  type WorkAttemptExecutionStatus,
  type WorkAttemptExecutor,
  type WorkAttemptExecutorOptions,
} from "./attempt-executor.js";
export { type WorkQueueRepository } from "./repository.js";
export {
  createWorkQueueRecoveryCoordinator,
  type WorkQueueRecoveryCoordinator,
  type WorkQueueRecoveryScanResult,
} from "./recovery-coordinator.js";
