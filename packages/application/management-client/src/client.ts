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
import { createClient, type Client } from "./generated/client/index.js";
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
  readonly transport: Client;
  /** Reads the live Management discovery descriptor. */
  getDiscovery(): Promise<GetManagementDiscoveryResponses[200]>;
  /** Claims the first Administrator using the published claim material. */
  claimFirstAdministrator(
    body: ClaimFirstAdministratorData["body"],
  ): Promise<ClaimFirstAdministratorResponses[201]>;
  /** Creates an opaque Administrator session. */
  login(
    body: CreateManagementSessionData["body"],
  ): Promise<CreateManagementSessionResponses[200]>;
  /** Revokes the current opaque Administrator session. */
  logout(): Promise<RevokeCurrentManagementSessionResponses[204]>;
  /** Reads aggregate system status. */
  getSystemStatus(): Promise<GetSystemStatusResponses[200]>;
  /** Reads the current Host projection. */
  getHost(): Promise<GetHostResponses[200]>;
  /** Reads the current Runtime graph projection. */
  getRuntimeGraph(): Promise<GetRuntimeGraphResponses[200]>;
  /** Reads the current Capability graph projection. */
  getCapabilityGraph(): Promise<GetCapabilityGraphResponses[200]>;
  /** Reads current Product Host readiness. */
  getReadiness(): Promise<GetReadinessResponses[200]>;
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
    transport,
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
