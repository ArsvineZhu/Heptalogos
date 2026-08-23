// Evaluate the ownership adapter before the public entry point's other runtime
// dependencies so its adopted provider registers exit cleanup first.
import "./bootstrap-ownership.js";

export const BOOTSTRAP_RUNTIME_PACKAGE = "@heptalogos/bootstrap-runtime" as const;
export { loadBootstrapLocator, type BootstrapLocatorV1 } from "./locator.js";
export {
  resolveBootstrapPathProfile,
  type BootstrapPathProfile,
  type ResolvedLifecycleRoot,
} from "./roots.js";
export type {
  BootstrapOwnershipLease,
  BootstrapOwnershipOptions,
  BootstrapOwnershipState,
} from "./bootstrap-ownership.js";
export {
  proveLocalInstallationOwner,
  type LocalInstallationOwnerRecoveryPrincipal,
} from "./local-installation-owner.js";
export {
  inspectBootstrapRecovery,
  type BootstrapRecoveryDisposition,
  type BootstrapRecoveryInspection,
} from "./bootstrap-recovery.js";
export {
  executeBootstrapRecoveryCommand,
  parseBootstrapRecoveryCommand,
  type BootstrapRecoveryCommand,
  type BootstrapRecoveryCommandContext,
  type BootstrapRecoveryCommandResult,
} from "./bootstrap-recovery-command.js";
export type { OwnedBootstrapStateStore } from "./bootstrap-state-access.js";
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
