[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-substrate/dist](../README.md) / ActivationResourceScope

# Interface: ActivationResourceScope

Defined in: packages/runtime-substrate/dist/contracts.d.ts:9

Tracks resources and process-memory tasks under one activation owner.

## Properties

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/runtime-substrate/dist/contracts.d.ts:10

## Methods

### defer()

> **defer**(`label`, `disposer`): `void`

Defined in: packages/runtime-substrate/dist/contracts.d.ts:12

Registers a disposer for bounded reverse-order cleanup.

#### Parameters

##### label

`string`

##### disposer

[`RuntimeDisposer`](../type-aliases/RuntimeDisposer.md)

#### Returns

`void`

---

### track()

> **track**(`label`, `task`): `void`

Defined in: packages/runtime-substrate/dist/contracts.d.ts:14

Tracks a task whose settlement is required before disposal completes.

#### Parameters

##### label

`string`

##### task

`Promise`\<`unknown`\>

#### Returns

`void`
