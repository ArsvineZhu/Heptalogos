[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / BootstrapJournalCheckpointLike

# Interface: BootstrapJournalCheckpointLike

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:13

Structural Bootstrap journal input accepted by lineage projection.

## Properties

### at

> `readonly` **at**: `string`

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:20

---

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:15

---

### bootstrapActivityId

> `readonly` **bootstrapActivityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:16

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:17

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:18

---

### outcome

> `readonly` **outcome**: `"STARTED"` \| `"SUCCEEDED"` \| `"FAILED"`

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:21

---

### problemCode?

> `readonly` `optional` **problemCode?**: `string`

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:22

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:14

---

### stage

> `readonly` **stage**: `string`

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:19
