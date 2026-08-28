[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / MicroSystemSupervisorOptions

# Interface: MicroSystemSupervisorOptions

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:15

Supplies substrate, registry, lifecycle, and retirement policy to supervision.

## Properties

### capabilityRegistry?

> `readonly` `optional` **capabilityRegistry?**: [`CapabilityRegistry`](../classes/CapabilityRegistry.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:19

---

### definitions?

> `readonly` `optional` **definitions?**: readonly [`MicroSystemDefinition`](MicroSystemDefinition.md)[]

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:21

---

### lifecycleLineage?

> `readonly` `optional` **lifecycleLineage?**: [`RuntimeLifecycleLineage`](RuntimeLifecycleLineage.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:22

---

### ownerLifecycle?

> `readonly` `optional` **ownerLifecycle?**: [`RuntimeOwnerLifecycle`](RuntimeOwnerLifecycle.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:24

---

### rootRuntimeOrigin?

> `readonly` `optional` **rootRuntimeOrigin?**: `RuntimeExecutionOrigin`

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:23

---

### serviceRegistry?

> `readonly` `optional` **serviceRegistry?**: [`ServiceRegistry`](../classes/ServiceRegistry.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:18

---

### settleTimeoutMs

> `readonly` **settleTimeoutMs**: `number`

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:17

---

### substrate

> `readonly` **substrate**: [`RuntimeSubstrate`](../../../runtime-substrate/dist/interfaces/RuntimeSubstrate.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:16

---

### workHandlerRegistry?

> `readonly` `optional` **workHandlerRegistry?**: [`WorkHandlerRegistry`](../classes/WorkHandlerRegistry.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:20
