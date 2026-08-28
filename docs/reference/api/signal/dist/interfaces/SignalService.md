[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / SignalService

# Interface: SignalService

Defined in: packages/signal/dist/contracts.d.ts:26

Provides subscriptions to the repository's bounded signal transport.

## Methods

### subscribe()

> **subscribe**(`topic`, `listener`): `Promise`\<[`SignalSubscription`](SignalSubscription.md)>\>

Defined in: packages/signal/dist/contracts.d.ts:28

Subscribe a listener to a topic until its subscription is closed.

#### Parameters

##### topic

[`SignalTopic`](../type-aliases/SignalTopic.md)

##### listener

[`SignalListener`](SignalListener.md)

#### Returns

`Promise`\<[`SignalSubscription`](SignalSubscription.md)\>
