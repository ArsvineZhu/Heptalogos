[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkItem

# Interface: WorkItem

Defined in: packages/work-queue/dist/contracts.d.ts:86

Canonical durable record for admitted work and its current dispatch state.

## Properties

### activeAttemptId?

> `readonly` `optional` **activeAttemptId?**: [`DispatchAttemptId`](../type-aliases/DispatchAttemptId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:102

---

### cancellationReasonCode?

> `readonly` `optional` **cancellationReasonCode?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:107

---

### cancelRequestedAt?

> `readonly` `optional` **cancelRequestedAt?**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:106

---

### configurationBinding

> `readonly` **configurationBinding**: [`WorkConfigurationBinding`](../type-aliases/WorkConfigurationBinding.md)

Defined in: packages/work-queue/dist/contracts.d.ts:99

---

### createdAt

> `readonly` **createdAt**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:110

---

### createdContinuityEpochId

> `readonly` **createdContinuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:97

---

### dedupKey?

> `readonly` `optional` **dedupKey?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:96

---

### dispatchRevision

> `readonly` **dispatchRevision**: `number`

Defined in: packages/work-queue/dist/contracts.d.ts:101

---

### handler

> `readonly` **handler**: [`WorkHandlerTarget`](../../../runtime-kernel/dist/interfaces/WorkHandlerTarget.md)

Defined in: packages/work-queue/dist/contracts.d.ts:89

---

### lineageContextRef

> `readonly` **lineageContextRef**: [`LineageContextRefV1`](../../../execution-lineage/dist/interfaces/LineageContextRefV1.md)

Defined in: packages/work-queue/dist/contracts.d.ts:98

---

### notBefore?

> `readonly` `optional` **notBefore?**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:95

---

### outcome?

> `readonly` `optional` **outcome?**: [`WorkItemOutcome`](../type-aliases/WorkItemOutcome.md)

Defined in: packages/work-queue/dist/contracts.d.ts:109

---

### partitionKey?

> `readonly` `optional` **partitionKey?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:93

---

### payload

> `readonly` **payload**: [`CanonicalJsonValue`](../../../foundation-contracts/dist/type-aliases/CanonicalJsonValue.md)

Defined in: packages/work-queue/dist/contracts.d.ts:90

---

### priority

> `readonly` **priority**: `number`

Defined in: packages/work-queue/dist/contracts.d.ts:94

---

### queueProfileId

> `readonly` **queueProfileId**: [`WorkQueueProfileId`](../../../runtime-kernel/dist/type-aliases/WorkQueueProfileId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:91

---

### resourceAdmissionClass

> `readonly` **resourceAdmissionClass**: [`ResourceAdmissionClassId`](../../../runtime-kernel/dist/type-aliases/ResourceAdmissionClassId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:92

---

### restoreReplayClass

> `readonly` **restoreReplayClass**: [`WorkHandlerRestoreReplayClass`](../../../runtime-kernel/dist/type-aliases/WorkHandlerRestoreReplayClass.md)

Defined in: packages/work-queue/dist/contracts.d.ts:100

---

### retryClass?

> `readonly` `optional` **retryClass?**: [`WorkRetryClass`](../type-aliases/WorkRetryClass.md)

Defined in: packages/work-queue/dist/contracts.d.ts:104

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/work-queue/dist/contracts.d.ts:87

---

### state

> `readonly` **state**: [`WorkItemState`](../type-aliases/WorkItemState.md)

Defined in: packages/work-queue/dist/contracts.d.ts:103

---

### stateReasonCode?

> `readonly` `optional` **stateReasonCode?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:105

---

### supersededBy?

> `readonly` `optional` **supersededBy?**: [`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:108

---

### updatedAt

> `readonly` **updatedAt**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:111

---

### workItemId

> `readonly` **workItemId**: [`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:88
