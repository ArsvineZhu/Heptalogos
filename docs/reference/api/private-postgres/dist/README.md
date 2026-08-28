[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / private-postgres/dist

# private-postgres/dist

Public private-PostgreSQL toolchain, cluster, lifecycle, and maintenance
contracts; process and profile mechanics remain behind controller adapters.

## Interfaces

- [EffectivePrivatePostgresProfile](interfaces/EffectivePrivatePostgresProfile.md)
- [InitializePrivatePostgresClusterOptions](interfaces/InitializePrivatePostgresClusterOptions.md)
- [OpenPrivatePostgresMaintenanceControllerOptions](interfaces/OpenPrivatePostgresMaintenanceControllerOptions.md)
- [ParsedPgControldata](interfaces/ParsedPgControldata.md)
- [PrivatePostgresClusterIdentity](interfaces/PrivatePostgresClusterIdentity.md)
- [PrivatePostgresClusterInspection](interfaces/PrivatePostgresClusterInspection.md)
- [PrivatePostgresExpectedIdentity](interfaces/PrivatePostgresExpectedIdentity.md)
- [PrivatePostgresInitializationProfile](interfaces/PrivatePostgresInitializationProfile.md)
- [PrivatePostgresInitializationResult](interfaces/PrivatePostgresInitializationResult.md)
- [PrivatePostgresLifecycleOptions](interfaces/PrivatePostgresLifecycleOptions.md)
- [PrivatePostgresMaintenanceController](interfaces/PrivatePostgresMaintenanceController.md)
- [PrivatePostgresPlacement](interfaces/PrivatePostgresPlacement.md)
- [PrivatePostgresToolchain](interfaces/PrivatePostgresToolchain.md)
- [ReadyPrivatePostgresMechanics](interfaces/ReadyPrivatePostgresMechanics.md)
- [StartPrivatePostgresClusterOptions](interfaces/StartPrivatePostgresClusterOptions.md)
- [ValidateExistingPrivatePostgresClusterOptions](interfaces/ValidateExistingPrivatePostgresClusterOptions.md)

## Type Aliases

- [ClusterDirectoryState](type-aliases/ClusterDirectoryState.md)
- [PrivatePostgresControlGuard](type-aliases/PrivatePostgresControlGuard.md)
- [PrivatePostgresInitializationProfileRevision](type-aliases/PrivatePostgresInitializationProfileRevision.md)
- [PrivatePostgresStartupDisposition](type-aliases/PrivatePostgresStartupDisposition.md)

## Variables

- [PRIVATE\_POSTGRES\_ARCHITECTURE\_MAJOR](variables/PRIVATE_POSTGRES_ARCHITECTURE_MAJOR.md)
- [PRIVATE\_POSTGRES\_BOOTSTRAP\_ROLE\_NAME](variables/PRIVATE_POSTGRES_BOOTSTRAP_ROLE_NAME.md)
- [PRIVATE\_POSTGRES\_DATA\_LAYOUT\_VERSION](variables/PRIVATE_POSTGRES_DATA_LAYOUT_VERSION.md)
- [PRIVATE\_POSTGRES\_QUALIFIED\_VERSION](variables/PRIVATE_POSTGRES_QUALIFIED_VERSION.md)
- [PRIVATE\_POSTGRES\_RELATIVE\_DATA\_PATH](variables/PRIVATE_POSTGRES_RELATIVE_DATA_PATH.md)

## Functions

- [classifyClusterDirectory](functions/classifyClusterDirectory.md)
- [createCanonicalHbaProfile](functions/createCanonicalHbaProfile.md)
- [createCanonicalRuntimeProfile](functions/createCanonicalRuntimeProfile.md)
- [createPrivatePostgresInitializationProfile](functions/createPrivatePostgresInitializationProfile.md)
- [createPrivatePostgresInitializationProfileRevision](functions/createPrivatePostgresInitializationProfileRevision.md)
- [initializePrivatePostgresCluster](functions/initializePrivatePostgresCluster.md)
- [inspectEffectivePrivatePostgresProfile](functions/inspectEffectivePrivatePostgresProfile.md)
- [inspectPrivatePostgresCluster](functions/inspectPrivatePostgresCluster.md)
- [openPrivatePostgresMaintenanceController](functions/openPrivatePostgresMaintenanceController.md)
- [parsePgControldata](functions/parsePgControldata.md)
- [readCanonicalHbaProfile](functions/readCanonicalHbaProfile.md)
- [readPrivatePostgresMajor](functions/readPrivatePostgresMajor.md)
- [resolvePrivatePostgresPlacement](functions/resolvePrivatePostgresPlacement.md)
- [resolvePrivatePostgresToolchain](functions/resolvePrivatePostgresToolchain.md)
- [startPrivatePostgresCluster](functions/startPrivatePostgresCluster.md)
- [validateExistingCluster](functions/validateExistingCluster.md)
- [writeCanonicalPrivatePostgresRuntimeProfile](functions/writeCanonicalPrivatePostgresRuntimeProfile.md)
