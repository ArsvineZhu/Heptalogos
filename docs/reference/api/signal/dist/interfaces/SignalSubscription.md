[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / SignalSubscription

# Interface: SignalSubscription

Defined in: packages/signal/dist/contracts.d.ts:12

Owns one listener registration and releases its client resources on close.

## Methods

### close()

> **close**(): `Promise`\<`void`>\>

Defined in: packages/signal/dist/contracts.d.ts:14

Stop delivery and await cleanup of the underlying listener.

#### Returns

`Promise`\<`void`\>
