[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkAttemptExecutor

# Interface: WorkAttemptExecutor

Defined in: packages/work-queue/dist/attempt-executor.d.ts:30

Coordinates one WorkItem attempt through admission, execution, and persistence.

## Methods

### execute()

> **execute**(`workItemId`, `expectedRevision`): `Promise`\<[`WorkAttemptExecutionResult`](WorkAttemptExecutionResult.md)>\>

Defined in: packages/work-queue/dist/attempt-executor.d.ts:32

Execute the expected revision or return a fenced/replay status.

#### Parameters

##### workItemId

[`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

##### expectedRevision

`number`

#### Returns

`Promise`\<[`WorkAttemptExecutionResult`](WorkAttemptExecutionResult.md)\>
