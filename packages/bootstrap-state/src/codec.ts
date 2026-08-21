import { Ajv2020 } from "ajv/dist/2020.js";
import { Type } from "typebox";
import {
  digestCanonicalJson,
  type CanonicalJsonValue,
  type Problem,
  SHA256_HEX_PATTERN,
  UUID_V7_PATTERN,
} from "@heptalogos/foundation-contracts";
import type {
  BootstrapStateBody,
  BootstrapStateBodyV1,
  BootstrapStateBodyV2,
  BootstrapStateEnvelope,
  BootstrapStateEnvelopeV1,
  BootstrapStateEnvelopeV2,
  BootstrapStateParseResult,
} from "./model.js";

export const BOOTSTRAP_STATE_DIGEST_DOMAIN = "heptalogos.bootstrap-state/v1";
export const BOOTSTRAP_STATE_V2_DIGEST_DOMAIN = "heptalogos.bootstrap-state/v2";

const digestSchema = Type.Object(
  {
    algorithm: Type.Literal("sha256"),
    canonicalization: Type.Literal("RFC8785-JCS"),
    domain: Type.String({ minLength: 1 }),
    hex: Type.String({ pattern: SHA256_HEX_PATTERN }),
  },
  { additionalProperties: false },
);

const stateSchemaV1 = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    revision: Type.Integer({ minimum: 1 }),
    activeBootstrapRuntimeGeneration: Type.String({ pattern: SHA256_HEX_PATTERN }),
    previousBootstrapRuntimeGeneration: Type.Optional(
      Type.String({ pattern: SHA256_HEX_PATTERN }),
    ),
    activeProductGeneration: Type.String({ pattern: SHA256_HEX_PATTERN }),
    lastKnownGoodProductGeneration: Type.Optional(
      Type.String({ pattern: SHA256_HEX_PATTERN }),
    ),
    lastCommittedOperationRef: Type.Optional(Type.String()),
    lastCompletedStageRef: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

const privatePostgresStateSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    postgresMajor: Type.Literal(18),
    initializedByPostgresVersion: Type.String({ minLength: 1 }),
    installationId: Type.String({ pattern: UUID_V7_PATTERN }),
    instanceId: Type.String({ pattern: UUID_V7_PATTERN }),
    dataPlacement: Type.Object(
      {
        rootId: Type.Literal("DATA"),
        relativePath: Type.Literal("private-postgres"),
        dataLayoutVersion: Type.Literal(1),
      },
      { additionalProperties: false },
    ),
    persistedPort: Type.Integer({ minimum: 1, maximum: 65535 }),
    clusterSystemIdentifier: Type.String({ pattern: "^[0-9]+$" }),
    initializationProfileRevision: Type.String({ pattern: SHA256_HEX_PATTERN }),
  },
  { additionalProperties: false },
);

const stateSchemaV2 = Type.Object(
  {
    schemaVersion: Type.Literal(2),
    revision: Type.Integer({ minimum: 1 }),
    activeBootstrapRuntimeGeneration: Type.String({ pattern: SHA256_HEX_PATTERN }),
    previousBootstrapRuntimeGeneration: Type.Optional(
      Type.String({ pattern: SHA256_HEX_PATTERN }),
    ),
    activeProductGeneration: Type.String({ pattern: SHA256_HEX_PATTERN }),
    lastKnownGoodProductGeneration: Type.Optional(
      Type.String({ pattern: SHA256_HEX_PATTERN }),
    ),
    lastCommittedOperationRef: Type.Optional(Type.String()),
    lastCompletedStageRef: Type.Optional(Type.String()),
    privatePostgres: privatePostgresStateSchema,
  },
  { additionalProperties: false },
);

const envelopeSchemaV1 = Type.Object(
  {
    state: stateSchemaV1,
    digest: digestSchema,
  },
  { additionalProperties: false },
);

const envelopeSchemaV2 = Type.Object(
  {
    state: stateSchemaV2,
    digest: digestSchema,
  },
  { additionalProperties: false },
);

const ajv = new Ajv2020({
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
  strict: true,
});
const validateEnvelopeV1 = ajv.compile(envelopeSchemaV1);
const validateEnvelopeV2 = ajv.compile(envelopeSchemaV2);

function problem(
  problemCode: string,
  title: string,
  detail: string,
): BootstrapStateParseResult {
  const value: Problem = {
    schemaVersion: 1,
    problemCode,
    category: "validation",
    retryClass: "manual",
    title,
    detail,
  };
  return { ok: false, problem: value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function schemaVersionOf(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.state)) return undefined;
  return value.state.schemaVersion;
}

export function sealBootstrapState(
  state: BootstrapStateBodyV1,
): BootstrapStateEnvelopeV1;
export function sealBootstrapState(
  state: BootstrapStateBodyV2,
): BootstrapStateEnvelopeV2;
export function sealBootstrapState(
  state: BootstrapStateBody,
): BootstrapStateEnvelope;
export function sealBootstrapState(state: BootstrapStateBody): BootstrapStateEnvelope {
  const domain =
    state.schemaVersion === 1
      ? BOOTSTRAP_STATE_DIGEST_DOMAIN
      : BOOTSTRAP_STATE_V2_DIGEST_DOMAIN;
  const digest = digestCanonicalJson(
    domain,
    state as unknown as CanonicalJsonValue,
  );
  return { state, digest } as BootstrapStateEnvelope;
}

export function parseBootstrapState(text: string): BootstrapStateParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return problem(
      "bootstrap.state.invalid_json",
      "Bootstrap state is not valid JSON",
      "Bootstrap state JSON could not be parsed",
    );
  }

  const version = schemaVersionOf(parsed);
  if (version === 3 || (typeof version === "number" && version > 2)) {
    return problem(
      "bootstrap.state.unsupported_schema",
      "Bootstrap state schema is newer than this runtime",
      "The BootstrapState schema version is not supported by this runtime",
    );
  }

  const isV2 = version === 2;
  const valid = isV2 ? validateEnvelopeV2(parsed) : validateEnvelopeV1(parsed);
  if (!valid) {
    return problem(
      "bootstrap.state.invalid_schema",
      "Bootstrap state does not match its supported schema",
      "Bootstrap state does not match the supported schema",
    );
  }

  const envelope = parsed as BootstrapStateEnvelope;
  const expected = sealBootstrapState(envelope.state).digest;
  const expectedDomain = isV2
    ? BOOTSTRAP_STATE_V2_DIGEST_DOMAIN
    : BOOTSTRAP_STATE_DIGEST_DOMAIN;
  if (
    envelope.digest.domain !== expectedDomain ||
    envelope.digest.hex !== expected.hex
  ) {
    return problem(
      "bootstrap.state.digest_mismatch",
      "Bootstrap state digest does not match its state",
      "The recorded digest is not the expected domain-separated SHA-256 digest",
    );
  }

  return { ok: true, value: envelope };
}
