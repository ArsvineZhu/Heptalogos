[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-substrate/dist](../README.md) / SubstrateActivationHandle

# Interface: SubstrateActivationHandle

Defined in: packages/runtime-substrate/dist/contracts.d.ts:31

Represents one active or disposed substrate activation handle.

## Properties

### state

> `readonly` **state**: `"FAILED"` \| `"ACTIVE"` \| `"DISPOSING"` \| `"DISPOSED"`

Defined in: packages/runtime-substrate/dist/contracts.d.ts:32

## Methods

### dispose()

> **dispose**(): `Promise`\<`void`>\>

Defined in: packages/runtime-substrate/dist/contracts.d.ts:34

Disposes the activation and drains its owned resources.

#### Returns

`Promise`\<`void`\>
