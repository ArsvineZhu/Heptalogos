import { readFile } from "node:fs/promises";
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
import { createSubjectGatewayFixture } from "../support/subject-gateway-fixture.js";

const postgresBin = process.env.HEPTALOGOS_TEST_PG_BIN;
const suite = postgresBin === undefined ? describe.skip : describe;
let fixture: ProductHostFixture | undefined;
let running: RunningHost | undefined;
let subjectGateway: Awaited<ReturnType<typeof createSubjectGatewayFixture>> | undefined;
interface SubjectFactSnapshot {
  readonly reactions: readonly {
    readonly reactionId: string;
    readonly workItemId: string;
    readonly state: string;
    readonly communicationCommitId: string | null;
    readonly primaryCognitionProvenance: Record<string, unknown> | null;
    readonly workState: string;
    readonly workReason: string | null;
  }[];
  readonly outboundCount: number;
}

async function readSubjectFactSnapshot(
  testFixture: ProductHostFixture,
  conversationId: string,
): Promise<SubjectFactSnapshot> {
  const runtimeKey = {
    service: "Heptalogos/" + testFixture.installationId,
    account: "bootstrap/private-postgres-runtime-role",
  };
  const runtimePassword = await testFixture.credentialStore.withCredential(
    runtimeKey,
    async (bytes) => new TextDecoder().decode(bytes),
  );
  const database = new Client({
    host: "127.0.0.1",
    port: testFixture.postgresPort,
    database: "heptalogos",
    user: "heptalogos_runtime",
    password: runtimePassword,
  });
  await database.connect();
  try {
    const reactions = await database.query<{
      readonly reaction_id: string;
      readonly work_item_id: string;
      readonly state: string;
      readonly communication_commit_id: string | null;
      readonly primary_cognition_provenance: unknown;
    }>(
      `SELECT r.reaction_id, r.state, c.communication_commit_id,
              c.primary_cognition_provenance, w.work_item_id,
              w.state AS work_state, w.state_reason_code AS work_reason
          FROM "heptalogos"."reaction" r
         LEFT JOIN "heptalogos"."communication_commit" c
           ON c.reaction_id = r.reaction_id
         JOIN "heptalogos"."work_item" w
           ON w.work_item_id = r.owner_work_item_id
        WHERE r.conversation_id = $1
        ORDER BY r.created_at, r.reaction_id`,
      [conversationId],
    );
    const outbound = await database.query<{ readonly count: string }>(
      `SELECT count(*)::text AS count
         FROM "heptalogos"."message_fact"
        WHERE conversation_id = $1 AND direction = 'OUTBOUND'`,
      [conversationId],
    );
    return {
      reactions: Object.freeze(
        reactions.rows.map((row) =>
          Object.freeze({
            reactionId: row.reaction_id,
            workItemId: row.work_item_id,
            state: row.state,
            communicationCommitId: row.communication_commit_id,
            primaryCognitionProvenance:
              row.primary_cognition_provenance === null
                ? null
                : ((typeof row.primary_cognition_provenance === "string"
                    ? JSON.parse(row.primary_cognition_provenance)
                    : row.primary_cognition_provenance) as Record<string, unknown>),
            workState: row.work_state,
            workReason: row.work_reason,
          }),
        ),
      ),
      outboundCount: Number(outbound.rows[0]?.count ?? "0"),
    };
  } finally {
    await database.end();
  }
}

async function holdWorkItemLock(
  testFixture: ProductHostFixture,
  workItemId: string,
): Promise<() => Promise<void>> {
  const runtimeKey = {
    service: "Heptalogos/" + testFixture.installationId,
    account: "bootstrap/private-postgres-runtime-role",
  };
  const runtimePassword = await testFixture.credentialStore.withCredential(
    runtimeKey,
    async (bytes) => new TextDecoder().decode(bytes),
  );
  const database = new Client({
    host: "127.0.0.1",
    port: testFixture.postgresPort,
    database: "heptalogos",
    user: "heptalogos_runtime",
    password: runtimePassword,
  });
  await database.connect();
  await database.query("BEGIN");
  await database.query(
    `SELECT work_item_id
       FROM "heptalogos"."work_item"
      WHERE work_item_id = $1
      FOR UPDATE`,
    [workItemId],
  );
  let released = false;
  return async () => {
    if (released) return;
    released = true;
    await database.query("ROLLBACK").catch(() => undefined);
    await database.end().catch(() => undefined);
  };
}

async function holdSubjectAuthorityLock(testFixture: ProductHostFixture): Promise<{
  waitForWaiters(minimum: number): Promise<void>;
  release(): Promise<void>;
}> {
  const runtimeKey = {
    service: "Heptalogos/" + testFixture.installationId,
    account: "bootstrap/private-postgres-runtime-role",
  };
  const runtimePassword = await testFixture.credentialStore.withCredential(
    runtimeKey,
    async (bytes) => new TextDecoder().decode(bytes),
  );
  const database = new Client({
    host: "127.0.0.1",
    port: testFixture.postgresPort,
    database: "heptalogos",
    user: "heptalogos_runtime",
    password: runtimePassword,
  });
  await database.connect();
  await database.query("BEGIN");
  await database.query(
    `SELECT subject_id
       FROM "heptalogos"."subject_authority"
      WHERE installation_id = $1
      FOR UPDATE`,
    [testFixture.installationId],
  );
  let released = false;
  return {
    async waitForWaiters(minimum: number) {
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const result = await database.query<{ readonly count: string }>(
          `SELECT count(*)::text AS count
             FROM pg_locks
            WHERE NOT granted`,
        );
        if (Number(result.rows[0]?.count ?? "0") >= minimum) return;
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
      }
      throw new Error("Expected PostgreSQL authority lock waiter was not observed");
    },
    async release() {
      if (released) return;
      released = true;
      await database.query("ROLLBACK").catch(() => undefined);
      await database.end().catch(() => undefined);
    },
  };
}

