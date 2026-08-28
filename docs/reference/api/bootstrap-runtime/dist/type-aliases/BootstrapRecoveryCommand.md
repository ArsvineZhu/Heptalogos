[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapRecoveryCommand

# Type Alias: BootstrapRecoveryCommand

> **BootstrapRecoveryCommand** = \{ `kind`: `"INSPECT"`; \} \| \{ `expectedOperationId?`: [`MaintenanceOperationId`](../../../bootstrap-state/dist/type-aliases/MaintenanceOperationId.md); `kind`: `"RECOVER"`; \}

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery-command.d.ts:11

Selects read-only inspection or one explicitly authorized recovery action.
