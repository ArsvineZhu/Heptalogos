export { deriveHostAdvisoryKey, type HostAdvisoryKey } from "./advisory-key.js";
export { encodePostgresScramSha256Verifier } from "./scram-verifier.js";
export {
  acquireBootstrapHostReservation,
  provisionHostOwnershipDatabase,
  type BootstrapHostReservation,
  type BootstrapHostReservationOptions,
  type BootstrapAdminPasswordProvider,
  type BootstrapAdminProvisioningOptions,
  type BootstrapAdminProvisioningResult,
} from "./bootstrap-admin.js";
export {
  ensureHostOwnershipSchema,
  type OwnershipSchemaOptions,
  type OwnershipSchemaResult,
} from "./ownership-schema.js";
export {
  publishHostOwnershipToken,
  type PublishHostOwnershipTokenOptions,
} from "./host-ownership.js";
export { acquireHostLeaseConnection } from "./host-lease-connection.js";
export {
  HOST_LEASE_ROLE,
  HOST_LEASE_SCRAM_ITERATIONS,
  HOST_LEASE_SCRAM_SALT_BYTES,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_OWNERSHIP_FENCE_TABLE,
  HOST_OWNERSHIP_OWNER_ROLE,
  HOST_OWNERSHIP_SCHEMA,
  type HostOwnershipConnectionTarget,
  type HostOwnershipContext,
  type HostOwnershipState,
  type HostOwnershipTimingOptions,
  type PostgresScramVerifierOptions,
} from "./contracts.js";
