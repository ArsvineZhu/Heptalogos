[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / BootstrapRetainedActivityDraft

# Interface: BootstrapRetainedActivityDraft

Defined in: packages/execution-lineage/dist/contracts.d.ts:87

Carries a Bootstrap Activity for retention after the normal Host handoff.

## Properties

### activityId

> `readonly` **activityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:88

---

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:93

---

### continuityEpochId

> `readonly` **continuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:94

---

### endedAt

> `readonly` **endedAt**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:90

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:91

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:92

---

### outcome

> `readonly` **outcome**: `"SUCCEEDED"` \| `"FAILED"`

Defined in: packages/execution-lineage/dist/contracts.d.ts:95

---

### outcomeRef?

> `readonly` `optional` **outcomeRef?**: `string`

Defined in: packages/execution-lineage/dist/contracts.d.ts:96

---

### startedAt

> `readonly` **startedAt**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:89
