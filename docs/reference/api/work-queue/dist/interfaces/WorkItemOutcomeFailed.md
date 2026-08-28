[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkItemOutcomeFailed

# Interface: WorkItemOutcomeFailed

Defined in: packages/work-queue/dist/contracts.d.ts:64

Durable failure outcome with the classifier's retry category and reason.

## Properties

### kind

> `readonly` **kind**: `"FAILED"`

Defined in: packages/work-queue/dist/contracts.d.ts:66

---

### reasonCode

> `readonly` **reasonCode**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:68

---

### retryClass

> `readonly` **retryClass**: [`WorkRetryClass`](../type-aliases/WorkRetryClass.md)

Defined in: packages/work-queue/dist/contracts.d.ts:67

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/work-queue/dist/contracts.d.ts:65
