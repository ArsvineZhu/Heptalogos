import { Ajv2020 } from "ajv/dist/2020.js";
import { Type } from "typebox";
import {
  canonicalizeJson,
  digestCanonicalJson,
  parseBootId,
  parseUuidV7Id,
  SHA256_HEX_PATTERN,
  UUID_V7_PATTERN,
  type CanonicalJsonValue,
  type Problem,
} from "@heptalogos/foundation-contracts";
import type {
  BootstrapOwnerWitnessBodyV1,
  BootstrapOwnerWitnessEnvelopeV1,
  BootstrapOwnerWitnessParseResult,
} from "./bootstrap-owner-witness-model.js";

export const BOOTSTRAP_OWNER_WITNESS_DIGEST_DOMAIN =
  "heptalogos.bootstrap-owner-witness/v1";

const CANONICAL_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

const digestSchema = Type.Object(
  {
    algorithm: Type.Literal("sha256"),
    canonicalization: Type.Literal("RFC8785-JCS"),
    domain: Type.String({ minLength: 1 }),
    hex: Type.String({ pattern: SHA256_HEX_PATTERN }),
  },
  { additionalProperties: false },
);

const witnessSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    phase: Type.Union([Type.Literal("ATTEMPT"), Type.Literal("OWNER")]),
    lockGenerationId: Type.String({ pattern: UUID_V7_PATTERN }),
    bootId: Type.String({ pattern: UUID_V7_PATTERN }),
    pid: Type.Integer({ minimum: 1 }),
    processStartedAtMs: Type.Number({ minimum: 0 }),
    heartbeatMs: Type.Integer({ minimum: 1_000 }),
    createdAt: Type.String({ pattern: CANONICAL_INSTANT_PATTERN.source }),
  },
  { additionalProperties: false },
);

const envelopeSchema = Type.Object(
  {
    witness: witnessSchema,
    digest: digestSchema,
  },
  { additionalProperties: false },
);

const ajv = new Ajv2020({
  allErrors: true,
  removeAdditional: false,
  useDefaults: false,
});
const validateEnvelope = ajv.compile(envelopeSchema);

function problem(
  problemCode: string,
  category: Problem["category"],
  title: string,
  detail: string,
): BootstrapOwnerWitnessParseResult {
  return {
    ok: false,
    problem: {
      schemaVersion: 1,
      problemCode,
      category,
      retryClass: "manual",
      title,
      detail,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function schemaVersionOf(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.witness)) return undefined;
  return value.witness.schemaVersion;
}

function isCanonicalInstant(value: string): boolean {
  if (!CANONICAL_INSTANT_PATTERN.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function hasValidIdentities(witness: BootstrapOwnerWitnessBodyV1): boolean {
  return (
    parseUuidV7Id("BootstrapLockGenerationId", witness.lockGenerationId) !==
      undefined && parseBootId(witness.bootId) !== undefined
  );
}

export function sealBootstrapOwnerWitness(
  witness: BootstrapOwnerWitnessBodyV1,
): BootstrapOwnerWitnessEnvelopeV1 {
  const digest = digestCanonicalJson(
    BOOTSTRAP_OWNER_WITNESS_DIGEST_DOMAIN,
    witness as unknown as CanonicalJsonValue,
  );
  return { witness, digest };
}

export function parseBootstrapOwnerWitness(
  text: string,
): BootstrapOwnerWitnessParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return problem(
      "bootstrap.owner_witness.invalid_json",
      "integrity",
      "Bootstrap owner witness is not valid JSON",
      "Bootstrap owner witness JSON could not be parsed",
    );
  }

  const version = schemaVersionOf(parsed);
  if (typeof version === "number" && version > 1) {
    return problem(
      "bootstrap.owner_witness.unsupported_schema",
      "integrity",
      "Bootstrap owner witness schema is newer than this runtime",
      "The BootstrapOwnerWitness schema version is not supported by this runtime",
    );
  }
  if (!validateEnvelope(parsed)) {
    return problem(
      "bootstrap.owner_witness.invalid_schema",
      "validation",
      "Bootstrap owner witness does not match its supported schema",
      "Bootstrap owner witness does not match the supported V1 schema",
    );
  }

  const envelope = parsed as BootstrapOwnerWitnessEnvelopeV1;
  if (
    envelope.digest.domain !== BOOTSTRAP_OWNER_WITNESS_DIGEST_DOMAIN ||
    !hasValidIdentities(envelope.witness) ||
    !isCanonicalInstant(envelope.witness.createdAt)
  ) {
    return problem(
      "bootstrap.owner_witness.invalid_schema",
      "validation",
      "Bootstrap owner witness identity or time is invalid",
      "Bootstrap owner witness identity and createdAt must use the fixed V1 contract",
    );
  }

  const expected = sealBootstrapOwnerWitness(envelope.witness).digest;
  if (envelope.digest.hex !== expected.hex) {
    return problem(
      "bootstrap.owner_witness.digest_mismatch",
      "integrity",
      "Bootstrap owner witness digest does not match its body",
      "The recorded digest is not the expected domain-separated SHA-256 digest",
    );
  }

  return { ok: true, value: envelope };
}

export function canonicalBootstrapOwnerWitnessText(
  envelope: BootstrapOwnerWitnessEnvelopeV1,
): string {
  return canonicalizeJson(envelope as unknown as CanonicalJsonValue);
}
