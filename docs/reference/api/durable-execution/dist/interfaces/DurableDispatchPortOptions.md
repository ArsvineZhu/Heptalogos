[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [durable-execution/dist](../README.md) / DurableDispatchPortOptions

# Interface: DurableDispatchPortOptions

Defined in: packages/durable-execution/dist/dbos-dispatch-port.d.ts:12

Public inputs for creating a lifecycle-bound durable dispatch port.

## Properties

### authority

> `readonly` **authority**: [`HostDurableExecutionAuthority`](../../../host-ownership/dist/interfaces/HostDurableExecutionAuthority.md)

Defined in: packages/durable-execution/dist/dbos-dispatch-port.d.ts:13

---

### durableCodeVersion

> `readonly` **durableCodeVersion**: [`DurableCodeVersion`](../../../foundation-contracts/dist/type-aliases/DurableCodeVersion.md)

Defined in: packages/durable-execution/dist/dbos-dispatch-port.d.ts:15

---

### lifecycle

> `readonly` **lifecycle**: `Pick`\<[`DurableExecutionRuntime`](DurableExecutionRuntime.md), `"state"`>\>

Defined in: packages/durable-execution/dist/dbos-dispatch-port.d.ts:14

---

### now

> `readonly` **now**: () => [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/durable-execution/dist/dbos-dispatch-port.d.ts:18

Supplies the canonical current wall-clock Instant for delay projection.

#### Returns

[`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

---

### profiles

> `readonly` **profiles**: [`WorkQueueProfileCatalog`](../../../work-queue/dist/interfaces/WorkQueueProfileCatalog.md)

Defined in: packages/durable-execution/dist/dbos-dispatch-port.d.ts:16
