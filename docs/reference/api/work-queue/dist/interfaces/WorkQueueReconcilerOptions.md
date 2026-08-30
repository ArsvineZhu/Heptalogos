[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkQueueReconcilerOptions

# Interface: WorkQueueReconcilerOptions

Defined in: packages/work-queue/dist/reconciler.d.ts:15

Dependencies and bounded policy for the canonical WorkItem projection loop.

## Properties

### admission

> `readonly` **admission**: [`WorkAdmissionPort`](WorkAdmissionPort.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:19

---

### durableDispatch

> `readonly` **durableDispatch**: [`DurableDispatchPort`](DurableDispatchPort.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:17

---

### execution

> `readonly` **execution**: [`ExecutionContextRuntime`](../../../execution-lineage/dist/interfaces/ExecutionContextRuntime.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:21

---

### handlerRegistry

> `readonly` **handlerRegistry**: [`WorkHandlerResolver`](WorkHandlerResolver.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:18

---

### onBackgroundError

> `readonly` **onBackgroundError**: (`error`) => `void`

Defined in: packages/work-queue/dist/reconciler.d.ts:26

#### Parameters

##### error

`unknown`

#### Returns

`void`

---

### recovery?

> `readonly` `optional` **recovery?**: [`WorkQueueRecoveryCoordinator`](WorkQueueRecoveryCoordinator.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:25

Optional engine-consistency lane owned by this scan gate.

---

### repository

> `readonly` **repository**: [`WorkQueueRepository`](WorkQueueRepository.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:16

---

### runtimeOptions

> `readonly` **runtimeOptions**: [`WorkQueueRuntimeOptions`](WorkQueueRuntimeOptions.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:23

---

### signal

> `readonly` **signal**: [`SignalService`](../../../signal/dist/interfaces/SignalService.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:20

---

### time

> `readonly` **time**: [`TimeService`](../../../time-service/dist/interfaces/TimeService.md)

Defined in: packages/work-queue/dist/reconciler.d.ts:22
