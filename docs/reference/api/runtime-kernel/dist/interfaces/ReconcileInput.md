[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / ReconcileInput

# Interface: ReconcileInput

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:42

Supplies desired, actual, registry, and binding state to reconciliation.

## Properties

### actual

> `readonly` **actual**: `ReadonlyMap`\<[`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md), [`MicroSystemActualState`](../type-aliases/MicroSystemActualState.md)>\>

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:45

---

### capabilities

> `readonly` **capabilities**: [`CapabilityRegistry`](../classes/CapabilityRegistry.md)

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:47

---

### currentCapabilityBindings?

> `readonly` `optional` **currentCapabilityBindings?**: `ReadonlyMap`\<[`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)>\>

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:49

---

### currentServiceBindings?

> `readonly` `optional` **currentServiceBindings?**: `ReadonlyMap`\<[`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)>\>

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:48

---

### definitions

> `readonly` **definitions**: readonly [`MicroSystemDefinition`](MicroSystemDefinition.md)[]

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:43

---

### desired

> `readonly` **desired**: [`DesiredRuntimeSnapshot`](DesiredRuntimeSnapshot.md)

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:44

---

### services

> `readonly` **services**: [`ServiceRegistry`](../classes/ServiceRegistry.md)

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:46
