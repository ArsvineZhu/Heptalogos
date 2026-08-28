[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / SignalClient

# Interface: SignalClient

Defined in: packages/signal/dist/contracts.d.ts:53

Narrow client surface required by the signal service for connection lifetime control.

## Methods

### connect()

> **connect**(): `Promise`\<`void`>\>

Defined in: packages/signal/dist/contracts.d.ts:55

Establish the notification connection.

#### Returns

`Promise`\<`void`\>

---

### end()

> **end**(): `Promise`\<`void`>\>

Defined in: packages/signal/dist/contracts.d.ts:61

End the connection and release client resources.

#### Returns

`Promise`\<`void`\>

---

### on()

> **on**(`event`, `listener`): `void`

Defined in: packages/signal/dist/contracts.d.ts:59

Register a transport event listener.

#### Parameters

##### event

`"error"` \| `"end"` \| `"notification"`

##### listener

(`value?`) => `void`

#### Returns

`void`

---

### query()

> **query**(`text`): `Promise`\<`void`>\>

Defined in: packages/signal/dist/contracts.d.ts:57

Execute a setup or teardown statement on the notification connection.

#### Parameters

##### text

`string`

#### Returns

`Promise`\<`void`\>
