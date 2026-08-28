[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [evidence/dist](../README.md) / EvidenceService

# Interface: EvidenceService

Defined in: packages/evidence/dist/contracts.d.ts:25

Persists required Evidence through a caller-owned mutation transaction.

## Methods

### recordRequired()

> **recordRequired**(`transaction`, `draft`): `Promise`\<[`EvidenceRecord`](EvidenceRecord.md)>\>

Defined in: packages/evidence/dist/contracts.d.ts:27

Records one draft and associates it with the transaction Activity.

#### Parameters

##### transaction

[`PersistenceMutationTransactionContext`](../../../persistence/dist/interfaces/PersistenceMutationTransactionContext.md)

##### draft

[`EvidenceDraft`](EvidenceDraft.md)

#### Returns

`Promise`\<[`EvidenceRecord`](EvidenceRecord.md)\>
