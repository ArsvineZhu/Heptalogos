import {
  ProblemError,
  type BootId,
  type ContinuityEpochId,
  type HostOwnershipToken,
  type InstallationId,
  type InstanceId,
} from "@heptalogos/foundation-contracts";
import type { MaintenanceOperationId } from "@heptalogos/bootstrap-state";
import type {
  HostPersistenceAuthority,
  HostOwnershipContext,
  HostRuntimeDatabaseTarget,
  HostOwnershipState,
} from "@heptalogos/host-ownership";
import type { HostMaintenanceState } from "./host-maintenance-machine.js";

export type PrivatePostgresMaintenanceRequest =
  | { readonly kind: "RESTART_PRIVATE_POSTGRES" }
  | { readonly kind: "STOP_PRIVATE_POSTGRES" };

export type PreparedMaintenanceState = HostMaintenanceState;

export interface HostMaintenanceQuiescence {
  quiesce(): Promise<HostQuiescenceLease>;
}

export interface HostQuiescenceLease {
  resumeAfterAbort(): Promise<void>;
}

interface PrivatePostgresMaintenanceResultRestarted {
  readonly kind: "RESTARTED";
  readonly host: BootstrapManagedHostContext;
}

interface PrivatePostgresMaintenanceResultStopped {
  readonly kind: "STOPPED";
}

export type PrivatePostgresMaintenanceResult =
  PrivatePostgresMaintenanceResultRestarted | PrivatePostgresMaintenanceResultStopped;

export interface PreparedPrivatePostgresMaintenance {
  readonly operationId: MaintenanceOperationId;
  readonly state: PreparedMaintenanceState;
  readonly signal: AbortSignal;
  execute(
    quiescence: HostMaintenanceQuiescence,
  ): Promise<PrivatePostgresMaintenanceResult>;
  abortBeforeEntry(): Promise<void>;
}

export interface BootstrapManagedHostContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly token: HostOwnershipToken;
  readonly state: HostOwnershipState;
  readonly signal: AbortSignal;
  readonly persistence: HostPersistenceAuthority;
  assertActive(): void;
  preparePrivatePostgresMaintenance(
    request: PrivatePostgresMaintenanceRequest,
  ): Promise<PreparedPrivatePostgresMaintenance>;
  shutdownKeepingPrivatePostgres(quiescence: HostMaintenanceQuiescence): Promise<void>;
}

export interface ManagedHostPersistenceOptions {
  readonly continuityEpochId: ContinuityEpochId;
  readonly target: HostRuntimeDatabaseTarget;
  readonly withRuntimeDatabasePassword: HostPersistenceAuthority["withRuntimeDatabasePassword"];
}

export interface ManagedHostOperations {
  preparePrivatePostgresMaintenance(
    request: PrivatePostgresMaintenanceRequest,
  ): Promise<PreparedPrivatePostgresMaintenance>;
  shutdownKeepingPrivatePostgres(quiescence: HostMaintenanceQuiescence): Promise<void>;
}

interface ManagedHostRecord {
  readonly raw: HostOwnershipContext;
  readonly operations: ManagedHostOperations;
  terminal: boolean;
}

const managedHostRecords = new WeakMap<
  BootstrapManagedHostContext,
  ManagedHostRecord
>();

function invalidCapability(): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode: "bootstrap.host.invalid_managed_capability",
    category: "integrity",
    retryClass: "manual",
    title: "Managed Host capability is invalid",
    detail: "The managed Host value was not issued by bootstrap-runtime",
  });
}

function terminalProblem(): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode: "bootstrap.host.managed_host_terminal",
    category: "conflict",
    retryClass: "manual",
    title: "Managed Host capability is terminal",
    detail: "The previous managed Host cannot authorize new Host work after handoff",
  });
}

export function assertManagedHostContext(
  value: unknown,
): asserts value is BootstrapManagedHostContext {
  if (
    typeof value !== "object" ||
    value === null ||
    !managedHostRecords.has(value as BootstrapManagedHostContext)
  ) {
    throw invalidCapability();
  }
}

export function createManagedHostContext(
  raw: HostOwnershipContext,
  operations: ManagedHostOperations,
  persistenceOptions: ManagedHostPersistenceOptions,
): BootstrapManagedHostContext {
  const record: ManagedHostRecord = {
    raw,
    operations,
    terminal: false,
  };
  const persistence: HostPersistenceAuthority = Object.freeze({
    installationId: raw.installationId,
    instanceId: raw.instanceId,
    bootId: raw.bootId,
    continuityEpochId: persistenceOptions.continuityEpochId,
    token: raw.token,
    target: persistenceOptions.target,
    signal: raw.signal,
    assertActive() {
      if (record.terminal) throw terminalProblem();
      raw.assertActive();
    },
    async withRuntimeDatabasePassword<T>(
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ) {
      if (record.terminal) throw terminalProblem();
      raw.assertActive();
      return await persistenceOptions.withRuntimeDatabasePassword(use);
    },
  });
  const managed: BootstrapManagedHostContext = Object.freeze({
    installationId: raw.installationId,
    instanceId: raw.instanceId,
    bootId: raw.bootId,
    continuityEpochId: persistenceOptions.continuityEpochId,
    token: raw.token,
    get state() {
      return record.terminal ? "CLOSED" : raw.state;
    },
    signal: raw.signal,
    persistence,
    assertActive() {
      if (record.terminal) throw terminalProblem();
      raw.assertActive();
    },
    preparePrivatePostgresMaintenance(request: PrivatePostgresMaintenanceRequest) {
      if (record.terminal) throw terminalProblem();
      raw.assertActive();
      return record.operations.preparePrivatePostgresMaintenance(request);
    },
    shutdownKeepingPrivatePostgres(quiescence: HostMaintenanceQuiescence) {
      if (record.terminal) throw terminalProblem();
      raw.assertActive();
      return record.operations.shutdownKeepingPrivatePostgres(quiescence);
    },
  });
  managedHostRecords.set(managed, record);
  return managed;
}

export function markManagedHostTerminal(managed: BootstrapManagedHostContext): void {
  assertManagedHostContext(managed);
  const record = managedHostRecords.get(managed);
  if (record === undefined) throw invalidCapability();
  record.terminal = true;
}
