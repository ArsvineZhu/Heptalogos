/**
 * Supervises the low-privilege Subject OpenClaw Gateway and adapts its public
 * agent/tool protocol to the narrow Subject cognition port.
 * @module subject-openclaw
 */

import { access, mkdir, unlink } from "node:fs/promises";
import { createRequire } from "node:module";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { createConnection, createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GatewayClient,
  startGatewayClientWhenEventLoopReady,
} from "@openclaw/gateway-client";
import { GATEWAY_CLIENT_CAPS } from "@openclaw/gateway-protocol/client-info";
import { PROTOCOL_VERSION } from "@openclaw/gateway-protocol";
import {
  type AIRuntimeService,
  type GatewayProfile,
  type ModelBinding,
  type ModelProfile,
  type ModelInvocationProtocol,
} from "@heptalogos/ai-runtime";
import { GATEWAY_TRANSPORT_DEFINITION_ID } from "@heptalogos/network-access";
import { type BootstrapPathProfile } from "@heptalogos/bootstrap-runtime";
import {
  type ConfigurationRevision,
  type ConfigurationService,
} from "@heptalogos/configuration";
import {
  createProblemError,
  type InstallationId,
  type ProductGenerationId,
  type SubjectId,
} from "@heptalogos/foundation-contracts";
import type { NetworkAccessService } from "@heptalogos/network-access";
import type { SecretService } from "@heptalogos/secret";
import {
  DEFAULT_SUBJECT_COGNITION_CONFIG,
  SUBJECT_COGNITION_CONFIGURATION_DEFINITION_ID,
  type ConversationCognitionInput,
  type ConversationReactionProposal,
  type SubjectCognitionConfigV1,
  type SubjectCognitionProposal,
  type SubjectCognitionProvenance,
  type SubjectCognitionRuntime,
  type SubjectCognitionRuntimeReadiness,
  type SubjectCognitionTerminalStatus,
} from "@heptalogos/subject";
import type { SubjectBlocker } from "@heptalogos/subject";

const require = createRequire(import.meta.url);
type AtomicWrite = (
  path: string,
  data: string,
  options?: { readonly encoding?: "utf8"; readonly mode?: number },
) => Promise<void>;
const writeFileAtomic = require("write-file-atomic") as AtomicWrite;

/** Exact OpenClaw release selected by the P3 preflight and product pin. */
export const SUBJECT_OPENCLAW_VERSION = "2026.9.1" as const;
/** The only OpenClaw profile used by the Product Subject role. */
export const SUBJECT_OPENCLAW_PROFILE = "subject" as const;
/** Product-owned plugin identity for the proposal-only tool surface. */
export const SUBJECT_OPENCLAW_PLUGIN_ID = "heptalogos-subject-cognition" as const;

const SUBJECT_OPENCLAW_MODEL_PROVIDER = "heptalogos" as const;
const SUBJECT_OPENCLAW_TOOL_NAMES = Object.freeze([
  "heptalogos_propose_communication",
  "heptalogos_complete_without_communication",
] as const);
const SUBJECT_OPENCLAW_RUNTIME_FILENAME = "subject-openclaw-runtime.json";
const SUBJECT_OPENCLAW_GATEWAY_TOKEN_ENV = "HEPTALOGOS_SUBJECT_GATEWAY_TOKEN" as const;
const SUBJECT_OPENCLAW_PORT_WAIT_MS = 30_000;
const SUBJECT_OPENCLAW_CONNECT_WAIT_MS = 5_000;
const SUBJECT_OPENCLAW_STOP_WAIT_MS = 5_000;
const SUBJECT_OPENCLAW_RESTART_LIMIT = 3;
const SUBJECT_INHERITED_ENVIRONMENT_KEYS = Object.freeze([
  "Path",
  "PATH",
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "PATHEXT",
  "TEMP",
  "TMP",
  "HOME",
  "USERPROFILE",
  "HOMEDRIVE",
  "HOMEPATH",
  "APPDATA",
  "LOCALAPPDATA",
  "PROGRAMDATA",
  "OS",
  "PROCESSOR_ARCHITECTURE",
  "PROCESSOR_IDENTIFIER",
  "NUMBER_OF_PROCESSORS",
  "LANG",
  "LANGUAGE",
  "TERM",
  "COLORTERM",
  "TZ",
] as const);

interface RuntimePaths {
  readonly data: string;
  readonly configuration: string;
  readonly cache: string;
  readonly run: string;
  readonly state: string;
  readonly workspace: string;
  readonly generatedConfig: string;
}

interface RuntimeProjection {
  readonly subjectId?: SubjectId;
  readonly cognitionRevision?: ConfigurationRevision;
  readonly cognitionConfig: SubjectCognitionConfigV1;
  readonly transportRevision?: ConfigurationRevision;
  readonly binding?: ModelBinding;
  readonly model?: ModelProfile;
  readonly gateway?: GatewayProfile;
}

interface LiveRuntime {
  readonly child: ChildProcess;
  readonly client: GatewayClient;
  readonly port: number;
  readonly gatewayToken: string;
  readonly fingerprint: string;
  readonly projection: RuntimeProjection;
  readonly runtimeGeneration: string;
}

interface PendingRun {
  readonly sessionKey: string;
  readonly resolve: (value: ObservedProposal) => void;
  readonly reject: (reason: unknown) => void;
  settled: boolean;
}

interface ObservedProposal {
  readonly proposal: ConversationReactionProposal;
  readonly terminalToolName: SubjectCognitionProvenance["terminalToolName"];
}

