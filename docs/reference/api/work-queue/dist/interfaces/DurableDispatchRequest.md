[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / DurableDispatchRequest

# Interface: DurableDispatchRequest

Defined in: packages/work-queue/dist/contracts.d.ts:142

Immutable dispatch envelope passed to the durable execution boundary.

## Properties

### dispatchAttemptId

> `readonly` **dispatchAttemptId**: [`DispatchAttemptId`](../type-aliases/DispatchAttemptId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:145

---

### dispatchRevision

> `readonly` **dispatchRevision**: `number`

Defined in: packages/work-queue/dist/contracts.d.ts:144

---

### notBefore?

> `readonly` `optional` **notBefore?**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:149

---

### partitionKey?

> `readonly` `optional` **partitionKey?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:148

---

### priority

> `readonly` **priority**: `number`

Defined in: packages/work-queue/dist/contracts.d.ts:147

---

### queueProfileId

> `readonly` **queueProfileId**: [`WorkQueueProfileId`](../../../runtime-kernel/dist/type-aliases/WorkQueueProfileId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:146

---

### workItemId

> `readonly` **workItemId**: [`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:143
