/**
 * Projects the canonical Management service to the bounded Fastify
 * surface. Route schemas come only from @heptalogos/management.
 * @module http
 */

import fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import {
  MANAGEMENT_API_BASE_PATH,
  MANAGEMENT_CONTRACT_VERSION,
  MANAGEMENT_DISCOVERY_PATH,
  claimRequestSchema,
  claimResponseSchema,
  capabilityGraphSchema,
  hostReadModelSchema,
  loginRequestSchema,
  loginResponseSchema,
  managementDiscoverySchema,
  managementProblemSchema,
  readinessSchema,
  runtimeGraphSchema,
  systemStatusSchema,
  type ClaimRequest,
  type LoginRequest,
  type ManagementProblemDetails,
  type ManagementService,
} from "@heptalogos/management";
import {
  contractUnsupportedProblem,
  invalidInputProblem,
  managementHttpStatus,
  managementProblem,
  toManagementProblemDetails,
} from "@heptalogos/management";

/** Creates a canonical Problem response for the adopted rate-limit plugin. */
function rateLimitResponse(): ManagementProblemDetails {
  return toManagementProblemDetails(
    managementProblem(
      "management.rate_limited",
      "Management request rate limit exceeded",
      "The Management authentication admission limit was exceeded",
      "conflict",
      "after-change",
    ),
  );
}

function tokenFromRequest(request: FastifyRequest): string {
  const authorization = request.headers.authorization;
  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ") ||
    authorization.length <= "Bearer ".length
  ) {
    throw managementProblem(
      "management.session_invalid",
      "Management session is invalid",
      "A Bearer session token is required",
      "conflict",
    );
  }
  return authorization.slice("Bearer ".length);
}

function assertContractHeader(request: FastifyRequest): void {
  const version = request.headers["x-heptalogos-contract-version"];
  if (
    version !== undefined &&
    (Array.isArray(version) || version !== MANAGEMENT_CONTRACT_VERSION)
  ) {
    throw contractUnsupportedProblem();
  }
}

async function authenticate(
  service: ManagementService,
  request: FastifyRequest,
): Promise<void> {
  assertContractHeader(request);
  await service.authenticate(tokenFromRequest(request));
}

/** Supplies Product Host-local publication cleanup for successful claim use. */
export interface ManagementHttpOptions {
  readonly onAdministratorClaimed?: () => Promise<void>;
}

