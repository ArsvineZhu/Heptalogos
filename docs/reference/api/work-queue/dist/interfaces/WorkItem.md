[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkItem

# Interface: WorkItem

Defined in: packages/work-queue/dist/contracts.d.ts:55

Canonical durable record for admitted work and its current dispatch state.

## Properties

### activeAttemptId?

> `readonly` `optional` **activeAttemptId?**: [`DispatchAttemptId`](../type-aliases/DispatchAttemptId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:71

---

### cancellationReasonCode?

> `readonly` `optional` **cancellationReasonCode?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:76

---

### cancelRequestedAt?

> `readonly` `optional` **cancelRequestedAt?**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:75

---

### configurationBinding

> `readonly` **configurationBinding**: [`WorkConfigurationBinding`](../type-aliases/WorkConfigurationBinding.md)

Defined in: packages/work-queue/dist/contracts.d.ts:68

---

### createdAt

> `readonly` **createdAt**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:79

---

### createdContinuityEpochId

> `readonly` **createdContinuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:66

---

### dedupKey?

> `readonly` `optional` **dedupKey?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:65

---

### dispatchRevision

> `readonly` **dispatchRevision**: `number`

Defined in: packages/work-queue/dist/contracts.d.ts:70

---

### handler

> `readonly` **handler**: [`WorkHandlerTarget`](../../../runtime-kernel/dist/interfaces/WorkHandlerTarget.md)

Defined in: packages/work-queue/dist/contracts.d.ts:58

---

### lineageContextRef

> `readonly` **lineageContextRef**: [`LineageContextRefV1`](../../../execution-lineage/dist/interfaces/LineageContextRefV1.md)

Defined in: packages/work-queue/dist/contracts.d.ts:67

---

### notBefore?

> `readonly` `optional` **notBefore?**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:64

---

### outcome?

> `readonly` `optional` **outcome?**: [`WorkItemOutcome`](../type-aliases/WorkItemOutcome.md)

Defined in: packages/work-queue/dist/contracts.d.ts:78

---

### partitionKey?

> `readonly` `optional` **partitionKey?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:62

---

### payload

> `readonly` **payload**: [`CanonicalJsonValue`](../../../foundation-contracts/dist/type-aliases/CanonicalJsonValue.md)

Defined in: packages/work-queue/dist/contracts.d.ts:59

---

### priority

> `readonly` **priority**: `number`

Defined in: packages/work-queue/dist/contracts.d.ts:63

---

### queueProfileId

> `readonly` **queueProfileId**: [`WorkQueueProfileId`](../../../runtime-kernel/dist/type-aliases/WorkQueueProfileId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:60

---

### resourceAdmissionClass

> `readonly` **resourceAdmissionClass**: [`ResourceAdmissionClassId`](../../../runtime-kernel/dist/type-aliases/ResourceAdmissionClassId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:61

---

### restoreReplayClass

> `readonly` **restoreReplayClass**: [`WorkHandlerRestoreReplayClass`](../../../runtime-kernel/dist/type-aliases/WorkHandlerRestoreReplayClass.md)

Defined in: packages/work-queue/dist/contracts.d.ts:69

---

### retryClass?

> `readonly` `optional` **retryClass?**: [`WorkRetryClass`](../type-aliases/WorkRetryClass.md)

Defined in: packages/work-queue/dist/contracts.d.ts:73

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/work-queue/dist/contracts.d.ts:56

---

### state

> `readonly` **state**: [`WorkItemState`](../type-aliases/WorkItemState.md)

Defined in: packages/work-queue/dist/contracts.d.ts:72

---

### stateReasonCode?

> `readonly` `optional` **stateReasonCode?**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:74

---

### supersededBy?

> `readonly` `optional` **supersededBy?**: [`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:77

---

### updatedAt

> `readonly` **updatedAt**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/work-queue/dist/contracts.d.ts:80

---

### workItemId

> `readonly` **workItemId**: [`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:57
