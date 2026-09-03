import { describe, expect, it } from "vitest";
import {
  createContinuityEpochId,
  createInstanceId,
  createUuidV7Id,
} from "@heptalogos/foundation-contracts";
import { compileSchema } from "@heptalogos/schema-runtime";
import type { ConfigurationService } from "@heptalogos/configuration";
import type {
  ExecutionContextRuntime,
  LineageContextRef,
} from "@heptalogos/execution-lineage";
import {
  createNetworkAccessService,
  networkAccessDiagnosticsSchema,
  type NetworkAccessService,
} from "../../src/index.js";

const lineageContextRef: LineageContextRef = {
  schemaVersion: 1,
  sourceActivityId: createUuidV7Id("ActivityId"),
  sourceInstanceId: createInstanceId(),
  sourceContinuityEpochId: createContinuityEpochId(),
};

const configurationValue = {
  schemaVersion: 1 as const,
  timeoutMs: 60_000,
  requestBodyBudgetBytes: 60_000,
  responseBodyBudgetBytes: 1_048_576,
  expandedResponseBodyBudgetBytes: 4_194_304,
};

function serviceFixture(
  transport: typeof fetch = async () => new Response("{}"),
  value = configurationValue,
): NetworkAccessService {
  const configuration = {
    getEffectiveRevision: async () => ({ value }),
  } as unknown as ConfigurationService;
  const execution = {
    current: () => ({}) as never,
    createLineageContextRef: () => lineageContextRef,
  } as unknown as ExecutionContextRuntime;
  return createNetworkAccessService({
    configuration,
    execution,
    installationId: "01j00000000000000000000000",
    transport,
  });
}

describe("NetworkAccess current OpenAI profile", () => {
  it("admits the Responses destination and exposes bounded diagnostics", async () => {
    const service = serviceFixture();
    const response = await service.request(
      "system.ai-runtime",
      "https://api.openai.com/v1/responses",
      { method: "POST", body: "{}" },
    );
    expect(response.statusCode).toBe(200);
    expect(new TextDecoder().decode(response.body)).toBe("{}");
    expect(
      compileSchema(networkAccessDiagnosticsSchema).validate(
        await service.getDiagnostics(),
      ).ok,
    ).toBe(true);
  });

  it("denies wrong requester, origin, path, method, and cookies", async () => {
    const service = serviceFixture();
    await expect(
      service.request("other-service", "https://api.openai.com/v1/responses", {
        method: "POST",
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "network.unauthorized_requester" },
    });
    await expect(
      service.request("system.ai-runtime", "https://example.com/v1/responses", {
        method: "POST",
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "network.unauthorized_destination" },
    });
    await expect(
      service.request("system.ai-runtime", "https://api.openai.com/other", {
        method: "POST",
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "network.unauthorized_destination" },
    });
    await expect(
      service.request("system.ai-runtime", "https://api.openai.com/v1/responses", {
        method: "GET",
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "network.unauthorized_method" },
    });
    await expect(
      service.request("system.ai-runtime", "https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Cookie: "private" },
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "network.sensitive_header_denied" },
    });
  });

  it("denies redirects, enforces response budgets, and does not retry transport failure", async () => {
    const redirect = serviceFixture(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://example.com" },
        }),
    );
    await expect(
      redirect.request("system.ai-runtime", "https://api.openai.com/v1/responses", {
        method: "POST",
      }),
    ).rejects.toMatchObject({ problem: { problemCode: "network.redirect_denied" } });

    const budget = serviceFixture(
      async () => new Response("too-large", { status: 200 }),
      { ...configurationValue, responseBodyBudgetBytes: 1 },
    );
    await expect(
      budget.request("system.ai-runtime", "https://api.openai.com/v1/responses", {
        method: "POST",
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "network.response_budget_exceeded" },
    });

    let calls = 0;
    const unavailable = serviceFixture(async () => {
      calls += 1;
      throw new Error("transport failed");
    });
    await expect(
      unavailable.request("system.ai-runtime", "https://api.openai.com/v1/responses", {
        method: "POST",
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "network.transport_unavailable" },
    });
    expect(calls).toBe(1);
  });
});
