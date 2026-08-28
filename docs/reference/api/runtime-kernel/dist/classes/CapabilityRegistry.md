[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / CapabilityRegistry

# Class: CapabilityRegistry

Defined in: packages/runtime-kernel/dist/capability-registry.d.ts:11

Owns Capability provider registration and generation-pinned resolution.

## Constructors

### Constructor

> **new CapabilityRegistry**(): `CapabilityRegistry`

#### Returns

`CapabilityRegistry`

## Methods

### hasEligible()

> **hasEligible**(`requirement`, `explicitProviderId?`): `boolean`

Defined in: packages/runtime-kernel/dist/capability-registry.d.ts:17

Reports whether an eligible Capability provider exists.

#### Parameters

##### requirement

[`CapabilityRequirement`](../interfaces/CapabilityRequirement.md)

##### explicitProviderId?

[`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)

#### Returns

`boolean`

---

### providerIds()

> **providerIds**(`capabilityId`): readonly [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)[]

Defined in: packages/runtime-kernel/dist/capability-registry.d.ts:21

Lists provider identities registered for a Capability.

#### Parameters

##### capabilityId

[`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md)

#### Returns

readonly [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)[]

---

### register()

> **register**\<`TContract`>\>(`descriptor`, `implementation`, `fence?`, `runtimeActivity?`): [`GenerationFence`](GenerationFence.md)

Defined in: packages/runtime-kernel/dist/capability-registry.d.ts:15

Registers a validated Capability implementation under a generation fence.

#### Type Parameters

##### TContract

`TContract` _extends_ `object`

#### Parameters

##### descriptor

[`CapabilityProvisionDescriptor`](../interfaces/CapabilityProvisionDescriptor.md)

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

> **resolve**\<`TContract`>\>(`requirement`, `explicitProviderId?`): [`CapabilityLease`](../interfaces/CapabilityLease.md)\<`TContract`> \> \| `undefined`

Defined in: packages/runtime-kernel/dist/capability-registry.d.ts:19

Resolves an eligible Capability behind a generation-fenced proxy.

#### Type Parameters

##### TContract

`TContract` _extends_ `object`

#### Parameters

##### requirement

[`CapabilityRequirement`](../interfaces/CapabilityRequirement.md)

##### explicitProviderId?

[`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)

#### Returns

[`CapabilityLease`](../interfaces/CapabilityLease.md)\<`TContract`\> \| `undefined`

---

### retireGeneration()

> **retireGeneration**(`ownerFence`, `settleTimeoutMs`): `Promise`\<`void`>\>

Defined in: packages/runtime-kernel/dist/capability-registry.d.ts:23

Retires every Capability binding owned by the supplied generation fence.

#### Parameters

##### ownerFence

[`GenerationFence`](GenerationFence.md)

##### settleTimeoutMs

`number`

#### Returns

`Promise`\<`void`\>
