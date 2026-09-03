/**
 * Implements immutable managed Configuration revisions and Host-fenced
 * activation through the existing PersistenceService owner.
 * @module service
 */

import {
  createUuidV7Id,
  digestCanonicalJson,
  parseContentDigest,
  parseInstant,
  parseUuidV7Id,
  snapshotCanonicalJson,
  type CanonicalJsonValue,
  type ContentDigest,
} from "@heptalogos/foundation-contracts";
import {
  decodeLineageContextRef,
  type ExecutionContextRuntime,
  type LineageContextRef,
} from "@heptalogos/execution-lineage";
import {
  executeRepositorySql,
  readRepositorySql,
  useRepositoryMutationTransaction,
  type PersistenceInternalTransaction,
} from "@heptalogos/persistence/repository";
import type { PersistenceService } from "@heptalogos/persistence";
import { compileSchema } from "@heptalogos/schema-runtime";
import {
  GATEWAY_TRANSPORT_DEFINITION_ID,
  gatewayTransportConfigSchema,
  type ActivateConfigurationInput,
  type ConfigurationActivation,
  type ConfigurationDefinition,
  type ConfigurationDefinitionId,
  type ConfigurationRevision,
  type ConfigurationRevisionId,
  type ConfigurationScopeRef,
  type ConfigurationService,
  type ConfigurationServiceOptions,
  type CreateConfigurationRevisionInput,
  type GatewayTransportConfigV1,
} from "./contracts.js";
import { configurationProblem } from "./problems.js";

const gatewayTransportValidator = compileSchema<GatewayTransportConfigV1>(
  gatewayTransportConfigSchema,
);

const definitions: readonly ConfigurationDefinition[] = Object.freeze([
  Object.freeze({
    schemaVersion: 1 as const,
    definitionId: GATEWAY_TRANSPORT_DEFINITION_ID,
    owner: "system.network-access",
    version: 1,
    scopeKind: "INSTALLATION" as const,
    valueSchema: gatewayTransportConfigSchema as unknown as CanonicalJsonValue,
    classification: "INSTALLATION_CONFIG" as const,
    visibility: "EXPERT" as const,
    manageability: "EDITABLE" as const,
    activation: "LIVE" as const,
    sensitivity: "INTERNAL" as const,
    defaultAuthority: "NO_DEFAULT_REQUIRED" as const,
    consumerRefs: Object.freeze(["system.network-access", "system.ai-runtime"]),
  }),
]);

interface RevisionRow {
  readonly revision_id: unknown;
  readonly definition_id: unknown;
  readonly definition_version: unknown;
  readonly scope_ref: unknown;
  readonly value: unknown;
  readonly source: unknown;
  readonly status: unknown;
  readonly value_digest: unknown;
  readonly created_at: unknown;
  readonly lineage_context_ref: unknown;
}

interface ActivationRow {
  readonly activation_id: unknown;
  readonly scope_ref: unknown;
  readonly active_revision_id: unknown;
  readonly previous_revision_id: unknown;
  readonly impact: unknown;
  readonly effective_at: unknown;
  readonly lineage_context_ref: unknown;
}

function asText(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw configurationProblem(
      "configuration.repository_invalid",
      "Configuration repository data is invalid",
      name + " is not a non-empty string",
      "integrity",
    );
  }
  return value;
}

function asUuid<T extends string>(brand: T, value: unknown, name: string) {
  const parsed = parseUuidV7Id(brand, value);
  if (parsed === undefined) {
    throw configurationProblem(
      "configuration.repository_invalid",
      "Configuration repository data is invalid",
      name + " is not a UUIDv7",
      "integrity",
    );
  }
  return parsed;
}

function asDigest(value: unknown): ContentDigest<"ConfigurationValueDigest"> {
  const parsed = parseContentDigest("ConfigurationValueDigest", value);
  if (parsed === undefined) {
    throw configurationProblem(
      "configuration.repository_invalid",
      "Configuration repository data is invalid",
      "value_digest is not a SHA-256 digest",
      "integrity",
    );
  }
  return parsed;
}

