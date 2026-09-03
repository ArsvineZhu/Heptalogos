# Gateway-First AIRuntime + External Integration Posture

**State:** `ACTIVE`  
**Mode:** `RAPID_EVOLUTION / PRE_PRODUCTION`  
**Task class:** `PRODUCT_IMPLEMENTATION + CURRENT-AUTHORITY_CORRECTION`  
**Date:** `2026-09-03`  
**Primary outcome:** replace the accidental OpenAI-vendor-specific AIRuntime implementation with a gateway-first OpenAI-protocol boundary, complete both Chat Completions and Responses mechanics, document the external-integration product posture, and prove one real NewAPI → DeepSeek model path  
**Recommended model gateway:** NewAPI  
**Default distribution posture:** external software is not bundled, downloaded, installed, updated, or lifecycle-managed by Heptalogos unless a future Plan explicitly authorizes that responsibility  
**Next eligible Product work after PASS:** Persistent Subject L4 Vertical Slice

This file is the complete executable Plan. Install this file itself as the active
Plan. Do not replace it with an Agent-authored summary or a pointer back to `tmp/`.

---

# 0. Executive decision

The previous implementation answered the wrong question.

The Product needs model inference. The current Product requirement is not:

```text
Heptalogos must directly implement OpenAI
Heptalogos must directly implement DeepSeek
Heptalogos must accumulate provider adapters
```

The current Product requirement is:

```text
Heptalogos
→ one configured model gateway endpoint
→ an OpenAI-family invocation protocol
→ a configured model identifier
→ structured generation
```

A gateway may internally route to:

```text
OpenAI
DeepSeek
Anthropic
Gemini
Qwen
another commercial service
a local model service
another OpenAI-compatible upstream
```

That routing is not Heptalogos Product Authority.

The preferred external gateway for current product guidance and live qualification
is **NewAPI**. NewAPI is not Heptalogos semantic state, is not a Host MicroSystem,
and is not a required bundled artifact.

The normal architecture is:

```text
                         Heptalogos Product Authority

Subject consumer
      │
      ▼
 ModelBinding
      │
      ▼
 ModelProfile
      │
      ├── modelIdentifier
      └── protocol = OPENAI_CHAT | OPENAI_RESPONSES
      │
      ▼
 GatewayProfile
      │
      ├── baseUrl
      ├── optional bearer-token SecretRef
      └── enabled
      │
      ▼
  AIRuntime
      │
      ├── AI SDK Chat mechanics
      └── AI SDK Responses mechanics
      │
      ▼
 NetworkAccess
      │
      ▼
configured external endpoint
      │
      ▼
     NewAPI                     ← recommended, not Product Authority
      │
      ├── provider credentials
      ├── upstream/channel configuration
      ├── model mapping
      ├── routing/load balancing
      ├── retries/failover
      └── protocol/provider adaptation
      │
      ▼
real upstream model provider
```

A user may configure another compatible gateway or a compatible direct endpoint.
`GatewayProfile` therefore MUST NOT encode `newapi`, `openai`, `deepseek`, or another
gateway/vendor brand as Product semantics.

---

# 1. Why this is a semantic correction, not another infrastructure phase

The repository already contains implemented current owners for:

```text
Configuration
Secret
NetworkAccess
AIRuntime
Management
Product Host
ManagementClient
CLI
```

The previous one-provider implementation accidentally collapsed these concepts:

```text
Product model gateway
OpenAI vendor
OpenAI Responses protocol
OpenAI API host
OpenAI credential
```

into one hard-coded route.

That is incorrect because the already-approved semantic chain:

```text
ModelBinding
→ ModelProfile
→ provider/protocol provenance
```

exists specifically so Subject identity and Product configuration do not become
vendor identities.

This Plan directly rewrites that still-unclosed PRE_PRODUCTION shape.

Do not introduce compatibility layers for the OpenAI-only development state.

Do not perform a generalized cleanup of the four packages. Correct only current
semantics and the knowledge/documents that express them.

---

# 2. Execution rules

Start from:

```text
AGENTS.md
INDEX.md
README.md
```

Then read the Project Charter, this Plan, affected Specs/package docs/current code.

The governing engineering interpretation for this task is:

```text
Preserve semantics, minimize machinery.
Prefer mature libraries over custom generic infrastructure.
Do not optimize for minimal diffs or minimal dependency count.
No current consumer is not, by itself, a deletion reason.
Future semantic seams may exist early; future machinery needs current evidence.
Do not preserve legacy paths, compatibility layers, or migrations without a real
compatibility obligation.
History does not create requirements.
Tests protect meaningful contracts and risks, not implementation rituals.
Tests must not force DI, factories, mocks, hooks, or architecture solely for
testability.
Evidence proves concrete claims; it does not create certification bureaucracy.
Avoid speculative recovery, fallback, abstraction, state, frameworks, registries,
matrices, and meta-tooling.
After acceptance criteria pass, STOP.
```

Rule of thumb:

```text
If it did not exist today, would current requirements independently justify adding
it?

NO → do not add it.
YES → implement it directly.
```

---

# 3. Plan installation and supersession

Install this exact file as:

```text
project/plans/active/product/
  gateway-first-airuntime-external-integration-posture-2026-09-03.md
```

The existing OpenAI-only active provider Plan is `SUPERSEDED`.

Any not-yet-installed direct OpenAI+DeepSeek proposal in `tmp/` is not an active
Plan and must not be implemented.

There MUST be exactly one active Product Plan after installation.

Update:

```text
project/plans/INDEX.md
project/roadmap/development-roadmap.md
```

to show:

```yaml
providerPrerequisites: IN_PROGRESS
activeProductImplementationPlan: gateway-first-airuntime
currentProductWork: gateway-first AIRuntime + OpenAI Chat/Responses + live gateway proof
nextEligibleProductWork: Persistent Subject L4 Vertical Slice
```

No separate correction/stabilization/closure Plan is authorized.

---

# 4. Required current context

Read current versions of:

```text
AGENTS.md
INDEX.md
README.md
packages/AGENTS.md

project/governance/project-charter.md
project/plans/README.md
project/plans/INDEX.md
project/roadmap/development-roadmap.md

docs/README.md
docs/product/README.md
docs/product/product-shape.md
docs/product/product-goals.md
docs/architecture/README.md
docs/architecture/ai-runtime.md
docs/architecture/machine-operations.md

project/dependencies/dependency-routing.json
project/dependencies/decision-ledger.md
project/dependencies/implementation-routing.md
project/qualification/dependency-status.json

specs/system/configuration.md
specs/system/secret.md
specs/system/network-access.md
specs/system/ai-runtime.md
specs/management/system-authority.md
specs/subject/subject-base.md

packages/data/canonical-schema/src/migrations/
  0002-product-provider-prerequisites.ts

packages/system/configuration/**
packages/system/secret/**
packages/system/network-access/**
packages/system/ai-runtime/**
packages/system/management/**

packages/application/product-host/**
packages/application/management-client/**
packages/application/cli/**

integration/product-host/**
integration/provider-openai/**

pnpm-workspace.yaml
pnpm-lock.yaml
```

Read broader history only if a concrete current fact cannot be resolved from current
Authority.

---

# 5. External Integration product posture

This Plan closes a documentation gap that applies beyond models.

Heptalogos may recommend third-party software and provide first-class adapters,
configuration guidance, diagnostics, and integration contracts without owning that
software's installation or lifecycle.

The default rule is:

```text
Heptalogos Product
→ recommends suitable external software
→ documents installation/configuration
→ provides official Heptalogos-side integration
→ detects/configures the boundary it actually consumes

External software
→ installed by the operator/user
→ owns its own files/state/database/configuration
→ owns its own upgrade lifecycle
→ owns its own privileged/provider credentials where applicable
```

Current examples:

| Capability | Recommended external implementation | Heptalogos owns | External software owns |
|---|---|---|---|
| Model gateway | NewAPI | GatewayProfile, ModelProfile, ModelBinding, gateway token SecretRef, invocation semantics | provider credentials, channels, routing, provider adaptation, upstream model management |
| Machine Operations | OpenClaw | Management/CLI/tools/skills integration contracts | privileged runtime, machine credentials, workspace, model config, process/lifecycle |
| Audio/video mechanics | FFmpeg | bounded AV invocation adapter/capability semantics when implemented | executable installation and its own release lifecycle |

Default Product distribution therefore does NOT imply:

```text
bundled NewAPI
bundled OpenClaw
vendored FFmpeg
automatic third-party downloader
third-party updater
third-party process supervisor
third-party configuration mirror
third-party database ownership
```

A future distribution Plan may explicitly choose to bundle or acquire one of these.
That would be a new responsibility and must independently close licensing,
platform, acquisition, integrity, update, and lifecycle questions.

Do NOT create a generic:

```text
ExternalSoftwareManager
ExternalToolRegistry
ThirdPartyRuntimeSupervisor
IntegrationInstaller
DownloadCenter
```

from this posture.

---

# 6. Model-gateway semantic model

## 6.1 Rename the current semantic object

Replace current `ProviderProfile` with:

```ts
interface GatewayProfile {
  readonly schemaVersion: 1;
  readonly gatewayProfileId: GatewayProfileId;
  readonly baseUrl: string;
  readonly apiTokenSecretRef?: SecretRef;
  readonly enabled: boolean;
}
```

Use the semantic names:

```text
GatewayProfile
GatewayProfileId
gatewayProfileId
gatewayProfiles
gateway-profile.set
```

Do not retain `ProviderProfile` aliases.

The rename is justified because the Product is configuring the inference endpoint it
calls, not the vendor that ultimately executes the model.

## 6.2 Stable identity

`GatewayProfileId` is required because it is referenced by:

```text
ModelProfile
Secret scope
Management target/precondition
Lineage/Evidence
```

The `baseUrl` is immutable for one `GatewayProfileId`.

Reason:

```text
GatewayProfileId
→ scopes bearer-token authority
→ exact configured external destination
```

Changing the destination under the same identity could authorize an existing bearer
token for a different external service.

To change endpoint/base URL:

```text
create a new GatewayProfile
→ set its token
→ point ModelProfile at it
```

Do not create endpoint migration state.

## 6.3 Base URL

`baseUrl` represents the OpenAI-family API prefix, normally ending in `/v1`.

Examples:

```text
http://127.0.0.1:3000/v1
https://gateway.example.com/v1
https://api.openai.com/v1
```

Canonicalization must:

```text
require absolute http/https URL
reject embedded username/password
remove trailing slash
preserve an explicit path prefix such as /v1
```

Current network policy:

```text
HTTP  → permitted only for literal loopback hosts
HTTPS → permitted for remote hosts
```

Current literal loopback forms:

```text
localhost
127.0.0.1
[::1]
```

Do not add DNS-resolution/rebinding machinery in this Plan.

A future explicit LAN/insecure transport requirement may revise this policy.

## 6.4 Authentication

Gateway authentication is currently:

```text
optional Bearer token
```

`apiTokenSecretRef` absent means the endpoint is configured without authorization.

When present, the Secret MUST have:

```text
consumer = system.ai-runtime
purpose  = ai.gateway.bearer-token
scope    = GatewayProfileId
```

This supports recommended NewAPI tokens and compatible endpoints without making
SecretService understand provider vendors.

Do not store an OpenAI/DeepSeek/Anthropic upstream API key merely because NewAPI uses
one internally. When NewAPI is the gateway, those credentials are NewAPI-owned.

---

# 7. ModelProfile semantic model

Replace current provider-vendor fields with:

```ts
type ModelInvocationProtocol =
  | "openai-chat"
  | "openai-responses";

interface ModelProfile {
  readonly schemaVersion: 1;
  readonly modelProfileId: ModelProfileId;
  readonly gatewayProfileId: GatewayProfileId;
  readonly modelIdentifier: string;
  readonly protocol: ModelInvocationProtocol;
  readonly consumedCapabilities: readonly ModelCapability[];
  readonly generation: number;
}
```

Current capabilities remain exactly:

```text
text-generation
structured-output
usage-metadata
abort-timeout
```

`modelIdentifier` is the string understood by the configured gateway.

It may be:

```text
a real upstream model id
a NewAPI model name
a NewAPI model mapping/alias
another gateway-defined model identifier
```

Heptalogos does not infer the upstream provider from that string.

Do not add:

```text
upstreamProvider
providerKind
channelId
provider credential
provider route priority
provider fallback
```

to ModelProfile.

