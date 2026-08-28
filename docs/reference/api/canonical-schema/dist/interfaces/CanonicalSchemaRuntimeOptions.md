[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [canonical-schema/dist](../README.md) / CanonicalSchemaRuntimeOptions

# Interface: CanonicalSchemaRuntimeOptions

Defined in: packages/canonical-schema/dist/contracts.d.ts:9

Supplies bounded connection and diagnostic policy for schema initialization.

## Properties

### connectionTimeoutMs

> `readonly` **connectionTimeoutMs**: `number`

Defined in: packages/canonical-schema/dist/contracts.d.ts:10

---

### idleInTransactionSessionTimeoutMs

> `readonly` **idleInTransactionSessionTimeoutMs**: `number`

Defined in: packages/canonical-schema/dist/contracts.d.ts:13

---

### lockTimeoutMs

> `readonly` **lockTimeoutMs**: `number`

Defined in: packages/canonical-schema/dist/contracts.d.ts:12

---

### onBackgroundError

> `readonly` **onBackgroundError**: (`error`) => `void`

Defined in: packages/canonical-schema/dist/contracts.d.ts:14

#### Parameters

##### error

`unknown`

#### Returns

`void`

---

### statementTimeoutMs

> `readonly` **statementTimeoutMs**: `number`

Defined in: packages/canonical-schema/dist/contracts.d.ts:11