/** Creates the Management HTTP app without starting its listener. */
export async function createManagementHttpApp(
  service: ManagementService,
  options: ManagementHttpOptions = {},
): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
    trustProxy: false,
    bodyLimit: 64 * 1024,
    exposeHeadRoutes: false,
    return503OnClosing: true,
  });

  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Heptalogos Management API",
        version: MANAGEMENT_CONTRACT_VERSION,
      },
      servers: [{ url: "http://127.0.0.1" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "opaque",
          },
        },
      },
    },
    hideUntagged: false,
    exposeHeadRoutes: false,
  });
  await app.register(rateLimit, { global: false });

  app.setErrorHandler((error, request, reply) => {
    const errorRecord =
      typeof error === "object" && error !== null
        ? (error as Record<string, unknown>)
        : undefined;
    const validation = errorRecord?.validation !== undefined;
    const statusCode =
      typeof errorRecord?.statusCode === "number" ? errorRecord.statusCode : undefined;
    const rateLimited =
      statusCode === 429 || errorRecord?.problemCode === "management.rate_limited";
    const projected = validation
      ? toManagementProblemDetails(invalidInputProblem(), request.url)
      : rateLimited
        ? rateLimitResponse()
        : toManagementProblemDetails(error, request.url);
    void reply
      .code(
        typeof projected.status === "number"
          ? projected.status
          : (statusCode ?? managementHttpStatus("management.internal")),
      )
      .type("application/problem+json")
      .send(projected);
  });

  app.get(
    MANAGEMENT_DISCOVERY_PATH,
    {
      schema: {
        operationId: "getManagementDiscovery",
        summary: "Discover the current Management contract",
        response: { 200: managementDiscoverySchema },
      },
    },
    async () => service.getDiscovery(),
  );

  app.post(
    MANAGEMENT_API_BASE_PATH + "/bootstrap/claim",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60_000,
          errorResponseBuilder: () => rateLimitResponse(),
        },
      },
      schema: {
        operationId: "claimFirstAdministrator",
        summary: "Claim the first Administrator",
        body: claimRequestSchema,
        response: {
          201: claimResponseSchema,
          400: managementProblemSchema,
          409: managementProblemSchema,
          429: managementProblemSchema,
          426: managementProblemSchema,
          503: managementProblemSchema,
        },
      },
    },
    async (request, reply) => {
      assertContractHeader(request);
      const body = request.body as ClaimRequest;
      const result = await service.claimFirstAdministrator(
        body.claimId,
        body.claimSecret,
        body.password,
      );
      if (options.onAdministratorClaimed !== undefined) {
        await options.onAdministratorClaimed().catch(() => undefined);
      }
      return reply.code(201).send(result);
    },
  );

  app.post(
    MANAGEMENT_API_BASE_PATH + "/session",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60_000,
          errorResponseBuilder: () => rateLimitResponse(),
        },
      },
      schema: {
        operationId: "createManagementSession",
        summary: "Create a Management session",
        body: loginRequestSchema,
        response: {
          200: loginResponseSchema,
          401: managementProblemSchema,
          429: managementProblemSchema,
          426: managementProblemSchema,
          503: managementProblemSchema,
        },
      },
    },
    async (request) => {
      assertContractHeader(request);
      const body = request.body as LoginRequest;
      return service.login(body.password);
    },
  );

  app.delete(
    MANAGEMENT_API_BASE_PATH + "/session/current",
    {
      schema: {
        operationId: "revokeCurrentManagementSession",
        summary: "Revoke the current Management session",
        response: {
          204: { type: "null" },
          401: managementProblemSchema,
          426: managementProblemSchema,
          503: managementProblemSchema,
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      assertContractHeader(request);
      await service.logout(tokenFromRequest(request));
      return reply.code(204).send();
    },
  );

  app.get(
    MANAGEMENT_API_BASE_PATH + "/system/status",
    {
      schema: {
        operationId: "getSystemStatus",
        response: {
          200: systemStatusSchema,
          401: managementProblemSchema,
          426: managementProblemSchema,
          503: managementProblemSchema,
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => authenticate(service, request),
    },
    async () => service.getSystemStatus(),
  );

  app.get(
    MANAGEMENT_API_BASE_PATH + "/host",
    {
      schema: {
        operationId: "getHost",
        response: {
          200: hostReadModelSchema,
          401: managementProblemSchema,
          426: managementProblemSchema,
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => authenticate(service, request),
    },
    async () => service.getHost(),
  );

  app.get(
    MANAGEMENT_API_BASE_PATH + "/runtime/graph",
    {
      schema: {
        operationId: "getRuntimeGraph",
        response: {
          200: runtimeGraphSchema,
          401: managementProblemSchema,
          426: managementProblemSchema,
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => authenticate(service, request),
    },
    async () => service.getRuntimeGraph(),
  );

  app.get(
    MANAGEMENT_API_BASE_PATH + "/capabilities",
    {
      schema: {
        operationId: "getCapabilityGraph",
        response: {
          200: capabilityGraphSchema,
          401: managementProblemSchema,
          426: managementProblemSchema,
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => authenticate(service, request),
    },
    async () => service.getCapabilityGraph(),
  );

  app.get(
    MANAGEMENT_API_BASE_PATH + "/readiness",
    {
      schema: {
        operationId: "getReadiness",
        response: {
          200: readinessSchema,
          401: managementProblemSchema,
          426: managementProblemSchema,
          503: managementProblemSchema,
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => authenticate(service, request),
    },
    async () => service.getReadiness(),
  );

  return app;
}
