[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / SignalListener

# Interface: SignalListener

Defined in: packages/signal/dist/contracts.d.ts:17

Receives wakeup hints without treating notifications as durable state.

## Methods

### onBackgroundError()

> **onBackgroundError**(`error`): `void`

Defined in: packages/signal/dist/contracts.d.ts:23

Report a background transport failure to the owning runtime.

#### Parameters

##### error

`unknown`

#### Returns

`void`

---

### onRescanRequired()

> **onRescanRequired**(): `void` \| `Promise`\<`void`>\>

Defined in: packages/signal/dist/contracts.d.ts:21

Ask the consumer to perform a broader scan after a missed or invalid hint.

#### Returns

`void` \| `Promise`\<`void`\>

---

### onWakeup()

> **onWakeup**(): `void` \| `Promise`\<`void`>\>

Defined in: packages/signal/dist/contracts.d.ts:19

Ask the consumer to inspect its durable source of truth.

#### Returns

`void` \| `Promise`\<`void`\>
