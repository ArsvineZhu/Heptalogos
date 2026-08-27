import type {
  ActivityId,
  BootId,
  ContinuityEpochId,
  HostOwnershipToken,
  InstallationId,
  InstanceId,
} from "@heptalogos/foundation-contracts";
import type { HostPersistenceAuthority } from "@heptalogos/host-ownership";

export interface PersistenceExecutionMetadata {
  readonly activityId: ActivityId;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly hostOwnershipToken: HostOwnershipToken;
}

export interface PersistenceExecutionContextProvider {
  current(): PersistenceExecutionMetadata | undefined;
}

export interface PersistenceReadTransactionContext {
  readonly mode: "READ";
  readonly execution?: PersistenceExecutionMetadata;
}

export interface PersistenceMutationTransactionContext {
  readonly mode: "MUTATION";
  readonly execution: PersistenceExecutionMetadata;
}

export type PersistenceTransactionContext =
  PersistenceReadTransactionContext | PersistenceMutationTransactionContext;
export type PersistenceTransactionMode = PersistenceTransactionContext["mode"];

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
    operation: (context: PersistenceReadTransactionContext) => Promise<T>,
  ): Promise<T>;
  mutate<T>(
    operation: (context: PersistenceMutationTransactionContext) => Promise<T>,
  ): Promise<T>;
  close(): Promise<void>;
}
