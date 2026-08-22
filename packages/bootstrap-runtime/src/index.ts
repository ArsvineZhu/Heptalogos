export const BOOTSTRAP_RUNTIME_PACKAGE = "@heptalogos/bootstrap-runtime" as const;
export { loadBootstrapLocator, type BootstrapLocatorV1 } from "./locator.js";
export {
  resolveBootstrapPathProfile,
  type BootstrapPathProfile,
  type ResolvedLifecycleRoot,
} from "./roots.js";
export {
  BOOTSTRAP_RECOVERY_STALE_MS,
  acquireBootstrapOwnership,
  type BootstrapOwnershipLease,
  type BootstrapOwnershipOptions,
  type BootstrapOwnershipState,
} from "./bootstrap-ownership.js";
export {
  assertLocalInstallationOwnerFor,
  proveLocalInstallationOwner,
  type LocalInstallationOwnerRecoveryPrincipal,
} from "./local-installation-owner.js";
export {
  acquireBootstrapRecoveryLease,
  reclaimAbandonedBootstrapOwnership,
  inspectBootstrapRecovery,
  type BootstrapRecoveryDisposition,
  type BootstrapRecoveryInspection,
} from "./bootstrap-recovery.js";
export {
  recoverInterruptedHostMaintenance,
  type HostMaintenanceRecoveryOptions,
} from "./host-maintenance-recovery.js";
export {
  executeBootstrapRecoveryCommand,
  parseBootstrapRecoveryCommand,
  type BootstrapRecoveryCommand,
  type BootstrapRecoveryCommandContext,
  type BootstrapRecoveryCommandResult,
} from "./bootstrap-recovery-command.js";
export type { OwnedBootstrapStateStore } from "./bootstrap-state-access.js";
export {
  openMaintenanceStateAccess,
  type OwnedMaintenanceStateAccess,
} from "./maintenance-state-access.js";
export {
  prepareBootstrapPrelude,
  type OwnedBootstrapPrelude,
  type PreparedBootstrapPrelude,
} from "./bootstrap-prelude.js";
export type {
  PreparePrivatePostgresOptions,
  ReadyPrivatePostgres,
} from "./private-postgres-bootstrap.js";
export type { HostOwnershipHandoffOptions } from "./host-ownership-handoff.js";
export type {
  BootstrapKeyProvider,
  BootstrapKeyRequestContext,
} from "./bootstrap-key-provider.js";
export type {
  BootstrapManagedHostContext,
  HostMaintenanceQuiescence,
  HostQuiescenceLease,
  PreparedPrivatePostgresMaintenance,
  PreparedMaintenanceState,
  PrivatePostgresMaintenanceRequest,
  PrivatePostgresMaintenanceResult,
} from "./managed-host.js";