A ModelProfile replacement under the same identity increments `generation`.

A protocol change is a ModelProfile replacement and increments generation.

---

# 8. ModelBinding remains the model-selection Authority

Keep exactly:

```text
subject.primary
subject.expression
```

A binding points only to `ModelProfileId`.

Both roles may use:

```text
the same ModelProfile
different ModelProfiles on the same GatewayProfile
different ModelProfiles on different GatewayProfiles
different OpenAI-family protocols
```

Do not create a global active gateway or global active provider.

AIRuntime resolves from binding:

```text
ModelBinding
→ ModelProfile
→ GatewayProfile
```

There is no fallback chain.

---

# 9. InvocationSpec and GenerationResult

Keep current provider-neutral runtime messages and structured invocation semantics.

Current `InvocationSpec` must include the already-implemented concrete inputs:

```ts
interface InvocationSpec {
  readonly schemaVersion: 1;
  readonly invocationId: InvocationId;
  readonly ownerActivityRef: ActivityId;
  readonly modelBindingId: ModelBindingId;
  readonly expectedBindingRevision: number;
  readonly contextProjection: CanonicalJsonValue;
  readonly messages: readonly AIRuntimeMessage[];
  readonly objective: string;
  readonly outputSchema: CanonicalJsonValue;
  readonly budget: InvocationBudget;
  readonly deadline?: Instant;
  readonly lineageContextRef: LineageContextRef;
}
```

Current budget remains:

```ts
interface InvocationBudget {
  readonly maxOutputTokens: number;
}
```

`GenerationResult` should describe Product-relevant provenance, not vendor branding:

```ts
interface GenerationResult {
  readonly schemaVersion: 1;
  readonly invocationId: InvocationId;
  readonly bindingRevision: number;

  readonly gatewayProfileId: GatewayProfileId;
  readonly modelProfileId: ModelProfileId;
  readonly modelProfileGeneration: number;
  readonly modelIdentifier: string;
  readonly protocol: ModelInvocationProtocol;

  readonly configurationRevisionId: ConfigurationRevisionId;

  readonly candidate: CanonicalJsonValue;
  readonly usage?: UsageMetadata;

  readonly lineageContextRef: LineageContextRef;
  readonly evidenceRefs: readonly EvidenceRef[];
}
```

Do not persist AI SDK provider/model objects.

Do not turn the actual upstream provider reported by NewAPI into canonical Product
identity.

If gateway response metadata happens to contain upstream information, it may be
bounded diagnostic/evidence metadata only when useful and safely available. Do not
make it required for current correctness.

---

# 10. Configuration

Rename the current definition:

```text
ai.provider.transport.v1
```

to:

```text
ai.gateway.transport.v1
```

Directly rewrite the current PRE_PRODUCTION definition and tests. No alias.

Keep the current transport configuration shape unless implementation reveals a
real current defect:

```ts
interface GatewayTransportConfigV1 {
  readonly schemaVersion: 1;
  readonly timeoutMs: number;
  readonly requestBodyBudgetBytes: number;
  readonly responseBodyBudgetBytes: number;
  readonly expandedResponseBodyBudgetBytes: number;
}
```

This remains one Installation-level managed configuration consumed by:

```text
system.network-access
system.ai-runtime
```

AIRuntime resolves the currently active revision at invocation.

Do not store a duplicate `configurationRevisionRef` in every GatewayProfile and
ModelProfile merely to mirror transport configuration.

The exact ConfigurationRevision actually used is recorded in GenerationResult /
Lineage/Evidence.

Do not redesign transfer/decompression accounting in this Plan unless the real
gateway route exposes a correctness failure.

---

# 11. Library-first AI mechanics

The current Product supports two protocol families, not vendor packages.

Use:

```text
ai
@ai-sdk/openai-compatible
@ai-sdk/open-responses
```

Remove current direct Product dependency on:

```text
@ai-sdk/openai
```

unless execution finds a concrete capability in the current Chat/Responses contract
that the two generic packages cannot provide.

Do not retain it merely because it was already implemented.

## 11.1 OpenAI Chat Completions

For:

```text
protocol = openai-chat
```

use current stable:

```text
@ai-sdk/openai-compatible
createOpenAICompatible(...)
```

with:

```text
name: private process-local identifier
baseURL: GatewayProfile.baseUrl
apiKey: resolved bearer token when configured
fetch: NetworkAccess-controlled fetch
```

Use its chat/language model materialization with `ModelProfile.modelIdentifier`.

Set:

```text
maxRetries = 0
```

at AIRuntime invocation.

Do not use AI SDK's environment-variable examples. The configured token is passed
explicitly from SecretService.

For the current broad-compatible route, do not require native JSON-schema enforcement
from the gateway/provider. AIRuntime still uses AI SDK structured-object mechanics
and SchemaRuntime performs canonical final validation.

## 11.2 OpenAI Responses

For:

```text
protocol = openai-responses
```

use current stable:

```text
@ai-sdk/open-responses
createOpenResponses(...)
```

with endpoint:

```text
GatewayProfile.baseUrl + "/responses"
```

and:

```text
apiKey: resolved bearer token when configured
fetch: NetworkAccess-controlled fetch
```

Use `ModelProfile.modelIdentifier`.

Set:

```text
maxRetries = 0
```

The current Product does not use:

```text
previous_response_id as persistent Subject state
provider/gateway conversation ownership
provider-hosted Subject state
tools
web search
file search
computer use
```

Responses is an invocation protocol, not Subject memory Authority.

## 11.3 Structured output

For both protocols:

```text
AI SDK structured-object mechanics
→ JSON Schema supplied by InvocationSpec
→ returned candidate
→ SchemaRuntime/Ajv canonical validation
```

Do not add Zod.

Do not handwrite OpenAI Chat or Responses codecs.

Do not implement Chat↔Responses translation in Heptalogos.

When a gateway such as NewAPI performs protocol conversion internally, that is
gateway-owned mechanics and may have compatibility limits.

---

# 12. Why NewAPI is recommended but not canonical

At authoring time, current NewAPI upstream documentation exposes:

```text
POST /v1/chat/completions
POST /v1/responses
```

and supports multiple upstream model/channel formats and routing.

NewAPI also owns provider-specific/channel-specific compatibility behavior.

