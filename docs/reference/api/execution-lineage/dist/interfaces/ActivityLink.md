[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / ActivityLink

# Interface: ActivityLink

Defined in: packages/execution-lineage/dist/contracts.d.ts:28

Links one Activity to another through causal or lifecycle semantics.

## Properties

### kind

> `readonly` **kind**: `"linked-to"` \| `"supersedes"` \| `"resumes"` \| `"fan-out"` \| `"fan-in"`

Defined in: packages/execution-lineage/dist/contracts.d.ts:29

---

### targetActivityId

> `readonly` **targetActivityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:30
