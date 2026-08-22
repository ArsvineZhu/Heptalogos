import { Ajv2020 } from "ajv/dist/2020.js";
import { Type } from "typebox";
import {
  canonicalizeJson,
  createUuidV7Id,
  digestCanonicalJson,
  parseBootId,
  parseHostOwnershipToken,
  parseInstallationId,
  parseInstanceId,
  parseUuidV7Id,
  SHA256_HEX_PATTERN,
  UUID_V7_PATTERN,
  type CanonicalJsonValue,
  type Problem,
} from "@heptalogos/foundation-contracts";
import type {
  MaintenanceJournalBodyV1,
  MaintenanceJournalEnvelopeV1,
  MaintenanceJournalParseResult,
  MaintenanceOperationId,
} from "./maintenance-model.js";

export const MAINTENANCE_JOURNAL_DIGEST_DOMAIN =
  "heptalogos.maintenance-journal/v1" as const;

const CANONICAL_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const DECIMAL_REVISION_PATTERN = "^(0|[1-9][0-9]*)$";

const digestSchema = Type.Object(
  {
    algorithm: Type.Literal("sha256"),
    canonicalization: Type.Literal("RFC8785-JCS"),
    domain: Type.String({ minLength: 1 }),
    hex: Type.String({ pattern: SHA256_HEX_PATTERN }),
  },
  { additionalProperties: false },
);

const bodySchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    revision: Type.Integer({ minimum: 1 }),
    operationId: Type.String({ pattern: UUID_V7_PATTERN }),
    activityId: Type.String({ pattern: UUID_V7_PATTERN }),
    installationId: Type.String({ pattern: UUID_V7_PATTERN }),
    instanceId: Type.String({ pattern: UUID_V7_PATTERN }),
    bootId: Type.String({ pattern: UUID_V7_PATTERN }),
    operationType: Type.Union([
      Type.Literal("PRIVATE_POSTGRES_RESTART"),
      Type.Literal("PRIVATE_POSTGRES_STOP"),
    ]),
    source: Type.Object(
      {
        hostOwnershipToken: Type.String({ pattern: UUID_V7_PATTERN }),
        hostOwnershipRevision: Type.String({ pattern: DECIMAL_REVISION_PATTERN }),
        postgresClusterSystemIdentifier: Type.String({ pattern: "^[0-9]+$" }),
        persistedPort: Type.Integer({ minimum: 1, maximum: 65535 }),
      },
      { additionalProperties: false },
    ),
    target: Type.Object(
      {
        privatePostgres: Type.Union([
          Type.Literal("RUNNING_SAME_IDENTITY"),
          Type.Literal("STOPPED"),
        ]),
        hostOwnershipToken: Type.Optional(Type.String({ pattern: UUID_V7_PATTERN })),
        hostOwnershipRevision: Type.Optional(
          Type.String({ pattern: DECIMAL_REVISION_PATTERN }),
        ),
      },
      { additionalProperties: false },
    ),
    verifiedPrerequisites: Type.Object(
      {
        bootstrapStateDigest: digestSchema,
        privatePostgresInitializationProfileRevision: Type.String({
          pattern: SHA256_HEX_PATTERN,
        }),
      },
      { additionalProperties: false },
    ),
    lastCompletedStage: Type.Union([
      Type.Literal("BOOTSTRAP_OWNERSHIP_ACQUIRED"),
      Type.Literal("HOST_QUIESCED"),
      Type.Literal("HOST_TOKEN_REVOKED"),
      Type.Literal("HOST_LEASE_CLOSED"),
      Type.Literal("POSTGRES_STOPPED"),
      Type.Literal("POSTGRES_READY"),
      Type.Literal("HOST_LEASE_ACQUIRED"),
      Type.Literal("HOST_TOKEN_PUBLISHED"),
      Type.Literal("BOOTSTRAP_RELEASE_ARMED"),
      Type.Literal("ABORTED"),
      Type.Literal("RECOVERY_REQUIRED"),
    ]),
    updatedAt: Type.String({ minLength: 1 }),
    terminalOutcome: Type.Optional(
      Type.Union([
        Type.Literal("SUCCEEDED"),
        Type.Literal("ABORTED"),
        Type.Literal("FAILED"),
        Type.Literal("UNCERTAIN"),
      ]),
    ),
    problemCode: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

