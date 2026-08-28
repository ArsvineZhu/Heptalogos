[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [persistence/dist](../README.md) / PersistenceService

# Interface: PersistenceService

Defined in: packages/persistence/dist/contracts.d.ts:48

Host-fenced persistence service used by Foundation semantic owners.

## Properties

### state

> `readonly` **state**: [`PersistenceServiceState`](../type-aliases/PersistenceServiceState.md)

Defined in: packages/persistence/dist/contracts.d.ts:49

## Methods

### close()

> **close**(): `Promise`\<`void`>\>

Defined in: packages/persistence/dist/contracts.d.ts:55

Drains in-flight work and closes database resources.

#### Returns

`Promise`\<`void`\>

---

### mutate()

> **mutate**\<`T`>\>(`operation`): `Promise`\<`T`>\>

Defined in: packages/persistence/dist/contracts.d.ts:53

Runs a canonical mutation transaction with current execution identity.

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

(`context`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### read()

> **read**\<`T`>\>(`operation`): `Promise`\<`T`>\>

Defined in: packages/persistence/dist/contracts.d.ts:51

Runs a read transaction without requiring mutation identity.

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

(`context`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
