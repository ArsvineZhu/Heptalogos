[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / work-queue/dist

# work-queue/dist

Public engine-neutral WorkQueue contracts, reconciliation services, and
generation-fenced attempt components; the concrete repository is restricted.

## Interfaces

- [DurableDispatchPort](interfaces/DurableDispatchPort.md)
- [DurableDispatchRequest](interfaces/DurableDispatchRequest.md)
- [NormalizedWorkFailure](interfaces/NormalizedWorkFailure.md)
- [ReconciliationScanResult](interfaces/ReconciliationScanResult.md)
- [WorkAdmissionPort](interfaces/WorkAdmissionPort.md)
- [WorkAdmissionRequest](interfaces/WorkAdmissionRequest.md)
- [WorkAttemptExecutionResult](interfaces/WorkAttemptExecutionResult.md)
- [WorkAttemptExecutor](interfaces/WorkAttemptExecutor.md)
- [WorkAttemptExecutorOptions](interfaces/WorkAttemptExecutorOptions.md)
- [WorkCreationRequest](interfaces/WorkCreationRequest.md)
- [WorkCreationResult](interfaces/WorkCreationResult.md)
- [WorkDispatchAdmissionRequest](interfaces/WorkDispatchAdmissionRequest.md)
- [WorkErrorClassificationInput](interfaces/WorkErrorClassificationInput.md)
- [WorkErrorClassifier](interfaces/WorkErrorClassifier.md)
- [WorkHandlerResolver](interfaces/WorkHandlerResolver.md)
- [WorkItem](interfaces/WorkItem.md)
- [WorkItemOutcomeCancelled](interfaces/WorkItemOutcomeCancelled.md)
- [WorkItemOutcomeFailed](interfaces/WorkItemOutcomeFailed.md)
- [WorkItemOutcomeSucceeded](interfaces/WorkItemOutcomeSucceeded.md)
- [WorkItemOutcomeSuperseded](interfaces/WorkItemOutcomeSuperseded.md)
- [WorkItemStateMachine](interfaces/WorkItemStateMachine.md)
- [WorkQueueReconciler](interfaces/WorkQueueReconciler.md)
- [WorkQueueReconcilerOptions](interfaces/WorkQueueReconcilerOptions.md)
- [WorkQueueRepository](interfaces/WorkQueueRepository.md)
- [WorkQueueRuntimeOptions](interfaces/WorkQueueRuntimeOptions.md)
- [WorkQueueService](interfaces/WorkQueueService.md)
- [WorkQueueServiceOptions](interfaces/WorkQueueServiceOptions.md)

## Type Aliases

- [DispatchAttemptId](type-aliases/DispatchAttemptId.md)
- [ResourceAdmissionClassId](type-aliases/ResourceAdmissionClassId.md)
- [WorkAttemptExecutionStatus](type-aliases/WorkAttemptExecutionStatus.md)
- [WorkConfigurationBinding](type-aliases/WorkConfigurationBinding.md)
- [WorkCreationAdmissionDecision](type-aliases/WorkCreationAdmissionDecision.md)
- [WorkDispatchAdmissionDecision](type-aliases/WorkDispatchAdmissionDecision.md)
- [WorkErrorDecision](type-aliases/WorkErrorDecision.md)
- [WorkItemOutcome](type-aliases/WorkItemOutcome.md)
- [WorkItemState](type-aliases/WorkItemState.md)
- [WorkItemTransitionEvent](type-aliases/WorkItemTransitionEvent.md)
- [WorkQueueProfileId](type-aliases/WorkQueueProfileId.md)
- [WorkRetryClass](type-aliases/WorkRetryClass.md)

## Variables

- [WORK\_AVAILABLE\_TOPIC](variables/WORK_AVAILABLE_TOPIC.md)

## Functions

- [applyWorkAdmissionDecision](functions/applyWorkAdmissionDecision.md)
- [applyWorkDispatchAdmissionDecision](functions/applyWorkDispatchAdmissionDecision.md)
- [canTransitionWorkItem](functions/canTransitionWorkItem.md)
- [createDispatchAttemptId](functions/createDispatchAttemptId.md)
- [createWorkAttemptExecutor](functions/createWorkAttemptExecutor.md)
- [createWorkItemStateMachine](functions/createWorkItemStateMachine.md)
- [createWorkQueueReconciler](functions/createWorkQueueReconciler.md)
- [createWorkQueueService](functions/createWorkQueueService.md)
- [dispatchAttemptIdToWorkflowId](functions/dispatchAttemptIdToWorkflowId.md)
- [parseDispatchAttemptId](functions/parseDispatchAttemptId.md)
- [transitionWorkItemState](functions/transitionWorkItemState.md)
- [validateWorkQueueRuntimeOptions](functions/validateWorkQueueRuntimeOptions.md)
- [workQueueProblem](functions/workQueueProblem.md)

## References

### WorkHandlerConfigurationBindingPolicy

Re-exports [WorkHandlerConfigurationBindingPolicy](../../runtime-kernel/dist/type-aliases/WorkHandlerConfigurationBindingPolicy.md)

---

### WorkHandlerRestoreReplayClass

Re-exports [WorkHandlerRestoreReplayClass](../../runtime-kernel/dist/type-aliases/WorkHandlerRestoreReplayClass.md)

---

### WorkHandlerTarget

Re-exports [WorkHandlerTarget](../../runtime-kernel/dist/interfaces/WorkHandlerTarget.md)
