[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / createPostgresSignalService

# Function: createPostgresSignalService()

> **createPostgresSignalService**(`authority`, `options`): [`SignalService`](../interfaces/SignalService.md)

Defined in: packages/signal/dist/postgres-signal.d.ts:45

Create the PostgreSQL-backed signal service behind the narrow SignalService contract.

## Parameters

### authority

[`HostPersistenceAuthority`](../../../host-ownership/dist/interfaces/HostPersistenceAuthority.md)

### options

[`PostgresSignalRuntimeOptions`](../interfaces/PostgresSignalRuntimeOptions.md)

## Returns

[`SignalService`](../interfaces/SignalService.md)
