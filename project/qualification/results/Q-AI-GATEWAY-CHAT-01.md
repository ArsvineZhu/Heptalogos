# Q-AI-GATEWAY-CHAT-01 Gateway Chat qualification

qualificationId: Q-AI-GATEWAY-CHAT-01
plan: project/plans/active/product/gateway-first-airuntime-external-integration-posture-2026-09-03.md
date: 2026-09-04
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
productGeneration: d93dcd2afdf651f7dd873a5cb99affe65417dd314b3f377625332e37275bcda5
bootstrapRuntimeGeneration: 717b3ab130bfcc5a85a8aff330436ca1027e4790e7fafac91502063e96115ca6
aiSdk: ai 7.0.91
chatAdapter: @ai-sdk/openai-compatible 3.0.43
responsesAdapter: @ai-sdk/open-responses 2.0.38
jsonInstructionHelper: @ai-sdk/provider-utils 5.0.36
configurationDefinition: ai.gateway.transport.v1
secretPurpose: ai.gateway.bearer-token
secretConsumer: system.ai-runtime
secretScope: gateway-profile
protocols: [openai-chat, openai-responses]
bindings: [subject.primary, subject.expression]

The bounded review correction was executed against base revision
`b4631251d99e2983472a1bf4ae664e042d7d8e17` in the uncommitted working tree.
The generated Product Host identity was regenerated from the current source
inputs; it is not a live-provider or release qualification.

The post-correction local implementation evidence is PASS:

    pnpm nx run ai-runtime:test --skip-nx-cache
    pnpm nx run network-access:test --skip-nx-cache
    pnpm nx run management:test --skip-nx-cache
    pnpm nx run canonical-schema:test --skip-nx-cache
    pnpm nx run ai-runtime:typecheck --skip-nx-cache
    pnpm nx run model-gateway-integration:test --skip-nx-cache
    pnpm nx run product-host-integration:test --skip-nx-cache

The focused correction assertions cover Chat broad-compatible `json_object`
output plus schema instruction and final validation, exact active transport
ConfigurationRevision fencing, expected-absent and stale resource semantics,
transactional generation/revision increments with stable binding identity,
full management postconditions, gateway-named migration identity, the actual
protected-token redaction assertion, and byte-preserving non-TTY token trim.

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
