[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / CapabilityLease

# Interface: CapabilityLease\<TContract\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:76

Provides a generation-fenced Capability operation selector to consumers.

## Type Parameters

### TContract

`TContract` _extends_ `object`

## Properties

### capabilityId

> `readonly` **capabilityId**: [`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:77

---

### contractVersion

> `readonly` **contractVersion**: [`ContractVersion`](../type-aliases/ContractVersion.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:79

---

### providerId

> `readonly` **providerId**: [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:78

## Methods

### invoke()

> **invoke**\<`TResult`>\>(`operationId`, `call`): `Promise`\<`TResult`>\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:81

Invokes a consumer-selected operation while the lease is active.

#### Type Parameters

##### TResult

`TResult`

#### Parameters

##### operationId

`string`

##### call

(`capability`) => `TResult` \| `Promise`\<`TResult`\>

#### Returns

`Promise`\<`TResult`\>
