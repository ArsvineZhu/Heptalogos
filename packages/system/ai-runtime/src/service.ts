/**
 * Implements current gateway/profile/binding persistence and structured
 * generation through AI SDK 7 protocol adapters and NetworkAccess.
 * @module service
 */

import {
  createUuidV7Id,
  digestCanonicalJson,
  parseInstant,
  parseUuidV7Id,
  snapshotCanonicalJson,
  ProblemError,
  type CanonicalJsonValue,
} from "@heptalogos/foundation-contracts";
import { decodeLineageContextRef } from "@heptalogos/execution-lineage";
import { GATEWAY_TRANSPORT_DEFINITION_ID } from "@heptalogos/configuration";
import type { GatewayNetworkTarget } from "@heptalogos/network-access";
import {
  executeRepositorySql,
  readRepositorySql,
  useRepositoryMutationTransaction,
} from "@heptalogos/persistence/repository";
import { compileSchema } from "@heptalogos/schema-runtime";
import type { SecretRef } from "@heptalogos/secret";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenResponses } from "@ai-sdk/open-responses";
import { injectJsonInstructionIntoMessages } from "@ai-sdk/provider-utils";
import { generateText, jsonSchema, Output, type ModelMessage } from "ai";
import {
  CURRENT_MODEL_CAPABILITIES,
  aiRuntimeReadinessSchema,
  type AIRuntimeReadiness,
  type AIRuntimeService,
  type AIRuntimeServiceOptions,
  type InvocationSpec,
  type ModelBinding,
  type ModelBindingId,
  type ModelCapability,
  type ModelProfile,
  type ModelProfileId,
  type GatewayProfile,
  type GatewayProfileId,
  type ModelInvocationProtocol,
  type SetModelBindingInput,
  type SetModelProfileInput,
  type SetGatewayProfileInput,
  type UsageMetadata,
} from "./contracts.js";
import { aiRuntimeProblem } from "./problems.js";

interface GatewayRow {
  readonly gateway_profile_id: unknown;
  readonly base_url: unknown;
  readonly api_token_secret_ref: unknown;
  readonly enabled: unknown;
}

interface ModelRow {
  readonly model_profile_id: unknown;
  readonly gateway_profile_id: unknown;
  readonly model_identifier: unknown;
  readonly protocol: unknown;
  readonly consumed_capabilities: unknown;
  readonly generation: unknown;
}

interface BindingRow {
  readonly model_binding_id: unknown;
  readonly role: unknown;
  readonly model_profile_id: unknown;
  readonly revision: unknown;
  readonly enabled: unknown;
}

function jsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw aiRuntimeProblem(
      "ai.repository_invalid",
      "AIRuntime repository data is invalid",
      field + " is not a non-empty string",
      "integrity",
    );
  }
  return value;
}

function integer(value: unknown, field: string, minimum = 0): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw aiRuntimeProblem(
      "ai.repository_invalid",
      "AIRuntime repository data is invalid",
      field + " is not a valid integer",
      "integrity",
    );
  }
  return parsed;
}

function uuid<T extends string>(brand: T, value: unknown, field: string) {
  const parsed = parseUuidV7Id(brand, value);
  if (parsed === undefined) {
    throw aiRuntimeProblem(
      "ai.repository_invalid",
      "AIRuntime repository data is invalid",
      field + " is not a UUIDv7",
      "integrity",
    );
  }
  return parsed;
}

function ref(value: unknown, field: string): SecretRef {
  const parsed = jsonValue(value);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    (parsed as Record<string, unknown>).schemaVersion !== 1
  ) {
    throw aiRuntimeProblem(
      "ai.repository_invalid",
      "AIRuntime repository data is invalid",
      field + " contains an invalid SecretRef",
      "integrity",
    );
  }
  const secretId = uuid(
    "SecretId",
    (parsed as Record<string, unknown>).secretId,
    field + ".secretId",
  );
  return Object.freeze({ schemaVersion: 1, secretId });
}

function optionalSecretRef(value: unknown, field: string): SecretRef | undefined {
  if (value === null || value === undefined) return undefined;
  return ref({ schemaVersion: 1, secretId: value }, field);
}

function canonicalBaseUrl(value: string): string {
  assertInputText(value, "baseUrl", 2048);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw aiRuntimeProblem(
      "ai.gateway_configuration_invalid",
      "GatewayProfile base URL is invalid",
      "baseUrl must be an absolute HTTP or HTTPS URL",
      "validation",
    );
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw aiRuntimeProblem(
      "ai.gateway_configuration_invalid",
      "GatewayProfile base URL is invalid",
      "baseUrl must be credential-free and must not contain a query or fragment",
      "validation",
    );
  }
  const host = url.hostname.toLowerCase();
  const loopback =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  if (url.protocol === "http:" && !loopback) {
    throw aiRuntimeProblem(
      "ai.gateway_configuration_invalid",
      "GatewayProfile base URL is invalid",
      "Plain HTTP is permitted only for literal loopback hosts",
      "validation",
    );
  }
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/u, "");
  const canonical = url.origin + path;
  if (canonical.length > 2048) {
    throw aiRuntimeProblem(
      "ai.gateway_configuration_invalid",
      "GatewayProfile base URL is invalid",
      "baseUrl is longer than the current bounded URL limit",
      "validation",
    );
  }
  return canonical;
}