Its current documentation and repository show that not every upstream/channel has
identical Responses capability, and Responses↔Chat conversion continues to evolve.

Therefore Heptalogos MUST represent:

```text
ModelProfile.protocol
```

explicitly.

Do NOT assume:

```text
if Chat works, Responses must work for the same model/channel
```

The operator configures a ModelProfile protocol that the selected gateway/model route
actually supports.

NewAPI recommendation belongs to documentation and integration guidance, not
`GatewayProfile` state.

---

# 13. NetworkAccess

NetworkAccess owns controlled Host-originated transport, not model-gateway domain
state.

Remove the fixed:

```text
network-access.openai-api.v1
https://api.openai.com
```

Product assumption.

Do not replace it with a NewAPI-only profile.

The current AIRuntime network authorization input is derived from the selected
canonical `GatewayProfile`.

A narrow current internal shape may be:

```ts
interface GatewayNetworkTarget {
  readonly gatewayProfileId: GatewayProfileId;
  readonly baseUrl: URL;
}
```

or a semantics-equivalent private representation.

The boundary must enforce:

```text
requester = system.ai-runtime
destination origin matches configured GatewayProfile baseUrl
destination path is below configured base path
current protocol endpoint only
POST
redirects DENY
credential header only to exact configured origin
configured body/response budgets
timeout/deadline
AbortSignal
```

For `openai-chat`, the allowed generated endpoint is the gateway base path's
Chat Completions route.

For `openai-responses`, the allowed generated endpoint is the gateway base path's
Responses route.

Do not implement:

```text
dynamic NetworkAccess CRUD
gateway registry
proxy fleet
VPN
service mesh
retry engine
DNS security framework
gateway health daemon
```

`GatewayProfile` is the canonical configured destination. NetworkAccess enforces
that destination; it does not re-own it.

---

# 14. SecretService

Change current AI gateway secret purpose from:

```text
provider.openai.api-key
```

to:

```text
ai.gateway.bearer-token
```

No compatibility alias.

The current authorization is:

```text
consumer = system.ai-runtime
purpose  = ai.gateway.bearer-token
scope.resourceKind = gateway-profile
scope.resourceId   = GatewayProfileId
```

Keep current Secret lifecycle/backend mechanics.

Do not create:

```text
NewAPI secret type
OpenAI key type
DeepSeek key type
credential scheme registry
gateway credential plugin system
```

When NewAPI is used:

```text
Heptalogos SecretService
→ stores only the token used by Heptalogos to call NewAPI

NewAPI
→ stores/configures the real DeepSeek/OpenAI/etc upstream credentials
```

Do not mirror NewAPI channel credentials into Heptalogos.

---

# 15. AIRuntime readiness

Readiness is binding-driven.

For each current required role:

```text
ModelBinding exists and enabled
→ referenced ModelProfile exists
→ referenced GatewayProfile exists and enabled
→ configured protocol is implemented
→ active ai.gateway.transport.v1 revision exists
→ optional configured gateway SecretRef is ACTIVE and resolvable
→ NetworkAccess can authorize the exact gateway/protocol endpoint
```

If both current roles resolve, AIRuntime is READY.

Valid states include:

```text
primary and expression use same gateway/model
primary and expression use different models on one gateway
primary and expression use different gateways
primary uses Chat, expression uses Responses
primary uses Responses, expression uses Chat
```

Do not create:

```text
gateway selection service
provider selection service
fallback
priority
health polling
readiness matrix
```

Unused GatewayProfiles do not block readiness.

---

# 16. Management contract

Replace current action identity:

```text
provider-profile.set
```

with:

```text
gateway-profile.set
```

No alias.

Current action set becomes:

```text
configuration.revision.create
configuration.activate

secret.set
secret.replace
secret.revoke

gateway-profile.set
model-profile.set
model-binding.set
```

Increment the current SystemAction catalog revision as required by the changed current
contract.

## 16.1 gateway-profile.set

Current semantic input:

```ts
interface GatewayProfileSetActionInput {
  readonly gatewayProfileId?: string;
  readonly baseUrl: string;
  readonly apiTokenSecretRef?: SecretRef;
  readonly enabled: boolean;
}
```

Create:

```text
no gatewayProfileId
→ generate new GatewayProfileId
→ canonicalize/validate baseUrl
```

Update:

```text
gatewayProfileId exists
→ baseUrl must match existing immutable baseUrl
→ token ref and enabled may change
```

To obtain a secret scoped to a stable identity, the normal flow is:

```text
create disabled GatewayProfile without token
→ receive GatewayProfileId
→ secret.set scoped to GatewayProfileId
→ gateway-profile.set attaches SecretRef and enables
```

## 16.2 model-profile.set

Current semantic input:

```ts
interface ModelProfileSetActionInput {
  readonly modelProfileId?: string;
  readonly gatewayProfileId: string;
  readonly modelIdentifier: string;
  readonly protocol: "openai-chat" | "openai-responses";
  readonly consumedCapabilities: readonly ModelCapability[];
}
```

Remove:

```text
providerProfileId
providerModelIdentifier
configurationRevisionRef
```

from the current semantic shape.

## 16.3 Read models

Management Product state exposes:

```text
configuration
secrets
gatewayProfiles
modelProfiles
modelBindings
network diagnostics
AIRuntime readiness
```

Do not expose NewAPI internal channels/providers/keys through current Management.

Regenerate ProductHost OpenAPI and generated ManagementClient through the current
generator. Do not hand-edit generated output.

---

# 17. Reference CLI

Update current provider-oriented CLI language to gateway-oriented language.

Required current capability:

```text
inspect gateway/model/binding/readiness state

create/update GatewayProfile
set/replace/revoke optional gateway bearer token through protected input
create/update ModelProfile with protocol
set subject.primary / subject.expression ModelBinding
```

No plaintext token in argv/stdout/stderr.

The normal user journey documented by the CLI/help should be:

```text
1. Prepare a compatible external model endpoint.
2. Heptalogos recommends NewAPI for multi-provider gateway use.
3. Configure GatewayProfile baseUrl.
4. Add its bearer token when required.
5. Configure ModelProfile modelIdentifier + protocol.
6. Bind current Subject roles.
```

Do not implement:

```text
NewAPI installer
NewAPI updater
NewAPI channel-management CLI
DeepSeek credential CLI
OpenAI credential CLI
gateway provider enumeration
```