function asInstant(value: unknown): ConfigurationRevision["createdAt"] {
  const text = value instanceof Date ? value.toISOString() : value;
  const instant = parseInstant(text);
  if (instant === undefined) {
    throw configurationProblem(
      "configuration.repository_invalid",
      "Configuration repository data is invalid",
      "A persisted time value is invalid",
      "integrity",
    );
  }
  return instant;
}

function jsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function scopeRef(value: unknown): ConfigurationScopeRef {
  const parsed = jsonValue(value);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    (parsed as Record<string, unknown>).schemaVersion !== 1 ||
    typeof (parsed as Record<string, unknown>).resourceKind !== "string" ||
    typeof (parsed as Record<string, unknown>).resourceId !== "string"
  ) {
    throw configurationProblem(
      "configuration.repository_invalid",
      "Configuration repository data is invalid",
      "scope_ref is not a current ConfigurationScopeRef",
      "integrity",
    );
  }
  const record = parsed as Record<string, string>;
  return Object.freeze({
    schemaVersion: 1,
    resourceKind: record.resourceKind,
    resourceId: record.resourceId,
  });
}

function lineageRef(value: unknown): LineageContextRef {
  return decodeLineageContextRef(jsonValue(value));
}

function scopeKey(ref: ConfigurationScopeRef): string {
  if (
    ref.schemaVersion !== 1 ||
    ref.resourceKind.trim().length === 0 ||
    ref.resourceKind.length > 128 ||
    ref.resourceId.trim().length === 0 ||
    ref.resourceId.length > 256
  ) {
    throw configurationProblem(
      "configuration.invalid_scope",
      "Configuration scope is invalid",
      "Configuration resource kind and identifier are bounded non-empty values",
    );
  }
  return JSON.stringify([ref.resourceKind, ref.resourceId]);
}

function revisionFromRow(row: RevisionRow): ConfigurationRevision {
  const definitionId = asText(
    row.definition_id,
    "definition_id",
  ) as ConfigurationDefinitionId;
  const revisionId = asUuid(
    "ConfigurationRevisionId",
    row.revision_id,
    "revision_id",
  ) as ConfigurationRevisionId;
  const status = asText(row.status, "status");
  const source = asText(row.source, "source");
  if (status !== "COMMITTED" || source !== "MANAGED_REVISION") {
    throw configurationProblem(
      "configuration.repository_invalid",
      "Configuration repository data is invalid",
      "Only committed MANAGED_REVISION rows are current",
      "integrity",
    );
  }
  const value = jsonValue(row.value);
  if (value === undefined) {
    throw configurationProblem(
      "configuration.repository_invalid",
      "Configuration repository data is invalid",
      "value is not valid JSON",
      "integrity",
    );
  }
  return Object.freeze({
    schemaVersion: 1,
    revisionId,
    definitionId,
    definitionVersion: Number(row.definition_version),
    scopeRef: scopeRef(row.scope_ref),
    value: snapshotCanonicalJson(value as CanonicalJsonValue).value,
    source: "MANAGED_REVISION",
    status: "COMMITTED",
    valueDigest: asDigest(row.value_digest),
    createdAt: asInstant(row.created_at),
    lineageContextRef: lineageRef(row.lineage_context_ref),
  });
}

function activationFromRow(row: ActivationRow): ConfigurationActivation {
  const previous = row.previous_revision_id;
  return Object.freeze({
    schemaVersion: 1,
    activationId: asUuid(
      "ConfigurationActivationId",
      row.activation_id,
      "activation_id",
    ),
    scopeRef: scopeRef(row.scope_ref),
    activeRevisionId: asUuid(
      "ConfigurationRevisionId",
      row.active_revision_id,
      "active_revision_id",
    ),
    ...(previous === null || previous === undefined
      ? {}
      : {
          previousRevisionId: asUuid(
            "ConfigurationRevisionId",
            previous,
            "previous_revision_id",
          ),
        }),
    impact: asText(row.impact, "impact") as ConfigurationDefinition["activation"],
    effectiveAt: asInstant(row.effective_at),
    lineageContextRef: lineageRef(row.lineage_context_ref),
  });
}

