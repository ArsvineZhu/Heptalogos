[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / MicroSystemActivationContext

# Interface: MicroSystemActivationContext

Defined in: packages/runtime-kernel/dist/contracts.d.ts:84

Supplies an activated MicroSystem with owned runtime resources and registries.

## Properties

### generation

> `readonly` **generation**: [`RuntimeGenerationRef`](RuntimeGenerationRef.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:87

---

### microSystemId

> `readonly` **microSystemId**: [`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:85

---

### microSystemInstanceId

> `readonly` **microSystemInstanceId**: [`MicroSystemInstanceId`](../../../foundation-contracts/dist/type-aliases/MicroSystemInstanceId.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:86

---

### operatingMode

> `readonly` **operatingMode**: [`OperatingMode`](../type-aliases/OperatingMode.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:88

---

### runtimeActivity?

> `readonly` `optional` **runtimeActivity?**: `RuntimeActivityRunner`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:91

---

### scope

> `readonly` **scope**: [`ActivationResourceScope`](../../../runtime-substrate/dist/interfaces/ActivationResourceScope.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:89

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:90

## Methods

### publishCapability()

> **publishCapability**\<`TContract`>\>(`descriptor`, `implementation`): `void`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:99

Publishes a validated Capability implementation into the current generation.

#### Type Parameters

##### TContract

`TContract` _extends_ `object`

#### Parameters

##### descriptor

[`CapabilityProvisionDescriptor`](CapabilityProvisionDescriptor.md)

##### implementation

`TContract`

#### Returns

`void`

---

### publishService()

> **publishService**\<`TContract`>\>(`descriptor`, `implementation`): `void`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:97

Publishes a validated Service implementation into the current generation.

#### Type Parameters

##### TContract

`TContract` _extends_ `object`

#### Parameters

##### descriptor

[`ServiceProvisionDescriptor`](ServiceProvisionDescriptor.md)

##### implementation

`TContract`

#### Returns

`void`

---

### publishWorkHandler()

> **publishWorkHandler**(`descriptor`, `implementation`): `void`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:101

Publishes a generation-pinned WorkHandler declaration and implementation.

#### Parameters

##### descriptor

[`WorkHandlerProvisionDescriptor`](WorkHandlerProvisionDescriptor.md)

##### implementation

[`RuntimeWorkHandler`](RuntimeWorkHandler.md)

#### Returns

`void`

---

### requireService()

> **requireService**\<`TContract`>\>(`requirement`): [`ServiceLease`](ServiceLease.md)\<`TContract`>\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:93

Resolves a required Service or raises the owning runtime Problem.

#### Type Parameters

##### TContract

`TContract` _extends_ `object`

#### Parameters

##### requirement

[`ServiceRequirement`](ServiceRequirement.md)

#### Returns

[`ServiceLease`](ServiceLease.md)\<`TContract`\>

---

### resolveCapability()

> **resolveCapability**\<`TContract`>\>(`requirement`): [`CapabilityLease`](CapabilityLease.md)\<`TContract`> \> \| `undefined`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:95

Resolves an eligible Capability for this generation.

#### Type Parameters

##### TContract

`TContract` _extends_ `object`

#### Parameters

##### requirement

[`CapabilityRequirement`](CapabilityRequirement.md)

#### Returns

[`CapabilityLease`](CapabilityLease.md)\<`TContract`\> \| `undefined`
