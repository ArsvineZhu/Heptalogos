# One Real Provider Enablement — OpenAI Reference Route

state: ACTIVE
mode: RAPID_EVOLUTION / PRE_PRODUCTION
task_class: PRODUCT_IMPLEMENTATION
primary_outcome: one real OpenAI structured generation through current Product owners
source_spec: tmp/Heptalogos-One-Real-Provider-Enablement-OpenAI-Spec-2026-09-03.md

## Authorization

This is the installed active authorization for the user-provided source
specification. The source specification is the complete decision record. This
Plan permits only one vertical provider capability:

Administrator → Management SystemAction → active ConfigurationRevision →
protected SecretRef → NetworkAccess → OpenAI ProviderProfile / ModelProfile /
exact ModelBinding → AIRuntime InvocationSpec → AI SDK 7 + official OpenAI
provider → structured JSON → SchemaRuntime validation → GenerationResult +
Lineage/Evidence.

A live OpenAI credential is required for completion. If implementation and
local proof are green but protected live input is unavailable, record the live
provider claim as BLOCKED, keep this Plan ACTIVE, and stop. Never add a
plaintext fallback.

## Frozen route and owners

Use exactly providerKind openai, AI SDK 7, official @ai-sdk/openai, OpenAI
Responses API, origin https://api.openai.com, and path /v1/**. Use
createOpenAI({ apiKey, fetch }), explicit openai.responses(model), and
generateText with Output.object(jsonSchema(...)); set store=false. Do not use
the raw OpenAI SDK, compatible provider, gateway, custom base URL, proxy,
failover, handwritten Responses client, or generic provider registry.

Create exactly:

packages/system/configuration/ @heptalogos/configuration
packages/system/secret/ @heptalogos/secret
packages/system/network-access/ @heptalogos/network-access
packages/system/ai-runtime/ @heptalogos/ai-runtime

Ownership is fixed: Configuration owns definitions/revisions/activation and
effective value; Secret owns SecretRef metadata and material authorization;
NetworkAccess owns controlled Host-fenced HTTP policy/budgets; AIRuntime owns
ProviderProfile/ModelProfile/ModelBinding/InvocationSpec; Management owns
SystemAction/auth/read projections; Product Host only composes and exposes
HTTP/OpenAPI.

No provider-core, openai-provider, ai-common, system-actions, policy,
generic ApprovalService, generic ManagementOperation, or parallel framework
package is authorized.

## Current product scope

Implement only the current OpenAI route and the already-authorized next Subject
consumer boundary. Current ModelCapability values are text-generation,
structured-output, usage-metadata, and abort-timeout. InvocationBudget only
contains maxOutputTokens. Binding roles are subject.primary and
subject.expression. The current network identity is
network-access.openai-api.v1.

AIRuntime accepts only ephemeral provider-neutral system/user/assistant text
messages. It does not own Subject state, PromptProgram, Persona, Memory,
tools, MCP, streaming, files, embeddings, provider-hosted continuity, or
fallback providers.

Configuration implements immutable revisions, explicit activation, effective
resolution, and activation CAS for ai.provider.transport.v1. There is no
implicit active default or file watcher/import/export framework.

Secret reuses @heptalogos/os-credential, uses a distinct backend entry per
material write, keeps only package-private current locator mechanics, enforces
purpose/consumer/scope, and never persists, logs, returns, or falls back to
plaintext.

NetworkAccess admits only the OpenAI HTTPS origin, /v1/**, POST, no redirects,
active transport budgets, and effective deadline. The AI SDK custom fetch is a
thin adapter for the actual @ai-sdk/openai request forms and all traffic goes
through NetworkAccess.

AIRuntime persists only ProviderProfile, ModelProfile, and ModelBinding.
Runtime SDK/provider/model objects are process-local. Invocation resolves exact
enabled revisions, Secret, and configuration, uses Responses structured JSON
Schema, validates again through SchemaRuntime, and emits truthful
GenerationResult plus Lineage/Evidence. Failure emits no fake result.

## Management, Host, persistence, and projections

Extend the existing Management SystemAction path for exactly:

configuration.revision.create, configuration.activate, secret.set,
secret.replace, secret.revoke, provider-profile.set, model-profile.set, and
model-binding.set.

Planning is side-effect-free and captures normalized input digest, current
preconditions, impact, and plan digest. Execution re-authenticates, repeats
normalization, recomputes from current state, requires exact digest equality,
invokes the owning Service, and verifies the postcondition. No plan cache,
durable approval store, operation store, or dynamic action runtime.

Add authenticated reads for definitions, revisions/activation, secret metadata,
ProviderProfiles, ModelProfiles, ModelBindings, AIRuntime readiness, and the
current NetworkAccess profile/diagnostics. Host health remains independent of
provider readiness.

Extend existing Product Host composition, regenerate the existing Hey API
ManagementClient, and extend the existing oclif CLI. The CLI remains
ManagementClient-only; protected secret input never enters argv/output.
Persist only configuration revisions/activation, secret metadata/current
backend locator, provider profiles, model profiles, and model bindings.
Reuse PersistenceService, TimeService, SchemaRuntime, Lineage, Evidence,
Host fence, and existing Runtime/MicroSystem mechanics.

## Required proof and stop

Focused proof must cover owner contracts, Management plan purity/staleness and
secret containment, generated API/client/CLI boundaries, and the existing
Product Host configure/restart scenario. Extend integration/product-host; do
not create a second Host. No Subject is created by this scenario.

Add the manually run, non-verify harness at integration/provider-openai/ using
protected stdin/TTY, the real current-profile OS credential backend, the
qualification model and bounded schema from the source specification. Record
only claim-relevant metadata/digests in
project/qualification/results/Q-PROVIDER-OPENAI-01.md. Never record keys,
authorization headers, raw locators, or unnecessary provider bodies.

Run focused tests/typechecks and the existing Product Host integration target,
then pnpm check:repo and pnpm verify. Live provider qualification runs
separately and is not part of normal pnpm verify.

Mark this Plan COMPLETED only when all owner implementations, Management/API/
client/CLI projections, Product Host configure/restart proof, Secret
containment, NetworkAccess enforcement, structured output and SchemaRuntime,
stale binding rejection, focused verification, repository gates, and
Q-PROVIDER-OPENAI-01 live call are PASS. Any material owner/provider/durable/
failure decision outside this Plan is PLAN_GAP.

On completion set providerPrerequisites to COMPLETED,
activeProductImplementationPlan and currentProductWork to NONE, and
nextEligibleProductWork to persistent Subject + built-in Subject Chat. Move
this Plan to project/plans/completed/product/ and STOP. Do not start Subject,
a second provider, stabilization, cleanup, or release qualification here.
