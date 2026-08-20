import type {
  ContentDigest,
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

export type BootstrapStateParseResult =
  | { readonly ok: true; readonly value: BootstrapStateEnvelopeV1 }
  | { readonly ok: false; readonly problem: Problem };
