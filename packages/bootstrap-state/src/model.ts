import type {
  ContentDigest,
  InstallationId,
  InstanceId,
  Problem,
  Sha256Digest,
} from "@heptalogos/foundation-contracts";

export type BootstrapRuntimeGenerationId =
  ContentDigest<"BootstrapRuntimeGenerationId">;
export type ProductGenerationId = ContentDigest<"ProductGenerationId">;

export interface BootstrapStateBodyV1 {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly activeBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly previousBootstrapRuntimeGeneration?: BootstrapRuntimeGenerationId;
  readonly activeProductGeneration: ProductGenerationId;
  readonly lastKnownGoodProductGeneration?: ProductGenerationId;
  readonly lastCommittedOperationRef?: string;
  readonly lastCompletedStageRef?: string;
}

export interface BootstrapStateEnvelopeV1 {
  readonly state: BootstrapStateBodyV1;
  readonly digest: Sha256Digest;
}

export type PrivatePostgresInitializationProfileRevision =
  ContentDigest<"PrivatePostgresInitializationProfileRevision">;

export interface PrivatePostgresBootstrapStateV1 {
  readonly schemaVersion: 1;
  readonly postgresMajor: 18;
  readonly initializedByPostgresVersion: string;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly dataPlacement: {
    readonly rootId: "DATA";
    readonly relativePath: "private-postgres";
    readonly dataLayoutVersion: 1;
  };
  readonly persistedPort: number;
  readonly clusterSystemIdentifier: string;
  readonly initializationProfileRevision: PrivatePostgresInitializationProfileRevision;
}

export interface BootstrapStateBodyV2 {
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly activeBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly previousBootstrapRuntimeGeneration?: BootstrapRuntimeGenerationId;
  readonly activeProductGeneration: ProductGenerationId;
  readonly lastKnownGoodProductGeneration?: ProductGenerationId;
  readonly lastCommittedOperationRef?: string;
  readonly lastCompletedStageRef?: string;
  readonly privatePostgres: PrivatePostgresBootstrapStateV1;
}

export interface BootstrapStateEnvelopeV2 {
  readonly state: BootstrapStateBodyV2;
  readonly digest: Sha256Digest;
}

export type BootstrapStateBody = BootstrapStateBodyV1 | BootstrapStateBodyV2;
export type BootstrapStateEnvelope =
  BootstrapStateEnvelopeV1 | BootstrapStateEnvelopeV2;

export type BootstrapStateParseResult =
  | { readonly ok: true; readonly value: BootstrapStateEnvelope }
  | { readonly ok: false; readonly problem: Problem };
