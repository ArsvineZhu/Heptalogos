[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / PostgresSignalRuntimeOptions

# Interface: PostgresSignalRuntimeOptions

Defined in: packages/signal/dist/contracts.d.ts:31

Bounds reconnect behavior and routes transport failures to the runtime owner.

## Properties

### clientFactory?

> `readonly` `optional` **clientFactory?**: [`SignalClientFactory`](SignalClientFactory.md)

Defined in: packages/signal/dist/contracts.d.ts:36

---

### connectionTimeoutMs

> `readonly` **connectionTimeoutMs**: `number`

Defined in: packages/signal/dist/contracts.d.ts:32

---

### onBackgroundError

> `readonly` **onBackgroundError**: (`error`) => `void`

Defined in: packages/signal/dist/contracts.d.ts:35

#### Parameters

##### error

`unknown`

#### Returns

`void`

---

### reconnectBaseDelayMs

> `readonly` **reconnectBaseDelayMs**: `number`

Defined in: packages/signal/dist/contracts.d.ts:33

---

### reconnectMaxDelayMs

> `readonly` **reconnectMaxDelayMs**: `number`

Defined in: packages/signal/dist/contracts.d.ts:34
