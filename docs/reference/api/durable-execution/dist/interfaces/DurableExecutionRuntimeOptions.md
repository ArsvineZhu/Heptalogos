[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [durable-execution/dist](../README.md) / DurableExecutionRuntimeOptions

# Interface: DurableExecutionRuntimeOptions

Defined in: packages/durable-execution/dist/contracts.d.ts:55

Configures one Host-bound DurableExecution runtime.

## Properties

### durableCodeVersion

> `readonly` **durableCodeVersion**: [`DurableCodeVersion`](../../../foundation-contracts/dist/type-aliases/DurableCodeVersion.md)

Defined in: packages/durable-execution/dist/contracts.d.ts:56

---

### maxConcurrentQueueDispatches

> `readonly` **maxConcurrentQueueDispatches**: `number`

Defined in: packages/durable-execution/dist/contracts.d.ts:59

---

### onBackgroundError

> `readonly` **onBackgroundError**: (`error`) => `void`

Defined in: packages/durable-execution/dist/contracts.d.ts:63

#### Parameters

##### error

`unknown`

#### Returns

`void`

---

### profiles

> `readonly` **profiles**: [`WorkQueueProfileCatalog`](../../../work-queue/dist/interfaces/WorkQueueProfileCatalog.md)

Defined in: packages/durable-execution/dist/contracts.d.ts:62

---

### shutdownDrainTimeoutMs

> `readonly` **shutdownDrainTimeoutMs**: `number`

Defined in: packages/durable-execution/dist/contracts.d.ts:61

---

### systemDatabasePollingConcurrency

> `readonly` **systemDatabasePollingConcurrency**: `number`

Defined in: packages/durable-execution/dist/contracts.d.ts:58

---

### systemPool

> `readonly` **systemPool**: [`DurableExecutionPoolOptions`](DurableExecutionPoolOptions.md)

Defined in: packages/durable-execution/dist/contracts.d.ts:57

---

### workflowMaxRecoveryAttempts

> `readonly` **workflowMaxRecoveryAttempts**: `number`

Defined in: packages/durable-execution/dist/contracts.d.ts:60
