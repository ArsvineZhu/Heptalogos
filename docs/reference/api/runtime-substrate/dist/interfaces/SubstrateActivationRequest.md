[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-substrate/dist](../README.md) / SubstrateActivationRequest

# Interface: SubstrateActivationRequest

Defined in: packages/runtime-substrate/dist/contracts.d.ts:23

Supplies activation work and its failure sink to RuntimeSubstrate.

## Properties

### label

> `readonly` **label**: `string`

Defined in: packages/runtime-substrate/dist/contracts.d.ts:24

## Methods

### activate()

> **activate**(`scope`): `Promise`\<`void`>\>

Defined in: packages/runtime-substrate/dist/contracts.d.ts:26

Activates one resource scope under the substrate owner.

#### Parameters

##### scope

[`ActivationResourceScope`](ActivationResourceScope.md)

#### Returns

`Promise`\<`void`\>

---

### onFailure()

> **onFailure**(`failure`): `void`

Defined in: packages/runtime-substrate/dist/contracts.d.ts:28

Receives a normalized failure without escaping substrate cleanup.

#### Parameters

##### failure

[`RuntimeSubstrateFailure`](RuntimeSubstrateFailure.md)

#### Returns

`void`