function cognitionProblem(
  problemCode: string,
  title: string,
  detail: string,
  category: "conflict" | "integrity" | "unavailable" | "validation" = "unavailable",
  retryClass: "manual" | "after-change" = "after-change",
): Error {
  return createProblemError({
    problemCode,
    category,
    retryClass,
    title,
    detail,
  });
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function boundedText(value: unknown, field: string, maximum: number): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximum ||
    value.trim().length === 0
  ) {
    throw cognitionProblem(
      "subject.cognition_run_failed",
      "Subject cognition run returned an invalid identity",
      `${field} is not a bounded non-empty string`,
      "integrity",
      "manual",
    );
  }
  return value;
}

function parsedCognitionConfig(
  revision: ConfigurationRevision | undefined,
): SubjectCognitionConfigV1 {
  if (revision === undefined) return DEFAULT_SUBJECT_COGNITION_CONFIG;
  const value = asRecord(revision.value);
  if (
    value === undefined ||
    value.schemaVersion !== 1 ||
    typeof value.enabled !== "boolean" ||
    value.profile !== SUBJECT_OPENCLAW_PROFILE ||
    typeof value.maxOutputTokens !== "number" ||
    typeof value.runTimeoutMs !== "number" ||
    typeof value.maxContextBytes !== "number"
  ) {
    throw cognitionProblem(
      "subject.cognition_configuration_invalid",
      "Subject cognition configuration is invalid",
      "The active subject.cognition.runtime.v1 value is not the current bounded shape",
      "integrity",
      "manual",
    );
  }
  return Object.freeze(value as unknown as SubjectCognitionConfigV1);
}

function runtimePaths(profile: BootstrapPathProfile): RuntimePaths {
  const data = join(profile.resolve("DATA").canonicalPath, "subject-openclaw");
  const configuration = join(
    profile.resolve("CONFIGURATION").canonicalPath,
    "subject-openclaw",
  );
  const cache = join(profile.resolve("CACHE").canonicalPath, "subject-openclaw");
  const run = join(profile.resolve("RUN").canonicalPath, "subject-openclaw");
  return Object.freeze({
    data,
    configuration,
    cache,
    run,
    state: join(data, "state"),
    workspace: join(data, "workspace"),
    generatedConfig: join(configuration, "openclaw.generated.json"),
  });
}

function installationScope(installationId: InstallationId) {
  return Object.freeze({
    schemaVersion: 1 as const,
    resourceKind: "installation",
    resourceId: installationId,
  });
}

function subjectScope(subjectId: SubjectId) {
  return Object.freeze({
    schemaVersion: 1 as const,
    resourceKind: "subject",
    resourceId: subjectId,
  });
}

function modelProviderRef(modelIdentifier: string): string {
  return SUBJECT_OPENCLAW_MODEL_PROVIDER + "/" + modelIdentifier;
}

function subjectProcessEnvironment(): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const key of SUBJECT_INHERITED_ENVIRONMENT_KEYS) {
    const value = process.env[key];
    if (value !== undefined) environment[key] = value;
  }
  return environment;
}

function openclawApi(
  protocol: ModelInvocationProtocol,
): "openai-completions" | "openai-responses" {
  return protocol === "openai-chat" ? "openai-completions" : "openai-responses";
}

function projectionFingerprint(projection: RuntimeProjection): string {
  return JSON.stringify({
    subjectId: projection.subjectId,
    cognitionRevisionId: projection.cognitionRevision?.revisionId,
    cognitionConfig: projection.cognitionConfig,
    transportRevisionId: projection.transportRevision?.revisionId,
    binding: projection.binding,
    model: projection.model,
    gateway: projection.gateway,
  });
}

function eventPayload(value: unknown): Record<string, unknown> | undefined {
  const event = asRecord(value);
  if (event?.event !== "agent") return undefined;
  return asRecord(event.payload);
}

function parseToolProposal(
  toolName: string,
  value: unknown,
): ConversationReactionProposal {
  const args = asRecord(value);
  if (toolName === "heptalogos_complete_without_communication") {
    if (args === undefined || Object.keys(args).length !== 0) {
      throw cognitionProblem(
        "subject.cognition_run_failed",
        "Subject cognition tool arguments are invalid",
        "heptalogos_complete_without_communication accepts no arguments",
        "validation",
        "manual",
      );
    }
    return Object.freeze({ schemaVersion: 1, kind: "NO_COMMUNICATION" });
  }
  if (toolName !== "heptalogos_propose_communication" || args === undefined) {
    throw cognitionProblem(
      "subject.cognition_run_failed",
      "Subject cognition tool is not allowed",
      "The Subject runtime observed a tool outside its bounded proposal surface",
      "conflict",
      "manual",
    );
  }
  const semantic = asRecord(args.semanticContent);
  if (
    Object.keys(args).length !== 1 ||
    semantic === undefined ||
    Object.keys(semantic).length !== 2 ||
    semantic.schemaVersion !== 1 ||
    typeof semantic.content !== "string" ||
    semantic.content.trim().length === 0 ||
    new TextEncoder().encode(semantic.content).byteLength > 65_536
  ) {
    throw cognitionProblem(
      "subject.cognition_run_failed",
      "Subject cognition proposal arguments are invalid",
      "heptalogos_propose_communication did not return bounded semanticContent",
      "validation",
      "manual",
    );
  }
  return Object.freeze({
    schemaVersion: 1,
    kind: "COMMUNICATE",
    semanticContent: Object.freeze({
      schemaVersion: 1,
      content: semantic.content,
    }),
  });
}

function parseTerminalStatus(value: unknown): SubjectCognitionTerminalStatus {
  if (value === "ok" || value === "error" || value === "timeout") return value;
  throw cognitionProblem(
    "subject.cognition_run_failed",
    "Subject cognition terminal outcome is invalid",
    "OpenClaw agent.wait did not return a current terminal status",
    "integrity",
    "manual",
  );
}

function waitForChild(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise<void>((resolvePromise, reject) => {
    const timer = setTimeout(() => {
      reject(
        cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject OpenClaw Gateway did not stop",
          "The Product Host could not settle the owned Subject Gateway child",
          "unavailable",
          "manual",
        ),
      );
    }, timeoutMs);
    child.once("close", () => {
      clearTimeout(timer);
      resolvePromise();
    });
  });
}