function gatewayFromRow(row: GatewayRow): GatewayProfile {
  const gatewayProfileId = uuid(
    "GatewayProfileId",
    row.gateway_profile_id,
    "gateway_profile_id",
  ) as GatewayProfileId;
  return Object.freeze({
    schemaVersion: 1,
    gatewayProfileId,
    baseUrl: canonicalBaseUrl(text(row.base_url, "base_url")),
    ...(optionalSecretRef(row.api_token_secret_ref, "api_token_secret_ref") ===
    undefined
      ? {}
      : {
          apiTokenSecretRef: optionalSecretRef(
            row.api_token_secret_ref,
            "api_token_secret_ref",
          ),
        }),
    enabled: row.enabled === true,
  });
}

function capabilities(value: unknown): readonly ModelCapability[] {
  const parsed = jsonValue(value);
  const candidate = Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
  const sortedCandidate = candidate.sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  const sortedExpected = [...CURRENT_MODEL_CAPABILITIES].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  if (
    !Array.isArray(parsed) ||
    candidate.length !== parsed.length ||
    sortedCandidate.length !== sortedExpected.length ||
    sortedCandidate.join("\u0000") !== sortedExpected.join("\u0000")
  ) {
    throw aiRuntimeProblem(
      "ai.model_configuration_invalid",
      "ModelProfile capabilities are invalid",
      "The current ModelProfile must declare exactly the four current capabilities",
      "integrity",
    );
  }
  return Object.freeze([...CURRENT_MODEL_CAPABILITIES] as ModelCapability[]);
}

function protocol(value: unknown, field: string): ModelInvocationProtocol {
  const parsed = text(value, field);
  if (parsed !== "openai-chat" && parsed !== "openai-responses") {
    throw aiRuntimeProblem(
      "ai.model_configuration_invalid",
      "ModelProfile protocol is invalid",
      "Only openai-chat and openai-responses are current invocation protocols",
      "integrity",
    );
  }
  return parsed;
}

function modelFromRow(row: ModelRow): ModelProfile {
  return Object.freeze({
    schemaVersion: 1,
    modelProfileId: uuid(
      "ModelProfileId",
      row.model_profile_id,
      "model_profile_id",
    ) as ModelProfileId,
    gatewayProfileId: uuid(
      "GatewayProfileId",
      row.gateway_profile_id,
      "gateway_profile_id",
    ) as GatewayProfileId,
    modelIdentifier: text(row.model_identifier, "model_identifier"),
    protocol: protocol(row.protocol, "protocol"),
    consumedCapabilities: capabilities(row.consumed_capabilities),
    generation: integer(row.generation, "generation", 1),
  });
}

function bindingFromRow(row: BindingRow): ModelBinding {
  const role = text(row.role, "role");
  if (role !== "subject.primary" && role !== "subject.expression") {
    throw aiRuntimeProblem(
      "ai.binding_invalid",
      "ModelBinding role is invalid",
      "Only subject.primary and subject.expression are current binding roles",
      "integrity",
    );
  }
  return Object.freeze({
    schemaVersion: 1,
    modelBindingId: uuid(
      "ModelBindingId",
      row.model_binding_id,
      "model_binding_id",
    ) as ModelBindingId,
    role,
    modelProfileId: uuid(
      "ModelProfileId",
      row.model_profile_id,
      "model_profile_id",
    ) as ModelProfileId,
    revision: integer(row.revision, "revision", 1),
    enabled: row.enabled === true,
  });
}

function gatewayId(
  value: GatewayProfileId | string | undefined,
): GatewayProfileId | undefined {
  if (value === undefined) return undefined;
  return uuid("GatewayProfileId", value, "gatewayProfileId") as GatewayProfileId;
}

function modelId(
  value: ModelProfileId | string | undefined,
): ModelProfileId | undefined {
  if (value === undefined) return undefined;
  return uuid("ModelProfileId", value, "modelProfileId") as ModelProfileId;
}

function bindingId(value: ModelBindingId | string): ModelBindingId {
  return uuid("ModelBindingId", value, "modelBindingId") as ModelBindingId;
}

function gatewayDigest(profile: GatewayProfile): string {
  return digestCanonicalJson(
    "ai.gateway-profile.v1",
    profile as unknown as CanonicalJsonValue,
  ).hex;
}

function modelDigest(profile: ModelProfile): string {
  return digestCanonicalJson(
    "ai.model-profile.v1",
    profile as unknown as CanonicalJsonValue,
  ).hex;
}

function bindingDigest(binding: ModelBinding): string {
  return digestCanonicalJson(
    "ai.model-binding.v1",
    binding as unknown as CanonicalJsonValue,
  ).hex;
}

function staleResource(name: string): never {
  throw aiRuntimeProblem(
    "ai.stale_revision",
    name + " is stale",
    "The current resource changed after the action was planned",
    "conflict",
    "after-change",
  );
}