async function rows<T>(
  transaction: PersistenceInternalTransaction,
  query: string,
  parameters: readonly unknown[],
): Promise<readonly T[]> {
  return executeRepositorySql<T>(transaction, query, parameters);
}

function activityRef(execution: ExecutionContextRuntime): LineageContextRef {
  if (execution.current() === undefined) {
    throw configurationProblem(
      "configuration.activity_required",
      "Configuration mutation requires an Activity",
      "A canonical Configuration mutation must run inside retained execution context",
      "conflict",
      "after-change",
    );
  }
  return execution.createLineageContextRef();
}

function validateGatewayTransport(value: CanonicalJsonValue): GatewayTransportConfigV1 {
  const result = gatewayTransportValidator.validate(value);
  if (!result.ok) {
    throw configurationProblem(
      "configuration.invalid_input",
      "Configuration value is invalid",
      result.issues.map((issue) => issue.instancePath + " " + issue.message).join("; "),
    );
  }
  if (
    result.value.expandedResponseBodyBudgetBytes < result.value.responseBodyBudgetBytes
  ) {
    throw configurationProblem(
      "configuration.invalid_input",
      "Configuration value is invalid",
      "expandedResponseBodyBudgetBytes must be at least responseBodyBudgetBytes",
    );
  }
  return result.value;
}

function definitionFor(
  definitionId: ConfigurationDefinitionId | string,
): ConfigurationDefinition {
  const definition = definitions.find((item) => item.definitionId === definitionId);
  if (definition === undefined) {
    throw configurationProblem(
      "configuration.unsupported_definition",
      "Configuration definition is unsupported",
      "No current ConfigurationDefinition exists for '" + definitionId + "'",
    );
  }
  return definition;
}

function revisionIdentity(
  value: ConfigurationRevisionId | string,
): ConfigurationRevisionId {
  const parsed = parseUuidV7Id("ConfigurationRevisionId", value);
  if (parsed === undefined) {
    throw configurationProblem(
      "configuration.invalid_revision",
      "Configuration revision is invalid",
      "revisionId must be a UUIDv7 ConfigurationRevisionId",
    );
  }
  return parsed;
}

