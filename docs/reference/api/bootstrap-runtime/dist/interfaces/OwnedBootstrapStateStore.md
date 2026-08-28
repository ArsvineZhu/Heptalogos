[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / OwnedBootstrapStateStore

# Interface: OwnedBootstrapStateStore

Defined in: packages/bootstrap-runtime/dist/bootstrap-state-access.d.ts:10

Exposes BootstrapState operations bound to a live Bootstrap ownership lease.

## Methods

### commit()

> **commit**(`candidate`): `Promise`\<[`BootstrapStateEnvelopeV1`](../../../bootstrap-state/dist/interfaces/BootstrapStateEnvelopeV1.md)>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-state-access.d.ts:14

Commits a new state body through the owned atomic store.

#### Parameters

##### candidate

[`BootstrapStateBodyV1`](../../../bootstrap-state/dist/interfaces/BootstrapStateBodyV1.md)

#### Returns

`Promise`\<[`BootstrapStateEnvelopeV1`](../../../bootstrap-state/dist/interfaces/BootstrapStateEnvelopeV1.md)\>

---

### load()

> **load**(): `Promise`\<[`BootstrapStateLoadResult`](../../../bootstrap-state/dist/type-aliases/BootstrapStateLoadResult.md)>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-state-access.d.ts:12

Loads the current durable BootstrapState evidence.

#### Returns

`Promise`\<[`BootstrapStateLoadResult`](../../../bootstrap-state/dist/type-aliases/BootstrapStateLoadResult.md)\>
