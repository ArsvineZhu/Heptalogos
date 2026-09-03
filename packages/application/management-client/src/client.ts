/**
 * Exposes the generated Management HTTP operations through a small, portable
 * client facade. The generated files remain the wire and response authority.
 * @module client
 */

import {
  claimFirstAdministrator,
  createManagementSession,
  getCapabilityGraph,
  getHost,
  getManagementDiscovery,
  getReadiness,
  getRuntimeGraph,
  getSystemStatus,
  revokeCurrentManagementSession,
} from "./generated/index.js";
import { createClient } from "./generated/client/index.js";
import type {
  ClaimFirstAdministratorData,
  ClaimFirstAdministratorErrors,
  ClaimFirstAdministratorResponses,
  CreateManagementSessionData,
  CreateManagementSessionResponses,
  GetCapabilityGraphResponses,
  GetHostResponses,
  GetManagementDiscoveryResponses,
  GetReadinessResponses,
  GetRuntimeGraphResponses,
  GetSystemStatusResponses,
  RevokeCurrentManagementSessionResponses,
} from "./generated/types.gen.js";

/** The redacted Problem envelope generated from the canonical error schema. */
export type ManagementProblemDetails = ClaimFirstAdministratorErrors[400];
/** Stable discovery result exposed by the facade. */
export type ManagementDiscoveryResult = GetManagementDiscoveryResponses[200];
/** Stable first-claim request input exposed by the facade. */
export type ClaimFirstAdministratorInput = ClaimFirstAdministratorData["body"];
/** Stable first-claim result exposed by the facade. */
export type ClaimFirstAdministratorResult = ClaimFirstAdministratorResponses[201];
/** Stable login request input exposed by the facade. */
export type ManagementLoginInput = CreateManagementSessionData["body"];
/** Stable login result exposed by the facade. */
export type ManagementLoginResult = CreateManagementSessionResponses[200];
/** Stable system status result exposed by the facade. */
export type SystemStatusResult = GetSystemStatusResponses[200];
/** Stable Host result exposed by the facade. */
export type HostReadModelResult = GetHostResponses[200];
/** Stable Runtime graph result exposed by the facade. */
export type RuntimeGraphResult = GetRuntimeGraphResponses[200];
/** Stable Capability graph result exposed by the facade. */
export type CapabilityGraphResult = GetCapabilityGraphResponses[200];
/** Stable readiness result exposed by the facade. */
export type ReadinessResult = GetReadinessResponses[200];

/** A transport or canonical Management failure surfaced by the client. */
export class ManagementClientError extends Error {
  readonly problem?: ManagementProblemDetails;
  readonly status?: number;

  /** Creates a redacted client error from a generated response failure. */
  constructor(error: unknown) {
    const problem = problemDetails(error);
    super(
      problem?.detail ??
        "The Management Host could not complete the requested operation",
    );
    this.name = "ManagementClientError";
    this.problem = problem;
    this.status = problem?.status;
  }
}

function problemDetails(value: unknown): ManagementProblemDetails | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  if (
    typeof record.type !== "string" ||
    typeof record.title !== "string" ||
    typeof record.status !== "number" ||
    typeof record.detail !== "string" ||
    typeof record.problemCode !== "string" ||
    typeof record.category !== "string" ||
    typeof record.retryClass !== "string" ||
    record.schemaVersion !== 1
  ) {
    return undefined;
  }
  return value as ManagementProblemDetails;
}

/** Options for one portable generated Management client instance. */
export interface ManagementClientOptions {
  readonly origin: string;
  readonly sessionToken?: string;
  readonly fetch?: typeof fetch;
}

/** Canonical generated-client operations used by CLI and later clients. */
export interface ManagementClient {
  /** Reads the live Management discovery descriptor. */
  getDiscovery(): Promise<ManagementDiscoveryResult>;
  /** Claims the first Administrator using the published claim material. */
  claimFirstAdministrator(
    body: ClaimFirstAdministratorInput,
  ): Promise<ClaimFirstAdministratorResult>;
  /** Creates an opaque Administrator session. */
  login(body: ManagementLoginInput): Promise<ManagementLoginResult>;
  /** Revokes the current opaque Administrator session. */
  logout(): Promise<RevokeCurrentManagementSessionResponses[204]>;
  /** Reads aggregate system status. */
  getSystemStatus(): Promise<SystemStatusResult>;
  /** Reads the current Host projection. */
  getHost(): Promise<HostReadModelResult>;
  /** Reads the current Runtime graph projection. */
  getRuntimeGraph(): Promise<RuntimeGraphResult>;
  /** Reads the current Capability graph projection. */
  getCapabilityGraph(): Promise<CapabilityGraphResult>;
  /** Reads current Product Host readiness. */
  getReadiness(): Promise<ReadinessResult>;
}

type ClientRequestResult<T> = Promise<T>;

async function request<T>(operation: () => ClientRequestResult<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ManagementClientError) throw error;
    throw new ManagementClientError(error);
  }
}

/** Creates a generated fetch client bound to one discovered loopback origin. */
export function createManagementClient(
  options: ManagementClientOptions,
): ManagementClient {
  const transport = createClient({
    baseUrl: options.origin,
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    ...(options.sessionToken === undefined ? {} : { auth: options.sessionToken }),
    headers: { "x-heptalogos-contract-version": "management.v1" },
  });
  return Object.freeze({
    getDiscovery() {
      return request(
        () =>
          getManagementDiscovery({
            client: transport,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<GetManagementDiscoveryResponses[200]>,
      );
    },
    claimFirstAdministrator(body: ClaimFirstAdministratorData["body"]) {
      return request(
        () =>
          claimFirstAdministrator({
            client: transport,
            body,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<ClaimFirstAdministratorResponses[201]>,
      );
    },
    login(body: CreateManagementSessionData["body"]) {
      return request(
        () =>
          createManagementSession({
            client: transport,
            body,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<CreateManagementSessionResponses[200]>,
      );
    },
    logout() {
      return request(
        () =>
          revokeCurrentManagementSession({
            client: transport,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<RevokeCurrentManagementSessionResponses[204]>,
      );
    },
    getSystemStatus() {
      return request(
        () =>
          getSystemStatus({
            client: transport,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<GetSystemStatusResponses[200]>,
      );
    },
    getHost() {
      return request(
        () =>
          getHost({
            client: transport,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<GetHostResponses[200]>,
      );
    },
    getRuntimeGraph() {
      return request(
        () =>
          getRuntimeGraph({
            client: transport,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<GetRuntimeGraphResponses[200]>,
      );
    },
    getCapabilityGraph() {
      return request(
        () =>
          getCapabilityGraph({
            client: transport,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<GetCapabilityGraphResponses[200]>,
      );
    },
    getReadiness() {
      return request(
        () =>
          getReadiness({
            client: transport,
            throwOnError: true,
            responseStyle: "data",
          }) as unknown as Promise<GetReadinessResponses[200]>,
      );
    },
  });
}
