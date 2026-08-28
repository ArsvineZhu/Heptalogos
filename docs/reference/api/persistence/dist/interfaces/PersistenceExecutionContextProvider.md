[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [persistence/dist](../README.md) / PersistenceExecutionContextProvider

# Interface: PersistenceExecutionContextProvider

Defined in: packages/persistence/dist/contracts.d.ts:17

Resolves current execution metadata for mutation admission.

## Methods

### current()

> **current**(): [`PersistenceExecutionMetadata`](PersistenceExecutionMetadata.md) \| `undefined`

Defined in: packages/persistence/dist/contracts.d.ts:19

Returns the current metadata or no context outside an Activity.

#### Returns

[`PersistenceExecutionMetadata`](PersistenceExecutionMetadata.md) \| `undefined`
