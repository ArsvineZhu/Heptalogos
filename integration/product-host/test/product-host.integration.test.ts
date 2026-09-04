import { Client } from "pg";
import { afterEach, describe, expect, it } from "vitest";
import { createUuidV7Id } from "@heptalogos/foundation-contracts";
import { createOsCredentialStore } from "@heptalogos/os-credential";
import {
  createManagementClient,
  ManagementClientError,
  type SystemActionRequestInput,
} from "../../../packages/application/management-client/dist/index.js";
import { openLocalManagementClient } from "../../../packages/application/management-client/dist/node.js";
import {
  makeFixture,
  readRunJson,
  runCli,
  runHost,
  type ProductHostFixture,
  type RunningHost,
} from "../support/fixture.js";

const postgresBin = process.env.HEPTALOGOS_TEST_PG_BIN;
const suite = postgresBin === undefined ? describe.skip : describe;
let fixture: ProductHostFixture | undefined;
let running: RunningHost | undefined;

afterEach(async () => {
  await running?.stop().catch(() => undefined);
  running = undefined;
  await fixture?.cleanup().catch(() => undefined);
  fixture = undefined;
});

suite("built Product Host process", () => {
  it("configures Chat and Responses gateway routes through plan/execute and preserves them on restart", async () => {
    fixture = await makeFixture(postgresBin!);
    running = await runHost(fixture);

    const password = "Administrator-provider-012345";
    const claim = (await readRunJson(fixture, "management-first-claim.json")) as {
      claimId: string;
      claimSecret: string;
    };
    const claimed = await runCli(
      fixture,
      ["admin", "claim", "--password-stdin", "--json"],
      password + "\n",
    );
    expect(claimed.code, claimed.stderr).toBe(0);
    const login = await runCli(
      fixture,
      ["auth", "login", "--password-stdin", "--json"],
      password + "\n",
    );
    expect(login.code, login.stderr).toBe(0);
    expect(claim.claimId).toMatch(/[0-9a-f-]{36}/u);
    expect(claim.claimSecret).toHaveLength(43);

    const local = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      credentialStore: fixture.credentialStore,
    });
    const sessionToken = await local.readSessionToken();
    expect(sessionToken).toBeDefined();
    const authenticatedLocal = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      sessionToken,
      credentialStore: fixture.credentialStore,
    });
    const client = authenticatedLocal.client;
    const applyAction = async (action: SystemActionRequestInput) => {
      const plan = await client.planSystemAction(action);
      const executed = await client.executeSystemAction({ plan, action });
      expect(executed.postconditionsVerified).toBe(true);
      return executed;
    };

    const transportValue = {
      schemaVersion: 1 as const,
      timeoutMs: 60_000,
      requestBodyBudgetBytes: 60_000,
      responseBodyBudgetBytes: 1_048_576,
      expandedResponseBodyBudgetBytes: 4_194_304,
    };
    const configurationAction = {
      actionId: "configuration.revision.create" as const,
      input: {
        definitionId: "ai.gateway.transport.v1" as const,
        scopeRef: {
          schemaVersion: 1 as const,
          resourceKind: "installation",
          resourceId: fixture.installationId,
        },
        value: transportValue,
      },
    };
    const actionCatalog = await runCli(fixture, ["action", "catalog", "--json"]);
    expect(actionCatalog.code, actionCatalog.stderr).toBe(0);
    expect(JSON.parse(actionCatalog.stdout)).toHaveLength(8);
    const cliPlan = await runCli(
      fixture,
      ["action", "plan", "--input-stdin", "--json"],
      JSON.stringify(configurationAction),
    );
    expect(cliPlan.code, cliPlan.stderr).toBe(0);
    expect(JSON.parse(cliPlan.stdout)).not.toHaveProperty("input");
    const configurationPlan = await client.planSystemAction(configurationAction);
    const configurationExecution = await client.executeSystemAction({
      plan: configurationPlan,
      action: configurationAction,
    });
    expect(configurationExecution.postconditionsVerified).toBe(true);
    const configured = await client.getProductState();
    const revision = configured.data.configuration.revisions[0] as {
      revisionId: string;
    };
    expect(revision.revisionId).toMatch(/[0-9a-f-]{36}/u);

    await applyAction({
      actionId: "configuration.activate",
      input: { revisionId: revision.revisionId },
    });

    const gatewayProfileId = createUuidV7Id("GatewayProfileId");
    await applyAction({
      actionId: "gateway-profile.set",
      input: {
        gatewayProfileId,
        baseUrl: "https://gateway.example.com/v1/",
        enabled: false,
      },
    });
    const disabled = await client.getProductState();
    expect(disabled.data.gatewayProfiles[0]).toMatchObject({
      gatewayProfileId,
      baseUrl: "https://gateway.example.com/v1",
      enabled: false,
    });
    expect(disabled.data.aiReadiness).toMatchObject({ state: "BLOCKED" });

    const immutableGatewayAction = {
      actionId: "gateway-profile.set" as const,
      input: {
        gatewayProfileId,
        baseUrl: "https://another-gateway.example.com/v1",
        enabled: false,
      },
    };
    const immutableGatewayPlan = await client.planSystemAction(immutableGatewayAction);
    await expect(
      client.executeSystemAction({
        plan: immutableGatewayPlan,
        action: immutableGatewayAction,
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "ai.gateway_destination_immutable" },
    });

    const submittedGatewayToken = "not-a-real-gateway-token";
    const secretAction = {
      actionId: "secret.set" as const,
      input: {
        purpose: "ai.gateway.bearer-token",
        scopeRef: {
          schemaVersion: 1 as const,
          resourceKind: "gateway-profile",
          resourceId: gatewayProfileId,
        },
        material: submittedGatewayToken,
      },
    };
    const secretPlan = await client.planSystemAction(secretAction);
    expect(JSON.stringify(secretPlan)).not.toContain(submittedGatewayToken);
    await client.executeSystemAction({ plan: secretPlan, action: secretAction });
    const withSecret = await client.getProductState();
    const secret = withSecret.data.secrets[0] as { secretId: string };

    await applyAction({
      actionId: "gateway-profile.set",
      input: {
        gatewayProfileId,
        baseUrl: "https://gateway.example.com/v1",
        apiTokenSecretRef: { schemaVersion: 1, secretId: secret.secretId },
        enabled: true,
      },
    });

    const chatModelProfileId = createUuidV7Id("ModelProfileId");
    const modelCapabilities = [
      "text-generation",
      "structured-output",
      "usage-metadata",
      "abort-timeout",
    ] as Array<
      "text-generation" | "structured-output" | "usage-metadata" | "abort-timeout"
    >;
    const chatModelInput = {
      modelProfileId: chatModelProfileId,
      gatewayProfileId,
      modelIdentifier: "deepseek-chat",
      protocol: "openai-chat" as const,
      consumedCapabilities: modelCapabilities,
    };
    await applyAction({ actionId: "model-profile.set", input: chatModelInput });

    const responsesModelProfileId = createUuidV7Id("ModelProfileId");
    const responsesModelInput = {
      modelProfileId: responsesModelProfileId,
      gatewayProfileId,
      modelIdentifier: "deepseek-responses",
      protocol: "openai-responses" as const,
      consumedCapabilities: modelCapabilities,
    };
    await applyAction({
      actionId: "model-profile.set",
      input: responsesModelInput,
    });
    await applyAction({
      actionId: "model-binding.set",
      input: { role: "subject.primary", modelProfileId: chatModelProfileId },
    });
    await applyAction({
      actionId: "model-binding.set",
      input: {
        role: "subject.expression",
        modelProfileId: responsesModelProfileId,
      },
    });
    const ready = await client.getProductState();
    expect(ready.data.aiReadiness).toMatchObject({ state: "READY", blockers: [] });

    const staleAction = {
      actionId: "model-binding.set" as const,
      input: {
        role: "subject.primary" as const,
        modelProfileId: chatModelProfileId,
      },
    };
    const stalePlan = await client.planSystemAction(staleAction);
    await applyAction({
      actionId: "model-binding.set",
      input: {
        role: "subject.primary",
        modelProfileId: responsesModelProfileId,
      },
    });
    await expect(
      client.executeSystemAction({ plan: stalePlan, action: staleAction }),
    ).rejects.toMatchObject({
      problem: { problemCode: "management.plan_conflict" },
    });

    await running.stop();
    running = await runHost(fixture, { includeInitialPort: false });
    const restartedLocal = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      credentialStore: fixture.credentialStore,
    });
    const restartedToken = await restartedLocal.readSessionToken();
    expect(restartedToken).toBeDefined();
    const restartedAuthenticated = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      sessionToken: restartedToken,
      credentialStore: fixture.credentialStore,
    });
    const restarted = await restartedAuthenticated.client.getProductState();
    expect(restarted.data.configuration.revisions).toHaveLength(1);
    expect(restarted.data.configuration.activations).toHaveLength(1);
    expect(restarted.data.gatewayProfiles).toHaveLength(1);
    expect(restarted.data.secrets).toHaveLength(1);
    expect(restarted.data.modelProfiles).toHaveLength(2);
    expect(restarted.data.modelBindings).toHaveLength(2);
    expect(restarted.data.aiReadiness).toMatchObject({ state: "READY" });
  });

  it("starts a fresh Host, exposes client and CLI reads, and preserves restart identity", async () => {
    fixture = await makeFixture(postgresBin!);
    running = await runHost(fixture);
    expect(running.ready.installationId).toBe(fixture.installationId);
    expect(running.ready.productGeneration).toMatch(/^[0-9a-f]{64}$/u);
    expect(running.ready.bootstrapRuntimeGeneration).toMatch(/^[0-9a-f]{64}$/u);
    const endpoint = (await readRunJson(fixture, "management-endpoint.json")) as {
      origin: string;
      bootId: string;
    };
    const claim = (await readRunJson(fixture, "management-first-claim.json")) as {
      claimId: string;
      claimSecret: string;
    };
    expect(endpoint.origin).toBe(running.ready.origin);
    expect(claim.claimSecret).toHaveLength(43);

    const password = "Administrator-password-012345";
    const claimed = await runCli(
      fixture,
      ["admin", "claim", "--password-stdin", "--json"],
      password + "\r\n",
    );
    expect(claimed.code).toBe(0);
    expect(JSON.parse(claimed.stdout)).toHaveProperty("administratorId");
    expect(claimed.stdout).not.toContain(claim.claimSecret);

    const replayClient = createManagementClient({ origin: running.ready.origin });
    await expect(
      replayClient.claimFirstAdministrator({
        claimId: claim.claimId,
        claimSecret: claim.claimSecret,
        password,
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "management.first_claim_consumed" },
    });

    const login = await runCli(
      fixture,
      ["auth", "login", "--password-stdin", "--json"],
      password + "\n",
    );
    expect(login.code).toBe(0);
    const loginJson = JSON.parse(login.stdout) as Record<string, unknown>;
    expect(loginJson.authenticated).toBe(true);
    expect(login.stdout).not.toMatch(/[A-Za-z0-9_-]{43}/u);

    const sessionLocal = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      credentialStore: fixture.credentialStore,
    });
    const sessionToken = await sessionLocal.readSessionToken();
    expect(sessionToken).toBeDefined();
    const authenticated = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      sessionToken,
      credentialStore: fixture.credentialStore,
    });
    for (const read of [
      authenticated.client.getSystemStatus(),
      authenticated.client.getHost(),
      authenticated.client.getRuntimeGraph(),
      authenticated.client.getCapabilityGraph(),
      authenticated.client.getReadiness(),
    ]) {
      await expect(read).resolves.toMatchObject({
        schemaVersion: 1,
        contractVersion: "management.v1",
        resource: { schemaVersion: 1 },
        productGeneration: running.ready.productGeneration,
        data: { schemaVersion: 1 },
      });
    }

    for (const command of [
      ["contract"],
      ["status"],
      ["host", "status"],
      ["runtime", "graph"],
      ["capability", "graph"],
      ["readiness"],
    ]) {
      const result = await runCli(fixture, [...command, "--json"]);
      expect(result.code, result.stderr).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    }
    const logout = await runCli(fixture, ["auth", "logout", "--json"]);
    expect(logout.code).toBe(0);

    const firstBootId = running.ready.bootId;
    const firstGeneration = running.ready.productGeneration;
    await running.stop();
    running = await runHost(fixture, { includeInitialPort: false });
    expect(running.ready.bootId).not.toBe(firstBootId);
    expect(running.ready.productGeneration).toBe(firstGeneration);
    expect(running.ready.installationId).toBe(fixture.installationId);
    await expect(
      readRunJson(fixture, "management-first-claim.json"),
    ).rejects.toBeDefined();
  });

  it("replaces a stale descriptor and shuts down gracefully", async () => {
    fixture = await makeFixture(postgresBin!);
    running = await runHost(fixture);
    const stale = await readRunJson(fixture, "management-endpoint.json");
    await running.crash();
    running = undefined;
    expect(await readRunJson(fixture, "management-endpoint.json")).toEqual(stale);
    running = await runHost(fixture, { includeInitialPort: false });
    const current = await readRunJson(fixture, "management-endpoint.json");
    expect(current).not.toEqual(stale);
    expect((current as { bootId: string }).bootId).toBe(running.ready.bootId);
  });

  it("fails closed on credential recovery and enforces Host-fenced ACLs", async () => {
    fixture = await makeFixture(postgresBin!);
    running = await runHost(fixture);
    const runtimeKey = {
      service: "Heptalogos/" + fixture.installationId,
      account: "bootstrap/private-postgres-runtime-role",
    };
    const runtimePassword = await fixture.credentialStore.withCredential(
      runtimeKey,
      async (bytes) => new TextDecoder().decode(bytes),
    );
    const client = new Client({
      host: "127.0.0.1",
      port: fixture.postgresPort,
      database: "heptalogos",
      user: "heptalogos_runtime",
      password: runtimePassword,
    });
    await client.connect();
    await expect(
      client.query('INSERT INTO "heptalogos"."administrator" DEFAULT VALUES'),
    ).rejects.toBeDefined();
    await client.end();

    await running.stop();
    running = undefined;
    await fixture.credentialStore.delete(runtimeKey);
    const failed = await runHost(fixture, { includeInitialPort: false }).catch(
      (error: Error) => error,
    );
    expect(failed).toBeInstanceOf(Error);
    expect((failed as Error).message).toContain("bootstrap_credential_missing");
  });

  it("exposes generated-client discovery and the shipping boundary", async () => {
    fixture = await makeFixture(postgresBin!);
    running = await runHost(fixture);
    const local = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      credentialStore: createOsCredentialStore(),
    });
    const discovery = await local.client.getDiscovery();
    expect(discovery.installationId).toBe(fixture.installationId);
    expect(discovery.compatibility.coreContractVersion).toBe("management.v1");
    expect(local.endpoint.origin).toBe(running.ready.origin);
  });

  it("preserves canonical Problem semantics across HTTP and generated client", async () => {
    fixture = await makeFixture(postgresBin!);
    running = await runHost(fixture);
    const client = createManagementClient({ origin: running.ready.origin });
    const assertProblem = (error: unknown, problemCode: string) => {
      expect(error).toBeInstanceOf(ManagementClientError);
      expect(error).toMatchObject({
        problem: {
          schemaVersion: 1,
          problemCode,
          category: expect.any(String),
          retryClass: expect.any(String),
          status: expect.any(Number),
          title: expect.any(String),
          detail: expect.any(String),
        },
      });
    };

    const invalidInput = await client
      .claimFirstAdministrator({
        claimId: "invalid",
        claimSecret: "invalid",
        password: "invalid",
      })
      .catch((error: unknown) => error);
    assertProblem(invalidInput, "management.first_claim_invalid");

    const invalidCredentials = await client
      .login({ password: "invalid-management-password" })
      .catch((error: unknown) => error);
    assertProblem(invalidCredentials, "management.invalid_credentials");

    let rateLimited: unknown;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      rateLimited = await client
        .claimFirstAdministrator({
          claimId: "invalid",
          claimSecret: "invalid",
          password: "invalid",
        })
        .catch((error: unknown) => error);
    }
    assertProblem(rateLimited, "management.rate_limited");

    const mismatch = await fetch(running.ready.origin + "/management/v1/readiness", {
      headers: { "x-heptalogos-contract-version": "management.v0" },
    });
    expect(mismatch.status).toBe(426);
    await expect(mismatch.json()).resolves.toMatchObject({
      schemaVersion: 1,
      problemCode: "management.contract_unsupported",
      category: "conflict",
      retryClass: "manual",
    });
  });
});
