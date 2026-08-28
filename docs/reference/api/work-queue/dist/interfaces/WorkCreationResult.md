[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkCreationResult

# Interface: WorkCreationResult

Defined in: packages/work-queue/dist/service.d.ts:30

Reports whether creation inserted a new item or reused a deduplicated item.

## Properties

### item

> `readonly` **item**: [`WorkItem`](WorkItem.md)

Defined in: packages/work-queue/dist/service.d.ts:32

---

### status

> `readonly` **status**: `"EXISTING"` \| `"CREATED"`

Defined in: packages/work-queue/dist/service.d.ts:31
