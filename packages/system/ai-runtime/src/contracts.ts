/**
 * Defines the current OpenAI Product AI runtime contracts, persistent profile
 * shapes, exact Subject bindings, and structured invocation boundary.
 * @module contracts
 */

import type {
  ActivityId,
  CanonicalJsonValue,
  Instant,
  UuidV7Id,
} from "@heptalogos/foundation-contracts";
import type {
  ExecutionContextRuntime,
  LineageContextRef,
} from "@heptalogos/execution-lineage";
import type { EvidenceService } from "@heptalogos/evidence";
import type {
  ConfigurationRevisionId,
  ConfigurationService,
} from "@heptalogos/configuration";
import type {
  NetworkAccessProfileId,
  NetworkAccessService,
} from "@heptalogos/network-access";
import type { PersistenceService } from "@heptalogos/persistence";
import type { SecretRef, SecretService } from "@heptalogos/secret";
import type { TimeService } from "@heptalogos/time-service";
import { Type } from "@heptalogos/schema-runtime/typebox";

/** Identifies one persisted ProviderProfile. */
export type ProviderProfileId = UuidV7Id<"ProviderProfileId">;
/** Identifies one persisted ModelProfile. */
export type ModelProfileId = UuidV7Id<"ModelProfileId">;
/** Identifies one persisted ModelBinding. */
export type ModelBindingId = UuidV7Id<"ModelBindingId">;
/** Identifies one process-local invocation. */
export type InvocationId = UuidV7Id<"InvocationId">;

/** The exact capability set used by the current Subject provider route. */
export type ModelCapability =
  "text-generation" | "structured-output" | "usage-metadata" | "abort-timeout";

/** The exact current model capability set in stable order. */
export const CURRENT_MODEL_CAPABILITIES: readonly ModelCapability[] = Object.freeze([
  "text-generation",
  "structured-output",
  "usage-metadata",
  "abort-timeout",
]);

/** The fixed OpenAI provider settings owned by AIRuntime. */
export interface OpenAIProviderSettings {
  readonly api: "responses";
  readonly store: false;
}

/** Persistent OpenAI provider configuration. */
export interface ProviderProfile {
  readonly schemaVersion: 1;
  readonly providerProfileId: ProviderProfileId;
  readonly providerKind: "openai";
  readonly configurationRevisionRef: ConfigurationRevisionId;
  readonly secretRefs: readonly SecretRef[];
  readonly networkAccessProfileRef: NetworkAccessProfileId;
  readonly enabled: boolean;
  readonly providerSettings: OpenAIProviderSettings;
}

/** Persistent provider model configuration and replacement generation. */
export interface ModelProfile {
  readonly schemaVersion: 1;
  readonly modelProfileId: ModelProfileId;
  readonly providerProfileId: ProviderProfileId;
  readonly providerModelIdentifier: string;
  readonly consumedCapabilities: readonly ModelCapability[];
  readonly generation: number;
  readonly configurationRevisionRef: ConfigurationRevisionId;
}

/** Persistent exact Subject model binding and its revision. */
export interface ModelBinding {
  readonly schemaVersion: 1;
  readonly modelBindingId: ModelBindingId;
  readonly role: "subject.primary" | "subject.expression";
  readonly modelProfileId: ModelProfileId;
  readonly revision: number;
  readonly enabled: boolean;
}

/** Provider-neutral ephemeral message accepted by AIRuntime. */
export type AIRuntimeMessage =
  | { readonly role: "system"; readonly text: string }
  | { readonly role: "user"; readonly text: string }
  | { readonly role: "assistant"; readonly text: string };

/** The only current invocation budget. */
export interface InvocationBudget {
  readonly maxOutputTokens: number;
}

/** One exact, provider-neutral structured invocation request. */
export interface InvocationSpec {
  readonly schemaVersion: 1;
  readonly invocationId: InvocationId;
  readonly ownerActivityRef: ActivityId;
  readonly modelBindingId: ModelBindingId;
  readonly expectedBindingRevision: number;
  readonly contextProjection: CanonicalJsonValue;
  readonly messages: readonly AIRuntimeMessage[];
  readonly objective: string;
  readonly outputSchema: CanonicalJsonValue;
  readonly budget: InvocationBudget;
  readonly deadline?: Instant;
  readonly lineageContextRef: LineageContextRef;
}

/** Narrow usage metadata retained from the selected AI SDK result. */
export interface UsageMetadata {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}

/** One structured provider result before a consuming owner commits it. */
export interface GenerationResult {
  readonly schemaVersion: 1;
  readonly invocationId: InvocationId;
  readonly bindingRevision: number;
  readonly providerProfileId: ProviderProfileId;
  readonly modelProfileId: ModelProfileId;
  readonly providerModelIdentifier: string;
  readonly candidate: CanonicalJsonValue;
  readonly usage?: UsageMetadata;
  readonly lineageContextRef: LineageContextRef;
  readonly evidenceRefs: readonly { readonly evidenceId: string }[];
}

/** Read-only reasoned provider readiness projection. */
export interface AIRuntimeReadiness {
  readonly schemaVersion: 1;
  readonly state: "READY" | "BLOCKED";
  readonly blockers: readonly string[];
}

/** Input to the current ProviderProfile action. */
export interface SetProviderProfileInput {
  readonly providerProfileId?: ProviderProfileId | string;
  readonly providerKind: "openai";
  readonly configurationRevisionRef: ConfigurationRevisionId | string;
  readonly secretRefs: readonly SecretRef[];
  readonly enabled: boolean;
}

/** Input to the current ModelProfile action. */
export interface SetModelProfileInput {
  readonly modelProfileId?: ModelProfileId | string;
  readonly providerProfileId: ProviderProfileId | string;
  readonly providerModelIdentifier: string;
  readonly consumedCapabilities: readonly ModelCapability[];
  readonly configurationRevisionRef: ConfigurationRevisionId | string;
}

