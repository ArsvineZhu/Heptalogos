import { Ajv2020 } from "ajv/dist/2020.js";
import { Type } from "typebox";
import {
  digestCanonicalJson,
  type CanonicalJsonValue,
  type Problem,
  SHA256_HEX_PATTERN,
} from "@heptalogos/foundation-contracts";
import type {
  BootstrapStateBodyV1,
  BootstrapStateEnvelopeV1,
  BootstrapStateParseResult,
} from "./model.js";

export const BOOTSTRAP_STATE_DIGEST_DOMAIN = "heptalogos.bootstrap-state/v1";

const digestSchema = Type.Object(
  {
    algorithm: Type.Literal("sha256"),
    canonicalization: Type.Literal("RFC8785-JCS"),
    domain: Type.String({ minLength: 1 }),
    hex: Type.String({ pattern: SHA256_HEX_PATTERN }),
  },
  { additionalProperties: false },
);

const stateSchema = Type.Object(
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

const envelopeSchema = Type.Object(
  {
    state: stateSchema,
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
const validateEnvelope = ajv.compile(envelopeSchema);

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

export function sealBootstrapState(
  state: BootstrapStateBodyV1,
): BootstrapStateEnvelopeV1 {
  const digest = digestCanonicalJson(
    BOOTSTRAP_STATE_DIGEST_DOMAIN,
    state as unknown as CanonicalJsonValue,
  );
  return { state, digest };
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

  if (!validateEnvelope(parsed)) {
    return problem(
      "bootstrap.state.invalid_schema",
      "Bootstrap state does not match schema version 1",
      "Bootstrap state does not match the supported schema",
    );
  }

  const envelope = parsed as BootstrapStateEnvelopeV1;
  const expected = sealBootstrapState(envelope.state).digest;
  if (
    envelope.digest.domain !== BOOTSTRAP_STATE_DIGEST_DOMAIN ||
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