async function readSubjectRuntimeDescriptor(
  testFixture: ProductHostFixture,
): Promise<{ readonly pid: number; readonly runtimeGeneration: string }> {
  const value = JSON.parse(
    await readFile(
      `${testFixture.roots.RUN}/subject-openclaw/subject-openclaw-runtime.json`,
      "utf8",
    ),
  ) as Record<string, unknown>;
  if (
    typeof value.pid !== "number" ||
    !Number.isSafeInteger(value.pid) ||
    typeof value.runtimeGeneration !== "string"
  ) {
    throw new Error("Subject OpenClaw runtime descriptor is invalid");
  }
  return { pid: value.pid, runtimeGeneration: value.runtimeGeneration };
}

afterEach(async () => {
  await running?.stop().catch(() => undefined);
  running = undefined;
  await fixture?.cleanup().catch(() => undefined);
  fixture = undefined;
  if (subjectGateway !== undefined) {
    subjectGateway.releaseSlowPrimary();
    subjectGateway.releaseSlowExpression();
    await new Promise<void>((resolve) => subjectGateway!.server.close(() => resolve()));
    subjectGateway = undefined;
  }
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
    expect(JSON.parse(actionCatalog.stdout)).toHaveLength(10);
    const cliPlan = await runCli(
      fixture,
      ["action", "plan", "--input-stdin", "--json"],
      JSON.stringify(configurationAction),
    );
    expect(cliPlan.code, cliPlan.stderr).toBe(0);
    expect(JSON.parse(cliPlan.stdout)).not.toHaveProperty("input");
    const configurationPlan = await client.planSystemAction(configurationAction);
    expect(configurationPlan.affectedSemanticOwners).toEqual([
      "system.configuration",
      "system.network-access",
    ]);
    expect(configurationPlan.configurationReadinessSubjectImpact).toMatchObject({
      configurationDefinitionId: "ai.gateway.transport.v1",
      activation: "LIVE",
      consumerRefs: ["system.network-access", "system.ai-runtime"],
      effective: "after-activation",
    });
    expect(configurationPlan.restartReconcileImpact).toMatchObject({
      restartRequired: false,
      activation: "LIVE",
      reconciliation: "staged-until-activation",
    });
    const configurationExecution = await client.executeSystemAction({
      plan: configurationPlan,
      action: configurationAction,
    });
    expect(configurationExecution.postconditionsVerified).toBe(true);
    const configured = await client.getProductState();
    const revision = configured.data.configuration.revisions.find(
      (candidate) => candidate.definitionId === "ai.gateway.transport.v1",
    ) as {
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
    expect(restarted.data.configuration.revisions).toHaveLength(4);
    expect(restarted.data.configuration.activations).toHaveLength(4);
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

  it("runs the local Subject Chat vertical slice through DBOS and canonical facts", async () => {
    fixture = await makeFixture(postgresBin!);
    subjectGateway = await createSubjectGatewayFixture();
    running = await runHost(fixture);

    const password = "Subject-l4-password-012345";
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
    const local = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      credentialStore: fixture.credentialStore,
    });
    const sessionToken = await local.readSessionToken();
    expect(sessionToken).toBeDefined();
    const authenticated = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      sessionToken,
      credentialStore: fixture.credentialStore,
    });
    let client = authenticated.client;
    const applyAction = async (action: SystemActionRequestInput) => {
      const plan = await client.planSystemAction(action);
      const executed = await client.executeSystemAction({ plan, action });
      expect(executed.postconditionsVerified).toBe(true);
      return executed;
    };
    const scopeRef = {
      schemaVersion: 1 as const,
      resourceKind: "installation",
      resourceId: fixture.installationId,
    };
    const transportRevision = await applyAction({
      actionId: "configuration.revision.create",
      input: {
        definitionId: "ai.gateway.transport.v1",
        scopeRef,
        value: {
          schemaVersion: 1,
          timeoutMs: 30_000,
          requestBodyBudgetBytes: 60_000,
          responseBodyBudgetBytes: 1_048_576,
        },
      },
    });
    const transport = transportRevision.result as { revisionId: string };
    await applyAction({
      actionId: "configuration.activate",
      input: { revisionId: transport.revisionId },
    });
    const gatewayProfileId = createUuidV7Id("GatewayProfileId");
    await applyAction({
      actionId: "gateway-profile.set",
      input: {
        gatewayProfileId,
        baseUrl: subjectGateway.baseUrl,
        enabled: true,
      },
    });
    const capabilities: Array<
      "text-generation" | "structured-output" | "usage-metadata" | "abort-timeout"
    > = ["text-generation", "structured-output", "usage-metadata", "abort-timeout"];
    const primaryModelProfileId = createUuidV7Id("ModelProfileId");
    const expressionModelProfileId = createUuidV7Id("ModelProfileId");
    await applyAction({
      actionId: "model-profile.set",
      input: {
        modelProfileId: primaryModelProfileId,
        gatewayProfileId,
        modelIdentifier: "subject-primary",
        protocol: "openai-chat",
        consumedCapabilities: capabilities,
      },
    });
    await applyAction({
      actionId: "model-profile.set",
      input: {
        modelProfileId: expressionModelProfileId,
        gatewayProfileId,
        modelIdentifier: "subject-expression",
        protocol: "openai-responses",
        consumedCapabilities: capabilities,
      },
    });
    await applyAction({
      actionId: "model-binding.set",
      input: { role: "subject.primary", modelProfileId: primaryModelProfileId },
    });
    await applyAction({
      actionId: "model-binding.set",
      input: {
        role: "subject.expression",
        modelProfileId: expressionModelProfileId,
      },
    });
    const setModelProfile = async (
      modelProfileId: string,
      modelIdentifier: string,
      protocol: "openai-chat" | "openai-responses",
    ) => {
      await applyAction({
        actionId: "model-profile.set",
        input: {
          modelProfileId,
          gatewayProfileId,
          modelIdentifier,
          protocol,
          consumedCapabilities: capabilities,
        },
      });
    };

    const beforeStart = await client.getProductState();
    const subjectBeforeStart = beforeStart.data.subject;
    expect(subjectBeforeStart.desiredState).toBe("STOPPED");
    const started = await applyAction({
      actionId: "subject.start",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision: subjectBeforeStart.authorityRevision,
      },
    });
    expect(started.result).toMatchObject({ desiredState: "RUNNING" });
    await expect
      .poll(async () => (await client.getProductState()).data.subject.actualState, {
        timeout: 10_000,
        interval: 100,
      })
      .toBe("READY");
    const send = async (clientMessageId: string, text: string) => {
      const response = await fetch(
        running!.ready.origin + "/subject-chat/v1/messages",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${sessionToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ clientMessageId, text }),
        },
      );
      return { response, body: (await response.json()) as Record<string, any> };
    };
    const staleStopState = await client.getProductState();
    const staleStopAction: SystemActionRequestInput = {
      actionId: "subject.stop",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision: staleStopState.data.subject.authorityRevision,
      },
    };
    const staleStopPlan = await client.planSystemAction(staleStopAction);
    const authorityLock = await holdSubjectAuthorityLock(fixture);
    const stopPromise = client.executeSystemAction({
      plan: staleStopPlan,
      action: staleStopAction,
    });
    await authorityLock.waitForWaiters(1);
    const staleInboundPromise = send(
      "subject-l4-message-stale-prepared-inbound",
      "Prepared under the old Subject authority",
    );
    await authorityLock.waitForWaiters(2);
    await authorityLock.release();
    const [staleInbound, stoppedByRace] = await Promise.all([
      staleInboundPromise,
      stopPromise,
    ]);
    expect(staleInbound.response.status, JSON.stringify(staleInbound.body)).toBe(400);
    expect(staleInbound.body.problemCode).toBe("subject.stale_authority_revision");
    expect(stoppedByRace.postconditionsVerified).toBe(true);
    const stoppedAfterRace = await client.getProductState();
    expect(stoppedAfterRace.data.subject.desiredState).toBe("STOPPED");
    await applyAction({
      actionId: "subject.start",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision: stoppedAfterRace.data.subject.authorityRevision,
      },
    });
    await expect
      .poll(async () => (await client.getProductState()).data.subject.actualState, {
        timeout: 10_000,
        interval: 100,
      })
      .toBe("READY");
    const first = await send("subject-l4-message-1", "Hello Subject");
    expect(first.response.status, JSON.stringify(first.body)).toBe(200);
    expect(first.body).toMatchObject({
      status: "ACCEPTED",
      message: { direction: "INBOUND" },
    });

    let page: Record<string, any> | undefined;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const response = await fetch(
        running.ready.origin + "/subject-chat/v1/messages?limit=100",
        {
          headers: { authorization: `Bearer ${sessionToken}` },
        },
      );
      page = (await response.json()) as Record<string, any>;
      if (
        Array.isArray(page.messages) &&
        page.messages.some((message) => message.direction === "OUTBOUND")
      )
        break;
      await new Promise<void>((resolve) => setTimeout(resolve, 250));
    }
    expect(
      page?.messages,
      `primaryCount=${subjectGateway?.primaryInvocationCount()} expressionCount=${subjectGateway?.expressionInvocationCount()} facts=${JSON.stringify(await readSubjectFactSnapshot(fixture, first.body.message.conversationId as string))}`,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ direction: "INBOUND", text: "Hello Subject" }),
        expect.objectContaining({
          direction: "OUTBOUND",
          text: "local expressed reply",
        }),
      ]),
    );
    const firstFacts = await readSubjectFactSnapshot(
      fixture,
      first.body.message.conversationId,
    );
    expect(firstFacts.reactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          state: "REPLIED",
          communicationCommitId: expect.any(String),
          primaryCognitionProvenance: expect.objectContaining({
            schemaVersion: 1,
            provider: "openclaw",
            openclawVersion: "2026.9.1",
            profile: "subject",
            modelProvider: "heptalogos",
            terminalToolName: "heptalogos_propose_communication",
            terminalStatus: "error",
          }),
        }),
      ]),
    );
    const firstRuntime = await readSubjectRuntimeDescriptor(fixture);
    expect(firstRuntime.pid).toBeGreaterThan(0);
    expect(firstRuntime.runtimeGeneration).toMatch(/^[0-9a-f]{64}:/u);
    expect(subjectGateway.primaryInvocationCount()).toBe(1);
    expect(subjectGateway.expressionInvocationCount()).toBe(1);

    const replay = await send("subject-l4-message-1", "Hello Subject");
    expect(replay.body).toMatchObject({
      status: "EXISTING",
      message: { sequence: first.body.message.sequence },
    });
    const conflict = await send("subject-l4-message-1", "Changed text");
    expect(conflict.response.status).toBe(409);
    expect(conflict.body.problemCode).toBe("messaging.idempotency_conflict");

    const conversationId = first.body.message.conversationId as string;
    const noCommunicationModelProfileId = createUuidV7Id("ModelProfileId");
    await setModelProfile(
      noCommunicationModelProfileId,
      "subject-primary-no-communication",
      "openai-chat",
    );
    await applyAction({
      actionId: "model-binding.set",
      input: {
        role: "subject.primary",
        modelProfileId: noCommunicationModelProfileId,
      },
    });
    const noCommunication = await send(
      "subject-l4-message-no-communication",
      "Please consider this quietly",
    );
    expect(noCommunication.response.status, JSON.stringify(noCommunication.body)).toBe(
      200,
    );
    await expect
      .poll(
        async () => {
          const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
          return (
            snapshot.outboundCount === 1 &&
            snapshot.reactions.some(
              (reaction) =>
                reaction.communicationCommitId === null &&
                reaction.state === "NO_COMMUNICATION",
            )
          );
        },
        { timeout: 20_000, interval: 250 },
      )
      .toBe(true);
    const noCommunicationFacts = await readSubjectFactSnapshot(fixture, conversationId);
    expect(noCommunicationFacts.reactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          state: "NO_COMMUNICATION",
          communicationCommitId: null,
        }),
      ]),
    );
    expect(noCommunicationFacts.outboundCount).toBe(1);
    const noCommunicationRuntime = JSON.parse(
      await readFile(
        `${fixture.roots.RUN}/subject-openclaw/subject-openclaw-runtime.json`,
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(noCommunicationRuntime.lastToolEvent).toMatchObject({
      name: "heptalogos_complete_without_communication",
    });

    const beforeStop = await client.getProductState();
    await applyAction({
      actionId: "subject.stop",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision: beforeStop.data.subject.authorityRevision,
      },
    });
    const stopped = await client.getProductState();
    expect(stopped.data.subject).toMatchObject({
      subjectId: subjectBeforeStart.subjectId,
      desiredState: "STOPPED",
      actualState: "STOPPED",
    });
    const rejectedWhileStopped = await send(
      "subject-l4-message-stopped",
      "This must not be accepted",
    );
    expect(rejectedWhileStopped.response.status).toBe(409);
    expect(rejectedWhileStopped.body.problemCode).toBe("subject.not_running");

    await applyAction({
      actionId: "gateway-profile.set",
      input: {
        gatewayProfileId,
        baseUrl: subjectGateway.baseUrl,
        enabled: false,
      },
    });
    const stoppedForBlockedStart = await client.getProductState();
    await applyAction({
      actionId: "subject.start",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision:
          stoppedForBlockedStart.data.subject.authorityRevision,
      },
    });
    await expect
      .poll(async () => (await client.getProductState()).data.subject.actualState, {
        timeout: 10_000,
        interval: 100,
      })
      .toBe("BLOCKED");
    const rejectedWithoutDependency = await send(
      "subject-l4-message-blocked",
      "This must wait for dependencies",
    );
    expect(rejectedWithoutDependency.response.status).toBe(503);
    expect(rejectedWithoutDependency.body.problemCode).toBe(
      "subject.dependencies_unavailable",
    );
    const blockedFacts = await readSubjectFactSnapshot(fixture, conversationId);
    expect(blockedFacts.reactions).toHaveLength(noCommunicationFacts.reactions.length);
    await applyAction({
      actionId: "gateway-profile.set",
      input: {
        gatewayProfileId,
        baseUrl: subjectGateway.baseUrl,
        enabled: true,
      },
    });
    await expect
      .poll(async () => (await client.getProductState()).data.subject.actualState, {
        timeout: 10_000,
        interval: 100,
      })
      .toBe("READY");

    const slowPrimaryModelProfileId = createUuidV7Id("ModelProfileId");
    await setModelProfile(
      slowPrimaryModelProfileId,
      "subject-primary-slow",
      "openai-chat",
    );
    await applyAction({
      actionId: "model-binding.set",
      input: { role: "subject.primary", modelProfileId: slowPrimaryModelProfileId },
    });
    const beforePreCommitStop = await client.getProductState();
    const preCommitStop = await send(
      "subject-l4-message-stop-before-commit",
      "Stop before communication commit",
    );
    expect(preCommitStop.response.status).toBe(200);
    await subjectGateway.waitForSlowPrimary();
    await applyAction({
      actionId: "subject.stop",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision: beforePreCommitStop.data.subject.authorityRevision,
      },
    });
    subjectGateway.releaseSlowPrimary();
    await expect
      .poll(
        async () => {
          const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
          return (
            snapshot.outboundCount === 1 &&
            snapshot.reactions.some((reaction) => reaction.state === "SUPERSEDED")
          );
        },
        { timeout: 30_000, interval: 250 },
      )
      .toBe(true);
    const preCommitStopFacts = await readSubjectFactSnapshot(fixture, conversationId);
    expect(preCommitStopFacts.reactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ state: "SUPERSEDED", communicationCommitId: null }),
      ]),
    );

    const restartedAfterPreCommitStop = await client.getProductState();
    await applyAction({
      actionId: "subject.start",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision:
          restartedAfterPreCommitStop.data.subject.authorityRevision,
      },
    });
    await expect
      .poll(async () => (await client.getProductState()).data.subject.actualState, {
        timeout: 10_000,
        interval: 100,
      })
      .toBe("READY");

    const supersededA = await send("subject-l4-message-a", "Message A");
    expect(supersededA.response.status).toBe(200);
    await subjectGateway.waitForSlowPrimary();
    const supersededB = await send("subject-l4-message-b", "Message B");
    expect(supersededB.response.status).toBe(200);
    subjectGateway.releaseSlowPrimary();
    await subjectGateway.waitForSlowPrimary();
    subjectGateway.releaseSlowPrimary();
    await expect
      .poll(
        async () => {
          const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
          return (
            snapshot.outboundCount === 2 &&
            snapshot.reactions.some((reaction) => reaction.state === "SUPERSEDED") &&
            snapshot.reactions.some(
              (reaction) =>
                reaction.state === "REPLIED" && reaction.communicationCommitId !== null,
            )
          );
        },
        { timeout: 30_000, interval: 250 },
      )
      .toBe(true);
    const supersessionFacts = await readSubjectFactSnapshot(fixture, conversationId);
    expect(supersessionFacts.reactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ state: "SUPERSEDED", communicationCommitId: null }),
      ]),
    );
    expect(
      subjectGateway
        .primaryRequestMessages()
        .some(
          (messages) =>
            messages.some((message) => message.includes("Message A")) &&
            messages.every((message) => !message.includes("Hello Subject")) &&
            messages.every(
              (message) => !message.includes("Please consider this quietly"),
            ),
        ),
    ).toBe(true);

    await applyAction({
      actionId: "model-binding.set",
      input: { role: "subject.primary", modelProfileId: primaryModelProfileId },
    });
    const slowExpressionModelProfileId = createUuidV7Id("ModelProfileId");
    await setModelProfile(
      slowExpressionModelProfileId,
      "subject-expression-slow",
      "openai-responses",
    );
    await applyAction({
      actionId: "model-binding.set",
      input: {
        role: "subject.expression",
        modelProfileId: slowExpressionModelProfileId,
      },
    });
    const primaryBeforeSubjectRuntimeRestart = subjectGateway.primaryInvocationCount();
    const postCommitStopMessage = await send(
      "subject-l4-message-stop-after-commit",
      "Stop after communication commit",
    );
    expect(postCommitStopMessage.response.status).toBe(200);
    await subjectGateway.waitForSlowExpression();
    await expect
      .poll(
        async () => {
          const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
          const latest = snapshot.reactions[snapshot.reactions.length - 1];
          return (
            snapshot.outboundCount === 2 &&
            latest?.state === "COMMUNICATION_COMMITTED" &&
            latest.communicationCommitId !== null
          );
        },
        { timeout: 20_000, interval: 250 },
      )
      .toBe(true);
    const runtimeBeforeKill = await readSubjectRuntimeDescriptor(fixture);
    expect(runtimeBeforeKill.pid).not.toBe(process.pid);
    process.kill(runtimeBeforeKill.pid, "SIGKILL");
    const beforePostCommitStop = await client.getProductState();
    await applyAction({
      actionId: "subject.stop",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision: beforePostCommitStop.data.subject.authorityRevision,
      },
    });
    subjectGateway.releaseSlowExpression();
    await expect
      .poll(
        async () => {
          const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
          const latest = snapshot.reactions[snapshot.reactions.length - 1];
          return snapshot.outboundCount === 3 && latest?.state === "REPLIED";
        },
        { timeout: 45_000, interval: 250 },
      )
      .toBe(true);
    expect(subjectGateway.primaryInvocationCount()).toBe(
      primaryBeforeSubjectRuntimeRestart + 1,
    );
    await expect
      .poll(
        async () => {
          try {
            return (
              (await readSubjectRuntimeDescriptor(fixture)).runtimeGeneration !==
              runtimeBeforeKill.runtimeGeneration
            );
          } catch {
            return false;
          }
        },
        { timeout: 30_000, interval: 250 },
      )
      .toBe(true);
    await expect
      .poll(async () => (await client.getProductState()).data.subject.actualState, {
        timeout: 10_000,
        interval: 100,
      })
      .toBe("STOPPED");

    const beforeRestart = await client.getProductState();
    await applyAction({
      actionId: "subject.start",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision: beforeRestart.data.subject.authorityRevision,
      },
    });
    await expect
      .poll(async () => (await client.getProductState()).data.subject.actualState, {
        timeout: 10_000,
        interval: 100,
      })
      .toBe("READY");

    const primaryBeforeCrash = subjectGateway.primaryInvocationCount();
    const expressionBeforeCrash = subjectGateway.expressionInvocationCount();
    const crashMessage = await send("subject-l4-message-crash", "Crash boundary");
    expect(crashMessage.response.status).toBe(200);
    await subjectGateway.waitForSlowExpression();
    await expect
      .poll(
        async () => {
          const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
          const latest = snapshot.reactions[snapshot.reactions.length - 1];
          return (
            snapshot.outboundCount === 3 &&
            latest?.state === "COMMUNICATION_COMMITTED" &&
            latest.communicationCommitId !== null
          );
        },
        { timeout: 20_000, interval: 250 },
      )
      .toBe(true);
    const crashSnapshot = await readSubjectFactSnapshot(fixture, conversationId);
    const crashReaction = crashSnapshot.reactions[crashSnapshot.reactions.length - 1];
    expect(crashReaction).toBeDefined();
    const releaseWorkItemLock = await holdWorkItemLock(
      fixture,
      crashReaction!.workItemId,
    );
    subjectGateway.releaseSlowExpression();
    try {
      await expect
        .poll(
          async () => {
            const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
            const latest = snapshot.reactions[snapshot.reactions.length - 1];
            return (
              snapshot.outboundCount === 4 &&
              latest?.state === "REPLIED" &&
              latest.workState === "RUNNING"
            );
          },
          { timeout: 45_000, interval: 250 },
        )
        .toBe(true);
      await running!.crash();
      running = undefined;
    } finally {
      await releaseWorkItemLock();
    }
    await runHost(fixture, { includeInitialPort: false }).then((host) => {
      running = host;
    });
    await expect
      .poll(
        async () => {
          const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
          const latest = snapshot.reactions[snapshot.reactions.length - 1];
          return (
            snapshot.outboundCount === 4 &&
            latest?.state === "REPLIED" &&
            latest.workState === "SUCCEEDED"
          );
        },
        { timeout: 45_000, interval: 250 },
      )
      .toBe(true);
    expect(subjectGateway.primaryInvocationCount()).toBe(primaryBeforeCrash + 1);
    expect(subjectGateway.expressionInvocationCount()).toBe(expressionBeforeCrash + 1);
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
    expect(restarted.data.subject).toMatchObject({
      subjectId: subjectBeforeStart.subjectId,
      desiredState: "RUNNING",
      actualState: "READY",
    });
    client = restartedAuthenticated.client;

    await applyAction({
      actionId: "model-binding.set",
      input: { role: "subject.primary", modelProfileId: slowPrimaryModelProfileId },
    });
    const primaryBeforePreProposalCrash = subjectGateway.primaryInvocationCount();
    const preProposalCrash = await send(
      "subject-l4-message-crash-before-proposal",
      "Crash before proposal acceptance",
    );
    expect(preProposalCrash.response.status).toBe(200);
    await subjectGateway.waitForSlowPrimary();
    await running!.crash();
    running = undefined;
    subjectGateway.releaseSlowPrimary();
    await runHost(fixture, { includeInitialPort: false }).then((host) => {
      running = host;
    });
    await subjectGateway.waitForSlowPrimary();
    subjectGateway.releaseSlowPrimary();
    await subjectGateway.waitForSlowExpression();
    subjectGateway.releaseSlowExpression();
    await expect
      .poll(
        async () => {
          const snapshot = await readSubjectFactSnapshot(fixture!, conversationId);
          const latest = snapshot.reactions[snapshot.reactions.length - 1];
          return snapshot.outboundCount === 5 && latest?.state === "REPLIED";
        },
        { timeout: 45_000, interval: 250 },
      )
      .toBe(true);
    expect(subjectGateway.primaryInvocationCount()).toBeGreaterThanOrEqual(
      primaryBeforePreProposalCrash + 1,
    );

    expect(subjectGateway.expressionBudgets()[0]).toBe(256);
  });

  it("applies Subject expression revisions to the real Expression consumer", async () => {
    fixture = await makeFixture(postgresBin!);
    subjectGateway = await createSubjectGatewayFixture();
    running = await runHost(fixture);

    const password = "Subject-config-password-012345";
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

    const local = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      credentialStore: fixture.credentialStore,
    });
    const sessionToken = await local.readSessionToken();
    expect(sessionToken).toBeDefined();
    const authenticated = await openLocalManagementClient({
      anchorRoot: fixture.anchorRoot,
      sessionToken,
      credentialStore: fixture.credentialStore,
    });
    const client = authenticated.client;
    const applyAction = async (action: SystemActionRequestInput) => {
      const plan = await client.planSystemAction(action);
      const executed = await client.executeSystemAction({ plan, action });
      expect(executed.postconditionsVerified).toBe(true);
      return executed;
    };

    const initial = await client.getProductState();
    expect(
      initial.data.configuration.definitions.map(
        (definition) => definition.definitionId,
      ),
    ).toEqual(
      expect.arrayContaining([
        "ai.gateway.transport.v1",
        "subject.cognition.runtime.v1",
        "subject.expression.v1",
        "management.http.admission.v1",
      ]),
    );
    const subjectBeforeStart = initial.data.subject;
    const subjectScope = {
      schemaVersion: 1 as const,
      resourceKind: "subject",
      resourceId: subjectBeforeStart.subjectId,
    };
    const initialExpressionActivation = initial.data.configuration.activations.find(
      (activation) =>
        activation.definitionId === "subject.expression.v1" &&
        activation.scopeRef.resourceId === subjectBeforeStart.subjectId,
    );
    expect(initialExpressionActivation).toBeDefined();
    const initialExpressionRevision = initial.data.configuration.revisions.find(
      (revision) =>
        revision.revisionId === initialExpressionActivation!.activeRevisionId,
    );
    expect(initialExpressionRevision?.value).toEqual({
      schemaVersion: 1,
      maxOutputTokens: 256,
    });
    const initialCognitionActivation = initial.data.configuration.activations.find(
      (activation) =>
        activation.definitionId === "subject.cognition.runtime.v1" &&
        activation.scopeRef.resourceId === subjectBeforeStart.subjectId,
    );
    expect(initialCognitionActivation).toBeDefined();
    const initialCognitionRevision = initial.data.configuration.revisions.find(
      (revision) =>
        revision.revisionId === initialCognitionActivation!.activeRevisionId,
    );
    expect(initialCognitionRevision?.value).toEqual({
      schemaVersion: 1,
      enabled: true,
      profile: "subject",
      maxOutputTokens: 256,
      runTimeoutMs: 60_000,
      maxContextBytes: 65_536,
    });
    const initialHttpAdmissionActivation = initial.data.configuration.activations.find(
      (activation) =>
        activation.definitionId === "management.http.admission.v1" &&
        activation.scopeRef.resourceId === fixture.installationId,
    );
    expect(initialHttpAdmissionActivation).toBeDefined();
    const initialHttpAdmissionRevision = initial.data.configuration.revisions.find(
      (revision) =>
        revision.revisionId === initialHttpAdmissionActivation!.activeRevisionId,
    );
    expect(initialHttpAdmissionRevision?.value).toEqual({
      schemaVersion: 1,
      bodyLimitBytes: 65_536,
      claimRateLimit: { max: 5, windowMs: 60_000 },
      loginRateLimit: { max: 10, windowMs: 60_000 },
    });
    const httpAdmissionPlan = await client.planSystemAction({
      actionId: "configuration.activate",
      input: { revisionId: initialHttpAdmissionActivation!.activeRevisionId },
    });
    expect(httpAdmissionPlan.affectedSemanticOwners).toEqual([
      "system.configuration",
      "application.product-host",
    ]);
    expect(httpAdmissionPlan.configurationReadinessSubjectImpact).toMatchObject({
      configurationDefinitionId: "management.http.admission.v1",
      activation: "RESTART_HOST",
      consumerRefs: ["application.product-host.http"],
      effective: "active-revision",
    });
    expect(httpAdmissionPlan.restartReconcileImpact).toMatchObject({
      restartRequired: true,
      activation: "RESTART_HOST",
      reconciliation: "restart-host",
    });

    const invalidAction: SystemActionRequestInput = {
      actionId: "configuration.revision.create",
      input: {
        definitionId: "subject.expression.v1",
        scopeRef: subjectScope,
        value: { schemaVersion: 1, maxOutputTokens: 0 },
      },
    };
    const invalid = await client
      .planSystemAction(invalidAction)
      .catch((error: unknown) => error);
    expect(invalid).toBeInstanceOf(ManagementClientError);
    expect(invalid).toMatchObject({
      problem: { problemCode: "configuration.invalid_input" },
    });
    await expect(client.getProductState()).resolves.toMatchObject({
      data: {
        configuration: {
          revisions: initial.data.configuration.revisions,
        },
      },
    });

    const transportScope = {
      schemaVersion: 1 as const,
      resourceKind: "installation",
      resourceId: fixture.installationId,
    };
    const transport = await applyAction({
      actionId: "configuration.revision.create",
      input: {
        definitionId: "ai.gateway.transport.v1",
        scopeRef: transportScope,
        value: {
          schemaVersion: 1,
          timeoutMs: 30_000,
          requestBodyBudgetBytes: 60_000,
          responseBodyBudgetBytes: 1_048_576,
        },
      },
    });
    const transportRevision = transport.result as { revisionId: string };
    await applyAction({
      actionId: "configuration.activate",
      input: { revisionId: transportRevision.revisionId },
    });

    const gatewayProfileId = createUuidV7Id("GatewayProfileId");
    await applyAction({
      actionId: "gateway-profile.set",
      input: {
        gatewayProfileId,
        baseUrl: subjectGateway.baseUrl,
        enabled: true,
      },
    });
    const capabilities: Array<
      "text-generation" | "structured-output" | "usage-metadata" | "abort-timeout"
    > = ["text-generation", "structured-output", "usage-metadata", "abort-timeout"];
    const primaryModelProfileId = createUuidV7Id("ModelProfileId");
    const expressionModelProfileId = createUuidV7Id("ModelProfileId");
    await applyAction({
      actionId: "model-profile.set",
      input: {
        modelProfileId: primaryModelProfileId,
        gatewayProfileId,
        modelIdentifier: "subject-primary-config",
        protocol: "openai-chat",
        consumedCapabilities: capabilities,
      },
    });
    await applyAction({
      actionId: "model-profile.set",
      input: {
        modelProfileId: expressionModelProfileId,
        gatewayProfileId,
        modelIdentifier: "subject-expression-config",
        protocol: "openai-responses",
        consumedCapabilities: capabilities,
      },
    });
    await applyAction({
      actionId: "model-binding.set",
      input: { role: "subject.primary", modelProfileId: primaryModelProfileId },
    });
    await applyAction({
      actionId: "model-binding.set",
      input: {
        role: "subject.expression",
        modelProfileId: expressionModelProfileId,
      },
    });

    await applyAction({
      actionId: "subject.start",
      input: {
        subjectId: subjectBeforeStart.subjectId,
        expectedAuthorityRevision: subjectBeforeStart.authorityRevision,
      },
    });
    await expect
      .poll(async () => (await client.getProductState()).data.subject.actualState, {
        timeout: 10_000,
        interval: 100,
      })
      .toBe("READY");
    const send = async (clientMessageId: string, text: string) => {
      const response = await fetch(
        running!.ready.origin + "/subject-chat/v1/messages",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${sessionToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ clientMessageId, text }),
        },
      );
      return { response, body: (await response.json()) as Record<string, any> };
    };

    const first = await send("subject-config-message-1", "Default budget");
    expect(first.response.status, JSON.stringify(first.body)).toBe(200);
    await expect
      .poll(() => subjectGateway!.expressionBudgets().length, {
        timeout: 20_000,
        interval: 100,
      })
      .toBe(1);
    expect(subjectGateway.expressionBudgets()[0]).toBe(256);

    const nextRevision = await applyAction({
      actionId: "configuration.revision.create",
      input: {
        definitionId: "subject.expression.v1",
        scopeRef: subjectScope,
        value: { schemaVersion: 1, maxOutputTokens: 128 },
      },
    });
    const next = nextRevision.result as { revisionId: string };
    const activeBeforeChange = (
      await client.getProductState()
    ).data.configuration.activations.find(
      (activation) =>
        activation.definitionId === "subject.expression.v1" &&
        activation.scopeRef.resourceId === subjectBeforeStart.subjectId,
    );
    expect(activeBeforeChange).toBeDefined();
    await applyAction({
      actionId: "configuration.activate",
      input: {
        revisionId: next.revisionId,
        expectedActiveRevisionId: activeBeforeChange!.activeRevisionId,
      },
    });
    const effectiveAfterChange = await client.getProductState();
    const activeAfterChange = effectiveAfterChange.data.configuration.activations.find(
      (activation) =>
        activation.definitionId === "subject.expression.v1" &&
        activation.scopeRef.resourceId === subjectBeforeStart.subjectId,
    );
    expect(activeAfterChange?.activeRevisionId).toBe(next.revisionId);
    expect(
      effectiveAfterChange.data.configuration.revisions.find(
        (revision) => revision.revisionId === next.revisionId,
      )?.value,
    ).toEqual({ schemaVersion: 1, maxOutputTokens: 128 });

    const second = await send("subject-config-message-2", "Changed budget");
    expect(second.response.status, JSON.stringify(second.body)).toBe(200);
    await expect
      .poll(() => subjectGateway!.expressionBudgets().length, {
        timeout: 20_000,
        interval: 100,
      })
      .toBe(2);
    expect(subjectGateway.expressionBudgets()[1]).toBe(128);

    const staleRevision = await applyAction({
      actionId: "configuration.revision.create",
      input: {
        definitionId: "subject.expression.v1",
        scopeRef: subjectScope,
        value: { schemaVersion: 1, maxOutputTokens: 192 },
      },
    });
    const stale = staleRevision.result as { revisionId: string };
    const staleAction: SystemActionRequestInput = {
      actionId: "configuration.activate",
      input: {
        revisionId: stale.revisionId,
        expectedActiveRevisionId: activeBeforeChange!.activeRevisionId,
      },
    };
    const stalePlan = await client.planSystemAction(staleAction);
    await expect(
      client.executeSystemAction({ plan: stalePlan, action: staleAction }),
    ).rejects.toMatchObject({
      problem: { problemCode: "configuration.activation_conflict" },
    });
    await expect(client.getProductState()).resolves.toMatchObject({
      data: {
        configuration: {
          activations: expect.arrayContaining([
            expect.objectContaining({
              definitionId: "subject.expression.v1",
              activeRevisionId: next.revisionId,
            }),
          ]),
        },
      },
    });
  });
});
