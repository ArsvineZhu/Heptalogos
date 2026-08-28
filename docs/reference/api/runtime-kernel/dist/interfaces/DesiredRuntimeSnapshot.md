[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / DesiredRuntimeSnapshot

# Interface: DesiredRuntimeSnapshot

Defined in: packages/runtime-kernel/dist/contracts.d.ts:119

Canonical desired Runtime state consumed by reconciliation.

## Properties

### capabilityBindings

> `readonly` **capabilityBindings**: `ReadonlyMap`\<[`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)>\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:124

---

### desired

> `readonly` **desired**: `ReadonlyMap`\<[`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md), [`MicroSystemDesiredState`](../type-aliases/MicroSystemDesiredState.md)>\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:122

---

### operatingMode

> `readonly` **operatingMode**: [`OperatingMode`](../type-aliases/OperatingMode.md)

Defined in: packages/runtime-kernel/dist/contracts.d.ts:121

---

### revision

> `readonly` **revision**: `number`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:120

---

### serviceBindings

> `readonly` **serviceBindings**: `ReadonlyMap`\<[`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)>\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:123
