[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / SignalPublisher

# Interface: SignalPublisher

Defined in: packages/signal/dist/contracts.d.ts:69

Publishes a transaction-scoped wakeup after the durable mutation is accepted.

## Methods

### publish()

> **publish**(`transaction`, `topic`): `Promise`\<`void`>\>

Defined in: packages/signal/dist/contracts.d.ts:71

Enqueue a topic notification in the supplied persistence transaction.

#### Parameters

##### transaction

[`PersistenceMutationTransactionContext`](../../../persistence/dist/interfaces/PersistenceMutationTransactionContext.md)

##### topic

[`SignalTopic`](../type-aliases/SignalTopic.md)

#### Returns

`Promise`\<`void`\>
