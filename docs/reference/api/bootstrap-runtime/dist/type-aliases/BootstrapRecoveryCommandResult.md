[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapRecoveryCommandResult

# Type Alias: BootstrapRecoveryCommandResult

> **BootstrapRecoveryCommandResult** = \{ `inspection`: [`BootstrapRecoveryInspection`](../interfaces/BootstrapRecoveryInspection.md); `kind`: `"INSPECTED"`; \} \| \{ `host`: [`BootstrapManagedHostContext`](../interfaces/BootstrapManagedHostContext.md); `kind`: `"RECOVERED"`; `recoveryKind`: `"BOOTSTRAP_CONTINUATION"`; \} \| \{ `kind`: `"RECOVERED"`; `operationId`: [`MaintenanceOperationId`](../../../bootstrap-state/dist/type-aliases/MaintenanceOperationId.md); `recoveryKind`: `"MAINTENANCE"`; `result`: [`PrivatePostgresMaintenanceResult`](PrivatePostgresMaintenanceResult.md); \}

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery-command.d.ts:18

Describes the typed result produced by an inspection or recovery action.
