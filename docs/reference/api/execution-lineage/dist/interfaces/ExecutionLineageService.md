[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / ExecutionLineageService

# Interface: ExecutionLineageService

Defined in: packages/execution-lineage/dist/contracts.d.ts:99

Persists current and Bootstrap lineage through Host-fenced transactions.

## Methods

### completeCurrent()

> **completeCurrent**(`transaction`, `context`, `completion`): `Promise`\<`void`>\>

Defined in: packages/execution-lineage/dist/contracts.d.ts:103

Completes the current Activity with its terminal outcome.

#### Parameters

##### transaction

[`PersistenceMutationTransactionContext`](../../../persistence/dist/interfaces/PersistenceMutationTransactionContext.md)

##### context

[`ExecutionContext`](ExecutionContext.md)

##### completion

[`ActivityCompletion`](ActivityCompletion.md)

#### Returns

`Promise`\<`void`\>

---

### retainBootstrapReference()

> **retainBootstrapReference**(`transaction`, `draft`): `Promise`\<`void`>\>

Defined in: packages/execution-lineage/dist/contracts.d.ts:105

Retains a Bootstrap handoff Activity from its durable journal projection.

#### Parameters

##### transaction

[`PersistenceMutationTransactionContext`](../../../persistence/dist/interfaces/PersistenceMutationTransactionContext.md)

##### draft

[`BootstrapRetainedActivityDraft`](BootstrapRetainedActivityDraft.md)

#### Returns

`Promise`\<`void`\>

---

### retainCurrent()

> **retainCurrent**(`transaction`, `context`): `Promise`\<`void`>\>

Defined in: packages/execution-lineage/dist/contracts.d.ts:101

Retains the current Activity context before its operation proceeds.

#### Parameters

##### transaction

[`PersistenceMutationTransactionContext`](../../../persistence/dist/interfaces/PersistenceMutationTransactionContext.md)

##### context

[`ExecutionContext`](ExecutionContext.md)

#### Returns

`Promise`\<`void`\>
