[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / runtime-kernel/dist

# runtime-kernel/dist

Public Runtime Kernel contracts for graph planning, registries, readiness,
generation fencing, and lifecycle supervision above RuntimeSubstrate.

## Classes

- [CapabilityRegistry](classes/CapabilityRegistry.md)
- [ContractCompatibilityRegistry](classes/ContractCompatibilityRegistry.md)
- [GenerationFence](classes/GenerationFence.md)
- [MicroSystemSupervisor](classes/MicroSystemSupervisor.md)
- [RuntimeGraph](classes/RuntimeGraph.md)
- [RuntimeReconciler](classes/RuntimeReconciler.md)
- [ServiceRegistry](classes/ServiceRegistry.md)
- [WorkHandlerRegistry](classes/WorkHandlerRegistry.md)

## Interfaces

- [CapabilityLease](interfaces/CapabilityLease.md)
- [CapabilityProvisionDescriptor](interfaces/CapabilityProvisionDescriptor.md)
- [CapabilityRequirement](interfaces/CapabilityRequirement.md)
- [DesiredRuntimeSnapshot](interfaces/DesiredRuntimeSnapshot.md)
- [GenerationInvocationReservation](interfaces/GenerationInvocationReservation.md)
- [MicroSystemActivationContext](interfaces/MicroSystemActivationContext.md)
- [MicroSystemDefinition](interfaces/MicroSystemDefinition.md)
- [MicroSystemSupervisorOptions](interfaces/MicroSystemSupervisorOptions.md)
- [ReadinessProfileDefinition](interfaces/ReadinessProfileDefinition.md)
- [ReadinessResult](interfaces/ReadinessResult.md)
- [ReconcileInput](interfaces/ReconcileInput.md)
- [ReconcilePlan](interfaces/ReconcilePlan.md)
- [RuntimeGenerationRef](interfaces/RuntimeGenerationRef.md)
- [RuntimeGraphPlan](interfaces/RuntimeGraphPlan.md)
- [RuntimeLifecycleLineage](interfaces/RuntimeLifecycleLineage.md)
- [RuntimeLifecycleLineageOptions](interfaces/RuntimeLifecycleLineageOptions.md)
- [RuntimeOwnerLifecycle](interfaces/RuntimeOwnerLifecycle.md)
- [RuntimeQuiescenceLease](interfaces/RuntimeQuiescenceLease.md)
- [RuntimeWorkHandler](interfaces/RuntimeWorkHandler.md)
- [RuntimeWorkHandlerInvocation](interfaces/RuntimeWorkHandlerInvocation.md)
- [RuntimeWorkHandlerInvocationReservation](interfaces/RuntimeWorkHandlerInvocationReservation.md)
- [RuntimeWorkHandlerLease](interfaces/RuntimeWorkHandlerLease.md)
- [RuntimeWorkHandlerResult](interfaces/RuntimeWorkHandlerResult.md)
- [ServiceLease](interfaces/ServiceLease.md)
- [ServiceProvisionDescriptor](interfaces/ServiceProvisionDescriptor.md)
- [ServiceRequirement](interfaces/ServiceRequirement.md)
- [WorkHandlerPayloadContract](interfaces/WorkHandlerPayloadContract.md)
- [WorkHandlerProvisionDescriptor](interfaces/WorkHandlerProvisionDescriptor.md)
- [WorkHandlerTarget](interfaces/WorkHandlerTarget.md)

## Type Aliases

- [ContractVersion](type-aliases/ContractVersion.md)
- [ContractVersionRange](type-aliases/ContractVersionRange.md)
- [GenerationFenceState](type-aliases/GenerationFenceState.md)
- [MicroSystemActualState](type-aliases/MicroSystemActualState.md)
- [MicroSystemDesiredState](type-aliases/MicroSystemDesiredState.md)
- [MicroSystemRole](type-aliases/MicroSystemRole.md)
- [OperatingMode](type-aliases/OperatingMode.md)
- [ReadinessState](type-aliases/ReadinessState.md)
- [ReconcileAction](type-aliases/ReconcileAction.md)
- [ResourceAdmissionClassId](type-aliases/ResourceAdmissionClassId.md)
- [RuntimeContractData](type-aliases/RuntimeContractData.md)
- [RuntimeContractMethod](type-aliases/RuntimeContractMethod.md)
- [RuntimeContractObject](type-aliases/RuntimeContractObject.md)
- [WorkHandlerConfigurationBindingPolicy](type-aliases/WorkHandlerConfigurationBindingPolicy.md)
- [WorkHandlerRestoreReplayClass](type-aliases/WorkHandlerRestoreReplayClass.md)
- [WorkQueueProfileId](type-aliases/WorkQueueProfileId.md)

## Variables

- [CONTRACT\_VERSION\_PATTERN](variables/CONTRACT_VERSION_PATTERN.md)

## Functions

- [canonicalizeWorkHandlerDescriptor](functions/canonicalizeWorkHandlerDescriptor.md)
- [createContractVersion](functions/createContractVersion.md)
- [createGenerationFence](functions/createGenerationFence.md)
- [createRuntimeLifecycleLineage](functions/createRuntimeLifecycleLineage.md)
- [evaluateReadiness](functions/evaluateReadiness.md)
- [exactContract](functions/exactContract.md)
- [parseContractVersion](functions/parseContractVersion.md)
- [runtimeKernelProblem](functions/runtimeKernelProblem.md)
- [workHandlerDescriptorsEqual](functions/workHandlerDescriptorsEqual.md)
