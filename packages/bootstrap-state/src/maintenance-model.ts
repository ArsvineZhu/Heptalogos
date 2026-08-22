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

export type MaintenanceOperationId = UuidV7Id<"MaintenanceOperationId">;
export type MaintenanceActivityId = UuidV7Id<"ActivityId">;
export type PrivatePostgresInitializationProfileRevision =
  ContentDigest<"PrivatePostgresInitializationProfileRevision">;

export type MaintenanceOperationType =
  "PRIVATE_POSTGRES_RESTART" | "PRIVATE_POSTGRES_STOP";

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

export type MaintenanceTerminalOutcome =
  "SUCCEEDED" | "ABORTED" | "FAILED" | "UNCERTAIN";

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

export function resolveMaintenanceTargetHostBootId(
  body: MaintenanceJournalBodyV1,
): BootId | undefined {
  if (body.target.hostBootId !== undefined) return body.target.hostBootId;
  if (
    body.operationType !== "PRIVATE_POSTGRES_RESTART" ||
    (body.lastCompletedStage !== "HOST_TOKEN_PUBLISHED" &&
      body.lastCompletedStage !== "BOOTSTRAP_RELEASE_ARMED" &&
      body.lastCompletedStage !== "RECOVERY_REQUIRED")
  ) {
    return undefined;
  }
  if (
    body.target.hostOwnershipToken === undefined ||
    body.target.hostOwnershipRevision === undefined
  ) {
    return undefined;
  }
  return body.bootId;
}

export interface MaintenanceJournalEnvelopeV1 {
  readonly state: MaintenanceJournalBodyV1;
  readonly digest: Sha256Digest;
}

export interface MaintenanceJournalRecoveryHead {
  readonly current: MaintenanceJournalEnvelopeV1;
  readonly previous?: MaintenanceJournalEnvelopeV1;
  readonly effectiveProgressStage: MaintenanceStage;
}

export type MaintenanceJournalParseResult =
  | { readonly ok: true; readonly value: MaintenanceJournalEnvelopeV1 }
  | { readonly ok: false; readonly problem: Problem };

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
