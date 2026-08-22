import {
  createUuidV7Id,
  type BootId,
  type Problem,
  type Sha256Digest,
  type UuidV7Id,
} from "@heptalogos/foundation-contracts";

export type BootstrapLockGenerationId = UuidV7Id<"BootstrapLockGenerationId">;

export function createBootstrapLockGenerationId(): BootstrapLockGenerationId {
  return createUuidV7Id("BootstrapLockGenerationId");
}

export interface BootstrapOwnerWitnessBodyV1 {
  readonly schemaVersion: 1;
  readonly phase: "ATTEMPT" | "OWNER" | "RELEASING";
  readonly lockGenerationId: BootstrapLockGenerationId;
  readonly bootId: BootId;
  readonly pid: number;
  readonly processStartedAtMs: number;
  readonly heartbeatMs: number;
  readonly createdAt: string;
}

export interface BootstrapOwnerWitnessEnvelopeV1 {
  readonly witness: BootstrapOwnerWitnessBodyV1;
  readonly digest: Sha256Digest;
}

export type BootstrapOwnerWitnessParseResult =
  | { readonly ok: true; readonly value: BootstrapOwnerWitnessEnvelopeV1 }
  | { readonly ok: false; readonly problem: Problem };
