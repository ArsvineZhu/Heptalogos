[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkCreationRequest

# Interface: WorkCreationRequest

Defined in: packages/work-queue/dist/service.d.ts:18

Untrusted request normalized before a WorkItem enters durable storage.

## Properties

### configurationBinding?

> `readonly` `optional` **configurationBinding?**: [`WorkConfigurationBinding`](../type-aliases/WorkConfigurationBinding.md)

Defined in: packages/work-queue/dist/service.d.ts:27

---

### dedupKey?

> `readonly` `optional` **dedupKey?**: `string`

Defined in: packages/work-queue/dist/service.d.ts:26

---

### notBefore?

> `readonly` `optional` **notBefore?**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/service.d.ts:25

---

### partitionKey?

> `readonly` `optional` **partitionKey?**: `string`

Defined in: packages/work-queue/dist/service.d.ts:23

---

### payload

> `readonly` **payload**: `unknown`

Defined in: packages/work-queue/dist/service.d.ts:20

---

### priority

> `readonly` **priority**: `number`

Defined in: packages/work-queue/dist/service.d.ts:24

---

### queueProfileId

> `readonly` **queueProfileId**: [`WorkQueueProfileId`](../../../runtime-kernel/dist/type-aliases/WorkQueueProfileId.md)

Defined in: packages/work-queue/dist/service.d.ts:21

---

### resourceAdmissionClass

> `readonly` **resourceAdmissionClass**: [`ResourceAdmissionClassId`](../../../runtime-kernel/dist/type-aliases/ResourceAdmissionClassId.md)

Defined in: packages/work-queue/dist/service.d.ts:22

---

### target

> `readonly` **target**: [`WorkHandlerTarget`](../../../runtime-kernel/dist/interfaces/WorkHandlerTarget.md)

Defined in: packages/work-queue/dist/service.d.ts:19
