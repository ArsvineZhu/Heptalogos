/**
 * Defines the current outbound NetworkAccess policy, gateway target
 * authorization, request/response knowledge, and AI custom-fetch boundary.
 * @module contracts
 */

import type { Instant } from "@heptalogos/foundation-contracts";
import type {
  ConfigurationRevisionId,
  ConfigurationService,
} from "@heptalogos/configuration";
import type {
  ExecutionContextRuntime,
  LineageContextRef,
} from "@heptalogos/execution-lineage";
import { Type } from "@heptalogos/schema-runtime/typebox";

/** The current AI invocation protocols understood by NetworkAccess routing. */
export type GatewayNetworkProtocol = "openai-chat" | "openai-responses";

/** Identifies the exact gateway destination authorized for one invocation. */
export interface GatewayNetworkTarget {
  readonly schemaVersion: 1;
  readonly gatewayProfileId: string;
  readonly baseUrl: string;
  readonly protocol: GatewayNetworkProtocol;
}

/** Describes the fixed transport rules applied to every gateway target. */
export interface NetworkAccessPolicy {
  readonly schemaVersion: 1;
  readonly method: "POST";
  readonly redirects: "DENY";
}

/** Redacted NetworkAccess diagnostics safe for Management projection. */
export interface NetworkAccessDiagnostics {
  readonly schemaVersion: 1;
  readonly policy: NetworkAccessPolicy;
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
  /** Returns redacted transport diagnostics. */
  getDiagnostics(): Promise<NetworkAccessDiagnostics>;
  /** Validates that a selected GatewayProfile/protocol has a permitted route. */
  authorizeGatewayTarget(target: GatewayNetworkTarget): void;
  /** Performs one bounded, policy-checked outbound request. */
  request(
    requester: string,
    target: GatewayNetworkTarget,
    expectedConfigurationRevisionId: ConfigurationRevisionId,
    input: Parameters<typeof fetch>[0] | URL,
    init?: RequestInit,
    deadline?: Instant,
  ): Promise<NetworkResponseKnowledge>;
  /** Creates the policy-enforcing fetch passed to one AI SDK protocol adapter. */
  createProviderFetch(
    requester: string,
    target: GatewayNetworkTarget,
    expectedConfigurationRevisionId: ConfigurationRevisionId,
  ): typeof fetch;
}

/** JSON Schema for the fixed NetworkAccess policy. */
export const networkAccessPolicySchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    method: Type.Literal("POST"),
    redirects: Type.Literal("DENY"),
  },
  { additionalProperties: false },
);

/** JSON Schema for redacted NetworkAccess diagnostics. */
export const networkAccessDiagnosticsSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    policy: networkAccessPolicySchema,
    configured: Type.Boolean(),
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1 })),
    requestBodyBudgetBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    responseBodyBudgetBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    expandedResponseBodyBudgetBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    blocker: Type.Optional(Type.Literal("configuration")),
  },
  { additionalProperties: false },
);
