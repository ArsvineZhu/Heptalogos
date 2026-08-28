[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkItemOutcomeSuperseded

# Interface: WorkItemOutcomeSuperseded

Defined in: packages/work-queue/dist/contracts.d.ts:46

Durable outcome identifying work replaced by another WorkItem.

## Properties

### kind

> `readonly` **kind**: `"SUPERSEDED"`

Defined in: packages/work-queue/dist/contracts.d.ts:48

---

### reasonCode

> `readonly` **reasonCode**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:49

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/work-queue/dist/contracts.d.ts:47

---

### supersededBy?

> `readonly` `optional` **supersededBy?**: [`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:50
