import type {
  BootId,
  HostOwnershipToken,
  InstallationId,
  InstanceId,
} from "@heptalogos/foundation-contracts";

export const HOST_OWNERSHIP_CANONICAL_DATABASE = "heptalogos" as const;
export const HOST_OWNERSHIP_OWNER_ROLE = "heptalogos_owner" as const;
export const HOST_LEASE_ROLE = "heptalogos_host_lease" as const;
export const HOST_RUNTIME_ROLE = "heptalogos_runtime" as const;
export const HOST_OWNERSHIP_SCHEMA = "heptalogos" as const;
export const HOST_OWNERSHIP_FENCE_TABLE = "host_ownership_fence" as const;
export const HOST_OWNERSHIP_FENCE_LOCK_FUNCTION = "lock_host_ownership_fence" as const;
export const HOST_LEASE_SCRAM_ITERATIONS = 4096 as const;
export const HOST_LEASE_SCRAM_SALT_BYTES = 16 as const;

export interface PostgresScramVerifierOptions {
  readonly iterations: number;
  readonly salt: Uint8Array;
}

export type HostOwnershipState = "ACTIVE" | "FENCED" | "CLOSING" | "CLOSED";

export interface HostOwnershipContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly token: HostOwnershipToken;
  readonly state: HostOwnershipState;
  readonly signal: AbortSignal;
  assertActive(): void;
  close(): Promise<void>;
}

export interface HostOwnershipConnectionTarget {
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: typeof HOST_OWNERSHIP_CANONICAL_DATABASE;
}

export interface HostRuntimeDatabaseTarget {
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: typeof HOST_OWNERSHIP_CANONICAL_DATABASE;
  readonly user: typeof HOST_RUNTIME_ROLE;
}

export interface HostPersistenceAuthority {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly token: HostOwnershipToken;
  readonly target: HostRuntimeDatabaseTarget;
  readonly signal: AbortSignal;
  assertActive(): void;
  withRuntimeDatabasePassword<T>(
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
}

export interface HostOwnershipTimingOptions {
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly fenceLockTimeoutMs: number;
  readonly keepAliveInitialDelayMs: number;
}
