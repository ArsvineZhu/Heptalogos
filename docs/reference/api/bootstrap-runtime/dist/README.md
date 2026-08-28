[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / bootstrap-runtime/dist

# bootstrap-runtime/dist

Public Bootstrap runtime contracts for installation/recovery orchestration,
Host handoff, and managed maintenance; private Authority adapters remain
behind these stable exports.

## Interfaces

- [BootstrapKeyProvider](interfaces/BootstrapKeyProvider.md)
- [BootstrapKeyRequestContext](interfaces/BootstrapKeyRequestContext.md)
- [BootstrapLocatorV1](interfaces/BootstrapLocatorV1.md)
- [BootstrapManagedHostContext](interfaces/BootstrapManagedHostContext.md)
- [BootstrapOwnershipLease](interfaces/BootstrapOwnershipLease.md)
- [BootstrapOwnershipOptions](interfaces/BootstrapOwnershipOptions.md)
- [BootstrapPathProfile](interfaces/BootstrapPathProfile.md)
- [BootstrapRecoveryInspection](interfaces/BootstrapRecoveryInspection.md)
- [BootstrapStateGenesisSelection](interfaces/BootstrapStateGenesisSelection.md)
- [HostMaintenanceQuiescence](interfaces/HostMaintenanceQuiescence.md)
- [HostOwnershipHandoffOptions](interfaces/HostOwnershipHandoffOptions.md)
- [HostQuiescenceLease](interfaces/HostQuiescenceLease.md)
- [LocalInstallationOwnerRecoveryPrincipal](interfaces/LocalInstallationOwnerRecoveryPrincipal.md)
- [OwnedBootstrapPrelude](interfaces/OwnedBootstrapPrelude.md)
- [OwnedBootstrapStateStore](interfaces/OwnedBootstrapStateStore.md)
- [PreparedBootstrapPrelude](interfaces/PreparedBootstrapPrelude.md)
- [PreparedPrivatePostgresMaintenance](interfaces/PreparedPrivatePostgresMaintenance.md)
- [PreparePrivatePostgresOptions](interfaces/PreparePrivatePostgresOptions.md)
- [ReadyPrivatePostgres](interfaces/ReadyPrivatePostgres.md)
- [ResolvedLifecycleRoot](interfaces/ResolvedLifecycleRoot.md)

## Type Aliases

- [BootstrapOwnershipState](type-aliases/BootstrapOwnershipState.md)
- [BootstrapRecoveryCommand](type-aliases/BootstrapRecoveryCommand.md)
- [BootstrapRecoveryCommandContext](type-aliases/BootstrapRecoveryCommandContext.md)
- [BootstrapRecoveryCommandResult](type-aliases/BootstrapRecoveryCommandResult.md)
- [BootstrapRecoveryDisposition](type-aliases/BootstrapRecoveryDisposition.md)
- [PreparedMaintenanceState](type-aliases/PreparedMaintenanceState.md)
- [PrivatePostgresMaintenanceRequest](type-aliases/PrivatePostgresMaintenanceRequest.md)
- [PrivatePostgresMaintenanceResult](type-aliases/PrivatePostgresMaintenanceResult.md)

## Variables

- [BOOTSTRAP\_RUNTIME\_PACKAGE](variables/BOOTSTRAP_RUNTIME_PACKAGE.md)

## Functions

- [executeBootstrapRecoveryCommand](functions/executeBootstrapRecoveryCommand.md)
- [inspectBootstrapRecovery](functions/inspectBootstrapRecovery.md)
- [loadBootstrapLocator](functions/loadBootstrapLocator.md)
- [parseBootstrapRecoveryCommand](functions/parseBootstrapRecoveryCommand.md)
- [prepareBootstrapPrelude](functions/prepareBootstrapPrelude.md)
- [proveLocalInstallationOwner](functions/proveLocalInstallationOwner.md)
- [resolveBootstrapPathProfile](functions/resolveBootstrapPathProfile.md)
