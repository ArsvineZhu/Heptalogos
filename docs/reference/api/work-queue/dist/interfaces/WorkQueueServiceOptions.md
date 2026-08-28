[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkQueueServiceOptions

# Interface: WorkQueueServiceOptions

Defined in: packages/work-queue/dist/service.d.ts:40

Service dependencies, policy, and reporting hooks for durable work creation.

## Properties

### admission

> `readonly` **admission**: [`WorkAdmissionPort`](WorkAdmissionPort.md)

Defined in: packages/work-queue/dist/service.d.ts:48

---

### execution

> `readonly` **execution**: [`ExecutionContextRuntime`](../../../execution-lineage/dist/interfaces/ExecutionContextRuntime.md)

Defined in: packages/work-queue/dist/service.d.ts:44

---

### handlerRegistry

> `readonly` **handlerRegistry**: [`WorkHandlerResolver`](WorkHandlerResolver.md)

Defined in: packages/work-queue/dist/service.d.ts:43

---

### lineage

> `readonly` **lineage**: [`ExecutionLineageService`](../../../execution-lineage/dist/interfaces/ExecutionLineageService.md)

Defined in: packages/work-queue/dist/service.d.ts:45

---

### onBackgroundError

> `readonly` **onBackgroundError**: (`error`) => `void`

Defined in: packages/work-queue/dist/service.d.ts:50

#### Parameters

##### error

`unknown`

#### Returns

`void`

---

### persistence

> `readonly` **persistence**: [`PersistenceService`](../../../persistence/dist/interfaces/PersistenceService.md)

Defined in: packages/work-queue/dist/service.d.ts:41

---

### repository?

> `readonly` `optional` **repository?**: [`WorkQueueRepository`](WorkQueueRepository.md)

Defined in: packages/work-queue/dist/service.d.ts:42

---

### runtimeOptions

> `readonly` **runtimeOptions**: [`WorkQueueRuntimeOptions`](WorkQueueRuntimeOptions.md)

Defined in: packages/work-queue/dist/service.d.ts:49

---

### scheduleReconciliation?

> `readonly` `optional` **scheduleReconciliation?**: () => `void` \| `Promise`\<`void`>\>

Defined in: packages/work-queue/dist/service.d.ts:51

#### Returns

`void` \| `Promise`\<`void`\>

---

### signalPublisher

> `readonly` **signalPublisher**: [`SignalPublisher`](../../../signal/dist/interfaces/SignalPublisher.md)

Defined in: packages/work-queue/dist/service.d.ts:47

---

### time

> `readonly` **time**: [`TimeService`](../../../time-service/dist/interfaces/TimeService.md)

Defined in: packages/work-queue/dist/service.d.ts:46
