/**
 * Implements current OpenAI profile/binding persistence and structured
 * generation through AI SDK 7 and the NetworkAccess custom-fetch boundary.
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
import type { ConfigurationRevisionId } from "@heptalogos/configuration";
import { PROVIDER_TRANSPORT_DEFINITION_ID } from "@heptalogos/configuration";
import { OPENAI_NETWORK_ACCESS_PROFILE_ID } from "@heptalogos/network-access";
import {
  executeRepositorySql,
  readRepositorySql,
  useRepositoryMutationTransaction,
} from "@heptalogos/persistence/repository";
import { compileSchema } from "@heptalogos/schema-runtime";
import type { SecretRef } from "@heptalogos/secret";
import { createOpenAI } from "@ai-sdk/openai";
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
  type ProviderProfile,
  type ProviderProfileId,
  type SetModelBindingInput,
  type SetModelProfileInput,
  type SetProviderProfileInput,
  type UsageMetadata,
} from "./contracts.js";
import { aiRuntimeProblem } from "./problems.js";

interface ProviderRow {
  readonly provider_profile_id: unknown;
  readonly configuration_revision_ref: unknown;
  readonly secret_refs: unknown;
  readonly network_access_profile_ref: unknown;
  readonly enabled: unknown;
  readonly provider_settings: unknown;
}

interface ModelRow {
  readonly model_profile_id: unknown;
  readonly provider_profile_id: unknown;
  readonly provider_model_identifier: unknown;
  readonly consumed_capabilities: unknown;
  readonly generation: unknown;
  readonly configuration_revision_ref: unknown;
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

function secretRefs(value: unknown): readonly SecretRef[] {
  const parsed = jsonValue(value);
  if (!Array.isArray(parsed) || parsed.length > 1) {
    throw aiRuntimeProblem(
      "ai.repository_invalid",
      "AIRuntime repository data is invalid",
      "secret_refs is not the current bounded SecretRef list",
      "integrity",
    );
  }
  return Object.freeze(parsed.map((item) => ref(item, "secret_refs")));
}

function providerFromRow(row: ProviderRow): ProviderProfile {
  const settings = jsonValue(row.provider_settings);
  if (
    typeof settings !== "object" ||
    settings === null ||
    Array.isArray(settings) ||
    (settings as Record<string, unknown>).api !== "responses" ||
    (settings as Record<string, unknown>).store !== false
  ) {
    throw aiRuntimeProblem(
      "ai.provider_configuration_invalid",
      "ProviderProfile settings are invalid",
      "Only OpenAI Responses with store=false is supported",
      "integrity",
    );
  }
  if (row.network_access_profile_ref !== OPENAI_NETWORK_ACCESS_PROFILE_ID) {
    throw aiRuntimeProblem(
      "ai.provider_configuration_invalid",
      "ProviderProfile network profile is invalid",
      "The current ProviderProfile must use the OpenAI NetworkAccess profile",
      "integrity",
    );
  }
  const providerProfileId = uuid(
    "ProviderProfileId",
    row.provider_profile_id,
    "provider_profile_id",
  ) as ProviderProfileId;
  return Object.freeze({
    schemaVersion: 1,
    providerProfileId,
    providerKind: "openai",
    configurationRevisionRef: uuid(
      "ConfigurationRevisionId",
      row.configuration_revision_ref,
      "configuration_revision_ref",
    ) as ConfigurationRevisionId,
    secretRefs: secretRefs(row.secret_refs),
    networkAccessProfileRef: OPENAI_NETWORK_ACCESS_PROFILE_ID,
    enabled: row.enabled === true,
    providerSettings: Object.freeze({ api: "responses", store: false }),
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

function modelFromRow(row: ModelRow): ModelProfile {
  return Object.freeze({
    schemaVersion: 1,
    modelProfileId: uuid(
      "ModelProfileId",
      row.model_profile_id,
      "model_profile_id",
    ) as ModelProfileId,
    providerProfileId: uuid(
      "ProviderProfileId",
      row.provider_profile_id,
      "provider_profile_id",
    ) as ProviderProfileId,
    providerModelIdentifier: text(
      row.provider_model_identifier,
      "provider_model_identifier",
    ),
    consumedCapabilities: capabilities(row.consumed_capabilities),
    generation: integer(row.generation, "generation", 1),
    configurationRevisionRef: uuid(
      "ConfigurationRevisionId",
      row.configuration_revision_ref,
      "configuration_revision_ref",
    ) as ConfigurationRevisionId,
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

function providerId(
  value: ProviderProfileId | string | undefined,
): ProviderProfileId | undefined {
  if (value === undefined) return undefined;
  return uuid("ProviderProfileId", value, "providerProfileId") as ProviderProfileId;
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

function configId(value: ConfigurationRevisionId | string): ConfigurationRevisionId {
  return uuid(
    "ConfigurationRevisionId",
    value,
    "configurationRevisionRef",
  ) as ConfigurationRevisionId;
}

function profileDigest(profile: ProviderProfile): string {
  return digestCanonicalJson(
    "ai.provider-profile.v1",
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

function assertExpected(
  actual: string,
  expected: string | undefined,
  name: string,
): void {
  if (expected !== undefined && expected !== actual) {
    throw aiRuntimeProblem(
      "ai.stale_revision",
      name + " is stale",
      "The current resource changed after the action was planned",
      "conflict",
      "after-change",
    );
  }
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

function providerScope(id: ProviderProfileId) {
  return Object.freeze({
    schemaVersion: 1 as const,
    resourceKind: "provider-profile",
    resourceId: id,
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

function modelMessages(messages: InvocationSpec["messages"]): ModelMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.text,
  }));
}

/** Creates the current AIRuntime service over its semantic owner boundaries. */
export function createAIRuntimeService(
  options: AIRuntimeServiceOptions,
): AIRuntimeService {
  const readProvider = async (
    id: ProviderProfileId,
  ): Promise<ProviderProfile | undefined> => {
    const result = await readRepositorySql<ProviderRow>(
      options.persistence,
      "SELECT provider_profile_id, configuration_revision_ref, secret_refs, " +
        "network_access_profile_ref, enabled, provider_settings " +
        'FROM "heptalogos"."provider_profile" WHERE provider_profile_id = $1',
      [id],
    );
    const row = result[0];
    return row === undefined ? undefined : providerFromRow(row);
  };
  const readModel = async (id: ModelProfileId): Promise<ModelProfile | undefined> => {
    const result = await readRepositorySql<ModelRow>(
      options.persistence,
      "SELECT model_profile_id, provider_profile_id, provider_model_identifier, " +
        "consumed_capabilities, generation, configuration_revision_ref " +
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
    async listProviderProfiles() {
      const result = await readRepositorySql<ProviderRow>(
        options.persistence,
        "SELECT provider_profile_id, configuration_revision_ref, secret_refs, " +
          "network_access_profile_ref, enabled, provider_settings " +
          'FROM "heptalogos"."provider_profile" ' +
          "ORDER BY provider_profile_id",
        [],
      );
      return Object.freeze(result.map(providerFromRow));
    },
    async listModelProfiles() {
      const result = await readRepositorySql<ModelRow>(
        options.persistence,
        "SELECT model_profile_id, provider_profile_id, provider_model_identifier, " +
          "consumed_capabilities, generation, configuration_revision_ref " +
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
    async getProviderProfile(value) {
      const id = providerId(value);
      if (id === undefined) return undefined;
      return readProvider(id);
    },
    async getModelProfile(value) {
      const id = modelId(value);
      if (id === undefined) return undefined;
      return readModel(id);
    },
    getModelBinding: readBinding,
    async setProviderProfile(input: SetProviderProfileInput, expectedDigest) {
      const existingId = providerId(input.providerProfileId);
      const providerProfileId =
        existingId ?? (createUuidV7Id("ProviderProfileId") as ProviderProfileId);
      const configurationRevisionRef = configId(input.configurationRevisionRef);
      const revision = await options.configuration.getRevision(
        configurationRevisionRef,
      );
      if (revision === undefined) {
        throw aiRuntimeProblem(
          "ai.provider_configuration_invalid",
          "Provider configuration revision was not found",
          "ProviderProfile must reference an existing ConfigurationRevision",
          "conflict",
          "after-change",
        );
      }
      if (
        input.secretRefs.length > 1 ||
        input.secretRefs.some(
          (secret) =>
            secret.schemaVersion !== 1 ||
            parseUuidV7Id("SecretId", secret.secretId) === undefined,
        )
      ) {
        throw aiRuntimeProblem(
          "ai.provider_configuration_invalid",
          "ProviderProfile SecretRefs are invalid",
          "The current provider route accepts zero or one valid SecretRef",
          "validation",
        );
      }
      for (const secretRef of input.secretRefs) {
        const secret = await options.secret.getMetadata(secretRef);
        if (
          secret === undefined ||
          secret.state !== "ACTIVE" ||
          secret.purpose !== "provider.openai.api-key" ||
          secret.scopeRef?.resourceKind !== "provider-profile" ||
          secret.scopeRef.resourceId !== providerProfileId
        ) {
          throw aiRuntimeProblem(
            "ai.secret_unavailable",
            "ProviderProfile SecretRef is not usable",
            "The attached SecretRef must be an active scoped OpenAI API key",
            "conflict",
            "after-change",
          );
        }
      }
      if (input.enabled && input.secretRefs.length !== 1) {
        throw aiRuntimeProblem(
          "ai.secret_unavailable",
          "Enabled ProviderProfile has no API key",
          "An enabled OpenAI ProviderProfile requires exactly one scoped SecretRef",
          "conflict",
          "after-change",
        );
      }
      const profile: ProviderProfile = Object.freeze({
        schemaVersion: 1,
        providerProfileId,
        providerKind: "openai",
        configurationRevisionRef,
        secretRefs: Object.freeze([...input.secretRefs]),
        networkAccessProfileRef: OPENAI_NETWORK_ACCESS_PROFILE_ID,
        enabled: input.enabled,
        providerSettings: Object.freeze({ api: "responses", store: false }),
      });
      const existing = await readProvider(providerProfileId);
      if (existing !== undefined)
        assertExpected(profileDigest(existing), expectedDigest, "ProviderProfile");
      const lineage = currentActivity(options);
      await options.persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          await executeRepositorySql(
            transaction,
            'INSERT INTO "heptalogos"."provider_profile" (' +
              "provider_profile_id, configuration_revision_ref, secret_refs, " +
              "network_access_profile_ref, enabled, provider_settings, lineage_context_ref) " +
              "VALUES ($1, $2, $3, $4, $5, $6, $7) " +
              "ON CONFLICT (provider_profile_id) DO UPDATE SET " +
              "configuration_revision_ref = EXCLUDED.configuration_revision_ref, " +
              "secret_refs = EXCLUDED.secret_refs, " +
              "network_access_profile_ref = EXCLUDED.network_access_profile_ref, " +
              "enabled = EXCLUDED.enabled, provider_settings = EXCLUDED.provider_settings, " +
              "lineage_context_ref = EXCLUDED.lineage_context_ref",
            [
              providerProfileId,
              configurationRevisionRef,
              JSON.stringify(profile.secretRefs),
              OPENAI_NETWORK_ACCESS_PROFILE_ID,
              profile.enabled,
              JSON.stringify(profile.providerSettings),
              options.execution.createLineageContextRef(),
            ],
          );
          await options.evidence.recordRequired(context, {
            evidenceKind: "ai.provider-profile.changed",
            evidenceContractVersion: "ai-runtime.v1",
            objectRef: providerProfileId,
            retentionClass: "retained",
            sensitivity: "operational",
          });
        }),
      );
      void lineage;
      return profile;
    },
    async setModelProfile(input: SetModelProfileInput, expectedDigest) {
      const existingId = modelId(input.modelProfileId);
      const modelProfileId =
        existingId ?? (createUuidV7Id("ModelProfileId") as ModelProfileId);
      const providerProfileId = uuid(
        "ProviderProfileId",
        input.providerProfileId,
        "providerProfileId",
      ) as ProviderProfileId;
      if ((await readProvider(providerProfileId)) === undefined) {
        throw aiRuntimeProblem(
          "ai.provider_unavailable",
          "ProviderProfile was not found",
          "ModelProfile must reference an existing ProviderProfile",
          "conflict",
          "after-change",
        );
      }
      const configurationRevisionRef = configId(input.configurationRevisionRef);
      if (
        (await options.configuration.getRevision(configurationRevisionRef)) ===
        undefined
      ) {
        throw aiRuntimeProblem(
          "ai.provider_configuration_invalid",
          "Model configuration revision was not found",
          "ModelProfile must reference an existing ConfigurationRevision",
          "conflict",
          "after-change",
        );
      }
      assertInputText(input.providerModelIdentifier, "providerModelIdentifier", 256);
      const normalizedCapabilities = capabilities(input.consumedCapabilities);
      const existing = await readModel(modelProfileId);
      if (existing !== undefined)
        assertExpected(modelDigest(existing), expectedDigest, "ModelProfile");
      const profile: ModelProfile = Object.freeze({
        schemaVersion: 1,
        modelProfileId,
        providerProfileId,
        providerModelIdentifier: input.providerModelIdentifier,
        consumedCapabilities: normalizedCapabilities,
        generation: existing === undefined ? 1 : existing.generation + 1,
        configurationRevisionRef,
      });
      await options.persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          await executeRepositorySql(
            transaction,
            'INSERT INTO "heptalogos"."model_profile" (' +
              "model_profile_id, provider_profile_id, provider_model_identifier, " +
              "consumed_capabilities, generation, configuration_revision_ref, " +
              "lineage_context_ref) VALUES ($1, $2, $3, $4, $5, $6, $7) " +
              "ON CONFLICT (model_profile_id) DO UPDATE SET " +
              "provider_profile_id = EXCLUDED.provider_profile_id, " +
              "provider_model_identifier = EXCLUDED.provider_model_identifier, " +
              "consumed_capabilities = EXCLUDED.consumed_capabilities, " +
              "generation = EXCLUDED.generation, " +
              "configuration_revision_ref = EXCLUDED.configuration_revision_ref, " +
              "lineage_context_ref = EXCLUDED.lineage_context_ref",
            [
              modelProfileId,
              providerProfileId,
              profile.providerModelIdentifier,
              JSON.stringify(profile.consumedCapabilities),
              profile.generation,
              configurationRevisionRef,
              options.execution.createLineageContextRef(),
            ],
          );
          await options.evidence.recordRequired(context, {
            evidenceKind: "ai.model-profile.changed",
            evidenceContractVersion: "ai-runtime.v1",
            objectRef: modelProfileId,
            retentionClass: "retained",
            sensitivity: "operational",
          });
        }),
      );
      return profile;
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
      const existing = await readBinding(input.role);
      if (existing !== undefined)
        assertExpected(bindingDigest(existing), expectedDigest, "ModelBinding");
      const binding: ModelBinding = Object.freeze({
        schemaVersion: 1,
        modelBindingId:
          existing?.modelBindingId ??
          (createUuidV7Id("ModelBindingId") as ModelBindingId),
        role: input.role,
        modelProfileId,
        revision: existing === undefined ? 1 : existing.revision + 1,
        enabled: true,
      });
      await options.persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          await executeRepositorySql(
            transaction,
            'INSERT INTO "heptalogos"."model_binding" (' +
              "model_binding_id, role, model_profile_id, revision, enabled, " +
              "lineage_context_ref) VALUES ($1, $2, $3, $4, $5, $6) " +
              "ON CONFLICT (role) DO UPDATE SET " +
              "model_binding_id = EXCLUDED.model_binding_id, " +
              "model_profile_id = EXCLUDED.model_profile_id, " +
              "revision = EXCLUDED.revision, enabled = EXCLUDED.enabled, " +
              "lineage_context_ref = EXCLUDED.lineage_context_ref",
            [
              binding.modelBindingId,
              binding.role,
              binding.modelProfileId,
              binding.revision,
              binding.enabled,
              options.execution.createLineageContextRef(),
            ],
          );
          await options.evidence.recordRequired(context, {
            evidenceKind: "ai.model-binding.changed",
            evidenceContractVersion: "ai-runtime.v1",
            objectRef: binding.modelBindingId,
            retentionClass: "retained",
            sensitivity: "operational",
          });
        }),
      );
      return binding;
    },
    async getReadiness() {
      const blockers: string[] = [];
      const providers = (await service.listProviderProfiles()).filter(
        (profile) => profile.enabled,
      );
      if (providers.length === 0) blockers.push("provider-profile");
      if (providers.length > 1) blockers.push("provider-profile.ambiguous");
      const provider = providers[0];
      if (provider !== undefined) {
        const activeConfig = await options.configuration.getEffectiveRevision(
          PROVIDER_TRANSPORT_DEFINITION_ID,
          installationScope(options),
        );
        if (
          activeConfig === undefined ||
          activeConfig.revisionId !== provider.configurationRevisionRef
        ) {
          blockers.push("configuration");
        }
        if (provider.secretRefs.length !== 1) {
          blockers.push("secret");
        } else {
          const secret = await options.secret.getMetadata(provider.secretRefs[0]);
          if (secret?.state !== "ACTIVE") blockers.push("secret");
          else {
            try {
              const material = await options.secret.resolve(provider.secretRefs[0], {
                consumer: "system.ai-runtime",
                purpose: "provider.openai.api-key",
                resourceRef: providerScope(provider.providerProfileId),
              });
              material.bytes.fill(0);
            } catch {
              blockers.push("secret");
            }
          }
        }
        const network = await options.networkAccess.getDiagnostics();
        if (!network.configured) blockers.push("network");
        const models = (await service.listModelProfiles()).filter(
          (model) => model.providerProfileId === provider.providerProfileId,
        );
        const bindings = await service.listModelBindings();
        for (const role of ["subject.primary", "subject.expression"] as const) {
          const binding = bindings.find((item) => item.role === role);
          const model =
            binding === undefined
              ? undefined
              : models.find((item) => item.modelProfileId === binding.modelProfileId);
          if (
            binding === undefined ||
            !binding.enabled ||
            model === undefined ||
            model.configurationRevisionRef !== provider.configurationRevisionRef
          ) {
            blockers.push("binding." + role);
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
      const provider = await readProvider(model.providerProfileId);
      if (provider === undefined || !provider.enabled) {
        throw aiRuntimeProblem(
          "ai.provider_unavailable",
          "ProviderProfile is unavailable",
          "The current ModelProfile does not resolve to an enabled provider",
          "unavailable",
          "after-change",
        );
      }
      const activeConfig = await options.configuration.getEffectiveRevision(
        PROVIDER_TRANSPORT_DEFINITION_ID,
        installationScope(options),
      );
      if (
        activeConfig === undefined ||
        activeConfig.revisionId !== provider.configurationRevisionRef ||
        activeConfig.revisionId !== model.configurationRevisionRef
      ) {
        throw aiRuntimeProblem(
          "ai.provider_configuration_invalid",
          "Provider configuration is stale",
          "The invocation does not reference the current active transport revision",
          "conflict",
          "after-change",
        );
      }
      if (provider.secretRefs.length !== 1) {
        throw aiRuntimeProblem(
          "ai.secret_unavailable",
          "Provider SecretRef is unavailable",
          "The enabled provider has no exact scoped API key",
          "unavailable",
          "after-change",
        );
      }
      let material;
      try {
        material = await options.secret.resolve(provider.secretRefs[0], {
          consumer: "system.ai-runtime",
          purpose: "provider.openai.api-key",
          resourceRef: providerScope(provider.providerProfileId),
        });
      } catch {
        throw aiRuntimeProblem(
          "ai.secret_unavailable",
          "Provider SecretRef is unavailable",
          "The current scoped API key could not be resolved",
          "unavailable",
          "after-change",
        );
      }
      let apiKey: string;
      try {
        apiKey = new TextDecoder("utf-8", { fatal: true }).decode(material.bytes);
      } catch {
        material.bytes.fill(0);
        throw aiRuntimeProblem(
          "ai.secret_unavailable",
          "Provider SecretRef is invalid",
          "The current API key material is not valid UTF-8",
          "integrity",
        );
      }
      material.bytes.fill(0);
      if (apiKey.length === 0) {
        throw aiRuntimeProblem(
          "ai.secret_unavailable",
          "Provider SecretRef is empty",
          "The current API key material is empty",
          "integrity",
        );
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
        const openai = createOpenAI({
          apiKey,
          fetch: options.networkAccess.createProviderFetch("system.ai-runtime"),
        });
        const output = Output.object({
          schema: jsonSchema<Record<string, unknown>>(
            spec.outputSchema as Record<string, unknown>,
          ),
        });
        const generated = await generateText({
          model: openai.responses(model.providerModelIdentifier),
          messages: modelMessages(spec.messages),
          output,
          maxOutputTokens: spec.budget.maxOutputTokens,
          maxRetries: 0,
          abortSignal: controller.signal,
          ...(remainingMs === undefined ? {} : { timeout: remainingMs }),
          providerOptions: { openai: { store: false } },
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
              factRef: provider.providerProfileId,
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
          providerProfileId: provider.providerProfileId,
          modelProfileId: model.modelProfileId,
          providerModelIdentifier: model.providerModelIdentifier,
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
            "The provider invocation exceeded its effective deadline",
            "unavailable",
            "after-change",
          );
        }
        throw aiRuntimeProblem(
          "ai.provider_unavailable",
          "OpenAI provider invocation failed",
          "The selected OpenAI Responses invocation did not complete",
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
