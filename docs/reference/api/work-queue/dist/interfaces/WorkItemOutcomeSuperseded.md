[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkItemOutcomeSuperseded

# Interface: WorkItemOutcomeSuperseded

Defined in: packages/work-queue/dist/contracts.d.ts:77

Durable outcome identifying work replaced by another WorkItem.

## Properties

### kind

> `readonly` **kind**: `"SUPERSEDED"`

Defined in: packages/work-queue/dist/contracts.d.ts:79

---

### reasonCode

> `readonly` **reasonCode**: `string`

Defined in: packages/work-queue/dist/contracts.d.ts:80

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/work-queue/dist/contracts.d.ts:78

---

### supersededBy?

> `readonly` `optional` **supersededBy?**: [`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

Defined in: packages/work-queue/dist/contracts.d.ts:81
