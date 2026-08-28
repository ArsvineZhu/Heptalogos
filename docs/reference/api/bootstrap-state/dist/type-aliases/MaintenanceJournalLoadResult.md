[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / MaintenanceJournalLoadResult

# Type Alias: MaintenanceJournalLoadResult

> **MaintenanceJournalLoadResult** = \{ `status`: `"EMPTY"`; \} \| \{ `status`: `"CURRENT"`; `value`: [`MaintenanceJournalEnvelopeV1`](../interfaces/MaintenanceJournalEnvelopeV1.md); \} \| \{ `problem`: [`Problem`](../../../foundation-contracts/dist/interfaces/Problem.md); `status`: `"RECOVERED_PREVIOUS"`; `value`: [`MaintenanceJournalEnvelopeV1`](../interfaces/MaintenanceJournalEnvelopeV1.md); \} \| \{ `problem`: [`Problem`](../../../foundation-contracts/dist/interfaces/Problem.md); `status`: `"CORRUPT"`; \}

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:70

Reports empty, current, recovered-previous, or corrupt journal state.
