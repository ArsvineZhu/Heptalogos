[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [persistence/dist](../README.md) / PersistenceRuntimeOptions

# Interface: PersistenceRuntimeOptions

Defined in: packages/persistence/dist/contracts.d.ts:36

Bounds pool and transaction behavior and receives background errors.

## Properties

### connectionTimeoutMs

> `readonly` **connectionTimeoutMs**: `number`

Defined in: packages/persistence/dist/contracts.d.ts:39

---

### idleInTransactionSessionTimeoutMs

> `readonly` **idleInTransactionSessionTimeoutMs**: `number`

Defined in: packages/persistence/dist/contracts.d.ts:42

---

### idleTimeoutMs

> `readonly` **idleTimeoutMs**: `number`

Defined in: packages/persistence/dist/contracts.d.ts:38

---

### lockTimeoutMs

> `readonly` **lockTimeoutMs**: `number`

Defined in: packages/persistence/dist/contracts.d.ts:41

---

### maxConnections

> `readonly` **maxConnections**: `number`

Defined in: packages/persistence/dist/contracts.d.ts:37

---

### onBackgroundError

> `readonly` **onBackgroundError**: (`error`) => `void`

Defined in: packages/persistence/dist/contracts.d.ts:43

#### Parameters

##### error

`unknown`

#### Returns

`void`

---

### statementTimeoutMs

> `readonly` **statementTimeoutMs**: `number`

Defined in: packages/persistence/dist/contracts.d.ts:40