/** Input to the current ModelBinding action. */
export interface SetModelBindingInput {
  readonly role: "subject.primary" | "subject.expression";
  readonly modelProfileId: ModelProfileId | string;
}

/** Options binding AIRuntime to current semantic owners. */
export interface AIRuntimeServiceOptions {
  readonly persistence: PersistenceService;
  readonly time: TimeService;
  readonly execution: ExecutionContextRuntime;
  readonly evidence: EvidenceService;
  readonly configuration: ConfigurationService;
  readonly secret: SecretService;
  readonly networkAccess: NetworkAccessService;
}

/** Current AIRuntime semantic service. */
export interface AIRuntimeService {
  /** Lists persisted provider profiles. */
  listProviderProfiles(): Promise<readonly ProviderProfile[]>;
  /** Lists persisted model profiles. */
  listModelProfiles(): Promise<readonly ModelProfile[]>;
  /** Lists the exact current model bindings. */
  listModelBindings(): Promise<readonly ModelBinding[]>;
  /** Reads one provider profile. */
  getProviderProfile(
    id: ProviderProfileId | string,
  ): Promise<ProviderProfile | undefined>;
  /** Reads one model profile. */
  getModelProfile(id: ModelProfileId | string): Promise<ModelProfile | undefined>;
  /** Reads one binding by role or identifier. */
  getModelBinding(roleOrId: ModelBindingId | string): Promise<ModelBinding | undefined>;
  /** Creates or replaces one OpenAI provider profile. */
  setProviderProfile(
    input: SetProviderProfileInput,
    expectedDigest?: string,
  ): Promise<ProviderProfile>;
  /** Creates or replaces one model profile. */
  setModelProfile(
    input: SetModelProfileInput,
    expectedDigest?: string,
  ): Promise<ModelProfile>;
  /** Creates or replaces one exact Subject binding. */
  setModelBinding(
    input: SetModelBindingInput,
    expectedDigest?: string,
  ): Promise<ModelBinding>;
  /** Reports whether the current binding route is invokable. */
  getReadiness(): Promise<AIRuntimeReadiness>;
  /** Invokes one ephemeral structured generation. */
  invoke(spec: InvocationSpec): Promise<GenerationResult>;
}

const capabilitySchema = Type.Union([
  Type.Literal("text-generation"),
  Type.Literal("structured-output"),
  Type.Literal("usage-metadata"),
  Type.Literal("abort-timeout"),
]);
const secretRefsSchema = Type.Array(
  Type.Object(
    {
      schemaVersion: Type.Literal(1),
      secretId: Type.String({ minLength: 1 }),
    },
    { additionalProperties: false },
  ),
  { maxItems: 1 },
);

/** JSON Schema for ProviderProfile reads and action input. */
export const providerProfileSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    providerProfileId: Type.String({ minLength: 1 }),
    providerKind: Type.Literal("openai"),
    configurationRevisionRef: Type.String({ minLength: 1 }),
    secretRefs: secretRefsSchema,
    networkAccessProfileRef: Type.Literal("network-access.openai-api.v1"),
    enabled: Type.Boolean(),
    providerSettings: Type.Object(
      {
        api: Type.Literal("responses"),
        store: Type.Literal(false),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

/** JSON Schema for ProviderProfile action input. */
export const providerProfileSetInputSchema = Type.Object(
  {
    providerProfileId: Type.Optional(Type.String({ minLength: 1 })),
    providerKind: Type.Literal("openai"),
    configurationRevisionRef: Type.String({ minLength: 1 }),
    secretRefs: secretRefsSchema,
    enabled: Type.Boolean(),
  },
  { additionalProperties: false },
);

/** JSON Schema for ModelProfile reads. */
export const modelProfileSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    modelProfileId: Type.String({ minLength: 1 }),
    providerProfileId: Type.String({ minLength: 1 }),
    providerModelIdentifier: Type.String({ minLength: 1, maxLength: 256 }),
    consumedCapabilities: Type.Array(capabilitySchema, { minItems: 1, maxItems: 4 }),
    generation: Type.Integer({ minimum: 1 }),
    configurationRevisionRef: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

/** JSON Schema for ModelProfile action input. */
export const modelProfileSetInputSchema = Type.Object(
  {
    modelProfileId: Type.Optional(Type.String({ minLength: 1 })),
    providerProfileId: Type.String({ minLength: 1 }),
    providerModelIdentifier: Type.String({ minLength: 1, maxLength: 256 }),
    consumedCapabilities: Type.Array(capabilitySchema, {
      minItems: 1,
      maxItems: 4,
    }),
    configurationRevisionRef: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

/** JSON Schema for ModelBinding reads. */
export const modelBindingSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    modelBindingId: Type.String({ minLength: 1 }),
    role: Type.Union([
      Type.Literal("subject.primary"),
      Type.Literal("subject.expression"),
    ]),
    modelProfileId: Type.String({ minLength: 1 }),
    revision: Type.Integer({ minimum: 1 }),
    enabled: Type.Boolean(),
  },
  { additionalProperties: false },
);

/** JSON Schema for ModelBinding action input. */
export const modelBindingSetInputSchema = Type.Object(
  {
    role: Type.Union([
      Type.Literal("subject.primary"),
      Type.Literal("subject.expression"),
    ]),
    modelProfileId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

/** JSON Schema for AIRuntime readiness. */
export const aiRuntimeReadinessSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    state: Type.Union([Type.Literal("READY"), Type.Literal("BLOCKED")]),
    blockers: Type.Array(Type.String()),
  },
  { additionalProperties: false },
);