function assertExpected<T extends object>(
  actual: T | undefined,
  expected: string | null | undefined,
  digest: (value: T) => string,
  name: string,
): void {
  if (expected === undefined) return;
  if (expected === null) {
    if (actual !== undefined) staleResource(name);
    return;
  }
  if (actual === undefined || digest(actual) !== expected) staleResource(name);
}

function currentActivity(options: AIRuntimeServiceOptions) {
  const current = options.execution.current();
  if (current === undefined) {
    throw aiRuntimeProblem(
      "ai.invocation_activity_required",
      "AIRuntime invocation requires an Activity",
      "A provider generation must be attributed to current execution lineage",
      "conflict",
      "after-change",
    );
  }
  return current;
}

function installationScope(options: AIRuntimeServiceOptions) {
  return Object.freeze({
    schemaVersion: 1 as const,
    resourceKind: "installation",
    resourceId: currentActivity(options).origin.installationId,
  });
}

function gatewayScope(id: GatewayProfileId) {
  return Object.freeze({
    schemaVersion: 1 as const,
    resourceKind: "gateway-profile",
    resourceId: id,
  });
}

function networkTarget(
  gateway: GatewayProfile,
  invocationProtocol: ModelInvocationProtocol,
): GatewayNetworkTarget {
  return Object.freeze({
    schemaVersion: 1 as const,
    gatewayProfileId: gateway.gatewayProfileId,
    baseUrl: gateway.baseUrl,
    protocol: invocationProtocol,
  });
}

function assertInputText(value: string, field: string, maximum: number): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximum
  ) {
    throw aiRuntimeProblem(
      "ai.invalid_input",
      "AIRuntime input is invalid",
      field + " must be a bounded non-empty string",
      "validation",
    );
  }
}

function validateInvocation(
  spec: InvocationSpec,
  options: AIRuntimeServiceOptions,
): void {
  const current = currentActivity(options);
  if (spec.ownerActivityRef !== current.activityId) {
    throw aiRuntimeProblem(
      "ai.invocation_activity_mismatch",
      "Invocation Activity does not match current execution",
      "InvocationSpec ownerActivityRef must identify the current Activity",
      "conflict",
      "after-change",
    );
  }
  const lineage = decodeLineageContextRef(spec.lineageContextRef);
  if (
    lineage.sourceActivityId !== current.activityId ||
    lineage.sourceInstanceId !== current.origin.instanceId ||
    lineage.sourceContinuityEpochId !== current.origin.continuityEpochId
  ) {
    throw aiRuntimeProblem(
      "ai.invocation_lineage_mismatch",
      "Invocation lineage is invalid",
      "InvocationSpec lineage must continue the current Activity",
      "conflict",
      "after-change",
    );
  }
  if (
    !Number.isSafeInteger(spec.expectedBindingRevision) ||
    spec.expectedBindingRevision < 1 ||
    !Number.isSafeInteger(spec.budget.maxOutputTokens) ||
    spec.budget.maxOutputTokens < 1 ||
    spec.budget.maxOutputTokens > 32_768
  ) {
    throw aiRuntimeProblem(
      "ai.invalid_input",
      "Invocation budget is invalid",
      "maxOutputTokens must be a positive bounded integer",
      "validation",
    );
  }
  assertInputText(spec.objective, "objective", 512);
  if (
    !Array.isArray(spec.messages) ||
    spec.messages.length === 0 ||
    spec.messages.some(
      (message) =>
        !["system", "user", "assistant"].includes(message.role) ||
        typeof message.text !== "string" ||
        message.text.length === 0 ||
        message.text.length > 64 * 1024,
    )
  ) {
    throw aiRuntimeProblem(
      "ai.invalid_input",
      "Invocation messages are invalid",
      "AIRuntime accepts bounded system/user/assistant text messages",
      "validation",
    );
  }
  if (
    typeof spec.outputSchema !== "object" ||
    spec.outputSchema === null ||
    Array.isArray(spec.outputSchema)
  ) {
    throw aiRuntimeProblem(
      "ai.output_schema_invalid",
      "Invocation output schema is invalid",
      "Structured generation requires a JSON Schema object",
      "validation",
    );
  }
}

function normalizeUsage(value: {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}): UsageMetadata | undefined {
  const usage: UsageMetadata = {
    ...(value.inputTokens === undefined ? {} : { inputTokens: value.inputTokens }),
    ...(value.outputTokens === undefined ? {} : { outputTokens: value.outputTokens }),
    ...(value.totalTokens === undefined ? {} : { totalTokens: value.totalTokens }),
  };
  return Object.keys(usage).length === 0 ? undefined : Object.freeze(usage);
}

function modelPrompt(messages: InvocationSpec["messages"]): {
  readonly system?: string;
  readonly messages: ModelMessage[];
} {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.text)
    .join("\n");
  return {
    ...(system.length === 0 ? {} : { system }),
    messages: messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role,
        content: message.text,
      })),
  };
}

