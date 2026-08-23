import type { HostPersistenceAuthority } from "@heptalogos/host-ownership";

export type PersistenceTransactionMode = "READ" | "MUTATION";

export interface PersistenceTransactionContext {
  readonly mode: PersistenceTransactionMode;
}

export interface PersistenceRuntimeOptions {
  readonly maxConnections: number;
  readonly idleTimeoutMs: number;
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly lockTimeoutMs: number;
  readonly idleInTransactionSessionTimeoutMs: number;
  readonly onBackgroundError: (error: unknown) => void;
}

export type PersistenceServiceState = "OPEN" | "FENCED" | "CLOSING" | "CLOSED";

export interface PersistenceService {
  readonly state: PersistenceServiceState;
  read<T>(
    operation: (context: PersistenceTransactionContext) => Promise<T>,
  ): Promise<T>;
  mutate<T>(
    operation: (context: PersistenceTransactionContext) => Promise<T>,
  ): Promise<T>;
  close(): Promise<void>;
}

export type PersistenceAuthority = HostPersistenceAuthority;
