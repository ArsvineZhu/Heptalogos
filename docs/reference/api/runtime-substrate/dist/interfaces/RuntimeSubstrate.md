[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-substrate/dist](../README.md) / RuntimeSubstrate

# Interface: RuntimeSubstrate

Defined in: packages/runtime-substrate/dist/contracts.d.ts:37

Owns generic activation and bounded disposal behind Heptalogos contracts.

## Methods

### activate()

> **activate**(`request`): `Promise`\<[`SubstrateActivationHandle`](SubstrateActivationHandle.md)>\>

Defined in: packages/runtime-substrate/dist/contracts.d.ts:39

Activates one request and returns its lifecycle handle.

#### Parameters

##### request

[`SubstrateActivationRequest`](SubstrateActivationRequest.md)

#### Returns

`Promise`\<[`SubstrateActivationHandle`](SubstrateActivationHandle.md)\>

---

### close()

> **close**(): `Promise`\<`void`>\>

Defined in: packages/runtime-substrate/dist/contracts.d.ts:41

Closes the substrate after all activations settle.

#### Returns

`Promise`\<`void`\>
