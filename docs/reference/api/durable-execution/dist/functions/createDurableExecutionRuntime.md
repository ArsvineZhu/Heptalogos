[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [durable-execution/dist](../README.md) / createDurableExecutionRuntime

# Function: createDurableExecutionRuntime()

> **createDurableExecutionRuntime**(`authority`, `options`, `executor`): [`DurableExecutionRuntime`](../interfaces/DurableExecutionRuntime.md)

Defined in: packages/durable-execution/dist/dbos-runtime.d.ts:41

Creates the Host-bound runtime with the real DBOS and caller-owned pool.

## Parameters

### authority

[`HostDurableExecutionAuthority`](../../../host-ownership/dist/interfaces/HostDurableExecutionAuthority.md)

### options

[`DurableExecutionRuntimeOptions`](../interfaces/DurableExecutionRuntimeOptions.md)

### executor

[`WorkAttemptExecutor`](../../../work-queue/dist/interfaces/WorkAttemptExecutor.md)

## Returns

[`DurableExecutionRuntime`](../interfaces/DurableExecutionRuntime.md)
