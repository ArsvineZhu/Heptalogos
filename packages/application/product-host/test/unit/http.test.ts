import { describe, expect, it } from "vitest";
import type { ManagementService } from "@heptalogos/management";
import { createManagementHttpApp } from "../../src/http.js";

function serviceFixture(): ManagementService {
  return {
    contractVersion: "management.v1" as const,
    getCompatibilityDescriptor: () => ({
      schemaVersion: 1 as const,
      instanceId: "instance",
      continuityEpochId: "epoch",
      productGeneration: "generation",
      coreContractVersion: "management.v1" as const,
      supportedClientContractRange: {
        kind: "exact" as const,
        version: "management.v1" as const,
      },
      problemSchemaVersion: 1 as const,
    }),
    getDiscovery: () => ({
      schemaVersion: 1 as const,
      installationId: "installation",
      compatibility: {
        schemaVersion: 1 as const,
        instanceId: "instance",
        continuityEpochId: "epoch",
        productGeneration: "generation",
        coreContractVersion: "management.v1" as const,
        supportedClientContractRange: {
          kind: "exact" as const,
          version: "management.v1" as const,
        },
        problemSchemaVersion: 1 as const,
      },
      apiBasePath: "/management/v1" as const,
    }),
    getSystemStatus: async () => ({}),
    getHost: () => ({}),
    getRuntimeGraph: () => ({}),
    getCapabilityGraph: () => ({}),
    getReadiness: async () => ({}),
    ensureFirstAdministratorClaim: async () => undefined,
    claimFirstAdministrator: async () => ({}),
    login: async () => ({}),
    authenticate: async () => ({}),
    logout: async () => undefined,
  } as unknown as ManagementService;
}

describe("Management HTTP adapter", () => {
  it("exposes discovery, rejects unauthenticated reads, and documents bearer auth", async () => {
    const app = await createManagementHttpApp(serviceFixture());
    const discovery = await app.inject({
      method: "GET",
      url: "/.well-known/heptalogos-management",
    });
    expect(discovery.statusCode).toBe(200);
    expect(discovery.json()).toMatchObject({ apiBasePath: "/management/v1" });
    const unauthorized = await app.inject({
      method: "GET",
      url: "/management/v1/host",
    });
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.headers["content-type"]).toContain("application/problem+json");
    const openapi = app.swagger() as unknown as {
      readonly openapi: string;
      readonly components?: { readonly securitySchemes?: Record<string, unknown> };
      readonly paths: Record<string, unknown>;
    };
    expect(openapi.openapi).toBe("3.1.0");
    expect(openapi.components?.securitySchemes).toHaveProperty("bearerAuth");
    expect(openapi.paths).toHaveProperty("/management/v1/runtime/graph");
    await app.close();
  });
});
