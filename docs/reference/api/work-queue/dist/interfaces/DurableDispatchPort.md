[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / DurableDispatchPort

# Interface: DurableDispatchPort

Defined in: packages/work-queue/dist/contracts.d.ts:121

Port used to submit a previously admitted dispatch request.

## Methods

### dispatch()

> **dispatch**(`request`): `Promise`\<`void`>\>

Defined in: packages/work-queue/dist/contracts.d.ts:123

Submit the request while preserving its revision and attempt identity.

#### Parameters

##### request

[`DurableDispatchRequest`](DurableDispatchRequest.md)

#### Returns

`Promise`\<`void`\>
