[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkAttemptExecutorOptions

# Interface: WorkAttemptExecutorOptions

Defined in: packages/work-queue/dist/attempt-executor.d.ts:20

Dependencies and bounded policy required by the attempt coordinator.

## Properties

### classifier

> `readonly` **classifier**: [`WorkErrorClassifier`](WorkErrorClassifier.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:26

---

### execution

> `readonly` **execution**: [`ExecutionContextRuntime`](../../../execution-lineage/dist/interfaces/ExecutionContextRuntime.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:23

---

### handlerRegistry

> `readonly` **handlerRegistry**: [`WorkHandlerResolver`](WorkHandlerResolver.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:22

---

### lineage

> `readonly` **lineage**: [`ExecutionLineageService`](../../../execution-lineage/dist/interfaces/ExecutionLineageService.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:24

---

### repository

> `readonly` **repository**: [`WorkQueueRepository`](WorkQueueRepository.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:21

---

### runtimeOptions

> `readonly` **runtimeOptions**: [`WorkQueueRuntimeOptions`](WorkQueueRuntimeOptions.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:27

---

### time

> `readonly` **time**: [`TimeService`](../../../time-service/dist/interfaces/TimeService.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:25
