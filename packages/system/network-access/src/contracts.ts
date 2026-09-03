/**
 * Defines the current outbound NetworkAccess profile, request/response
 * knowledge, and provider custom-fetch boundary.
 * @module contracts
 */

import type { Branded, Instant } from "@heptalogos/foundation-contracts";
import type {
  ExecutionContextRuntime,
  LineageContextRef,
} from "@heptalogos/execution-lineage";
import type { ConfigurationService } from "@heptalogos/configuration";
import { Type } from "@heptalogos/schema-runtime/typebox";

/** Identifies a stable NetworkAccess profile. */
export type NetworkAccessProfileId = Branded<string, "NetworkAccessProfileId">;

/** The current OpenAI NetworkAccess profile identity. */
export const OPENAI_NETWORK_ACCESS_PROFILE_ID =
  "network-access.openai-api.v1" as NetworkAccessProfileId;

/** Describes one admitted outbound network profile. */
export interface NetworkAccessProfile {
  readonly schemaVersion: 1;
  readonly profileId: NetworkAccessProfileId;
  readonly origin: "https://api.openai.com";
  readonly path: "/v1/**";
  readonly method: "POST";
  readonly redirects: "DENY";
}

/** Redacted NetworkAccess diagnostics safe for Management projection. */
export interface NetworkAccessDiagnostics {
  readonly schemaVersion: 1;
  readonly profile: NetworkAccessProfile;
  readonly configured: boolean;
  readonly timeoutMs?: number;
  readonly requestBodyBudgetBytes?: number;
  readonly responseBodyBudgetBytes?: number;
  readonly expandedResponseBodyBudgetBytes?: number;
  readonly blocker?: "configuration";
}

/** Bounded transport result retained only for the current invocation. */
export interface NetworkResponseKnowledge {
  readonly statusCode: number;
  readonly finalDestination: URL;
  readonly headers: readonly { readonly name: string; readonly value: string }[];
  readonly body: Uint8Array;
  readonly bytesRead: number;
  readonly expandedBytesRead: number;
  readonly lineageContextRef: LineageContextRef;
}

/** Options binding NetworkAccess to Configuration and Lineage. */
export interface NetworkAccessServiceOptions {
  readonly configuration: ConfigurationService;
  readonly execution: ExecutionContextRuntime;
  readonly installationId: string;
  readonly transport?: typeof fetch;
}

/** Current controlled outbound transport service. */
export interface NetworkAccessService {
  /** The fixed current OpenAI transport profile. */
  readonly profile: NetworkAccessProfile;
  /** Returns redacted transport diagnostics. */
  getDiagnostics(): Promise<NetworkAccessDiagnostics>;
  /** Performs one bounded, policy-checked outbound request. */
  request(
    requester: string,
    input: Parameters<typeof fetch>[0] | URL,
    init?: RequestInit,
    deadline?: Instant,
  ): Promise<NetworkResponseKnowledge>;
  /** Creates the policy-enforcing fetch passed to the provider SDK. */
  createProviderFetch(requester: string): typeof fetch;
}

/** JSON Schema for the current NetworkAccess profile. */
export const networkAccessProfileSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    profileId: Type.Literal(OPENAI_NETWORK_ACCESS_PROFILE_ID),
    origin: Type.Literal("https://api.openai.com"),
    path: Type.Literal("/v1/**"),
    method: Type.Literal("POST"),
    redirects: Type.Literal("DENY"),
  },
  { additionalProperties: false },
);

/** JSON Schema for redacted NetworkAccess diagnostics. */
export const networkAccessDiagnosticsSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    profile: networkAccessProfileSchema,
    configured: Type.Boolean(),
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1 })),
    requestBodyBudgetBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    responseBodyBudgetBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    expandedResponseBodyBudgetBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    blocker: Type.Optional(Type.Literal("configuration")),
  },
  { additionalProperties: false },
);
