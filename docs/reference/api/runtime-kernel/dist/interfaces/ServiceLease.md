[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / ServiceLease

# Interface: ServiceLease\<TContract\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:68

Provides a generation-fenced Service operation selector to consumers.

## Type Parameters

### TContract

`TContract` _extends_ `object`

## Properties

### contractVersion

> `readonly` **contractVersion**: [`ContractVersion`](../type-aliases/ContractVersion.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:71

---

### providerId

> `readonly` **providerId**: [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:70

---

### serviceId

> `readonly` **serviceId**: [`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:69

## Methods

### invoke()

> **invoke**\<`TResult`>\>(`operationId`, `call`): `Promise`\<`TResult`>\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:73

Invokes a consumer-selected operation while the lease is active.

#### Type Parameters

##### TResult

`TResult`

#### Parameters

##### operationId

`string`

##### call

(`service`) => `TResult` \| `Promise`\<`TResult`\>

#### Returns

`Promise`\<`TResult`\>
