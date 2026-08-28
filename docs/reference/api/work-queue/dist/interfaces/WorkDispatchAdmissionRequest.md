[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkDispatchAdmissionRequest

# Interface: WorkDispatchAdmissionRequest

Defined in: packages/work-queue/dist/admission.d.ts:34

Inputs checked immediately before a durable dispatch attempt is started.

## Properties

### dispatch

> `readonly` **dispatch**: [`DurableDispatchRequest`](DurableDispatchRequest.md)

Defined in: packages/work-queue/dist/admission.d.ts:37

---

### execution

> `readonly` **execution**: [`ExecutionContext`](../../../execution-lineage/dist/interfaces/ExecutionContext.md)

Defined in: packages/work-queue/dist/admission.d.ts:35

---

### now

> `readonly` **now**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/admission.d.ts:38

---

### workItem

> `readonly` **workItem**: [`WorkItem`](WorkItem.md)

Defined in: packages/work-queue/dist/admission.d.ts:36
