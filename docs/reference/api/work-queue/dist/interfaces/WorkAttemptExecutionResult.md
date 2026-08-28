[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkAttemptExecutionResult

# Interface: WorkAttemptExecutionResult

Defined in: packages/work-queue/dist/attempt-executor.d.ts:14

Outcome of executing or replaying one durable dispatch attempt.

## Properties

### item?

> `readonly` `optional` **item?**: [`WorkItem`](WorkItem.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:16

---

### outcome?

> `readonly` `optional` **outcome?**: [`WorkItemOutcome`](../type-aliases/WorkItemOutcome.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:17

---

### status

> `readonly` **status**: [`WorkAttemptExecutionStatus`](../type-aliases/WorkAttemptExecutionStatus.md)

Defined in: packages/work-queue/dist/attempt-executor.d.ts:15