async function waitForLoopbackPort(
  child: ChildProcess,
  port: number,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject OpenClaw Gateway exited before readiness",
        "The Product Host child did not expose its loopback listener",
        "unavailable",
        "after-change",
      );
    }
    const connected = await new Promise<boolean>((resolvePromise) => {
      const socket = createConnection({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.destroy();
        resolvePromise(true);
      });
      socket.once("error", () => {
        socket.destroy();
        resolvePromise(false);
      });
    });
    if (connected) return;
    await new Promise<void>((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw cognitionProblem(
    "subject.cognition_runtime_unavailable",
    "Subject OpenClaw Gateway did not become ready",
    "The Product Host child did not expose its bounded loopback listener in time",
    "unavailable",
    "after-change",
  );
}

async function freeLoopbackPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolvePromise());
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
    throw cognitionProblem(
      "subject.cognition_runtime_unavailable",
      "Subject OpenClaw port allocation failed",
      "The Product Host could not allocate a loopback port for the owned Gateway",
    );
  }
  const port = address.port;
  await new Promise<void>((resolvePromise, reject) => {
    server.close((error) => (error ? reject(error) : resolvePromise()));
  });
  return port;
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  onTimeout: () => Error,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(onTimeout()), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Product Host-owned lifecycle handle for the Subject OpenClaw adapter. */
export interface SubjectOpenClawRuntimeHandle extends SubjectCognitionRuntime {
  /** Associates the runtime with its canonical Subject identity. */
  bindSubject(subjectId: SubjectId): void;
  /** Starts or reconciles the runtime for the current Subject projection. */
  start(): Promise<void>;
  /** Stops the runtime and releases all owned external resources. */
  stop(): Promise<void>;
}

