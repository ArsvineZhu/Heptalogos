import type { ContinuityEpochId } from "@heptalogos/foundation-contracts";
import type { HostCanonicalMigrationAuthority } from "@heptalogos/host-ownership";

export interface CanonicalSchemaRuntimeOptions {
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly lockTimeoutMs: number;
  readonly idleInTransactionSessionTimeoutMs: number;
  readonly onBackgroundError: (error: unknown) => void;
}

export interface CanonicalSchemaInitializationContext {
  readonly authority: HostCanonicalMigrationAuthority;
  readonly expectedContinuityEpochId: ContinuityEpochId;
}

export interface CanonicalSchemaInitializer {
  (context: CanonicalSchemaInitializationContext): Promise<void>;
}
