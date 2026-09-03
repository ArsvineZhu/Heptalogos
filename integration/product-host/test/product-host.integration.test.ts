import { Client } from "pg";
import { afterEach, describe, expect, it } from "vitest";
import { createOsCredentialStore } from "@heptalogos/os-credential";
import {
  createManagementClient,
  ManagementClientError,
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
    ).rejects.toMatchObject<Partial<ManagementClientError>>({
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