/** Creates one isolated Product-supervised Subject OpenClaw runtime. */
export function createSubjectOpenClawRuntime(options: {
  readonly installationId: InstallationId;
  readonly productGeneration: ProductGenerationId;
  readonly paths: BootstrapPathProfile;
  readonly configuration: ConfigurationService;
  readonly aiRuntime: AIRuntimeService;
  readonly networkAccess: NetworkAccessService;
  readonly secret: SecretService;
}): SubjectOpenClawRuntimeHandle {
  const paths = runtimePaths(options.paths);
  const openclawPackageMain = require.resolve("openclaw");
  const openclawPackageRoot = resolve(dirname(openclawPackageMain), "..");
  const openclawEntry = join(openclawPackageRoot, "openclaw.mjs");
  const pluginPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "subject-openclaw-plugin.js",
  );
  let boundSubjectId: SubjectId | undefined;
  let lifecycle: "STOPPED" | "STARTING" | "READY" | "FAILED" | "STOPPING" = "STOPPED";
  let live: LiveRuntime | undefined;
  let transitionTail: Promise<void> = Promise.resolve();
  const pendingStarts = new Map<string, Promise<LiveRuntime>>();
  let stopPromise: Promise<void> | undefined;
  let descriptorTail: Promise<void> = Promise.resolve();
  let recoveryTimer: NodeJS.Timeout | undefined;
  let recoveryAttempts = 0;
  let closed = false;
  const pendingRuns = new Map<string, PendingRun>();
  const observedToolEvents = new Map<string, ObservedProposal | Error>();
  let lastToolEvent:
    | {
        readonly runId: string;
        readonly phase: string;
        readonly name?: string;
      }
    | undefined;
  let lastRunFailure: string | undefined;
  let lastRunStage: string | undefined;

  const enqueueTransition = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = transitionTail.then(operation);
    transitionTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  const enqueueDescriptor = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = descriptorTail.then(operation);
    descriptorTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  const ensureDirectories = async (): Promise<void> => {
    await Promise.all(
      [
        paths.data,
        paths.configuration,
        paths.cache,
        paths.run,
        paths.state,
        paths.workspace,
      ].map((directory) => mkdir(directory, { recursive: true })),
    );
    await access(openclawEntry).catch(() => {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Pinned OpenClaw executable is unavailable",
        "The Product Host dependency does not contain the exact OpenClaw executable",
        "integrity",
        "manual",
      );
    });
    await access(pluginPath).catch(() => {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject OpenClaw tool plugin is unavailable",
        "The Product Host build did not carry the bounded Subject plugin entry",
        "integrity",
        "manual",
      );
    });
  };

  const readProjection = async (
    subjectId: SubjectId | undefined,
    requireConfigured: boolean,
  ): Promise<RuntimeProjection> => {
    const cognitionRevision =
      subjectId === undefined
        ? undefined
        : await options.configuration.getEffectiveRevision(
            SUBJECT_COGNITION_CONFIGURATION_DEFINITION_ID,
            subjectScope(subjectId),
          );
    const cognitionConfig = parsedCognitionConfig(cognitionRevision);
    if (requireConfigured && cognitionRevision === undefined) {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject cognition configuration is unavailable",
        "An active subject.cognition.runtime.v1 revision is required",
        "unavailable",
        "after-change",
      );
    }
    if (requireConfigured && !cognitionConfig.enabled) {
      throw cognitionProblem(
        "subject.cognition_disabled",
        "Subject cognition is disabled",
        "The active Subject cognition configuration does not admit OpenClaw runs",
        "conflict",
        "after-change",
      );
    }
    const binding = await options.aiRuntime.getModelBinding("subject.primary");
    if (binding === undefined || !binding.enabled) {
      if (requireConfigured) {
        throw cognitionProblem(
          "subject.primary_unavailable",
          "Subject primary binding is unavailable",
          "The current subject.primary ModelBinding is not usable by OpenClaw",
          "unavailable",
          "after-change",
        );
      }
      return Object.freeze({ subjectId, cognitionRevision, cognitionConfig });
    }
    const model = await options.aiRuntime.getModelProfile(binding.modelProfileId);
    if (model === undefined) {
      if (requireConfigured) {
        throw cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject primary model is unavailable",
          "The current subject.primary binding points to no ModelProfile",
          "unavailable",
          "after-change",
        );
      }
      return Object.freeze({ subjectId, cognitionRevision, cognitionConfig });
    }
    const gateway = await options.aiRuntime.getGatewayProfile(model.gatewayProfileId);
    if (gateway === undefined || !gateway.enabled) {
      if (requireConfigured) {
        throw cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject primary gateway is unavailable",
          "The current Subject model route does not resolve to an enabled GatewayProfile",
          "unavailable",
          "after-change",
        );
      }
      return Object.freeze({ subjectId, cognitionRevision, cognitionConfig });
    }
    const transportRevision = await options.configuration.getEffectiveRevision(
      GATEWAY_TRANSPORT_DEFINITION_ID,
      installationScope(options.installationId),
    );
    if (transportRevision === undefined) {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject gateway transport configuration is unavailable",
        "An active ai.gateway.transport.v1 revision is required for the projected route",
        "unavailable",
        "after-change",
      );
    }
    try {
      options.networkAccess.authorizeGatewayTarget({
        schemaVersion: 1,
        gatewayProfileId: gateway.gatewayProfileId,
        baseUrl: gateway.baseUrl,
        protocol: model.protocol,
      });
    } catch {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject gateway route is unavailable",
        "NetworkAccess did not authorize the projected Subject model route",
        "unavailable",
        "after-change",
      );
    }
    return Object.freeze({
      subjectId,
      cognitionRevision,
      cognitionConfig,
      transportRevision,
      binding,
      model,
      gateway,
    });
  };

  const resolvedApiToken = async (gateway: GatewayProfile): Promise<string> => {
    if (gateway.apiTokenSecretRef === undefined) return "heptalogos-no-token";
    let material;
    try {
      material = await options.secret.resolve(gateway.apiTokenSecretRef, {
        consumer: "product.subject.openclaw",
        purpose: "ai.gateway.bearer-token",
        resourceRef: {
          schemaVersion: 1,
          resourceKind: "gateway-profile",
          resourceId: gateway.gatewayProfileId,
        },
      });
    } catch {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject gateway credential is unavailable",
        "The configured Subject Gateway bearer token could not be resolved",
        "unavailable",
        "after-change",
      );
    }
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(material.bytes);
    } catch {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject gateway credential is invalid",
        "The configured Subject Gateway bearer token is not valid UTF-8",
        "integrity",
        "manual",
      );
    } finally {
      material.bytes.fill(0);
    }
  };

  const generatedConfig = async (
    projection: RuntimeProjection,
    port: number,
    gatewayToken: string,
  ): Promise<{ readonly env: NodeJS.ProcessEnv; readonly config: string }> => {
    const model = projection.model;
    const gateway = projection.gateway;
    const config = {
      gateway: {
        mode: "local",
        bind: "loopback",
        port,
        auth: { mode: "token", token: gatewayToken },
        controlUi: { enabled: false },
      },
      agents: {
        defaults: {
          workspace: paths.workspace,
          skipBootstrap: true,
          timeoutSeconds: Math.ceil(projection.cognitionConfig.runTimeoutMs / 1_000),
          model: {
            primary:
              model === undefined
                ? modelProviderRef("unconfigured")
                : modelProviderRef(model.modelIdentifier),
          },
          models: {
            [model === undefined
              ? modelProviderRef("unconfigured")
              : modelProviderRef(model.modelIdentifier)]: {},
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          [SUBJECT_OPENCLAW_MODEL_PROVIDER]: {
            baseUrl: gateway?.baseUrl ?? "http://127.0.0.1:1/v1",
            apiKey: `\${${SUBJECT_OPENCLAW_GATEWAY_TOKEN_ENV}}`,
            api: openclawApi(model?.protocol ?? "openai-chat"),
            timeoutSeconds: Math.ceil(projection.cognitionConfig.runTimeoutMs / 1_000),
            models: [
              {
                id: model?.modelIdentifier ?? "unconfigured",
                name: model?.modelIdentifier ?? "unconfigured",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128_000,
                maxTokens: projection.cognitionConfig.maxOutputTokens,
              },
            ],
          },
        },
      },
      tools: {
        profile: "minimal",
        alsoAllow: [...SUBJECT_OPENCLAW_TOOL_NAMES],
        deny: [
          "exec",
          "process",
          "browser",
          "web_search",
          "message",
          "gateway",
          "cron",
          "nodes",
        ],
      },
      plugins: {
        enabled: true,
        allow: [SUBJECT_OPENCLAW_PLUGIN_ID],
        load: { paths: [pluginPath] },
        entries: {
          [SUBJECT_OPENCLAW_PLUGIN_ID]: { enabled: true, config: {} },
        },
      },
    };
    return Object.freeze({
      env: Object.freeze({
        ...subjectProcessEnvironment(),
        OPENCLAW_HOME: paths.state,
        OPENCLAW_STATE_DIR: paths.state,
        OPENCLAW_CONFIG_PATH: paths.generatedConfig,
        OPENCLAW_WORKSPACE_DIR: paths.workspace,
        XDG_CACHE_HOME: paths.cache,
        OPENCLAW_DISABLE_BONJOUR: "1",
        OPENCLAW_NO_RESPAWN: "1",
        OPENCLAW_SKIP_CHANNELS: "1",
        NO_COLOR: "1",
        [SUBJECT_OPENCLAW_GATEWAY_TOKEN_ENV]: await resolvedApiToken(
          gateway ??
            ({
              enabled: true,
              schemaVersion: 1,
              gatewayProfileId: "unconfigured",
              baseUrl: "http://127.0.0.1:1/v1",
            } as GatewayProfile),
        ),
      }),
      config: JSON.stringify(config),
    });
  };

  const rejectPendingRuns = (error: Error): void => {
    for (const pending of pendingRuns.values()) {
      if (pending.settled) continue;
      pending.settled = true;
      pending.reject(error);
    }
    pendingRuns.clear();
    observedToolEvents.clear();
  };

  const onEvent = (value: unknown): void => {
    const payload = eventPayload(value);
    if (payload === undefined) return;
    const runId = payload.runId;
    if (typeof runId !== "string") return;
    const data = asRecord(payload.data);
    if (payload.stream !== "tool" || data === undefined || data.phase !== "start")
      return;
    const toolName = data.name;
    lastToolEvent = Object.freeze({
      runId,
      phase: String(data.phase),
      ...(typeof toolName === "string" ? { name: toolName } : {}),
    });
    if (live !== undefined) void publishDescriptor(live).catch(() => undefined);
    if (
      typeof toolName !== "string" ||
      !SUBJECT_OPENCLAW_TOOL_NAMES.includes(toolName as never)
    ) {
      const error = cognitionProblem(
        "subject.cognition_run_failed",
        "Subject cognition invoked a disallowed tool",
        "The isolated Subject OpenClaw run emitted a tool outside its fixed allowlist",
        "conflict",
        "manual",
      );
      const pending = pendingRuns.get(runId);
      if (pending === undefined) observedToolEvents.set(runId, error);
      else if (!pending.settled) {
        pending.settled = true;
        pending.reject(error);
      }
      return;
    }
    try {
      const proposal = parseToolProposal(toolName, data.args);
      const observed = {
        proposal,
        terminalToolName: toolName as ObservedProposal["terminalToolName"],
      };
      const pending = pendingRuns.get(runId);
      if (pending === undefined) {
        if (observedToolEvents.size >= 32) {
          const oldest = observedToolEvents.keys().next().value;
          if (typeof oldest === "string") observedToolEvents.delete(oldest);
        }
        observedToolEvents.set(runId, observed);
      } else if (!pending.settled) {
        pending.settled = true;
        pending.resolve(observed);
      }
    } catch (error) {
      const pending = pendingRuns.get(runId);
      if (pending === undefined) observedToolEvents.set(runId, error as Error);
      else if (!pending.settled) {
        pending.settled = true;
        pending.reject(error);
      }
    }
  };

  const connectClient = async (
    port: number,
    gatewayToken: string,
    getDiagnostics: () => string,
  ): Promise<GatewayClient> => {
    let resolveHello: (value: unknown) => void = () => undefined;
    let rejectHello: (reason: unknown) => void = () => undefined;
    const hello = new Promise<unknown>((resolvePromise, reject) => {
      resolveHello = resolvePromise;
      rejectHello = reject;
    });
    const client = new GatewayClient({
      url: `ws://127.0.0.1:${port}`,
      token: gatewayToken,
      clientName: "gateway-client",
      clientDisplayName: "Heptalogos Subject cognition",
      clientVersion: SUBJECT_OPENCLAW_VERSION,
      clientBuildId: options.productGeneration,
      platform: process.platform,
      mode: "backend",
      role: "operator",
      scopes: ["operator.read", "operator.write"],
      caps: [GATEWAY_CLIENT_CAPS.TOOL_EVENTS],
      commands: [],
      instanceId: `${SUBJECT_OPENCLAW_PROFILE}-${process.pid}`,
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      onHelloOk: resolveHello,
      onConnectError: rejectHello,
      onEvent,
    });
    const eventLoop = await startGatewayClientWhenEventLoopReady(client, {
      timeoutMs: SUBJECT_OPENCLAW_CONNECT_WAIT_MS,
    });
    if (!eventLoop.ready) {
      await client
        .stopAndWait({ timeoutMs: SUBJECT_OPENCLAW_STOP_WAIT_MS })
        .catch(() => undefined);
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject OpenClaw client event loop is not ready",
        "The Product Host could not establish bounded Gateway client readiness",
        "unavailable",
        "after-change",
      );
    }
    const helloPayload = asRecord(
      await withTimeout(hello, SUBJECT_OPENCLAW_CONNECT_WAIT_MS, () =>
        cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject OpenClaw protocol handshake timed out",
          "The Product Host did not receive the public Gateway hello payload",
          "unavailable",
          "after-change",
        ),
      ),
    );
    if (helloPayload?.protocol !== PROTOCOL_VERSION) {
      await client
        .stopAndWait({ timeoutMs: SUBJECT_OPENCLAW_STOP_WAIT_MS })
        .catch(() => undefined);
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject OpenClaw protocol version is incompatible",
        `The Gateway negotiated protocol ${String(helloPayload?.protocol)} instead of ${PROTOCOL_VERSION}`,
        "conflict",
        "manual",
      );
    }
    const catalog = asRecord(
      await client.request("tools.catalog", {
        agentId: "main",
        includePlugins: true,
      }),
    );
    const groups = Array.isArray(catalog?.groups) ? catalog.groups : [];
    const catalogTools = groups.flatMap((group) => {
      const entry = asRecord(group);
      return Array.isArray(entry?.tools) ? entry.tools : [];
    });
    for (const toolName of SUBJECT_OPENCLAW_TOOL_NAMES) {
      if (
        !catalogTools.some(
          (tool) =>
            asRecord(tool)?.id === toolName && asRecord(tool)?.source === "plugin",
        )
      ) {
        await client
          .stopAndWait({ timeoutMs: SUBJECT_OPENCLAW_STOP_WAIT_MS })
          .catch(() => undefined);
        throw cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject OpenClaw proposal tool is not available",
          `The public tools.catalog result did not expose ${toolName}; catalog=${JSON.stringify(catalog).slice(0, 4_096)}${getDiagnostics().length === 0 ? "" : `; child=${getDiagnostics()}`}`,
          "integrity",
          "manual",
        );
      }
    }
    return client;
  };

  const stopChild = async (child: ChildProcess): Promise<void> => {
    const errors: unknown[] = [];
    if (child.exitCode === null && child.signalCode === null) {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        errors.push(error);
      }
      if (child.exitCode === null && child.signalCode === null) {
        try {
          await waitForChild(child, SUBJECT_OPENCLAW_STOP_WAIT_MS);
        } catch (error) {
          errors.push(error);
          if (child.exitCode === null && child.signalCode === null) {
            try {
              child.kill("SIGKILL");
            } catch (killError) {
              errors.push(killError);
            }
            if (child.exitCode === null && child.signalCode === null) {
              try {
                await waitForChild(child, SUBJECT_OPENCLAW_STOP_WAIT_MS);
              } catch (waitError) {
                errors.push(waitError);
              }
            }
          }
        }
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, "Subject OpenClaw child cleanup failed");
    }
  };

  const stopLive = async (current: LiveRuntime): Promise<void> => {
    const errors: unknown[] = [];
    try {
      await current.client.stopAndWait({ timeoutMs: SUBJECT_OPENCLAW_STOP_WAIT_MS });
    } catch (error) {
      errors.push(error);
    }
    try {
      await stopChild(current.child);
    } catch (error) {
      errors.push(error);
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, "Subject OpenClaw runtime cleanup failed");
    }
  };

  const publishDescriptor = async (current: LiveRuntime): Promise<void> => {
    await enqueueDescriptor(async () => {
      if (closed || live !== current) return;
      await writeFileAtomic(
        join(paths.run, SUBJECT_OPENCLAW_RUNTIME_FILENAME),
        JSON.stringify({
          schemaVersion: 1,
          profile: SUBJECT_OPENCLAW_PROFILE,
          pid: current.child.pid,
          port: current.port,
          runtimeGeneration: current.runtimeGeneration,
          ...(lastToolEvent === undefined ? {} : { lastToolEvent }),
          ...(lastRunFailure === undefined ? {} : { lastRunFailure }),
          ...(lastRunStage === undefined ? {} : { lastRunStage }),
        }),
        { encoding: "utf8", mode: 0o600 },
      );
    });
  };

  const removeDescriptor = async (): Promise<void> => {
    await enqueueDescriptor(() =>
      unlink(join(paths.run, SUBJECT_OPENCLAW_RUNTIME_FILENAME)).catch(() => undefined),
    );
  };

  const scheduleRecovery = (): void => {
    if (
      closed ||
      recoveryTimer !== undefined ||
      recoveryAttempts >= SUBJECT_OPENCLAW_RESTART_LIMIT
    )
      return;
    const delayMs = 250 * (recoveryAttempts + 1);
    recoveryAttempts += 1;
    recoveryTimer = setTimeout(() => {
      recoveryTimer = undefined;
      void start().catch(() => undefined);
    }, delayMs);
  };

  const startProcessNow = async (
    projection: RuntimeProjection,
    fingerprint: string,
  ): Promise<LiveRuntime> => {
    if (closed) {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject OpenClaw runtime is closed",
        "The Product Host has already begun terminal shutdown",
        "conflict",
        "manual",
      );
    }
    if (live !== undefined && live.fingerprint === fingerprint && lifecycle === "READY")
      return live;
    if (live !== undefined) {
      const previous = live;
      live = undefined;
      lifecycle = "STOPPING";
      rejectPendingRuns(
        cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject OpenClaw runtime was replaced",
          "The active Subject cognition configuration changed while a run was pending",
          "conflict",
          "after-change",
        ),
      );
      await stopLive(previous);
      await removeDescriptor();
    }
    lifecycle = "STARTING";
    let child: ChildProcess | undefined;
    let client: GatewayClient | undefined;
    try {
      await ensureDirectories();
      const port = await freeLoopbackPort();
      const gatewayToken = randomBytes(32).toString("base64url");
      const material = await generatedConfig(projection, port, gatewayToken);
      await writeFileAtomic(paths.generatedConfig, material.config, {
        encoding: "utf8",
        mode: 0o600,
      });
      child = spawn(
        process.execPath,
        [
          openclawEntry,
          "--profile",
          SUBJECT_OPENCLAW_PROFILE,
          "gateway",
          "run",
          "--allow-unconfigured",
          "--bind",
          "loopback",
          "--port",
          String(port),
          "--token",
          gatewayToken,
        ],
        {
          cwd: openclawPackageRoot,
          env: material.env,
          stdio: ["ignore", "pipe", "pipe"],
          windowsHide: true,
        },
      );
      let childDiagnostics = "";
      for (const stream of [child.stdout, child.stderr]) {
        stream?.on("data", (chunk: Buffer) => {
          childDiagnostics = (childDiagnostics + String(chunk)).slice(-4_096);
        });
      }
      child.once("exit", () => {
        if (live?.child !== child) return;
        live = undefined;
        lifecycle = closed ? "STOPPED" : "FAILED";
        rejectPendingRuns(
          cognitionProblem(
            "subject.cognition_runtime_unavailable",
            "Subject OpenClaw Gateway stopped",
            "The owned Subject cognition process stopped while a run was active",
            "unavailable",
            "after-change",
          ),
        );
        void removeDescriptor();
        scheduleRecovery();
      });
      try {
        await waitForLoopbackPort(child, port, SUBJECT_OPENCLAW_PORT_WAIT_MS);
      } catch (error) {
        await stopChild(child).catch((cleanupError) => {
          throw new AggregateError(
            [
              cognitionProblem(
                "subject.cognition_runtime_unavailable",
                "Subject OpenClaw Gateway did not become ready",
                `${error instanceof Error ? error.message : "The Gateway did not expose its listener"}${childDiagnostics.length === 0 ? "" : `; child=${childDiagnostics}`}`,
                "unavailable",
                "after-change",
              ),
              cleanupError,
            ],
            "Subject OpenClaw startup and cleanup both failed",
          );
        });
        throw cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject OpenClaw Gateway did not become ready",
          `${error instanceof Error ? error.message : "The Gateway did not expose its listener"}${childDiagnostics.length === 0 ? "" : `; child=${childDiagnostics}`}`,
          "unavailable",
          "after-change",
        );
      }
      try {
        client = await connectClient(port, gatewayToken, () => childDiagnostics);
      } catch (error) {
        const cleanupErrors: unknown[] = [];
        try {
          await stopChild(child);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
        if (cleanupErrors.length > 0) {
          throw new AggregateError(
            [error, ...cleanupErrors],
            "Subject OpenClaw connection and cleanup both failed",
          );
        }
        throw error;
      }
      const current: LiveRuntime = Object.freeze({
        child,
        client,
        port,
        gatewayToken,
        fingerprint,
        projection,
        runtimeGeneration: `${options.productGeneration}:${randomUUID()}`,
      });
      if (closed) {
        await stopLive(current);
        throw cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject OpenClaw runtime is closed",
          "The Product Host began terminal shutdown before the new runtime became current",
          "conflict",
          "manual",
        );
      }
      live = current;
      lifecycle = "READY";
      recoveryAttempts = 0;
      await publishDescriptor(current);
      if (closed) {
        live = undefined;
        lifecycle = "STOPPING";
        await stopLive(current);
        await removeDescriptor();
        lifecycle = "STOPPED";
        throw cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject OpenClaw runtime is closed",
          "The Product Host began terminal shutdown before the new runtime was published",
          "conflict",
          "manual",
        );
      }
      return current;
    } catch (error) {
      const cleanupErrors: unknown[] = [];
      const currentLive = live;
      if (currentLive !== undefined && currentLive.child === child) {
        const current = currentLive;
        live = undefined;
        try {
          await stopLive(current);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      } else if (child !== undefined) {
        if (client !== undefined) {
          try {
            await client.stopAndWait({ timeoutMs: SUBJECT_OPENCLAW_STOP_WAIT_MS });
          } catch (cleanupError) {
            cleanupErrors.push(cleanupError);
          }
        }
        try {
          await stopChild(child);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      lifecycle = "FAILED";
      if (cleanupErrors.length > 0) {
        throw new AggregateError(
          [error, ...cleanupErrors],
          "Subject OpenClaw startup and cleanup both failed",
        );
      }
      throw error;
    }
  };

  const startProcess = (projection: RuntimeProjection): Promise<LiveRuntime> => {
    const fingerprint = projectionFingerprint(projection);
    if (closed) {
      return Promise.reject(
        cognitionProblem(
          "subject.cognition_runtime_unavailable",
          "Subject OpenClaw runtime is closed",
          "The Product Host has already begun terminal shutdown",
          "conflict",
          "manual",
        ),
      );
    }
    if (live !== undefined && live.fingerprint === fingerprint && lifecycle === "READY")
      return Promise.resolve(live);
    const existing = pendingStarts.get(fingerprint);
    if (existing !== undefined) return existing;
    const pending = enqueueTransition(() => startProcessNow(projection, fingerprint));
    pendingStarts.set(fingerprint, pending);
    const clearPending = () => {
      if (pendingStarts.get(fingerprint) === pending) pendingStarts.delete(fingerprint);
    };
    void pending.then(clearPending, clearPending);
    return pending;
  };

  const start = async (): Promise<void> => {
    if (closed) {
      throw cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject OpenClaw runtime is closed",
        "The Product Host has already begun terminal shutdown",
        "conflict",
        "manual",
      );
    }
    const projection = await readProjection(boundSubjectId, false);
    await startProcess(projection);
  };

  const cancelRun = async (
    current: LiveRuntime,
    sessionKey: string,
    runId: string,
  ): Promise<void> => {
    await current.client
      .request("chat.abort", { sessionKey, runId })
      .catch(() => undefined);
    await current.client
      .request("agent.wait", {
        runId,
        timeoutMs: SUBJECT_OPENCLAW_STOP_WAIT_MS,
      })
      .catch(() => undefined);
  };

  const runConversationReaction = async (
    input: ConversationCognitionInput,
  ): Promise<SubjectCognitionProposal> => {
    const projection = await readProjection(input.subjectId, true);
    const contextText = JSON.stringify(input.contextProjection);
    if (
      new TextEncoder().encode(contextText).byteLength >
      projection.cognitionConfig.maxContextBytes
    ) {
      throw cognitionProblem(
        "subject.cognition_context_too_large",
        "Subject cognition context is too large",
        "The canonical Reaction projection exceeds the active Subject cognition budget",
        "validation",
        "manual",
      );
    }
    const current = await startProcess(projection);
    const setRunStage = (stage: string): void => {
      lastRunStage = stage;
      void publishDescriptor(current).catch(() => undefined);
    };
    const sessionKey = `agent:main:heptalogos-subject-reaction-${input.reactionId}-${randomUUID().slice(0, 8)}`;
    const message = [
      "You are the low-privilege Heptalogos Subject cognition runtime.",
      "For this current Reaction, call exactly one terminal proposal tool.",
      "Use heptalogos_propose_communication for semantic content or heptalogos_complete_without_communication for no communication.",
      "Do not call any other tool and do not send any external message.",
      "Current bounded canonical Reaction projection:",
      contextText,
    ].join("\n");
    let runId: string | undefined;
    try {
      const accepted = asRecord(
        await current.client.request("agent", {
          agentId: "main",
          sessionKey,
          message,
          idempotencyKey: `heptalogos-subject-${input.reactionId}-${randomUUID()}`,
          deliver: false,
        }),
      );
      runId = boundedText(accepted?.runId, "runId", 256);
      setRunStage("accepted");
      const proposalPromise = new Promise<ObservedProposal>(
        (resolvePromise, reject) => {
          const pending: PendingRun = {
            sessionKey,
            resolve: resolvePromise,
            reject,
            settled: false,
          };
          pendingRuns.set(runId!, pending);
          const buffered = observedToolEvents.get(runId!);
          if (buffered !== undefined) {
            observedToolEvents.delete(runId!);
            pending.settled = true;
            if (buffered instanceof Error) pending.reject(buffered);
            else pending.resolve(buffered);
          }
        },
      );
      const observed = await withTimeout(
        proposalPromise,
        projection.cognitionConfig.runTimeoutMs,
        () =>
          cognitionProblem(
            "subject.cognition_timeout",
            "Subject cognition run timed out",
            "OpenClaw did not emit one bounded terminal proposal within the configured budget",
            "unavailable",
            "after-change",
          ),
      );
      setRunStage("proposal-observed");
      await current.client
        .request("chat.abort", { sessionKey, runId })
        .catch(() => undefined);
      setRunStage("abort-requested");
      const terminal = asRecord(
        await current.client.request("agent.wait", {
          runId,
          timeoutMs: Math.min(
            SUBJECT_OPENCLAW_STOP_WAIT_MS,
            projection.cognitionConfig.runTimeoutMs,
          ),
        }),
      );
      setRunStage("terminal-observed");
      const terminalStatus = parseTerminalStatus(terminal?.status);
      if (terminalStatus === "timeout") {
        throw cognitionProblem(
          "subject.cognition_timeout",
          "Subject cognition run did not terminate",
          "The public OpenClaw cancellation path did not produce a bounded terminal outcome",
          "unavailable",
          "after-change",
        );
      }
      return Object.freeze({
        proposal: observed.proposal,
        provenance: Object.freeze({
          schemaVersion: 1,
          provider: "openclaw",
          runtimeGeneration: current.runtimeGeneration,
          openclawVersion: SUBJECT_OPENCLAW_VERSION,
          profile: SUBJECT_OPENCLAW_PROFILE,
          agentId: "main",
          sessionKey,
          runId,
          modelProvider: SUBJECT_OPENCLAW_MODEL_PROVIDER,
          modelIdentifier: projection.model!.modelIdentifier,
          modelBindingId: projection.binding!.modelBindingId,
          bindingRevision: projection.binding!.revision,
          modelProfileId: projection.model!.modelProfileId,
          modelProfileGeneration: projection.model!.generation,
          gatewayProfileId: projection.gateway!.gatewayProfileId,
          configurationRevisionId: projection.cognitionRevision!.revisionId,
          gatewayConfigurationRevisionId: projection.transportRevision!.revisionId,
          protocol: projection.model!.protocol,
          terminalToolName: observed.terminalToolName,
          terminalStatus,
        }),
      });
    } catch (error) {
      lastRunFailure =
        error instanceof Error
          ? error.message.slice(0, 1_024)
          : String(error).slice(0, 1_024);
      if (live === current) void publishDescriptor(current).catch(() => undefined);
      if (runId !== undefined) {
        const pending = pendingRuns.get(runId);
        if (pending !== undefined) pendingRuns.delete(runId);
        await cancelRun(current, sessionKey, runId).catch(() => undefined);
      }
      throw error;
    } finally {
      if (runId !== undefined) pendingRuns.delete(runId);
    }
  };

  const readiness = async (): Promise<SubjectCognitionRuntimeReadiness> => {
    const blockers: SubjectBlocker[] = [];
    if (boundSubjectId === undefined) {
      blockers.push({
        code: "subject.cognition_subject_unbound",
        detail:
          "The Product Host has not bound current Subject identity to the runtime",
      });
    } else {
      try {
        const projection = await readProjection(boundSubjectId, true);
        const fingerprint = projectionFingerprint(projection);
        if (live === undefined || lifecycle !== "READY") {
          blockers.push({
            code: "subject.cognition_runtime_unavailable",
            detail: "The owned Subject OpenClaw Gateway is not protocol-ready",
          });
        } else if (live.fingerprint !== fingerprint) {
          blockers.push({
            code: "subject.cognition_runtime_stale",
            detail:
              "The owned Subject OpenClaw Gateway does not match the current effective configuration",
          });
        }
      } catch (error) {
        const problem = asRecord(error)?.problem;
        const problemValue = asRecord(problem);
        blockers.push({
          code:
            typeof problemValue?.problemCode === "string"
              ? problemValue.problemCode
              : "subject.cognition_runtime_unavailable",
          detail:
            error instanceof Error
              ? error.message
              : "Subject cognition runtime is unavailable",
        });
      }
    }
    return Object.freeze({
      schemaVersion: 1,
      state: blockers.length === 0 ? "READY" : "BLOCKED",
      blockers: Object.freeze(blockers),
    });
  };

  const stop = (): Promise<void> => {
    if (stopPromise !== undefined) return stopPromise;
    closed = true;
    if (recoveryTimer !== undefined) {
      clearTimeout(recoveryTimer);
      recoveryTimer = undefined;
    }
    lifecycle = "STOPPING";
    rejectPendingRuns(
      cognitionProblem(
        "subject.cognition_runtime_unavailable",
        "Subject cognition runtime is stopping",
        "The Product Host is closing the owned Subject OpenClaw run domain",
        "conflict",
        "manual",
      ),
    );
    stopPromise = enqueueTransition(async () => {
      const current = live;
      live = undefined;
      if (current !== undefined) await stopLive(current);
      await removeDescriptor();
      lifecycle = "STOPPED";
    });
    return stopPromise;
  };

  return Object.freeze({
    bindSubject(subjectId: SubjectId) {
      boundSubjectId = subjectId;
    },
    start,
    stop,
    runConversationReaction,
    readiness,
  });
}
