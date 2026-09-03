import { afterEach, describe, expect, it } from "vitest";
import {
  asContentDigest,
  createUuidV7Id,
  digestCanonicalJson,
  type CanonicalJsonValue,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import {
  createExecutionContextRuntime,
  createExecutionLineageService,
  createPersistenceExecutionContextProvider,
  type ExecutionContext,
} from "@heptalogos/execution-lineage";
import { createPersistenceService } from "@heptalogos/persistence";
import { createEvidenceService } from "@heptalogos/evidence";
import { createSystemTimeService } from "@heptalogos/time-service";
import { createConfigurationService } from "@heptalogos/configuration";
import { createSecretService } from "@heptalogos/secret";
import { createNetworkAccessService } from "@heptalogos/network-access";
import { createAIRuntimeService } from "@heptalogos/ai-runtime";
import {
  boot,
  cleanupCanonicalPostgresFixtures,
  describeRealPostgres,
  makeFixture,
  stopManagedHostWithoutRuntime,
} from "../../foundation/support/canonical-postgres.js";

const suite = describeRealPostgres === undefined ? describe.skip : describe;
const qualificationModel = "gpt-5.6-luna";
const outputSchema: CanonicalJsonValue = {
  type: "object",
  required: ["schemaVersion", "ok", "marker"],
  properties: {
    schemaVersion: { const: 1 },
    ok: { const: true },
    marker: { type: "string", minLength: 1, maxLength: 64 },
  },
  additionalProperties: false,
};

const PERSISTENCE_OPTIONS = {
  maxConnections: 2,
  idleTimeoutMs: 5_000,
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  lockTimeoutMs: 10_000,
  idleInTransactionSessionTimeoutMs: 30_000,
  onBackgroundError() {},
} as const;

function productGeneration(): ProductGenerationId {
  return asContentDigest(
    "ProductGenerationId",
    digestCanonicalJson("provider-openai-qualification/product/v1", {
      route: "openai-responses",
    }),
  );
}

async function readProtectedKey(): Promise<Uint8Array> {
  if (process.stdin.isTTY && process.stdin.setRawMode !== undefined) {
    return new Promise<Uint8Array>((resolveKey, rejectKey) => {
      const chunks: Buffer[] = [];
      const finish = (error?: Error) => {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdin.off("data", onData);
        process.stderr.write("\n");
        if (error !== undefined) {
          chunks.forEach((chunk) => chunk.fill(0));
          rejectKey(error);
          return;
        }
        const key = Buffer.concat(chunks);
        chunks.forEach((chunk) => chunk.fill(0));
        if (key.byteLength === 0) {
          key.fill(0);
          rejectKey(new Error("A protected OpenAI API key is required on stdin"));
          return;
        }
        resolveKey(Uint8Array.from(key));
        key.fill(0);
      };
      const onData = (chunk: Buffer) => {
        let contentEnd = chunk.byteLength;
        for (let index = 0; index < chunk.byteLength; index += 1) {
          const byte = chunk[index];
          if (byte === 3) {
            finish(new Error("Protected OpenAI key input was cancelled"));
            return;
          }
          if (byte === 10 || byte === 13) {
            contentEnd = index;
            if (contentEnd > 0) chunks.push(Buffer.from(chunk.subarray(0, contentEnd)));
            finish();
            return;
          }
        }
        if (contentEnd > 0) chunks.push(Buffer.from(chunk));
      };
      process.stderr.write("OpenAI API key (protected stdin): ");
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", onData);
    });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  const value = Buffer.concat(chunks);
  chunks.forEach((chunk) => chunk.fill(0));
  const trimmed = value.toString("utf8").replace(/(?:\r\n|\n|\r)$/u, "");
  value.fill(0);
  const key = new TextEncoder().encode(trimmed);
  if (key.byteLength === 0)
    throw new Error("A protected OpenAI API key is required on stdin");
  return key;
}

async function runRetainedActivity<T>(
  runtime: ReturnType<typeof createExecutionContextRuntime>,
  persistence: ReturnType<typeof createPersistenceService>,
  lineage: ReturnType<typeof createExecutionLineageService>,
  evidence: ReturnType<typeof createEvidenceService>,
  time: ReturnType<typeof createSystemTimeService>,
  kind: string,
  operation: (context: ExecutionContext) => Promise<T>,
): Promise<T> {
  return runtime.runActivity(
    {
      kind,
      importance: "significant",
      retentionClass: "retained",
      sensitivity: "operational",
    },
    async (context) => {
      await persistence.mutate((transaction) =>
        lineage.retainCurrent(transaction, context),
      );
      try {
        const result = await operation(context);
        await persistence.mutate((transaction) =>
          evidence.recordRequired(transaction, {
            evidenceKind: "provider-openai.qualification",
            evidenceContractVersion: "provider-openai.v1",
            subjectRef: context.activityId,
            retentionClass: "retained",
            sensitivity: "operational",
          }),
        );
        await persistence.mutate((transaction) =>
          lineage.completeCurrent(transaction, context, {
            endedAt: time.now(),
            outcome: "SUCCEEDED",
          }),
        );
        return result;
      } catch (error) {
        await persistence
          .mutate((transaction) =>
            lineage.completeCurrent(transaction, context, {
              endedAt: time.now(),
              outcome: "FAILED",
            }),
          )
          .catch(() => undefined);
        throw error;
      }
    },
  );
}

let fixture: Awaited<ReturnType<typeof makeFixture>> | undefined;
let host: Awaited<ReturnType<typeof boot>> | undefined;
let persistence: ReturnType<typeof createPersistenceService> | undefined;
let cleanupSecret: (() => Promise<void>) | undefined;

afterEach(async () => {
  await persistence?.close().catch(() => undefined);
  persistence = undefined;
  cleanupSecret = undefined;
  if (host !== undefined) {
    await stopManagedHostWithoutRuntime(host.host).catch(() => undefined);
    host = undefined;
  }
  await cleanupCanonicalPostgresFixtures().catch(() => undefined);
  fixture = undefined;
});

suite("manual OpenAI provider qualification", () => {
  it("performs one real Responses structured generation through current owners", async () => {
    const apiKey = await readProtectedKey();
    let secretRef: import("@heptalogos/secret").SecretRef | undefined;
    try {
      fixture = await makeFixture();
      host = await boot(fixture);
      const time = createSystemTimeService();
      const generation = productGeneration();
      const runtime = createExecutionContextRuntime(
        {
          installationId: host.host.installationId,
          instanceId: host.host.instanceId,
          bootId: host.host.bootId,
          continuityEpochId: host.host.continuityEpochId,
          hostOwnershipToken: host.host.token,
          runtime: { productGenerationId: generation },
        },
        time,
      );
      persistence = createPersistenceService(
        host.host.persistence,
        PERSISTENCE_OPTIONS,
        createPersistenceExecutionContextProvider(runtime),
      );
      const lineage = createExecutionLineageService();
      const evidence = createEvidenceService(time);
      const configuration = createConfigurationService({
        persistence,
        time,
        execution: runtime,
        evidence,
      });
      const secret = createSecretService({
        persistence,
        time,
        execution: runtime,
        evidence,
      });
      const networkAccess = createNetworkAccessService({
        configuration,
        execution: runtime,
        installationId: host.host.installationId,
      });
      const aiRuntime = createAIRuntimeService({
        persistence,
        time,
        execution: runtime,
        evidence,
        configuration,
        secret,
        networkAccess,
      });

      const transportRevision = await runRetainedActivity(
        runtime,
        persistence,
        lineage,
        evidence,
        time,
        "provider-openai.qualification.configuration",
        async () =>
          configuration.createRevision({
            definitionId: "ai.provider.transport.v1",
            scopeRef: {
              schemaVersion: 1,
              resourceKind: "installation",
              resourceId: host!.host.installationId,
            },
            value: {
              schemaVersion: 1,
              timeoutMs: 120_000,
              requestBodyBudgetBytes: 60_000,
              responseBodyBudgetBytes: 1_048_576,
              expandedResponseBodyBudgetBytes: 4_194_304,
            },
          }),
      );
      await runRetainedActivity(
        runtime,
        persistence,
        lineage,
        evidence,
        time,
        "provider-openai.qualification.activation",
        async () =>
          configuration.activate({ revisionId: transportRevision.revisionId }),
      );

      const providerProfileId = createUuidV7Id("ProviderProfileId");
      await runRetainedActivity(
        runtime,
        persistence,
        lineage,
        evidence,
        time,
        "provider-openai.qualification.provider",
        async () =>
          aiRuntime.setProviderProfile({
            providerProfileId,
            providerKind: "openai",
            configurationRevisionRef: transportRevision.revisionId,
            secretRefs: [],
            enabled: false,
          }),
      );

      const protectedMaterial = Uint8Array.from(apiKey);
      try {
        secretRef = await runRetainedActivity(
          runtime,
          persistence,
          lineage,
          evidence,
          time,
          "provider-openai.qualification.secret",
          async () =>
            secret.createOrSet({
              purpose: "provider.openai.api-key",
              scopeRef: {
                schemaVersion: 1,
                resourceKind: "provider-profile",
                resourceId: providerProfileId,
              },
              material: protectedMaterial,
            }),
        );
      } finally {
        protectedMaterial.fill(0);
        apiKey.fill(0);
      }
      cleanupSecret = async () => {
        if (secretRef === undefined) return;
        await runRetainedActivity(
          runtime,
          persistence!,
          lineage,
          evidence,
          time,
          "provider-openai.qualification.revoke",
          async () => secret.revoke(secretRef!),
        );
      };
      await runRetainedActivity(
        runtime,
        persistence,
        lineage,
        evidence,
        time,
        "provider-openai.qualification.enable",
        async () =>
          aiRuntime.setProviderProfile({
            providerProfileId,
            providerKind: "openai",
            configurationRevisionRef: transportRevision.revisionId,
            secretRefs: [secretRef!],
            enabled: true,
          }),
      );

      const modelProfile = await runRetainedActivity(
        runtime,
        persistence,
        lineage,
        evidence,
        time,
        "provider-openai.qualification.model",
        async () =>
          aiRuntime.setModelProfile({
            providerProfileId,
            providerModelIdentifier: qualificationModel,
            consumedCapabilities: [
              "text-generation",
              "structured-output",
              "usage-metadata",
              "abort-timeout",
            ],
            configurationRevisionRef: transportRevision.revisionId,
          }),
      );
      const binding = await runRetainedActivity(
        runtime,
        persistence,
        lineage,
        evidence,
        time,
        "provider-openai.qualification.binding",
        async () =>
          aiRuntime.setModelBinding({
            role: "subject.primary",
            modelProfileId: modelProfile.modelProfileId,
          }),
      );

      const generationResult = await runRetainedActivity(
        runtime,
        persistence,
        lineage,
        evidence,
        time,
        "provider-openai.qualification.invoke",
        async (context) =>
          aiRuntime.invoke({
            schemaVersion: 1,
            invocationId: createUuidV7Id("InvocationId"),
            ownerActivityRef: context.activityId,
            modelBindingId: binding.modelBindingId,
            expectedBindingRevision: binding.revision,
            contextProjection: { schemaVersion: 1, source: "qualification" },
            messages: [
              { role: "system", text: "Return the requested object only." },
              {
                role: "user",
                text: "Return schemaVersion 1, ok true, and a short marker.",
              },
            ],
            objective: "Produce one bounded qualification object",
            outputSchema,
            budget: { maxOutputTokens: 128 },
            lineageContextRef: runtime.createLineageContextRef(),
          }),
      );

      expect(generationResult.providerProfileId).toBe(providerProfileId);
      expect(generationResult.modelProfileId).toBe(modelProfile.modelProfileId);
      expect(generationResult.providerModelIdentifier).toBe(qualificationModel);
      expect(generationResult.bindingRevision).toBe(binding.revision);
      expect(generationResult.candidate).toMatchObject({
        schemaVersion: 1,
        ok: true,
        marker: expect.any(String),
      });
      expect(generationResult.evidenceRefs.length).toBeGreaterThan(0);
    } finally {
      await cleanupSecret?.().catch(() => undefined);
      apiKey.fill(0);
    }
  });
});
