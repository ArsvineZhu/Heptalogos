[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / BootstrapJournal

# Class: BootstrapJournal

Defined in: packages/bootstrap-state/dist/journal.d.ts:31

Appends and reads per-BootId Bootstrap journal checkpoints atomically.

## Constructors

### Constructor

> **new BootstrapJournal**(`directory`): `BootstrapJournal`

Defined in: packages/bootstrap-state/dist/journal.d.ts:36

Binds journal files to one Bootstrap lifecycle root.

#### Parameters

##### directory

`string`

#### Returns

`BootstrapJournal`

## Methods

### checkpoint()

> **checkpoint**(`entry`): `Promise`\<`void`>\>

Defined in: packages/bootstrap-state/dist/journal.d.ts:38

Appends a validated checkpoint while serializing same-boot writes.

#### Parameters

##### entry

[`BootstrapJournalCheckpointV1`](../interfaces/BootstrapJournalCheckpointV1.md)

#### Returns

`Promise`\<`void`\>

---

### read()

> **read**(`bootId`): `Promise`\<readonly [`BootstrapJournalCheckpointV1`](../interfaces/BootstrapJournalCheckpointV1.md)[]\>

Defined in: packages/bootstrap-state/dist/journal.d.ts:40

Reads the validated checkpoint history for one BootId.

#### Parameters

##### bootId

[`BootId`](../type-aliases/BootId.md)

#### Returns

`Promise`\<readonly [`BootstrapJournalCheckpointV1`](../interfaces/BootstrapJournalCheckpointV1.md)[]\>
