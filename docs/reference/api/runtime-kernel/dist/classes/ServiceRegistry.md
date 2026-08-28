[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / ServiceRegistry

# Class: ServiceRegistry

Defined in: packages/runtime-kernel/dist/service-registry.d.ts:11

Owns Service provider registration and generation-pinned resolution.

## Constructors

### Constructor

> **new ServiceRegistry**(): `ServiceRegistry`

#### Returns

`ServiceRegistry`

## Methods

### hasEligible()

> **hasEligible**(`requirement`, `explicitProviderId?`): `boolean`

Defined in: packages/runtime-kernel/dist/service-registry.d.ts:17

Reports whether an eligible Service provider exists.

#### Parameters

##### requirement

[`ServiceRequirement`](../interfaces/ServiceRequirement.md)

##### explicitProviderId?

[`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)

#### Returns

`boolean`

---

### providerIds()

> **providerIds**(`serviceId`): readonly [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)[]

Defined in: packages/runtime-kernel/dist/service-registry.d.ts:21

Lists provider identities registered for a Service.

#### Parameters

##### serviceId

[`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md)

#### Returns

readonly [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)[]

---

### register()

> **register**\<`TContract`>\>(`descriptor`, `implementation`, `fence?`, `runtimeActivity?`): [`GenerationFence`](GenerationFence.md)

Defined in: packages/runtime-kernel/dist/service-registry.d.ts:15

Registers a validated Service implementation under a generation fence.

#### Type Parameters

##### TContract

`TContract` _extends_ `object`

#### Parameters

##### descriptor

[`ServiceProvisionDescriptor`](../interfaces/ServiceProvisionDescriptor.md)

##### implementation

`TContract`

##### fence?

[`GenerationFence`](GenerationFence.md)

##### runtimeActivity?

`RuntimeActivityRunner`

#### Returns

[`GenerationFence`](GenerationFence.md)

---

### resolve()

> **resolve**\<`TContract`>\>(`requirement`, `explicitProviderId?`): [`ServiceLease`](../interfaces/ServiceLease.md)\<`TContract`>\>

Defined in: packages/runtime-kernel/dist/service-registry.d.ts:19

Resolves an eligible Service behind a generation-fenced proxy.

#### Type Parameters

##### TContract

`TContract` _extends_ `object`

#### Parameters

##### requirement

[`ServiceRequirement`](../interfaces/ServiceRequirement.md)

##### explicitProviderId?

[`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)

#### Returns

[`ServiceLease`](../interfaces/ServiceLease.md)\<`TContract`\>

---

### retireGeneration()

> **retireGeneration**(`ownerFence`, `settleTimeoutMs`): `Promise`\<`void`>\>

Defined in: packages/runtime-kernel/dist/service-registry.d.ts:23

Retires every Service binding owned by the supplied generation fence.

#### Parameters

##### ownerFence

[`GenerationFence`](GenerationFence.md)

##### settleTimeoutMs

`number`

#### Returns

`Promise`\<`void`\>
