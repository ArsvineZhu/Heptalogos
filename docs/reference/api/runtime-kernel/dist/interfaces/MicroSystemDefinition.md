[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / MicroSystemDefinition

# Interface: MicroSystemDefinition

Defined in: packages/runtime-kernel/dist/contracts.d.ts:104

Declares the desired activation, dependencies, and providers of a MicroSystem.

## Properties

### activate

> `readonly` **activate**: (`context`) => `Promise`\<`void`>\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:114

#### Parameters

##### context

[`MicroSystemActivationContext`](MicroSystemActivationContext.md)

#### Returns

`Promise`\<`void`\>

---

### capabilityProvisions

> `readonly` **capabilityProvisions**: readonly [`CapabilityProvisionDescriptor`](CapabilityProvisionDescriptor.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:112

---

### capabilityRequirements

> `readonly` **capabilityRequirements**: readonly [`CapabilityRequirement`](CapabilityRequirement.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:110

---

### generation

> `readonly` **generation**: [`RuntimeGenerationRef`](RuntimeGenerationRef.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:107

---

### microSystemId

> `readonly` **microSystemId**: [`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:105

---

### operatingModes

> `readonly` **operatingModes**: readonly [`OperatingMode`](../type-aliases/OperatingMode.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:108

---

### role

> `readonly` **role**: [`MicroSystemRole`](../type-aliases/MicroSystemRole.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:106

---

### serviceProvisions

> `readonly` **serviceProvisions**: readonly [`ServiceProvisionDescriptor`](ServiceProvisionDescriptor.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:111

---

### serviceRequirements

> `readonly` **serviceRequirements**: readonly [`ServiceRequirement`](ServiceRequirement.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:109

---

### workHandlerProvisions?

> `readonly` `optional` **workHandlerProvisions?**: readonly [`WorkHandlerProvisionDescriptor`](WorkHandlerProvisionDescriptor.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:113
