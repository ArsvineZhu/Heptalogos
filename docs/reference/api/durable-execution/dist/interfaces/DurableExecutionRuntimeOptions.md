[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [durable-execution/dist](../README.md) / DurableExecutionRuntimeOptions

# Interface: DurableExecutionRuntimeOptions

Defined in: packages/durable-execution/dist/contracts.d.ts:65

Configures one Host-bound DurableExecution runtime.

## Properties

### durableCodeVersion

> `readonly` **durableCodeVersion**: [`DurableCodeVersion`](../../../foundation-contracts/dist/type-aliases/DurableCodeVersion.md)

Defined in: packages/durable-execution/dist/contracts.d.ts:66

---

### maxConcurrentQueueDispatches

> `readonly` **maxConcurrentQueueDispatches**: `number`

Defined in: packages/durable-execution/dist/contracts.d.ts:69

---

### onBackgroundError

> `readonly` **onBackgroundError**: (`error`) => `void`

Defined in: packages/durable-execution/dist/contracts.d.ts:77

#### Parameters

##### error

`unknown`

#### Returns

`void`

---

### onTerminalFailure

> `readonly` **onTerminalFailure**: (`error`) => `void` \| `Promise`\<`void`>\>

Defined in: packages/durable-execution/dist/contracts.d.ts:76

Fence the Host when an irreversible provider failure cannot be restored.

#### Parameters

##### error

`unknown`

#### Returns

`void` \| `Promise`\<`void`\>

---

### profiles

> `readonly` **profiles**: [`WorkQueueProfileCatalog`](../../../work-queue/dist/interfaces/WorkQueueProfileCatalog.md)

Defined in: packages/durable-execution/dist/contracts.d.ts:72

---

### quiescence?

> `readonly` `optional` **quiescence?**: [`DurableExecutionQuiescenceCoordinator`](DurableExecutionQuiescenceCoordinator.md)

Defined in: packages/durable-execution/dist/contracts.d.ts:74

Upstream owner used by authentic Host compositions; preparation is atomic.

---

### shutdownDrainTimeoutMs

> `readonly` **shutdownDrainTimeoutMs**: `number`

Defined in: packages/durable-execution/dist/contracts.d.ts:71

---

### systemDatabasePollingConcurrency

> `readonly` **systemDatabasePollingConcurrency**: `number`

Defined in: packages/durable-execution/dist/contracts.d.ts:68

---

### systemPool

> `readonly` **systemPool**: [`DurableExecutionPoolOptions`](DurableExecutionPoolOptions.md)

Defined in: packages/durable-execution/dist/contracts.d.ts:67

---

### workflowMaxRecoveryAttempts

> `readonly` **workflowMaxRecoveryAttempts**: `number`

Defined in: packages/durable-execution/dist/contracts.d.ts:70
