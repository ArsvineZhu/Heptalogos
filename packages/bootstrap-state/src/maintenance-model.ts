/**
 * Defines durable maintenance operation identities, phases, and outcomes used
 * to resume or reject bounded Bootstrap cleanup after interruption.
 * @module maintenance-model
 */

import type {
  BootId,
  ContentDigest,
  HostOwnershipToken,
  InstallationId,
  InstanceId,
  Problem,
  Sha256Digest,
  UuidV7Id,
} from "@heptalogos/foundation-contracts";

/** Identifies one durable private-PostgreSQL maintenance operation. */
export type MaintenanceOperationId = UuidV7Id<"MaintenanceOperationId">;
/** Identifies the Activity retained for one maintenance operation. */
export type MaintenanceActivityId = UuidV7Id<"ActivityId">;
/** Identifies the initialization profile verified before maintenance. */
export type PrivatePostgresInitializationProfileRevision =
  ContentDigest<"PrivatePostgresInitializationProfileRevision">;

/** Selects restart or stop behavior for a maintenance window. */
export type MaintenanceOperationType =
  "PRIVATE_POSTGRES_RESTART" | "PRIVATE_POSTGRES_STOP";

/** Enumerates durable maintenance stages used for recovery ordering. */
export type MaintenanceStage =
  | "BOOTSTRAP_OWNERSHIP_ACQUIRED"
  | "HOST_QUIESCED"
  | "HOST_TOKEN_REVOKED"
  | "HOST_LEASE_CLOSED"
  | "POSTGRES_STOPPED"
  | "POSTGRES_READY"
  | "HOST_LEASE_ACQUIRED"
  | "HOST_TOKEN_PUBLICATION_ARMED"
  | "HOST_TOKEN_PUBLISHED"
  | "BOOTSTRAP_RELEASE_ARMED"
  | "ABORTED"
  | "RECOVERY_REQUIRED";

/** Records the terminal result observed for a maintenance operation. */
export type MaintenanceTerminalOutcome =
  "SUCCEEDED" | "ABORTED" | "FAILED" | "UNCERTAIN";

/** Versioned durable journal body for one Host/private-PostgreSQL window. */
export interface MaintenanceJournalBodyV1 {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly operationId: MaintenanceOperationId;
  readonly activityId: MaintenanceActivityId;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly operationType: MaintenanceOperationType;

  readonly source: {
    readonly hostOwnershipToken: HostOwnershipToken;
    readonly hostOwnershipRevision: string;
    readonly postgresClusterSystemIdentifier: string;
    readonly persistedPort: number;
  };

  readonly target: {
    readonly privatePostgres: "RUNNING_SAME_IDENTITY" | "STOPPED";
    readonly hostOwnershipToken?: HostOwnershipToken;
    readonly hostBootId?: BootId;
    readonly hostOwnershipRevision?: string;
  };

  readonly verifiedPrerequisites: {
    readonly bootstrapStateDigest: Sha256Digest;
    readonly privatePostgresInitializationProfileRevision: PrivatePostgresInitializationProfileRevision;
  };

  readonly lastCompletedStage: MaintenanceStage;
  readonly updatedAt: string;
  readonly terminalOutcome?: MaintenanceTerminalOutcome;
  readonly problemCode?: string;
}

/** Couples maintenance state with its canonical digest. */
export interface MaintenanceJournalEnvelopeV1 {
  readonly state: MaintenanceJournalBodyV1;
  readonly digest: Sha256Digest;
}

/** Holds current and previous journal envelopes for recovery decisions. */
export interface MaintenanceJournalRecoveryHead {
  readonly current: MaintenanceJournalEnvelopeV1;
  readonly previous?: MaintenanceJournalEnvelopeV1;
  readonly effectiveProgressStage: MaintenanceStage;
}

/** Reports an authenticated maintenance envelope or a parse Problem. */
export type MaintenanceJournalParseResult =
  | { readonly ok: true; readonly value: MaintenanceJournalEnvelopeV1 }
  | { readonly ok: false; readonly problem: Problem };

/** Reports empty, current, recovered-previous, or corrupt journal state. */
export type MaintenanceJournalLoadResult =
  | { readonly status: "EMPTY" }
  | {
      readonly status: "CURRENT";
      readonly value: MaintenanceJournalEnvelopeV1;
    }
  | {
      readonly status: "RECOVERED_PREVIOUS";
      readonly value: MaintenanceJournalEnvelopeV1;
      readonly problem: Problem;
    }
  | { readonly status: "CORRUPT"; readonly problem: Problem };
