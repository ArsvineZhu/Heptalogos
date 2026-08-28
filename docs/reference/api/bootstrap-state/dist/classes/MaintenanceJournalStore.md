[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / MaintenanceJournalStore

# Class: MaintenanceJournalStore

Defined in: packages/bootstrap-state/dist/maintenance-store.d.ts:8

Owns serialized, atomic MaintenanceJournal revisions for one instance.

## Constructors

### Constructor

> **new MaintenanceJournalStore**(`instanceRoot`, `assertAuthority?`): `MaintenanceJournalStore`

Defined in: packages/bootstrap-state/dist/maintenance-store.d.ts:13

Binds the journal store to an instance root and optional authority check.

#### Parameters

##### instanceRoot

`string`

##### assertAuthority?

() => `void`

#### Returns

`MaintenanceJournalStore`

## Methods

### advance()

> **advance**(`body`): `Promise`\<[`MaintenanceJournalEnvelopeV1`](../interfaces/MaintenanceJournalEnvelopeV1.md)>\>

Defined in: packages/bootstrap-state/dist/maintenance-store.d.ts:21

Advances one operation serially after checking revision and authority.

#### Parameters

##### body

[`MaintenanceJournalBodyV1`](../interfaces/MaintenanceJournalBodyV1.md)

#### Returns

`Promise`\<[`MaintenanceJournalEnvelopeV1`](../interfaces/MaintenanceJournalEnvelopeV1.md)\>

---

### create()

> **create**(`body`): `Promise`\<[`MaintenanceJournalEnvelopeV1`](../interfaces/MaintenanceJournalEnvelopeV1.md)>\>

Defined in: packages/bootstrap-state/dist/maintenance-store.d.ts:19

Creates revision one after confirming the operation does not already exist.

#### Parameters

##### body

[`MaintenanceJournalBodyV1`](../interfaces/MaintenanceJournalBodyV1.md)

#### Returns

`Promise`\<[`MaintenanceJournalEnvelopeV1`](../interfaces/MaintenanceJournalEnvelopeV1.md)\>

---

### load()

> **load**(`operation`): `Promise`\<[`MaintenanceJournalLoadResult`](../type-aliases/MaintenanceJournalLoadResult.md)>\>

Defined in: packages/bootstrap-state/dist/maintenance-store.d.ts:15

Loads the current journal result for one operation.

#### Parameters

##### operation

[`MaintenanceOperationId`](../type-aliases/MaintenanceOperationId.md)

#### Returns

`Promise`\<[`MaintenanceJournalLoadResult`](../type-aliases/MaintenanceJournalLoadResult.md)\>

---

### loadRecoveryHead()

> **loadRecoveryHead**(`operation`): `Promise`\<[`MaintenanceJournalRecoveryHead`](../interfaces/MaintenanceJournalRecoveryHead.md)>\>

Defined in: packages/bootstrap-state/dist/maintenance-store.d.ts:17

Loads current/previous envelopes and the effective recovery progress stage.

#### Parameters

##### operation

[`MaintenanceOperationId`](../type-aliases/MaintenanceOperationId.md)

#### Returns

`Promise`\<[`MaintenanceJournalRecoveryHead`](../interfaces/MaintenanceJournalRecoveryHead.md)\>
