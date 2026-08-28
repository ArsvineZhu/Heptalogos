[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / BootstrapStateStore

# Class: BootstrapStateStore

Defined in: packages/bootstrap-state/dist/store.d.ts:23

Owns atomic current/previous BootstrapState publication for one directory.

## Constructors

### Constructor

> **new BootstrapStateStore**(`directory`): `BootstrapStateStore`

Defined in: packages/bootstrap-state/dist/store.d.ts:28

Binds the store to the BootstrapState directory.

#### Parameters

##### directory

`string`

#### Returns

`BootstrapStateStore`

## Methods

### commit()

> **commit**(`candidate`): `Promise`\<[`BootstrapStateEnvelopeV1`](../interfaces/BootstrapStateEnvelopeV1.md)>\>

Defined in: packages/bootstrap-state/dist/store.d.ts:32

Commits the next revision and verifies the exact durable reload.

#### Parameters

##### candidate

[`BootstrapStateBodyV1`](../interfaces/BootstrapStateBodyV1.md)

#### Returns

`Promise`\<[`BootstrapStateEnvelopeV1`](../interfaces/BootstrapStateEnvelopeV1.md)\>

---

### load()

> **load**(): `Promise`\<[`BootstrapStateLoadResult`](../type-aliases/BootstrapStateLoadResult.md)>\>

Defined in: packages/bootstrap-state/dist/store.d.ts:30

Loads current state, recovering a previous valid revision for inspection only.

#### Returns

`Promise`\<[`BootstrapStateLoadResult`](../type-aliases/BootstrapStateLoadResult.md)\>