---

# 18. Canonical durable schema

The current provider-prerequisite database shape was introduced by the still-unclosed
provider work.

Rewrite the current target migration directly:

```text
packages/data/canonical-schema/src/migrations/
  0002-product-provider-prerequisites.ts
```

Do not add an `0003` compatibility correction merely because the wrong OpenAI-only
shape briefly existed in development.

Rename:

```text
provider_profile
→ gateway_profile
```

Current `gateway_profile` target shape:

```text
gateway_profile_id UUID primary key
base_url TEXT
api_token_secret_ref UUID nullable → secret_metadata(secret_id)
enabled BOOLEAN
lineage_context_ref JSONB
```

Required constraints:

```text
GatewayProfileId UUIDv7 shape
base_url non-empty and bounded
api_token_secret_ref nullable
```

Application/schema validation owns URL canonical syntax rules that are not sensible
to duplicate in SQL.

Current `model_profile` becomes:

```text
model_profile_id
gateway_profile_id → gateway_profile
model_identifier
protocol
consumed_capabilities
generation
lineage_context_ref
```

`protocol` CHECK:

```text
openai-chat
openai-responses
```

Keep current ModelBinding table semantics with `model_profile_id`.

Remove current durable concepts that no longer have Product meaning:

```text
provider kind
provider settings
provider network profile ref
ModelProfile configuration revision ref
```

Do not create:

```text
legacy provider_profile view
data converter
old-column reader
dual schema
upcaster
backfill
compatibility migration
```

Development databases/fixtures may be recreated.

Update `CanonicalDatabase` typing directly.

---

# 19. Package boundaries

Do not create a new gateway package solely for naming symmetry.

Keep semantic ownership:

```text
@heptalogos/configuration
  → gateway transport configuration

@heptalogos/secret
  → SecretRef lifecycle/resolution

@heptalogos/network-access
  → controlled outbound HTTP

@heptalogos/ai-runtime
  → GatewayProfile
  → ModelProfile
  → ModelBinding
  → InvocationSpec
  → AI SDK protocol materialization
```

Management remains projection/orchestration over the owning services.

No:

```text
gateway-core
gateway-provider
provider-registry
protocol-registry
model-router
newapi-adapter package
```

is authorized.

A private helper inside AIRuntime that selects Chat vs Responses mechanics is enough.

---

# 20. Product Host composition

Keep the four existing Product services composed by Product Host.

Do not make an external model gateway a child process or RuntimeKernel MicroSystem.

Product Host startup remains valid with no configured gateway:

```text
Product Host       READY when its own prerequisites are ready
Management         READY
AIRuntime          BLOCKED
Subject later      BLOCKED if it requires AIRuntime
```

NewAPI availability does not determine Host process health.

AIRuntime invokes the configured endpoint on demand.

Do not add:

```text
gateway process spawn
gateway PID tracking
gateway Desired/Actual state
gateway watchdog
gateway auto-restart
gateway update check
```

---

# 21. External-integration documentation gap closure

This Plan explicitly authorizes current documentation correction.

Current Authority must stop implying that selected external software is necessarily
vendored or bundled.

## 21.1 Create product posture page

Create:

```text
docs/product/external-integrations.md
```

Write it in the repository's current human-facing documentation language/style.

It owns the Product-level rule:

```text
external capability software is normally operator-installed and independently owned;
Heptalogos recommends implementations and supplies integration guidance/adapters
without assuming distribution/lifecycle ownership.
```

Cover at least:

### Model Gateway

```text
role: model aggregation/protocol endpoint
recommended: NewAPI
required by Heptalogos: compatible endpoint + optional bearer token + usable model
protocol
not owned: upstream provider keys/channels/routing/NewAPI DB/process/update lifecycle
```

### Machine Operations

```text
role: external machine/deployment authority
recommended: OpenClaw
not owned: OpenClaw privileged credentials/state/model configuration/process/update
lifecycle
```

### Audio/Video mechanics

```text
role: external executable mechanics
recommended: FFmpeg
not owned by default: distribution/acquisition/update lifecycle
```

State that future bundling is a separate explicit product/distribution decision.

## 21.2 Update product-shape.md

Add the external-integration posture to the Product shape without turning every tool
into a Product component.

Clarify:

```text
Product can require/configure an integration capability
!= Product owns the third-party implementation lifecycle
```

The normal model path should reference a model gateway rather than direct provider
ownership.

## 21.3 Update docs/product/README.md and docs/README.md

Link the new Product page from the appropriate navigation location.

Do not create a second generic documentation hierarchy.

## 21.4 Rewrite docs/architecture/ai-runtime.md current truth

Replace vendor-oriented `ProviderProfile` discussion with:

```text
GatewayProfile
ModelProfile
ModelBinding
ModelInvocationProtocol
```

Document:

```text
GatewayProfile = configured inference endpoint
ModelProfile = gateway + model identifier + invocation protocol
ModelBinding = Product selection
AI SDK = protocol mechanics
NewAPI = recommended external gateway, not semantic Authority
```

Remove current generic `Failover` wording where it could imply Heptalogos owns model
gateway routing. The current Product has no AIRuntime fallback.

If an external gateway performs retry/failover before returning a response, that is
external gateway behavior. Heptalogos records the model/gateway information it
actually knows and does not pretend to own the upstream routing decision.

Keep broader future Capability/MCP material only where it is still current and not
contradictory.

## 21.5 Update machine-operations.md

Preserve its existing independent OpenClaw Authority design.

Correct the distribution language to state the default current posture:

```text
OpenClaw is recommended/supported external software and is not bundled or downloaded
by default.
```

Retain the rule that if a future Plan explicitly bundles/downloads/modifies it,
license/distribution qualification becomes required.

## 21.6 Add maintained reference guidance

Create:

```text
docs/reference/external-integrations.md
```

This is a practical human/developer reference, not Architecture Authority.

For each recommended external integration provide:

```text
official project/documentation location
role in Heptalogos
installation/deployment options at a high level
Heptalogos-side configuration
readiness/diagnostic expectation
what Heptalogos does not manage
```

For NewAPI, current guidance should include:

```text
recommended external model gateway
typical local base URL: http://127.0.0.1:3000/v1
operator configures upstream provider/channel in NewAPI
operator creates a NewAPI token for Heptalogos
Heptalogos stores only that gateway token
ModelProfile selects model identifier and openai-chat/openai-responses
```

Reference upstream installation docs rather than copying a large third-party setup
manual into this repository.

For OpenClaw and FFmpeg, do the same at the appropriate current level of implemented
integration; do not claim implementation that does not yet exist.

## 21.7 Glossary

Update `docs/reference/glossary.md` for the current meanings of:

```text
GatewayProfile
ModelProfile
ModelBinding
ModelInvocationProtocol
Model Gateway
External Integration
```

Remove or redefine obsolete `ProviderProfile` if it currently appears as Product
state.

---

# 22. Dependency Authority correction

Update current dependency records to match actual architectural responsibility.

## 22.1 AI SDK route

`project/dependencies/dependency-routing.json`:

replace current route equivalent to:

```text
AI SDK 7 + @ai-sdk/openai OpenAI Responses provider
```

with the current route:

```text
AI SDK 7
+ @ai-sdk/openai-compatible for OpenAI Chat-compatible gateway mechanics
+ @ai-sdk/open-responses for Open Responses-compatible gateway mechanics
```

Boundary:

```text
AIRuntime protocol materialization behind GatewayProfile / ModelProfile semantics
```

Do not list NewAPI as an npm package dependency.

Update the exact package identities and version constraints to the current selected
stable lines after one execution-time refresh.

At authoring time observations are:

```text
@ai-sdk/openai-compatible 3.0.43
@ai-sdk/open-responses     2.0.34
```

These are not permanent exact requirements.

## 22.2 AI SDK decision ledger

Update `project/dependencies/decision-ledger.md` to say:

```text
AI SDK owns OpenAI-family protocol/model mechanics.
Heptalogos owns gateway/model/binding semantics.
Current protocol implementations are Chat-compatible and Open Responses-compatible.
```

Remove "OpenAI Responses route only" as current Product truth.

## 22.3 dependency-status.json

Update the current machine-readable AI SDK role and package list consistently.

Do not mark a live Responses gateway claim PASS merely because the package was added.

## 22.4 NewAPI dependency role

Record NewAPI as a **recommended external integration**, not a mandatory repository
runtime dependency.

Use the repository's existing external-product-operation representation if one
already exists. Do not invent a new dependency-state schema solely for NewAPI.

Its role:

```text
recommended model gateway / provider aggregation implementation
```

Its Product boundary:

```text
outside Product Authority and Product Host lifecycle
```

Its qualification:

```text
one current live gateway route may prove compatibility
```

Do not make a specific NewAPI version a permanent Heptalogos package pin.

## 22.5 OpenClaw dependency wording

Align current dependency text with:

```text
recommended external Machine Operations runtime
not default bundled/downloaded/Host-managed
```

Do not reopen the already-decided OpenClaw Authority model.

## 22.6 FFmpeg route

Current dependency routing says:

```text
vendored FFmpeg
```

Correct the current route to:

```text
external FFmpeg executable behind the Heptalogos AV adapter when that capability is
implemented
```

Default:

```text
operator-installed / explicitly configured or discovered
```

Do not implement an FFmpeg downloader in this Plan.

If there is no current AV implementation consumer, update knowledge Authority only
and leave implementation to its actual Product Plan.

---

# 23. Focused verification

Tests protect the semantic correction and the two actual protocol paths.

Do not add broad test infrastructure.

## 23.1 GatewayProfile

Prove:

```text
baseUrl canonicalization
remote plain HTTP rejected
literal loopback HTTP accepted
HTTPS accepted
embedded URL credentials rejected

GatewayProfile creation
baseUrl immutable under same GatewayProfileId
token may be attached/replaced/revoked through Secret owner
```

Do not build DNS/network security simulators.

## 23.2 Secret authorization

Prove:

```text
gateway token resolves only for system.ai-runtime
purpose = ai.gateway.bearer-token
exact GatewayProfile scope required
revoked/unavailable secret blocks invocation
no environment fallback
```

## 23.3 NetworkAccess

Prove:

```text
request may target only selected GatewayProfile base URL
Chat path admitted for Chat protocol
Responses path admitted for Responses protocol
wrong origin/path denied
redirect denied
bearer token never forwarded to another origin
timeout/body budget behavior remains current
no hidden retry
```

Do not redesign NetworkAccess internals solely to create new tests.

## 23.4 Chat protocol mechanics

Use real installed `@ai-sdk/openai-compatible` with a bounded local HTTP fixture.

Prove:

```text
AIRuntime selects Chat mechanics from ModelProfile.protocol
model identifier is sent
custom NetworkAccess fetch is used
structured object passes through AI SDK and SchemaRuntime
maxRetries = 0
GenerationResult contains gateway/model/protocol/configuration provenance
```

This fixture should emulate only the consumed OpenAI-compatible response shape. It is
not a fake provider architecture.

## 23.5 Responses protocol mechanics

Use real installed `@ai-sdk/open-responses` with a bounded local HTTP fixture.

Prove:

```text
AIRuntime selects Responses mechanics
request goes to <baseUrl>/responses
model identifier is sent
custom NetworkAccess fetch is used
structured object passes through AI SDK and SchemaRuntime
maxRetries = 0
GenerationResult provenance is correct
```

Do not require provider-hosted conversation state.

## 23.6 Binding-driven readiness

Prove one meaningful mixed configuration:

```text
subject.primary    → ModelProfile(protocol=openai-chat)
subject.expression → ModelProfile(protocol=openai-responses)
```

Both may be on one or two GatewayProfiles.

Readiness depends on the referenced chains, not number of configured gateways.

## 23.7 Management/OpenAPI/client/CLI

Prove current contract consistency after renaming:

```text
gateway-profile.set exists
provider-profile.set is gone
Product state exposes gatewayProfiles
ModelProfile exposes gatewayProfileId/modelIdentifier/protocol
generated client has typed current action union
CLI uses ManagementClient only
protected token is not argv/output
```

Do not add permanent tombstone gates for the old names. Ordinary affected tests are
enough.

---

# 24. Product Host process proof

Update the existing Product Host integration scenario.

Through normal Management:

