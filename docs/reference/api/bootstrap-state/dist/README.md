[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / bootstrap-state/dist

# bootstrap-state/dist

Public BootstrapState contracts for versioned envelopes, journals, witnesses,
codecs, and crash-safe stores; file and serialization mechanics stay owned
by their internal modules.

## Classes

- [BootstrapJournal](classes/BootstrapJournal.md)
- [BootstrapOwnerWitnessStore](classes/BootstrapOwnerWitnessStore.md)
- [BootstrapStateStore](classes/BootstrapStateStore.md)
- [MaintenanceJournalStore](classes/MaintenanceJournalStore.md)

## Interfaces

- [BootstrapJournalCheckpointV1](interfaces/BootstrapJournalCheckpointV1.md)
- [BootstrapOwnerWitnessBodyV1](interfaces/BootstrapOwnerWitnessBodyV1.md)
- [BootstrapOwnerWitnessEnvelopeV1](interfaces/BootstrapOwnerWitnessEnvelopeV1.md)
- [BootstrapStateBodyV1](interfaces/BootstrapStateBodyV1.md)
- [BootstrapStateEnvelopeV1](interfaces/BootstrapStateEnvelopeV1.md)
- [MaintenanceJournalBodyV1](interfaces/MaintenanceJournalBodyV1.md)
- [MaintenanceJournalEnvelopeV1](interfaces/MaintenanceJournalEnvelopeV1.md)
- [MaintenanceJournalRecoveryHead](interfaces/MaintenanceJournalRecoveryHead.md)
- [PrivatePostgresBootstrapStateV1](interfaces/PrivatePostgresBootstrapStateV1.md)

## Type Aliases

- [BootId](type-aliases/BootId.md)
- [BootstrapActivityId](type-aliases/BootstrapActivityId.md)
- [BootstrapJournalCheckpoint](type-aliases/BootstrapJournalCheckpoint.md)
- [BootstrapLockGenerationId](type-aliases/BootstrapLockGenerationId.md)
- [BootstrapOwnerWitnessParseResult](type-aliases/BootstrapOwnerWitnessParseResult.md)
- [BootstrapRuntimeGenerationId](type-aliases/BootstrapRuntimeGenerationId.md)
- [BootstrapStageOutcome](type-aliases/BootstrapStageOutcome.md)
- [BootstrapStateBody](type-aliases/BootstrapStateBody.md)
- [BootstrapStateEnvelope](type-aliases/BootstrapStateEnvelope.md)
- [BootstrapStateLoadResult](type-aliases/BootstrapStateLoadResult.md)
- [BootstrapStateParseResult](type-aliases/BootstrapStateParseResult.md)
- [MaintenanceActivityId](type-aliases/MaintenanceActivityId.md)
- [MaintenanceJournalLoadResult](type-aliases/MaintenanceJournalLoadResult.md)
- [MaintenanceJournalParseResult](type-aliases/MaintenanceJournalParseResult.md)
- [MaintenanceOperationId](type-aliases/MaintenanceOperationId.md)
- [MaintenanceOperationType](type-aliases/MaintenanceOperationType.md)
- [MaintenancePrivatePostgresInitializationProfileRevision](type-aliases/MaintenancePrivatePostgresInitializationProfileRevision.md)
- [MaintenanceStage](type-aliases/MaintenanceStage.md)
- [MaintenanceTerminalOutcome](type-aliases/MaintenanceTerminalOutcome.md)
- [PrivatePostgresInitializationProfileRevision](type-aliases/PrivatePostgresInitializationProfileRevision.md)
- [ProductGenerationId](type-aliases/ProductGenerationId.md)

## Variables

- [BOOTSTRAP\_OWNER\_WITNESS\_DIGEST\_DOMAIN](variables/BOOTSTRAP_OWNER_WITNESS_DIGEST_DOMAIN.md)
- [BOOTSTRAP\_STATE\_DIGEST\_DOMAIN](variables/BOOTSTRAP_STATE_DIGEST_DOMAIN.md)
- [MAINTENANCE\_JOURNAL\_DIGEST\_DOMAIN](variables/MAINTENANCE_JOURNAL_DIGEST_DOMAIN.md)

## Functions

- [canonicalBootstrapOwnerWitnessText](functions/canonicalBootstrapOwnerWitnessText.md)
- [canonicalMaintenanceJournalText](functions/canonicalMaintenanceJournalText.md)
- [createBootstrapJournalCheckpoint](functions/createBootstrapJournalCheckpoint.md)
- [createBootstrapLockGenerationId](functions/createBootstrapLockGenerationId.md)
- [createMaintenanceOperationId](functions/createMaintenanceOperationId.md)
- [maintenanceOperationRef](functions/maintenanceOperationRef.md)
- [parseBootstrapOwnerWitness](functions/parseBootstrapOwnerWitness.md)
- [parseBootstrapState](functions/parseBootstrapState.md)
- [parseMaintenanceJournal](functions/parseMaintenanceJournal.md)
- [sealBootstrapOwnerWitness](functions/sealBootstrapOwnerWitness.md)
- [sealBootstrapState](functions/sealBootstrapState.md)
- [sealMaintenanceJournal](functions/sealMaintenanceJournal.md)