/** Creates the current PostgreSQL-backed Configuration service. */
export function createConfigurationService(
  options: ConfigurationServiceOptions,
): ConfigurationService {
  const persistence: PersistenceService = options.persistence;

  const service: ConfigurationService = {
    definitions,
    getDefinition(definitionId) {
      return definitions.find((item) => item.definitionId === definitionId);
    },
    async listRevisions() {
      const result = await readRepositorySql<RevisionRow>(
        persistence,
        "SELECT revision_id, definition_id, definition_version, scope_ref, " +
          "value, source, status, value_digest, created_at, lineage_context_ref " +
          'FROM "heptalogos"."configuration_revision" ' +
          "ORDER BY created_at, revision_id",
        [],
      );
      return Object.freeze(result.map(revisionFromRow));
    },
    async listActivations() {
      const result = await readRepositorySql<ActivationRow>(
        persistence,
        "SELECT activation_id, scope_ref, active_revision_id, " +
          "previous_revision_id, impact, effective_at, lineage_context_ref " +
          'FROM "heptalogos"."configuration_activation" ' +
          "ORDER BY effective_at, activation_id",
        [],
      );
      return Object.freeze(result.map(activationFromRow));
    },
    async getRevision(revisionId) {
      const parsed = revisionIdentity(revisionId);
      const result = await readRepositorySql<RevisionRow>(
        persistence,
        "SELECT revision_id, definition_id, definition_version, scope_ref, " +
          "value, source, status, value_digest, created_at, lineage_context_ref " +
          'FROM "heptalogos"."configuration_revision" WHERE revision_id = $1',
        [parsed],
      );
      const row = result[0];
      return row === undefined ? undefined : revisionFromRow(row);
    },
    async getActivation(ref) {
      const result = await readRepositorySql<ActivationRow>(
        persistence,
        "SELECT activation_id, scope_ref, active_revision_id, " +
          "previous_revision_id, impact, effective_at, lineage_context_ref " +
          'FROM "heptalogos"."configuration_activation" WHERE scope_key = $1',
        [scopeKey(ref)],
      );
      const row = result[0];
      return row === undefined ? undefined : activationFromRow(row);
    },
    async getEffectiveRevision(definitionId, ref) {
      const definition = definitionFor(definitionId);
      const activation = await service.getActivation(ref);
      if (activation === undefined) return undefined;
      const revision = await service.getRevision(activation.activeRevisionId);
      if (revision === undefined || revision.definitionId !== definition.definitionId) {
        throw configurationProblem(
          "configuration.activation_invalid",
          "Configuration activation is invalid",
          "The active revision does not match the requested definition",
          "integrity",
        );
      }
      return revision;
    },
    validateValue(definitionId, value) {
      const definition = definitionFor(definitionId);
      if (definition.definitionId === GATEWAY_TRANSPORT_DEFINITION_ID) {
        return Object.freeze({ ...validateGatewayTransport(value) });
      }
      throw configurationProblem(
        "configuration.unsupported_definition",
        "Configuration definition is unsupported",
        "No validator exists for '" + definition.definitionId + "'",
      );
    },
    async createRevision(input: CreateConfigurationRevisionInput) {
      const definition = definitionFor(input.definitionId);
      const value = service.validateValue(definition.definitionId, input.value);
      const ref = Object.freeze({
        schemaVersion: 1 as const,
        resourceKind: input.scopeRef.resourceKind,
        resourceId: input.scopeRef.resourceId,
      });
      const key = scopeKey(ref);
      const revisionId = createUuidV7Id(
        "ConfigurationRevisionId",
      ) as ConfigurationRevisionId;
      const createdAt = options.time.now();
      const lineageContextRef = activityRef(options.execution);
      const digest = digestCanonicalJson("configuration.revision.v1", {
        definitionId: definition.definitionId,
        definitionVersion: definition.version,
        scopeRef: ref,
        value,
        source: "MANAGED_REVISION",
      });
      const valueDigest = digest.hex as ConfigurationRevision["valueDigest"];
      await persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          try {
            await executeRepositorySql(
              transaction,
              'INSERT INTO "heptalogos"."configuration_revision" (' +
                "revision_id, definition_id, definition_version, scope_ref, " +
                "scope_key, value, source, status, value_digest, created_at, " +
                "lineage_context_ref) VALUES ($1, $2, $3, $4, $5, $6, " +
                "'MANAGED_REVISION', 'COMMITTED', $7, $8, $9)",
              [
                revisionId,
                definition.definitionId,
                definition.version,
                ref,
                key,
                value,
                valueDigest,
                createdAt,
                lineageContextRef,
              ],
            );
          } catch (error) {
            if (
              typeof error === "object" &&
              error !== null &&
              "code" in error &&
              error.code === "23505"
            ) {
              throw configurationProblem(
                "configuration.revision_conflict",
                "Configuration revision conflicts with existing state",
                "The generated ConfigurationRevisionId already exists",
                "conflict",
                "after-change",
              );
            }
            throw error;
          }
          await options.evidence.recordRequired(context, {
            evidenceKind: "configuration.revision.committed",
            evidenceContractVersion: "configuration.v1",
            objectRef: revisionId,
            factRef: valueDigest,
            retentionClass: "retained",
            sensitivity: "operational",
          });
        }),
      );
      return Object.freeze({
        schemaVersion: 1 as const,
        revisionId,
        definitionId: definition.definitionId,
        definitionVersion: definition.version,
        scopeRef: ref,
        value,
        source: "MANAGED_REVISION" as const,
        status: "COMMITTED" as const,
        valueDigest,
        createdAt,
        lineageContextRef,
      });
    },
    async activate(input: ActivateConfigurationInput) {
      const revisionId = revisionIdentity(input.revisionId);
      const expected =
        input.expectedActiveRevisionId === undefined
          ? undefined
          : revisionIdentity(input.expectedActiveRevisionId);
      const revisionResult = await readRepositorySql<RevisionRow>(
        persistence,
        "SELECT revision_id, definition_id, definition_version, scope_ref, " +
          "value, source, status, value_digest, created_at, lineage_context_ref " +
          'FROM "heptalogos"."configuration_revision" WHERE revision_id = $1',
        [revisionId],
      );
      const revisionRow = revisionResult[0];
      if (revisionRow === undefined) {
        throw configurationProblem(
          "configuration.revision_not_found",
          "Configuration revision was not found",
          "The requested revision does not exist",
          "conflict",
          "after-change",
        );
      }
      const revision = revisionFromRow(revisionRow);
      const definition = definitionFor(revision.definitionId);
      const key = scopeKey(revision.scopeRef);
      const activationId = createUuidV7Id("ConfigurationActivationId");
      const effectiveAt = options.time.now();
      const lineageContextRef = activityRef(options.execution);
      let result: ConfigurationActivation | undefined;
      await persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          const currentRows = await rows<ActivationRow>(
            transaction,
            "SELECT activation_id, scope_ref, active_revision_id, " +
              "previous_revision_id, impact, effective_at, lineage_context_ref " +
              'FROM "heptalogos"."configuration_activation" ' +
              "WHERE scope_key = $1 FOR UPDATE",
            [key],
          );
          const current = currentRows[0];
          const currentRevisionId =
            current === undefined
              ? undefined
              : asUuid(
                  "ConfigurationRevisionId",
                  current.active_revision_id,
                  "active_revision_id",
                );
          if (currentRevisionId !== expected) {
            throw configurationProblem(
              "configuration.activation_conflict",
              "Configuration activation is stale",
              "The expected active revision no longer matches current Authority",
              "conflict",
              "after-change",
            );
          }
          if (current === undefined) {
            await executeRepositorySql(
              transaction,
              'INSERT INTO "heptalogos"."configuration_activation" (' +
                "activation_id, scope_ref, scope_key, active_revision_id, " +
                "previous_revision_id, impact, effective_at, lineage_context_ref) " +
                "VALUES ($1, $2, $3, $4, NULL, $5, $6, $7)",
              [
                activationId,
                revision.scopeRef,
                key,
                revision.revisionId,
                definition.activation,
                effectiveAt,
                lineageContextRef,
              ],
            );
          } else {
            await executeRepositorySql(
              transaction,
              'UPDATE "heptalogos"."configuration_activation" ' +
                "SET activation_id = $1, scope_ref = $2, active_revision_id = $3, " +
                "previous_revision_id = $4, impact = $5, effective_at = $6, " +
                "lineage_context_ref = $7 WHERE scope_key = $8",
              [
                activationId,
                revision.scopeRef,
                revision.revisionId,
                currentRevisionId,
                definition.activation,
                effectiveAt,
                lineageContextRef,
                key,
              ],
            );
          }
          await options.evidence.recordRequired(context, {
            evidenceKind: "configuration.activation.committed",
            evidenceContractVersion: "configuration.v1",
            objectRef: activationId,
            factRef: revision.valueDigest,
            retentionClass: "retained",
            sensitivity: "operational",
          });
          result = Object.freeze({
            schemaVersion: 1 as const,
            activationId,
            scopeRef: revision.scopeRef,
            activeRevisionId: revision.revisionId,
            ...(currentRevisionId === undefined
              ? {}
              : { previousRevisionId: currentRevisionId }),
            impact: definition.activation,
            effectiveAt,
            lineageContextRef,
          });
        }),
      );
      if (result === undefined) {
        throw configurationProblem(
          "configuration.activation_failed",
          "Configuration activation did not complete",
          "The owning activation transaction returned no result",
          "integrity",
        );
      }
      return result;
    },
  };
  return Object.freeze(service);
}