```text
Host starts with no gateway
→ Management healthy
→ AIRuntime BLOCKED

create + activate ai.gateway.transport.v1

create disabled GatewayProfile
→ stable GatewayProfileId

set ai.gateway.bearer-token through protected path when required
→ only SecretRef/metadata visible

attach SecretRef + enable GatewayProfile

create Chat ModelProfile
create Responses ModelProfile

bind subject.primary / subject.expression

restart Product Host
→ GatewayProfile / Secret metadata / ModelProfiles / ModelBindings survive
→ no third-party process is spawned
```

This process proof does not need a live NewAPI instance.

---

# 25. Live qualification: NewAPI → DeepSeek

The live qualification proves the gateway architecture, not direct DeepSeek support.

Use a generic integration target such as:

```text
integration/model-gateway/
```

Do NOT name the Product integration package `provider-deepseek`.

The harness accepts operator-supplied current qualification parameters:

```text
Gateway base URL
Gateway bearer token through protected stdin/TTY
model identifier configured in the gateway
protocol
```

It must not accept an upstream DeepSeek API key.

The operator configures DeepSeek in NewAPI outside Heptalogos.

Current recommended qualification topology:

```text
Heptalogos qualification
→ GatewayProfile
→ ai.gateway.bearer-token
→ NetworkAccess
→ AIRuntime
→ OpenAI Chat protocol
→ NewAPI
→ externally configured DeepSeek channel
→ real DeepSeek model
```

## 25.1 Why Chat is the required live proof

The current NewAPI documentation exposes both Chat Completions and Responses.

However, current upstream/channel support for Responses is not uniform, and NewAPI's
Responses↔Chat compatibility behavior continues to evolve.

The user currently has a DeepSeek credential suitable for configuring a NewAPI
DeepSeek channel.

Therefore the required live gateway proof for this Plan is:

```text
protocol = openai-chat
gateway implementation = NewAPI
upstream = DeepSeek
```

This proves the gateway-first Product boundary without making Heptalogos depend on a
NewAPI-specific Responses conversion feature.

## 25.2 Responses live evidence

The Responses adapter MUST be implemented and locally proven with the actual
`@ai-sdk/open-responses` package.

A live NewAPI Responses call is:

```text
OPTIONAL in this Plan
```

Run it only if the operator already has a configured NewAPI model/channel that
supports the current `/v1/responses` route.

If not run, record:

```text
live NewAPI Responses compatibility: NOT_RUN
```

Do not block the current Plan solely because DeepSeek-through-NewAPI does not provide
the desired Responses conversion.

Do not weaken the Product's explicit protocol distinction to hide this fact.

## 25.3 NewAPI is not installed by the harness

The harness MUST NOT:

```text
download NewAPI
docker pull NewAPI
spawn NewAPI
initialize NewAPI DB
create NewAPI admin account
configure NewAPI channels
store DeepSeek API key
update NewAPI
```

If no operator-managed compatible gateway is available:

```text
live gateway qualification = BLOCKED
reason = compatible gateway endpoint/token/model not supplied
```

Implementation can be locally green while the active Plan remains open.

## 25.4 Protected input

The gateway token is supplied through the existing protected input path.

Never place it in:

```text
argv
repository file
ordinary configuration
qualification Markdown
prompt/chat
log
stdout/stderr
environment fallback
```

---

# 26. Qualification records

Replace the current provider-centric current claim with gateway-centric evidence.

Create:

```text
project/qualification/results/Q-AI-GATEWAY-CHAT-01.md
```

Record:

```text
PASS / FAIL / NOT_RUN / BLOCKED
date
platform actually run
Node/pnpm
exact ai package versions
gateway implementation observed: NewAPI
gateway base origin/path classification (no token)
model identifier
protocol = openai-chat
GatewayProfileId
ModelProfileId/generation
ModelBindingId/revision
ConfigurationRevisionId
Lineage/Evidence refs
live result
```

Never record:

```text
NewAPI bearer token
DeepSeek upstream key
Authorization header
NewAPI admin credentials
raw NewAPI provider/channel secrets
```

For Responses implementation evidence, use a focused local qualification/test record
only if current repository conventions require one; do not manufacture a certification
document for every test.

If a real Responses gateway run is performed, record a separate concrete live claim.
Otherwise keep it NOT_RUN rather than inferring PASS.

The previous `Q-PROVIDER-OPENAI-01` remains historical evidence of the superseded
implementation attempt. Do not rewrite history to pretend it was gateway qualification.

---

# 27. NewAPI guidance required by current docs

The maintained human reference must be practical but must not become a copied NewAPI
manual.

At execution time verify the current official NewAPI documentation/repository links.

Current upstream guidance supports multiple deployment methods including Docker
Compose, Docker, panels, cluster, and local-development/source routes. Heptalogos
should link to those upstream sources.

The Heptalogos NewAPI setup section needs only the integration sequence:

```text
1. Install/deploy NewAPI independently using upstream guidance.
2. Initialize NewAPI and configure an upstream provider/channel.
3. Configure a model/model mapping usable by the desired OpenAI-family protocol.
4. Create a NewAPI token for Heptalogos.
5. In Heptalogos create GatewayProfile with NewAPI's /v1 base URL.
6. Store the NewAPI token through SecretService protected input.
7. Create ModelProfile with modelIdentifier and protocol.
8. Bind subject.primary / subject.expression.
9. Inspect AIRuntime readiness.
```

Explicitly explain:

```text
DeepSeek/OpenAI/etc upstream key goes to NewAPI, not Heptalogos, when NewAPI is the
gateway.

NewAPI admin credentials go to NewAPI, not Heptalogos.

Heptalogos stores only the token it needs to call the configured gateway.
```

Do not add NewAPI admin API integration in this Plan.

---

# 28. Knowledge current-truth sweep

Because the previous implementation wrote OpenAI-specific current truth into multiple
Authority planes, perform one **targeted semantic sweep** after implementation.

Search current non-historical Authority for concepts equivalent to:

```text
ProviderProfile
provider-profile.set
provider.openai.api-key
network-access.openai-api
api.openai.com
OpenAI Responses route only
vendored FFmpeg
bundled OpenClaw
bundled NewAPI
```

For each hit:

```text
if it states current Product semantics → update it
if it is package/test code for current implementation → update/delete it
if it is historical Plan/Qualification/Git chronology → leave it as history
if it is an example that remains factually valid → do not mechanically delete it
```

