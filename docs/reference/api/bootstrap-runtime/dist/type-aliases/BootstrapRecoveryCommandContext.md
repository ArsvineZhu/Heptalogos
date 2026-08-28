[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapRecoveryCommandContext

# Type Alias: BootstrapRecoveryCommandContext

> **BootstrapRecoveryCommandContext** = \{ `continuation`: `Omit`\<`AbandonedBootstrapContinuationOptions`, `"anchorRoot"`>\>; `kind`: `"BOOTSTRAP_CONTINUATION"`; \} \| \{ `kind`: `"MAINTENANCE"`; `recovery`: `Omit`\<`HostMaintenanceRecoveryOptions`, `"anchorRoot"` \| `"expectedOperationId"`>\>; \}

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery-command.d.ts:32

Supplies the fixed local context required to execute a recovery command.
