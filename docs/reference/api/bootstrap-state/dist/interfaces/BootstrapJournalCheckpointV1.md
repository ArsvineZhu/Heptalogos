[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / BootstrapJournalCheckpointV1

# Interface: BootstrapJournalCheckpointV1

Defined in: packages/bootstrap-state/dist/journal.d.ts:13

Versioned checkpoint written before and after a Bootstrap lifecycle stage.

## Properties

### at

> `readonly` **at**: `string`

Defined in: packages/bootstrap-state/dist/journal.d.ts:22

---

### attemptedBootstrapRuntimeGeneration?

> `readonly` `optional` **attemptedBootstrapRuntimeGeneration?**: [`BootstrapRuntimeGenerationId`](../type-aliases/BootstrapRuntimeGenerationId.md)

Defined in: packages/bootstrap-state/dist/journal.d.ts:19

---

### attemptedProductGeneration?

> `readonly` `optional` **attemptedProductGeneration?**: [`ProductGenerationId`](../type-aliases/ProductGenerationId.md)

Defined in: packages/bootstrap-state/dist/journal.d.ts:20

---

### bootId

> `readonly` **bootId**: [`BootId`](../type-aliases/BootId.md)

Defined in: packages/bootstrap-state/dist/journal.d.ts:15

---

### bootstrapActivityId

> `readonly` **bootstrapActivityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/bootstrap-state/dist/journal.d.ts:16

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-state/dist/journal.d.ts:17

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-state/dist/journal.d.ts:18

---

### outcome

> `readonly` **outcome**: [`BootstrapStageOutcome`](../type-aliases/BootstrapStageOutcome.md)

Defined in: packages/bootstrap-state/dist/journal.d.ts:23

---

### problemCode?

> `readonly` `optional` **problemCode?**: `string`

Defined in: packages/bootstrap-state/dist/journal.d.ts:24

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/bootstrap-state/dist/journal.d.ts:14

---

### stage

> `readonly` **stage**: `string`

Defined in: packages/bootstrap-state/dist/journal.d.ts:21
