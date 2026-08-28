[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkAdmissionRequest

# Interface: WorkAdmissionRequest

Defined in: packages/work-queue/dist/admission.d.ts:10

Inputs checked before a new durable WorkItem is admitted to the queue.

## Properties

### configurationBinding

> `readonly` **configurationBinding**: [`WorkConfigurationBinding`](../type-aliases/WorkConfigurationBinding.md)

Defined in: packages/work-queue/dist/admission.d.ts:20

---

### createdContinuityEpochId

> `readonly` **createdContinuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/work-queue/dist/admission.d.ts:21

---

### dedupKey?

> `readonly` `optional` **dedupKey?**: `string`

Defined in: packages/work-queue/dist/admission.d.ts:19

---

### execution

> `readonly` **execution**: [`ExecutionContext`](../../../execution-lineage/dist/interfaces/ExecutionContext.md)

Defined in: packages/work-queue/dist/admission.d.ts:11

---

### handlerContributionId

> `readonly` **handlerContributionId**: [`ContributionId`](../../../foundation-contracts/dist/type-aliases/ContributionId.md)

Defined in: packages/work-queue/dist/admission.d.ts:24

---

### handlerMicroSystemId

> `readonly` **handlerMicroSystemId**: [`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md)

Defined in: packages/work-queue/dist/admission.d.ts:23

---

### lineageContextRef

> `readonly` **lineageContextRef**: [`LineageContextRefV1`](../../../execution-lineage/dist/interfaces/LineageContextRefV1.md)

Defined in: packages/work-queue/dist/admission.d.ts:22

---

### notBefore?

> `readonly` `optional` **notBefore?**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/admission.d.ts:18

---

### partitionKey?

> `readonly` `optional` **partitionKey?**: `string`

Defined in: packages/work-queue/dist/admission.d.ts:16

---

### payload

> `readonly` **payload**: [`CanonicalJsonValue`](../../../foundation-contracts/dist/type-aliases/CanonicalJsonValue.md)

Defined in: packages/work-queue/dist/admission.d.ts:13

---

### priority

> `readonly` **priority**: `number`

Defined in: packages/work-queue/dist/admission.d.ts:17

---

### queueProfileId

> `readonly` **queueProfileId**: [`WorkQueueProfileId`](../../../runtime-kernel/dist/type-aliases/WorkQueueProfileId.md)

Defined in: packages/work-queue/dist/admission.d.ts:14

---

### resourceAdmissionClass

> `readonly` **resourceAdmissionClass**: [`ResourceAdmissionClassId`](../../../runtime-kernel/dist/type-aliases/ResourceAdmissionClassId.md)

Defined in: packages/work-queue/dist/admission.d.ts:15

---

### target

> `readonly` **target**: [`WorkHandlerTarget`](../../../runtime-kernel/dist/interfaces/WorkHandlerTarget.md)

Defined in: packages/work-queue/dist/admission.d.ts:12
