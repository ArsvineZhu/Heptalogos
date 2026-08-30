[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / host-ownership/dist

# host-ownership/dist

Public Host ownership contracts and PostgreSQL fence operations; raw clients,
statechart objects, and provisioning mechanics remain adapter-internal.

## Interfaces

- [BootstrapAdminInspectionOptions](interfaces/BootstrapAdminInspectionOptions.md)
- [BootstrapAdminPasswordProvider](interfaces/BootstrapAdminPasswordProvider.md)
- [BootstrapAdminProvisioningOptions](interfaces/BootstrapAdminProvisioningOptions.md)
- [BootstrapAdminProvisioningResult](interfaces/BootstrapAdminProvisioningResult.md)
- [BootstrapHostReservation](interfaces/BootstrapHostReservation.md)
- [BootstrapHostReservationOptions](interfaces/BootstrapHostReservationOptions.md)
- [BootstrapMutationAuthority](interfaces/BootstrapMutationAuthority.md)
- [CanonicalHostDatabaseInspection](interfaces/CanonicalHostDatabaseInspection.md)
- [HostAdvisoryKey](interfaces/HostAdvisoryKey.md)
- [HostAdvisoryLeaseInspection](interfaces/HostAdvisoryLeaseInspection.md)
- [HostAdvisoryLeaseInspectionOptions](interfaces/HostAdvisoryLeaseInspectionOptions.md)
- [HostCanonicalMigrationAuthority](interfaces/HostCanonicalMigrationAuthority.md)
- [HostDurableExecutionAuthority](interfaces/HostDurableExecutionAuthority.md)
- [HostDurableExecutionDatabaseTarget](interfaces/HostDurableExecutionDatabaseTarget.md)
- [HostMigrationDatabaseTarget](interfaces/HostMigrationDatabaseTarget.md)
- [HostOwnershipCanonicalSnapshot](interfaces/HostOwnershipCanonicalSnapshot.md)
- [HostOwnershipCanonicalSnapshotOptions](interfaces/HostOwnershipCanonicalSnapshotOptions.md)
- [HostOwnershipConnectionTarget](interfaces/HostOwnershipConnectionTarget.md)
- [HostOwnershipContext](interfaces/HostOwnershipContext.md)
- [HostOwnershipPublicationResult](interfaces/HostOwnershipPublicationResult.md)
- [HostOwnershipRevocationResult](interfaces/HostOwnershipRevocationResult.md)
- [HostOwnershipTimingOptions](interfaces/HostOwnershipTimingOptions.md)
- [HostPersistenceAuthority](interfaces/HostPersistenceAuthority.md)
- [HostRuntimeDatabaseTarget](interfaces/HostRuntimeDatabaseTarget.md)
- [OwnershipSchemaOptions](interfaces/OwnershipSchemaOptions.md)
- [OwnershipSchemaResult](interfaces/OwnershipSchemaResult.md)
- [PostgresScramVerifierOptions](interfaces/PostgresScramVerifierOptions.md)
- [PublishHostOwnershipTokenOptions](interfaces/PublishHostOwnershipTokenOptions.md)
- [RevokeHostOwnershipTokenOptions](interfaces/RevokeHostOwnershipTokenOptions.md)

## Type Aliases

- [HostOwnershipState](type-aliases/HostOwnershipState.md)

## Variables

- [HOST\_DURABLE\_EXECUTION\_ROLE](variables/HOST_DURABLE_EXECUTION_ROLE.md)
- [HOST\_LEASE\_ROLE](variables/HOST_LEASE_ROLE.md)
- [HOST\_LEASE\_SCRAM\_ITERATIONS](variables/HOST_LEASE_SCRAM_ITERATIONS.md)
- [HOST\_LEASE\_SCRAM\_SALT\_BYTES](variables/HOST_LEASE_SCRAM_SALT_BYTES.md)
- [HOST\_MIGRATION\_ROLE](variables/HOST_MIGRATION_ROLE.md)
- [HOST\_OWNERSHIP\_CANONICAL\_DATABASE](variables/HOST_OWNERSHIP_CANONICAL_DATABASE.md)
- [HOST\_OWNERSHIP\_FENCE\_LOCK\_FUNCTION](variables/HOST_OWNERSHIP_FENCE_LOCK_FUNCTION.md)
- [HOST\_OWNERSHIP\_FENCE\_TABLE](variables/HOST_OWNERSHIP_FENCE_TABLE.md)
- [HOST\_OWNERSHIP\_OWNER\_ROLE](variables/HOST_OWNERSHIP_OWNER_ROLE.md)
- [HOST\_OWNERSHIP\_SCHEMA](variables/HOST_OWNERSHIP_SCHEMA.md)
- [HOST\_RUNTIME\_ROLE](variables/HOST_RUNTIME_ROLE.md)

## Functions

- [acquireBootstrapHostReservation](functions/acquireBootstrapHostReservation.md)
- [acquireHostLeaseConnection](functions/acquireHostLeaseConnection.md)
- [deriveHostAdvisoryKey](functions/deriveHostAdvisoryKey.md)
- [encodePostgresScramSha256Verifier](functions/encodePostgresScramSha256Verifier.md)
- [ensureHostOwnershipSchema](functions/ensureHostOwnershipSchema.md)
- [inspectCanonicalHostDatabase](functions/inspectCanonicalHostDatabase.md)
- [inspectHostAdvisoryLease](functions/inspectHostAdvisoryLease.md)
- [inspectHostOwnershipCanonicalSnapshot](functions/inspectHostOwnershipCanonicalSnapshot.md)
- [provisionHostOwnershipDatabase](functions/provisionHostOwnershipDatabase.md)
- [publishHostOwnershipToken](functions/publishHostOwnershipToken.md)
- [revokeHostOwnershipTokenForBootstrap](functions/revokeHostOwnershipTokenForBootstrap.md)