This is not a permanent tombstone rule.

Do NOT add a repository gate forbidding those strings.

Stop the sweep once current Authority is coherent.

---

# 29. Explicit non-goals

This Plan does NOT authorize:

```text
direct DeepSeek provider adapter
direct Anthropic provider adapter
direct Gemini provider adapter
provider registry
provider factory framework
provider plugin system
provider routing
provider failover
provider health polling
provider qualification matrix

NewAPI package/vendor fork
NewAPI source modification
NewAPI admin API client
NewAPI channel management
NewAPI provider credential management
NewAPI process supervisor
NewAPI downloader/updater
NewAPI bundled distribution

OpenClaw downloader/updater/supervisor
OpenClaw implementation work beyond documentation alignment

FFmpeg downloader/updater/vendor payload
FFmpeg AV implementation work beyond dependency/product posture alignment

Chat↔Responses translation
OpenAI-vendor-specific feature surface
provider-hosted conversation state
AI tools
MCP tools
AI SDK Agent / WorkflowAgent
streaming Product API
vision/files/audio/embedding

Subject implementation
Messaging
Subject Chat
Reaction
Persona
Memory
Relationship
Attention
Observation Window
proactive behavior

NetworkAccess redesign unrelated to the gateway endpoint requirement
Evidence redesign
Lineage redesign
Configuration framework expansion
Cedar
ApprovalService
ManagementOperation

new Skill
new permanent gate
new Plan schema/linter
new qualification framework
stabilization/review/cleanup ceremony
source-less/release/cross-platform campaign
```

---

# 30. PLAN_GAP boundaries

Stop only the affected branch when a material unresolved fact appears.

Examples:

```text
current @ai-sdk/openai-compatible cannot provide the current Chat structured
generation contract through custom fetch

current @ai-sdk/open-responses cannot provide the current Responses structured
generation contract through custom fetch

a required current NewAPI-compatible gateway cannot be represented by one base URL
plus optional bearer token

the current NetworkAccess owner cannot authorize an administrator-configured exact
gateway destination without changing its semantic ownership

the Product genuinely requires a provider-vendor-specific capability before Subject L4
```

Not PLAN_GAP:

```text
ordinary helper/file naming
private Chat/Responses branch organization
SQL column order
test fixture placement
exact current patch versions
NewAPI installation method chosen by the operator
actual DeepSeek model alias configured in NewAPI
live Responses proof unavailable on current DeepSeek channel
```

Do not invent machinery to avoid reporting a real PLAN_GAP.

---

# 31. Verification

During implementation run focused affected tests/typechecks.

Before closure run:

```text
pnpm check:repo
pnpm verify
```

Run the credential-requiring live gateway qualification separately.

Do not add it to normal `pnpm verify`.

Do not run unrelated:

```text
release/source-less
service/headless
cross-platform campaign
OpenClaw integration
FFmpeg/media qualification
Subject
external IM
```

proof.

---

# 32. Acceptance

The Plan is complete when the following current claims are true.

## Product semantics

```text
ProviderProfile no longer exists as current Product state.

GatewayProfile owns the configured inference endpoint.

ModelProfile owns gateway/model/protocol selection.

ModelBinding remains the Subject model-selection Authority.

The current protocols are exactly:
  openai-chat
  openai-responses

No current Product state encodes OpenAI, DeepSeek, NewAPI, Anthropic, or another
upstream vendor as the required provider identity.
```

## Mechanics

```text
AI SDK 7 remains the model invocation mechanics.

@ai-sdk/openai-compatible implements the Chat-compatible route.

@ai-sdk/open-responses implements the Responses-compatible route.

Both routes use NetworkAccess-controlled custom fetch.

Both routes use explicit SecretService-resolved bearer token when configured.

No environment credential fallback is a Product path.

No hidden AIRuntime retry/fallback exists.
```

## Persistence / Management

```text
0002 current provider-prerequisite migration is directly rewritten to gateway semantics.

No compatibility migration/alias exists for the temporary OpenAI-only shape.

gateway-profile.set replaces provider-profile.set.

Management/OpenAPI/generated client/CLI use the same GatewayProfile/ModelProfile
current contract.

Product Host starts normally without an external model gateway.
```

## External integration posture

```text
docs/product/external-integrations.md exists and states the default independent
third-party lifecycle rule.

NewAPI is documented as the recommended model gateway, not a required bundled
runtime.

OpenClaw is documented as the recommended external Machine Operations runtime, not
default bundled/downloaded.

FFmpeg dependency wording no longer claims default vendoring.

docs/reference/external-integrations.md gives practical operator integration guidance.
```

## Proof

```text
focused semantic/protocol tests PASS

Product Host process proof PASS

pnpm check:repo PASS
pnpm verify PASS

Q-AI-GATEWAY-CHAT-01:
  NewAPI → DeepSeek real invocation PASS
```

A live Responses gateway claim may remain NOT_RUN without blocking this Plan, because
the actual current DeepSeek-through-NewAPI route is the required real gateway proof
and the Responses protocol implementation is separately proven through the adopted
real AI SDK package and controlled HTTP boundary.

The strongest justified completed claim is:

```text
Heptalogos has a gateway-first AIRuntime with explicit OpenAI Chat and Open Responses
protocol semantics. Model/provider aggregation is outside Product Authority. One real
operator-managed NewAPI gateway path to DeepSeek has been proven through canonical
Configuration, Secret, NetworkAccess, GatewayProfile, ModelProfile, ModelBinding,
AIRuntime, SchemaRuntime, Lineage, and Evidence boundaries.
```

---

# 33. Closure and STOP

After all required acceptance claims pass:

```yaml
providerPrerequisites: COMPLETED
activeProductImplementationPlan: NONE
currentProductWork: NONE
nextEligibleProductWork: Persistent Subject L4 Vertical Slice
```

Move this Plan to:

```text
project/plans/completed/product/
```

Update only necessary current Roadmap/index/dependency/qualification projections.

STOP.

Do not start:

```text
another provider/gateway cleanup
NewAPI management
direct provider adapters
external integration manager
release packaging
Subject implementation
```

in the same execution.

The next Product Plan should consume the now-correct gateway-first AIRuntime and
implement the persistent Subject message → cognition → REPLY/SILENCE → outbound
vertical slice.