function chatSystemPrompt(
  prompt: string | undefined,
  schema: InvocationSpec["outputSchema"],
): string {
  const instructed = injectJsonInstructionIntoMessages({
    messages: (prompt === undefined
      ? []
      : [{ role: "system" as const, content: prompt }]) as Parameters<
      typeof injectJsonInstructionIntoMessages
    >[0]["messages"],
    schema: schema as Parameters<typeof injectJsonInstructionIntoMessages>[0]["schema"],
  });
  const system = instructed[0];
  if (system?.role !== "system" || typeof system.content !== "string") {
    throw aiRuntimeProblem(
      "ai.output_schema_invalid",
      "AIRuntime could not prepare the Chat schema instruction",
      "The installed AI SDK helper did not produce a system instruction",
      "integrity",
    );
  }
  return system.content;
}

/** Creates the current AIRuntime service over its semantic owner boundaries. */
export function createAIRuntimeService(
  options: AIRuntimeServiceOptions,
): AIRuntimeService {
  const readGateway = async (
    id: GatewayProfileId,
  ): Promise<GatewayProfile | undefined> => {
    const result = await readRepositorySql<GatewayRow>(
      options.persistence,
      "SELECT gateway_profile_id, base_url, api_token_secret_ref, enabled " +
        'FROM "heptalogos"."gateway_profile" WHERE gateway_profile_id = $1',
      [id],
    );
    const row = result[0];
    return row === undefined ? undefined : gatewayFromRow(row);
  };
  const readModel = async (id: ModelProfileId): Promise<ModelProfile | undefined> => {
    const result = await readRepositorySql<ModelRow>(
      options.persistence,
      "SELECT model_profile_id, gateway_profile_id, model_identifier, protocol, " +
        "consumed_capabilities, generation " +
        'FROM "heptalogos"."model_profile" WHERE model_profile_id = $1',
      [id],
    );
    const row = result[0];
    return row === undefined ? undefined : modelFromRow(row);
  };
  const readBinding = async (
    roleOrId: ModelBindingId | string,
  ): Promise<ModelBinding | undefined> => {
    const id =
      roleOrId === "subject.primary" || roleOrId === "subject.expression"
        ? undefined
        : bindingId(roleOrId);
    const result = await readRepositorySql<BindingRow>(
      options.persistence,
      "SELECT model_binding_id, role, model_profile_id, revision, enabled " +
        'FROM "heptalogos"."model_binding" ' +
        (id === undefined ? "WHERE role = $1" : "WHERE model_binding_id = $1"),
      [id ?? roleOrId],
    );
    const row = result[0];
    return row === undefined ? undefined : bindingFromRow(row);
  };

  const service: AIRuntimeService = {
    async listGatewayProfiles() {
      const result = await readRepositorySql<GatewayRow>(
        options.persistence,
        "SELECT gateway_profile_id, base_url, api_token_secret_ref, enabled " +
          'FROM "heptalogos"."gateway_profile" ' +
          "ORDER BY gateway_profile_id",
        [],
      );
      return Object.freeze(result.map(gatewayFromRow));
    },
    async listModelProfiles() {
      const result = await readRepositorySql<ModelRow>(
        options.persistence,
        "SELECT model_profile_id, gateway_profile_id, model_identifier, protocol, " +
          "consumed_capabilities, generation " +
          'FROM "heptalogos"."model_profile" ORDER BY model_profile_id',
        [],
      );
      return Object.freeze(result.map(modelFromRow));
    },
    async listModelBindings() {
      const result = await readRepositorySql<BindingRow>(
        options.persistence,
        "SELECT model_binding_id, role, model_profile_id, revision, enabled " +
          'FROM "heptalogos"."model_binding" ORDER BY role',
        [],
      );
      return Object.freeze(result.map(bindingFromRow));
    },
    async getGatewayProfile(value) {
      const id = gatewayId(value);
      if (id === undefined) return undefined;
      return readGateway(id);
    },
    async getModelProfile(value) {
      const id = modelId(value);
      if (id === undefined) return undefined;
      return readModel(id);
    },
    getModelBinding: readBinding,
    async setGatewayProfile(input: SetGatewayProfileInput, expectedDigest) {
      const existingId = gatewayId(input.gatewayProfileId);
      if (input.apiTokenSecretRef !== undefined && existingId === undefined) {
        throw aiRuntimeProblem(
          "ai.invalid_input",
          "GatewayProfile input is invalid",
          "A gateway token SecretRef requires an explicit GatewayProfileId",
          "validation",
        );
      }
      const gatewayProfileId =
        existingId ?? (createUuidV7Id("GatewayProfileId") as GatewayProfileId);
      const baseUrl = canonicalBaseUrl(input.baseUrl);
      const apiTokenSecretRef =
        input.apiTokenSecretRef === undefined
          ? undefined
          : ref(input.apiTokenSecretRef, "apiTokenSecretRef");
      if (apiTokenSecretRef !== undefined) {
        const secret = await options.secret.getMetadata(apiTokenSecretRef);
        if (
          secret === undefined ||
          secret.state !== "ACTIVE" ||
          secret.purpose !== "ai.gateway.bearer-token" ||
          secret.scopeRef?.resourceKind !== "gateway-profile" ||
          secret.scopeRef.resourceId !== gatewayProfileId
        ) {
          throw aiRuntimeProblem(
            "ai.secret_unavailable",
            "GatewayProfile SecretRef is not usable",
            "The attached SecretRef must be an active bearer token scoped to this GatewayProfile",
            "conflict",
            "after-change",
          );
        }
      }
      let written: GatewayProfile | undefined;
      await options.persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          const currentRows = await executeRepositorySql<GatewayRow>(
            transaction,
            "SELECT gateway_profile_id, base_url, api_token_secret_ref, enabled " +
              'FROM "heptalogos"."gateway_profile" ' +
              "WHERE gateway_profile_id = $1 FOR UPDATE",
            [gatewayProfileId],
          );
          const currentRow = currentRows[0];
          const current =
            currentRow === undefined ? undefined : gatewayFromRow(currentRow);
          assertExpected(current, expectedDigest, gatewayDigest, "GatewayProfile");
          if (current !== undefined && current.baseUrl !== baseUrl) {
            throw aiRuntimeProblem(
              "ai.gateway_destination_immutable",
              "GatewayProfile base URL is immutable",
              "Create a new GatewayProfile when the configured destination changes",
              "conflict",
              "after-change",
            );
          }
          const lineageContextRef = options.execution.createLineageContextRef();
          const writtenRows =
            current === undefined
              ? await executeRepositorySql<GatewayRow>(
                  transaction,
                  'INSERT INTO "heptalogos"."gateway_profile" (' +
                    "gateway_profile_id, base_url, api_token_secret_ref, enabled, lineage_context_ref) " +
                    "VALUES ($1, $2, $3, $4, $5) " +
                    "ON CONFLICT (gateway_profile_id) DO NOTHING " +
                    "RETURNING gateway_profile_id, base_url, api_token_secret_ref, enabled",
                  [
                    gatewayProfileId,
                    baseUrl,
                    apiTokenSecretRef?.secretId ?? null,
                    input.enabled,
                    lineageContextRef,
                  ],
                )
              : await executeRepositorySql<GatewayRow>(
                  transaction,
                  'UPDATE "heptalogos"."gateway_profile" SET ' +
                    "api_token_secret_ref = $1, enabled = $2, lineage_context_ref = $3 " +
                    "WHERE gateway_profile_id = $4 " +
                    "RETURNING gateway_profile_id, base_url, api_token_secret_ref, enabled",
                  [
                    apiTokenSecretRef?.secretId ?? null,
                    input.enabled,
                    lineageContextRef,
                    gatewayProfileId,
                  ],
                );
          const writtenRow = writtenRows[0];
          if (writtenRow === undefined) staleResource("GatewayProfile");
          written = gatewayFromRow(writtenRow);
          await options.evidence.recordRequired(context, {
            evidenceKind: "ai.gateway-profile.changed",
            evidenceContractVersion: "ai-runtime.v1",
            objectRef: gatewayProfileId,
            retentionClass: "retained",
            sensitivity: "operational",
          });
        }),
      );
      return written!;
    },
    async setModelProfile(input: SetModelProfileInput, expectedDigest) {
      const existingId = modelId(input.modelProfileId);
      const modelProfileId =
        existingId ?? (createUuidV7Id("ModelProfileId") as ModelProfileId);
      const gatewayProfileId = uuid(
        "GatewayProfileId",
        input.gatewayProfileId,
        "gatewayProfileId",
      ) as GatewayProfileId;
      if ((await readGateway(gatewayProfileId)) === undefined) {
        throw aiRuntimeProblem(
          "ai.gateway_unavailable",
          "GatewayProfile was not found",
          "ModelProfile must reference an existing GatewayProfile",
          "conflict",
          "after-change",
        );
      }
      if (input.protocol !== "openai-chat" && input.protocol !== "openai-responses") {
        throw aiRuntimeProblem(
          "ai.model_configuration_invalid",
          "ModelProfile protocol is invalid",
          "Only openai-chat and openai-responses are current invocation protocols",
          "validation",
        );
      }
      assertInputText(input.modelIdentifier, "modelIdentifier", 256);
      const normalizedCapabilities = capabilities(input.consumedCapabilities);
      let written: ModelProfile | undefined;
      await options.persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          const currentRows = await executeRepositorySql<ModelRow>(
            transaction,
            "SELECT model_profile_id, gateway_profile_id, model_identifier, protocol, " +
              "consumed_capabilities, generation FROM " +
              '"heptalogos"."model_profile" ' +
              "WHERE model_profile_id = $1 FOR UPDATE",
            [modelProfileId],
          );
          const currentRow = currentRows[0];
          const current =
            currentRow === undefined ? undefined : modelFromRow(currentRow);
          assertExpected(current, expectedDigest, modelDigest, "ModelProfile");
          const generation = current === undefined ? 1 : current.generation + 1;
          const lineageContextRef = options.execution.createLineageContextRef();
          const writtenRows =
            current === undefined
              ? await executeRepositorySql<ModelRow>(
                  transaction,
                  'INSERT INTO "heptalogos"."model_profile" (' +
                    "model_profile_id, gateway_profile_id, model_identifier, protocol, " +
                    "consumed_capabilities, generation, lineage_context_ref) " +
                    "VALUES ($1, $2, $3, $4, $5, $6, $7) " +
                    "ON CONFLICT (model_profile_id) DO NOTHING " +
                    "RETURNING model_profile_id, gateway_profile_id, model_identifier, " +
                    "protocol, consumed_capabilities, generation",
                  [
                    modelProfileId,
                    gatewayProfileId,
                    input.modelIdentifier,
                    input.protocol,
                    JSON.stringify(normalizedCapabilities),
                    generation,
                    lineageContextRef,
                  ],
                )
              : await executeRepositorySql<ModelRow>(
                  transaction,
                  'UPDATE "heptalogos"."model_profile" SET ' +
                    "gateway_profile_id = $1, model_identifier = $2, protocol = $3, " +
                    "consumed_capabilities = $4, generation = $5, lineage_context_ref = $6 " +
                    "WHERE model_profile_id = $7 " +
                    "RETURNING model_profile_id, gateway_profile_id, model_identifier, " +
                    "protocol, consumed_capabilities, generation",
                  [
                    gatewayProfileId,
                    input.modelIdentifier,
                    input.protocol,
                    JSON.stringify(normalizedCapabilities),
                    generation,
                    lineageContextRef,
                    modelProfileId,
                  ],
                );
          const writtenRow = writtenRows[0];
          if (writtenRow === undefined) staleResource("ModelProfile");
          written = modelFromRow(writtenRow);
          await options.evidence.recordRequired(context, {
            evidenceKind: "ai.model-profile.changed",
            evidenceContractVersion: "ai-runtime.v1",
            objectRef: modelProfileId,
            retentionClass: "retained",
            sensitivity: "operational",
          });
        }),
      );
      return written!;
    },
    async setModelBinding(input: SetModelBindingInput, expectedDigest) {
      const modelProfileId = uuid(
        "ModelProfileId",
        input.modelProfileId,
        "modelProfileId",
      ) as ModelProfileId;
      if ((await readModel(modelProfileId)) === undefined) {
        throw aiRuntimeProblem(
          "ai.model_unavailable",
          "ModelProfile was not found",
          "ModelBinding must reference an existing ModelProfile",
          "conflict",
          "after-change",
        );
      }
      const newModelBindingId = createUuidV7Id("ModelBindingId") as ModelBindingId;
      let written: ModelBinding | undefined;
      await options.persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          const currentRows = await executeRepositorySql<BindingRow>(
            transaction,
            "SELECT model_binding_id, role, model_profile_id, revision, enabled " +
              'FROM "heptalogos"."model_binding" WHERE role = $1 FOR UPDATE',
            [input.role],
          );
          const currentRow = currentRows[0];
          const current =
            currentRow === undefined ? undefined : bindingFromRow(currentRow);
          assertExpected(current, expectedDigest, bindingDigest, "ModelBinding");
          const modelBindingId = current?.modelBindingId ?? newModelBindingId;
          const revision = current === undefined ? 1 : current.revision + 1;
          const lineageContextRef = options.execution.createLineageContextRef();
          const writtenRows =
            current === undefined
              ? await executeRepositorySql<BindingRow>(
                  transaction,
                  'INSERT INTO "heptalogos"."model_binding" (' +
                    "model_binding_id, role, model_profile_id, revision, enabled, " +
                    "lineage_context_ref) VALUES ($1, $2, $3, $4, $5, $6) " +
                    "ON CONFLICT (role) DO NOTHING " +
                    "RETURNING model_binding_id, role, model_profile_id, revision, enabled",
                  [
                    modelBindingId,
                    input.role,
                    modelProfileId,
                    revision,
                    true,
                    lineageContextRef,
                  ],
                )
              : await executeRepositorySql<BindingRow>(
                  transaction,
                  'UPDATE "heptalogos"."model_binding" SET ' +
                    "model_profile_id = $1, revision = $2, enabled = $3, " +
                    "lineage_context_ref = $4 WHERE role = $5 " +
                    "RETURNING model_binding_id, role, model_profile_id, revision, enabled",
                  [modelProfileId, revision, true, lineageContextRef, input.role],
                );
          const writtenRow = writtenRows[0];
          if (writtenRow === undefined) staleResource("ModelBinding");
          written = bindingFromRow(writtenRow);
          await options.evidence.recordRequired(context, {
            evidenceKind: "ai.model-binding.changed",
            evidenceContractVersion: "ai-runtime.v1",
            objectRef: written.modelBindingId,
            retentionClass: "retained",
            sensitivity: "operational",
          });
        }),
      );
      return written!;
    },
    async getReadiness() {
      const blockers: string[] = [];
      const [activeConfig, gateways, models, bindings] = await Promise.all([
        options.configuration.getEffectiveRevision(
          GATEWAY_TRANSPORT_DEFINITION_ID,
          installationScope(options),
        ),
        service.listGatewayProfiles(),
        service.listModelProfiles(),
        service.listModelBindings(),
      ]);
      if (activeConfig === undefined) blockers.push("configuration");
      for (const role of ["subject.primary", "subject.expression"] as const) {
        const binding = bindings.find((item) => item.role === role);
        if (binding === undefined || !binding.enabled) {
          blockers.push("binding." + role);
          continue;
        }
        const model = models.find(
          (item) => item.modelProfileId === binding.modelProfileId,
        );
        if (model === undefined) {
          blockers.push("model." + role);
          continue;
        }
        const gateway = gateways.find(
          (item) => item.gatewayProfileId === model.gatewayProfileId,
        );
        if (gateway === undefined || !gateway.enabled) {
          blockers.push("gateway." + role);
          continue;
        }
        try {
          options.networkAccess.authorizeGatewayTarget(
            networkTarget(gateway, model.protocol),
          );
        } catch {
          blockers.push("network." + role);
        }
        if (gateway.apiTokenSecretRef !== undefined) {
          const secret = await options.secret.getMetadata(gateway.apiTokenSecretRef);
          if (secret?.state !== "ACTIVE") {
            blockers.push("secret." + role);
          } else {
            try {
              const material = await options.secret.resolve(gateway.apiTokenSecretRef, {
                consumer: "system.ai-runtime",
                purpose: "ai.gateway.bearer-token",
                resourceRef: gatewayScope(gateway.gatewayProfileId),
              });
              material.bytes.fill(0);
            } catch {
              blockers.push("secret." + role);
            }
          }
        }
      }
      const readiness: AIRuntimeReadiness = Object.freeze({
        schemaVersion: 1,
        state: blockers.length === 0 ? "READY" : "BLOCKED",
        blockers: Object.freeze([...new Set(blockers)]),
      });
      const validation = compileSchema<AIRuntimeReadiness>(
        aiRuntimeReadinessSchema,
      ).validate(readiness);
      if (!validation.ok) {
        throw aiRuntimeProblem(
          "ai.readiness_invalid",
          "AIRuntime readiness projection is invalid",
          "The current readiness owner produced an invalid projection",
          "integrity",
        );
      }
      return readiness;
    },
    async invoke(spec) {
      validateInvocation(spec, options);
      const binding = await readBinding(spec.modelBindingId);
      if (binding === undefined) {
        throw aiRuntimeProblem(
          "ai.model_binding_unavailable",
          "ModelBinding was not found",
          "The requested current ModelBinding does not exist",
          "conflict",
          "after-change",
        );
      }
      if (!binding.enabled || binding.revision !== spec.expectedBindingRevision) {
        throw aiRuntimeProblem(
          "ai.model_binding_stale",
          "ModelBinding is stale",
          "The requested binding revision is no longer current",
          "conflict",
          "after-change",
        );
      }
      const model = await readModel(binding.modelProfileId);
      if (model === undefined) {
        throw aiRuntimeProblem(
          "ai.model_binding_unavailable",
          "ModelProfile was not found",
          "The current ModelBinding points to no ModelProfile",
          "conflict",
          "after-change",
        );
      }
      const gateway = await readGateway(model.gatewayProfileId);
      if (gateway === undefined || !gateway.enabled) {
        throw aiRuntimeProblem(
          "ai.gateway_unavailable",
          "GatewayProfile is unavailable",
          "The current ModelProfile does not resolve to an enabled gateway",
          "unavailable",
          "after-change",
        );
      }
      const activeConfig = await options.configuration.getEffectiveRevision(
        GATEWAY_TRANSPORT_DEFINITION_ID,
        installationScope(options),
      );
      if (activeConfig === undefined) {
        throw aiRuntimeProblem(
          "ai.gateway_configuration_invalid",
          "Gateway transport configuration is unavailable",
          "An active gateway transport ConfigurationRevision is required",
          "conflict",
          "after-change",
        );
      }
      const target = networkTarget(gateway, model.protocol);
      try {
        options.networkAccess.authorizeGatewayTarget(target);
      } catch {
        throw aiRuntimeProblem(
          "ai.network_unavailable",
          "Gateway network route is unavailable",
          "NetworkAccess cannot authorize the selected GatewayProfile protocol endpoint",
          "conflict",
          "after-change",
        );
      }
      let apiKey: string | undefined;
      if (gateway.apiTokenSecretRef !== undefined) {
        let material;
        try {
          material = await options.secret.resolve(gateway.apiTokenSecretRef, {
            consumer: "system.ai-runtime",
            purpose: "ai.gateway.bearer-token",
            resourceRef: gatewayScope(gateway.gatewayProfileId),
          });
        } catch {
          throw aiRuntimeProblem(
            "ai.secret_unavailable",
            "Gateway SecretRef is unavailable",
            "The configured gateway bearer token could not be resolved",
            "unavailable",
            "after-change",
          );
        }
        try {
          apiKey = new TextDecoder("utf-8", { fatal: true }).decode(material.bytes);
        } catch {
          material.bytes.fill(0);
          throw aiRuntimeProblem(
            "ai.secret_unavailable",
            "Gateway SecretRef is invalid",
            "The configured gateway token is not valid UTF-8",
            "integrity",
          );
        }
        material.bytes.fill(0);
        if (apiKey.length === 0) {
          throw aiRuntimeProblem(
            "ai.secret_unavailable",
            "Gateway SecretRef is empty",
            "The configured gateway token is empty",
            "integrity",
          );
        }
      }
      const remainingMs =
        spec.deadline === undefined
          ? undefined
          : Math.max(0, Date.parse(parseInstant(spec.deadline) ?? "") - Date.now());
      if (remainingMs !== undefined && remainingMs <= 0) {
        throw aiRuntimeProblem(
          "ai.invocation_timed_out",
          "AIRuntime invocation deadline elapsed",
          "The invocation deadline elapsed before provider dispatch",
          "conflict",
          "after-change",
        );
      }
      const controller = new AbortController();
      const timer =
        remainingMs === undefined
          ? undefined
          : setTimeout(() => controller.abort(), remainingMs);
      try {
        const prompt = modelPrompt(spec.messages);
        const providerFetch = options.networkAccess.createProviderFetch(
          "system.ai-runtime",
          target,
          activeConfig.revisionId,
        );
        const selectedModel =
          model.protocol === "openai-chat"
            ? createOpenAICompatible<string, string, string, string>({
                name: "heptalogos-chat",
                baseURL: gateway.baseUrl,
                ...(apiKey === undefined ? {} : { apiKey }),
                fetch: providerFetch,
              }).chatModel(model.modelIdentifier)
            : createOpenResponses({
                name: "heptalogos-responses",
                url: gateway.baseUrl + "/responses",
                ...(apiKey === undefined ? {} : { apiKey }),
                fetch: providerFetch,
              })(model.modelIdentifier);
        const output = Output.object({
          schema: jsonSchema<Record<string, unknown>>(
            spec.outputSchema as Record<string, unknown>,
          ),
        });
        const system =
          model.protocol === "openai-chat"
            ? chatSystemPrompt(prompt.system, spec.outputSchema)
            : prompt.system;
        const generated = await generateText({
          model: selectedModel,
          messages: prompt.messages,
          ...(system === undefined ? {} : { system }),
          output,
          maxOutputTokens: spec.budget.maxOutputTokens,
          maxRetries: 0,
          abortSignal: controller.signal,
          ...(remainingMs === undefined ? {} : { timeout: remainingMs }),
        });
        if (generated.output === undefined) {
          throw aiRuntimeProblem(
            "ai.output_schema_invalid",
            "Provider returned no structured output",
            "The selected provider did not produce a structured result",
            "unavailable",
            "after-change",
          );
        }
        const validator = compileSchema<CanonicalJsonValue>(
          spec.outputSchema as object,
        );
        const validation = validator.validate(generated.output);
        if (!validation.ok) {
          throw aiRuntimeProblem(
            "ai.output_schema_invalid",
            "Provider structured output failed schema validation",
            "The returned object did not satisfy the current SchemaRuntime contract",
            "integrity",
          );
        }
        const candidate = snapshotCanonicalJson(validation.value).value;
        const evidenceRefs = await options.persistence.mutate((context) =>
          useRepositoryMutationTransaction(context, async () => {
            const evidence = await options.evidence.recordRequired(context, {
              evidenceKind: "ai.generation",
              evidenceContractVersion: "ai-runtime.v1",
              subjectRef: spec.invocationId,
              objectRef: model.modelProfileId,
              factRef: gateway.gatewayProfileId,
              retentionClass: "retained",
              sensitivity: "operational",
            });
            return Object.freeze([{ evidenceId: evidence.evidenceId }]);
          }),
        );
        return Object.freeze({
          schemaVersion: 1 as const,
          invocationId: spec.invocationId,
          bindingRevision: binding.revision,
          gatewayProfileId: gateway.gatewayProfileId,
          modelProfileId: model.modelProfileId,
          modelProfileGeneration: model.generation,
          modelIdentifier: model.modelIdentifier,
          protocol: model.protocol,
          configurationRevisionId: activeConfig.revisionId,
          candidate,
          ...(normalizeUsage(generated.usage) === undefined
            ? {}
            : { usage: normalizeUsage(generated.usage) }),
          lineageContextRef: spec.lineageContextRef,
          evidenceRefs,
        });
      } catch (error) {
        if (error instanceof ProblemError) throw error;
        if (controller.signal.aborted) {
          throw aiRuntimeProblem(
            "ai.invocation_timed_out",
            "AIRuntime invocation timed out",
            "The gateway invocation exceeded its effective deadline",
            "unavailable",
            "after-change",
          );
        }
        throw aiRuntimeProblem(
          "ai.gateway_unavailable",
          "Gateway invocation failed",
          "The selected OpenAI-family gateway invocation did not complete",
          "unavailable",
          "manual",
        );
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    },
  };
  return Object.freeze(service);
}
