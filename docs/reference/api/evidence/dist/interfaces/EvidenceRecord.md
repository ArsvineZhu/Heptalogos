[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [evidence/dist](../README.md) / EvidenceRecord

# Interface: EvidenceRecord

Defined in: packages/evidence/dist/contracts.d.ts:19

Describes a retained Evidence record with causal and recording identity.

## Extends

- [`EvidenceDraft`](EvidenceDraft.md)

## Properties

### activityId

> `readonly` **activityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/evidence/dist/contracts.d.ts:21

---

### evidenceContractVersion

> `readonly` **evidenceContractVersion**: `string`

Defined in: packages/evidence/dist/contracts.d.ts:11

#### Inherited from

[`EvidenceDraft`](EvidenceDraft.md).[`evidenceContractVersion`](EvidenceDraft.md#evidencecontractversion)

---

### evidenceId

> `readonly` **evidenceId**: [`EvidenceId`](../../../foundation-contracts/dist/type-aliases/EvidenceId.md)

Defined in: packages/evidence/dist/contracts.d.ts:20

---

### evidenceKind

> `readonly` **evidenceKind**: `string`

Defined in: packages/evidence/dist/contracts.d.ts:10

#### Inherited from

[`EvidenceDraft`](EvidenceDraft.md).[`evidenceKind`](EvidenceDraft.md#evidencekind)

---

### factRef?

> `readonly` `optional` **factRef?**: `string`

Defined in: packages/evidence/dist/contracts.d.ts:14

#### Inherited from

[`EvidenceDraft`](EvidenceDraft.md).[`factRef`](EvidenceDraft.md#factref)

---

### objectRef?

> `readonly` `optional` **objectRef?**: `string`

Defined in: packages/evidence/dist/contracts.d.ts:13

#### Inherited from

[`EvidenceDraft`](EvidenceDraft.md).[`objectRef`](EvidenceDraft.md#objectref)

---

### recordedAt

> `readonly` **recordedAt**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/evidence/dist/contracts.d.ts:22

---

### retentionClass

> `readonly` **retentionClass**: [`RetentionClass`](../../../foundation-contracts/dist/type-aliases/RetentionClass.md)

Defined in: packages/evidence/dist/contracts.d.ts:15

#### Inherited from

[`EvidenceDraft`](EvidenceDraft.md).[`retentionClass`](EvidenceDraft.md#retentionclass)

---

### sensitivity

> `readonly` **sensitivity**: [`Sensitivity`](../../../foundation-contracts/dist/type-aliases/Sensitivity.md)

Defined in: packages/evidence/dist/contracts.d.ts:16

#### Inherited from

[`EvidenceDraft`](EvidenceDraft.md).[`sensitivity`](EvidenceDraft.md#sensitivity)

---

### subjectRef?

> `readonly` `optional` **subjectRef?**: `string`

Defined in: packages/evidence/dist/contracts.d.ts:12

#### Inherited from

[`EvidenceDraft`](EvidenceDraft.md).[`subjectRef`](EvidenceDraft.md#subjectref)
