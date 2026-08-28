[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [persistence/dist](../README.md) / createPersistenceService

# Function: createPersistenceService()

> **createPersistenceService**(`authority`, `options`, `executionContextProvider`): [`PersistenceService`](../interfaces/PersistenceService.md)

Defined in: packages/persistence/dist/persistence-service.d.ts:19

Creates the production persistence service over a Host-authorized pool.

## Parameters

### authority

[`HostPersistenceAuthority`](../../../host-ownership/dist/interfaces/HostPersistenceAuthority.md)

### options

[`PersistenceRuntimeOptions`](../interfaces/PersistenceRuntimeOptions.md)

### executionContextProvider

[`PersistenceExecutionContextProvider`](../interfaces/PersistenceExecutionContextProvider.md)

## Returns

[`PersistenceService`](../interfaces/PersistenceService.md)
