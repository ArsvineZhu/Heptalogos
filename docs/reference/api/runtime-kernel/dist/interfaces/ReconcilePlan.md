[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / ReconcilePlan

# Interface: ReconcilePlan

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:33

Reports the ordered actions and bindings produced by reconciliation.

## Properties

### actions

> `readonly` **actions**: readonly [`ReconcileAction`](../type-aliases/ReconcileAction.md)[]

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:35

---

### blocked

> `readonly` **blocked**: `ReadonlyMap`\<[`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md), `string`>\>

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:36

---

### capabilityBindings

> `readonly` **capabilityBindings**: `ReadonlyMap`\<[`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)>\>

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:39

---

### desiredServiceBindings

> `readonly` **desiredServiceBindings**: `ReadonlyMap`\<[`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)>\>

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:38

---

### revision

> `readonly` **revision**: `number`

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:34

---

### serviceBindings

> `readonly` **serviceBindings**: `ReadonlyMap`\<[`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)>\>

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:37
