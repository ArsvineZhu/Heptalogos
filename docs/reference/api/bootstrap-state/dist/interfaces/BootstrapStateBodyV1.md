[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / BootstrapStateBodyV1

# Interface: BootstrapStateBodyV1

Defined in: packages/bootstrap-state/dist/model.d.ts:11

Versioned current BootstrapState body used for startup/recovery decisions.

## Properties

### activeBootstrapRuntimeGeneration

> `readonly` **activeBootstrapRuntimeGeneration**: [`BootstrapRuntimeGenerationId`](../type-aliases/BootstrapRuntimeGenerationId.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:14

---

### activeProductGeneration

> `readonly` **activeProductGeneration**: [`ProductGenerationId`](../type-aliases/ProductGenerationId.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:16

---

### continuityEpochId

> `readonly` **continuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:17

---

### lastCommittedOperationRef?

> `readonly` `optional` **lastCommittedOperationRef?**: `string`

Defined in: packages/bootstrap-state/dist/model.d.ts:19

---

### lastCompletedStageRef?

> `readonly` `optional` **lastCompletedStageRef?**: `string`

Defined in: packages/bootstrap-state/dist/model.d.ts:20

---

### lastKnownGoodProductGeneration?

> `readonly` `optional` **lastKnownGoodProductGeneration?**: [`ProductGenerationId`](../type-aliases/ProductGenerationId.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:18

---

### previousBootstrapRuntimeGeneration?

> `readonly` `optional` **previousBootstrapRuntimeGeneration?**: [`BootstrapRuntimeGenerationId`](../type-aliases/BootstrapRuntimeGenerationId.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:15

---

### privatePostgres?

> `readonly` `optional` **privatePostgres?**: [`PrivatePostgresBootstrapStateV1`](PrivatePostgresBootstrapStateV1.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:21

---

### revision

> `readonly` **revision**: `number`

Defined in: packages/bootstrap-state/dist/model.d.ts:13

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/bootstrap-state/dist/model.d.ts:12
