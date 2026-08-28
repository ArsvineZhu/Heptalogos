[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / execution-lineage/dist

# execution-lineage/dist

Public execution-lineage contracts, providers, persistence adapters, and
handoff projections for causal Foundation context propagation.

## Interfaces

- [ActivityCompletion](interfaces/ActivityCompletion.md)
- [ActivityLink](interfaces/ActivityLink.md)
- [ActivityRequest](interfaces/ActivityRequest.md)
- [ActivityTelemetryCorrelation](interfaces/ActivityTelemetryCorrelation.md)
- [BootstrapHandoffProjection](interfaces/BootstrapHandoffProjection.md)
- [BootstrapHandoffProjectionInput](interfaces/BootstrapHandoffProjectionInput.md)
- [BootstrapJournalCheckpointLike](interfaces/BootstrapJournalCheckpointLike.md)
- [BootstrapRetainedActivityDraft](interfaces/BootstrapRetainedActivityDraft.md)
- [ExecutionContext](interfaces/ExecutionContext.md)
- [ExecutionContextRuntime](interfaces/ExecutionContextRuntime.md)
- [ExecutionLineageService](interfaces/ExecutionLineageService.md)
- [HostExecutionOrigin](interfaces/HostExecutionOrigin.md)
- [LineageContextRefV1](interfaces/LineageContextRefV1.md)

## Type Aliases

- [ActivityImportance](type-aliases/ActivityImportance.md)
- [BootstrapHandoffStatus](type-aliases/BootstrapHandoffStatus.md)
- [LineageContextRef](type-aliases/LineageContextRef.md)

## Functions

- [createExecutionContextRuntime](functions/createExecutionContextRuntime.md)
- [createExecutionLineageService](functions/createExecutionLineageService.md)
- [createPersistenceExecutionContextProvider](functions/createPersistenceExecutionContextProvider.md)
- [decodeLineageContextRef](functions/decodeLineageContextRef.md)
- [encodeLineageContextRef](functions/encodeLineageContextRef.md)
- [projectBootstrapHandoff](functions/projectBootstrapHandoff.md)
