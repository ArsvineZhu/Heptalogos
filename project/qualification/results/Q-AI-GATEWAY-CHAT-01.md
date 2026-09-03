# Q-AI-GATEWAY-CHAT-01 Gateway Chat qualification

qualificationId: Q-AI-GATEWAY-CHAT-01
plan: project/plans/active/product/gateway-first-airuntime-external-integration-posture-2026-09-03.md
date: 2026-09-03
evidenceStatus: BLOCKED
implementationQualification: PASS
liveGatewayQualification: BLOCKED
testedProperty: Gateway-first AIRuntime selection, OpenAI-family Chat/Responses protocol mechanics, scoped bearer-token transport, structured output, and Product Host persistence

## Environment and implementation evidence

platform: Windows
shell: PowerShell
node: v24.20.0
pnpm: 11.24.0
postgres: PostgreSQL 18.6
postgresToolchain: tmp/pg/extracted/pgsql/bin
preChangeGitRevision: a5287a01b42e3d09f445e96982caf6842ed74674
productGeneration: fd896fe7b3c1a3e4fd072bd73d53e62353323822dff9fd7f64ea1629e42a92bc
bootstrapRuntimeGeneration: 717b3ab130bfcc5a85a8aff330436ca1027e4790e7fafac91502063e96115ca6
aiSdk: ai 7.0.91
chatAdapter: @ai-sdk/openai-compatible 3.0.43
responsesAdapter: @ai-sdk/open-responses 2.0.38
configurationDefinition: ai.gateway.transport.v1
secretPurpose: ai.gateway.bearer-token
secretConsumer: system.ai-runtime
secretScope: gateway-profile
protocols: [openai-chat, openai-responses]
bindings: [subject.primary, subject.expression]

The local real-SDK fixture is PASS:

    HEPTALOGOS_TEST_PG_BIN=tmp/pg/extracted/pgsql/bin
    pnpm nx run model-gateway-integration:test --skip-nx-cache

It used one loopback GatewayProfile and a bounded local HTTP fixture. The
installed Chat adapter sent one POST to /v1/chat/completions and the installed
Responses adapter sent one POST to /v1/responses. Both requests used the
explicit scoped gateway bearer token; the same fixture exercised SecretService
replacement, exact-scope rejection, and revocation (with readiness blocked
after revocation). Results passed the current output schema and retained
protocol, model, gateway, and configuration-revision metadata.

The built Product Host process proof is PASS:

    HEPTALOGOS_TEST_PG_BIN=tmp/pg/extracted/pgsql/bin
    pnpm nx run product-host-integration:test --skip-nx-cache

It verified Management plan/execute, URL canonicalization and destination
immutability, redacted protected-secret planning, both model protocol entries,
both current Subject bindings, readiness, stale-plan rejection, and persistence
across a built Host restart. No third-party process was started.

## Required live NewAPI to DeepSeek Chat claim

gateway: NewAPI
upstream_model: DeepSeek model configured in NewAPI
protocol: openai-chat
gateway_base_url: NOT_SUPPLIED
model_identifier: NOT_SUPPLIED
gateway_profile_id: NOT_RUN
model_profile_id: NOT_RUN
model_profile_generation: NOT_RUN
model_binding_id: NOT_RUN
model_binding_revision: NOT_RUN
configuration_revision_id: NOT_RUN
lineage_evidence_refs: NOT_RUN
protected_gateway_token: BLOCKED
live_request: NOT_RUN
live_structured_output: NOT_RUN
live_evidence: BLOCKED

The current execution supplied no gateway base URL, model identifier, or
protected gateway token, so the required live NewAPI-to-DeepSeek Chat claim is
BLOCKED. It is not inferred from the local fixture or Product Host process
proof. No NewAPI instance was installed, spawned, configured, or administered,
and no token, upstream key, authorization header, or gateway response body is
recorded here.

The optional live NewAPI Responses compatibility claim remains NOT_RUN. This
record does not qualify another platform, a source-less artifact, NewAPI
administration, upstream-provider-wide behavior, or OpenClaw/FFmpeg lifecycle.