const envelopeSchema = Type.Object(
  {
    state: bodySchema,
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
  category: string,
  title: string,
  detail: string,
): MaintenanceJournalParseResult {
  const value: Problem = {
    schemaVersion: 1,
    problemCode,
    category,
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

function isCanonicalInstant(value: string): boolean {
  if (!CANONICAL_INSTANT_PATTERN.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function assertUuidIdentities(body: MaintenanceJournalBodyV1): boolean {
  return (
    parseUuidV7Id("MaintenanceOperationId", body.operationId) !== undefined &&
    parseUuidV7Id("ActivityId", body.activityId) !== undefined &&
    parseInstallationId(body.installationId) !== undefined &&
    parseInstanceId(body.instanceId) !== undefined &&
    parseBootId(body.bootId) !== undefined &&
    parseHostOwnershipToken(body.source.hostOwnershipToken) !== undefined &&
    (body.target.hostOwnershipToken === undefined ||
      parseHostOwnershipToken(body.target.hostOwnershipToken) !== undefined)
  );
}

function semanticProblem(body: MaintenanceJournalBodyV1): string | undefined {
  if (!assertUuidIdentities(body)) return "maintenance.journal.invalid_schema";
  if (!isCanonicalInstant(body.updatedAt)) return "maintenance.journal.invalid_schema";

  if (body.lastCompletedStage === "ABORTED" && body.terminalOutcome !== "ABORTED") {
    return "maintenance.journal.invalid_semantics";
  }
  if (
    body.lastCompletedStage === "RECOVERY_REQUIRED" &&
    body.terminalOutcome !== "FAILED" &&
    body.terminalOutcome !== "UNCERTAIN"
  ) {
    return "maintenance.journal.invalid_semantics";
  }
  if (
    body.lastCompletedStage === "BOOTSTRAP_RELEASE_ARMED" &&
    body.terminalOutcome !== undefined
  ) {
    return "maintenance.journal.invalid_semantics";
  }
  if (body.lastCompletedStage === "BOOTSTRAP_RELEASE_ARMED") {
    const hasTargetToken = body.target.hostOwnershipToken !== undefined;
    const hasTargetRevision = body.target.hostOwnershipRevision !== undefined;
    if (
      body.operationType === "PRIVATE_POSTGRES_RESTART" &&
      (!hasTargetToken || !hasTargetRevision)
    ) {
      return "maintenance.journal.invalid_semantics";
    }
    if (
      body.operationType === "PRIVATE_POSTGRES_STOP" &&
      (hasTargetToken || hasTargetRevision)
    ) {
      return "maintenance.journal.invalid_semantics";
    }
  }

  return undefined;
}

export function createMaintenanceOperationId(): MaintenanceOperationId {
  return createUuidV7Id("MaintenanceOperationId");
}

export function maintenanceOperationRef(operationId: MaintenanceOperationId): string {
  if (parseUuidV7Id("MaintenanceOperationId", operationId) === undefined) {
    throw new TypeError("MaintenanceOperationId must be a valid UUIDv7");
  }
  return `maintenance-journal/v1/${operationId}`;
}

export function sealMaintenanceJournal(
  state: MaintenanceJournalBodyV1,
): MaintenanceJournalEnvelopeV1 {
  const digest = digestCanonicalJson(
    MAINTENANCE_JOURNAL_DIGEST_DOMAIN,
    state as unknown as CanonicalJsonValue,
  );
  return { state, digest };
}

export function parseMaintenanceJournal(text: string): MaintenanceJournalParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return problem(
      "maintenance.journal.invalid_json",
      "integrity",
      "Maintenance journal is not valid JSON",
      "Maintenance journal JSON could not be parsed",
    );
  }

  const version = schemaVersionOf(parsed);
  if (typeof version === "number" && version > 1) {
    return problem(
      "maintenance.journal.unsupported_schema",
      "integrity",
      "Maintenance journal schema is newer than this runtime",
      "The MaintenanceJournal schema version is not supported by this runtime",
    );
  }
  if (!validateEnvelope(parsed)) {
    return problem(
      "maintenance.journal.invalid_schema",
      "validation",
      "Maintenance journal does not match its supported schema",
      "Maintenance journal does not match the supported V1 schema",
    );
  }

  const envelope = parsed as MaintenanceJournalEnvelopeV1;
  if (envelope.digest.domain !== MAINTENANCE_JOURNAL_DIGEST_DOMAIN) {
    return problem(
      "maintenance.journal.digest_mismatch",
      "integrity",
      "Maintenance journal digest domain is invalid",
      "The recorded digest does not use the fixed MaintenanceJournal V1 domain",
    );
  }

  const expected = sealMaintenanceJournal(envelope.state).digest;
  if (envelope.digest.hex !== expected.hex) {
    return problem(
      "maintenance.journal.digest_mismatch",
      "integrity",
      "Maintenance journal digest does not match its body",
      "The recorded digest is not the expected domain-separated SHA-256 digest",
    );
  }

  const semanticError = semanticProblem(envelope.state);
  if (semanticError !== undefined) {
    return problem(
      semanticError,
      semanticError.endsWith("semantics") ? "validation" : "integrity",
      "Maintenance journal semantics are invalid",
      "The MaintenanceJournal body violates a fixed V1 semantic invariant",
    );
  }

  return { ok: true, value: envelope };
}

export function canonicalMaintenanceJournalText(
  envelope: MaintenanceJournalEnvelopeV1,
): string {
  return canonicalizeJson(envelope as unknown as CanonicalJsonValue);
}
