[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / ReadinessResult

# Interface: ReadinessResult

Defined in: packages/runtime-kernel/dist/contracts.d.ts:149

Reports readiness state and the dependencies preventing full readiness.

## Properties

### missingOptionalCapabilities

> `readonly` **missingOptionalCapabilities**: readonly [`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:154

---

### missingRequiredCapabilities

> `readonly` **missingRequiredCapabilities**: readonly [`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:153

---

### missingServices

> `readonly` **missingServices**: readonly [`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md)[]

Defined in: packages/runtime-kernel/dist/contracts.d.ts:152

---

### profileId

> `readonly` **profileId**: `string`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:150

---

### state

> `readonly` **state**: [`ReadinessState`](../type-aliases/ReadinessState.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:151
