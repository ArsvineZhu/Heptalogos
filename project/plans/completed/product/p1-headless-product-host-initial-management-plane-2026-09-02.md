# P1 — Real Headless Product Host & Initial Management Plane

**State:** `COMPLETED`
**Mode:** `PRE_PRODUCTION`
**Task class:** `PRODUCT_IMPLEMENTATION`
**Starting authority:** `T2 COMPLETED`
**Starting repository HEAD:** `0dcc79380d51db6bc5677b0740cb4175f0f460d0`
**Primary goal:** first real Heptalogos headless Product Host + usable canonical Management API + generated ManagementClient + reference CLI
**GUI:** external repository; no GUI implementation here
**Machine Operations / OpenClaw:** retained architecture, not implemented in P1
**Next stages:** P2 and O1 are separately eligible after P1 closure; neither is authorized by this Plan
**Active Product Plan:** `NONE`
**Completion path:** `project/plans/completed/product/p1-headless-product-host-initial-management-plane-2026-09-02.md`

---

# 0. Purpose

P1 is the first task that turns the closed Foundation into an actual Heptalogos
product process.

The repository already owns:

```text
Bootstrap
Private PostgreSQL
Host Ownership
Persistence
Runtime
Readiness
Execution Lineage / Evidence
durable Work / Effect foundations
```

and T2 has frozen the first Product contracts.

What does not yet exist is a production entry point that composes the existing
owners and exposes a real Management surface.

P1 MUST produce:

```text
Installation Anchor
        ↓
existing Bootstrap / Recovery
        ↓
private PostgreSQL
        ↓
existing Host Authority handoff
        ↓
Persistence + Runtime
        ↓
Management Service
        ↓
loopback HTTP / OpenAPI
        ↓
generated ManagementClient
        ↓
reference CLI
```

P1 is complete when this path works as a built product process on the actual
qualification platform and the repository remains clean.

P1 is **not** an installer, a GUI stage, a provider stage, a Subject stage, an
OpenClaw stage, or a general H4 implementation.

---

# 1. Engineering posture for P1

P1 MUST avoid two opposite errors.

## 1.1 Do not over-engineer for hypothetical futures

A merely imaginable future does not authorize:

```text
new generic framework
new state machine
new package
new compatibility layer
new retry/recovery layer
new qualification matrix
```

without a concrete Product requirement.

## 1.2 Do not delete or ignore confirmed future Product requirements

The following are already confirmed Product directions and MUST remain current
Architecture/dependency Authority even when P1 does not instantiate them:

```text
external Browser/Desktop Presentation repository
browser-capable Management transport evolution
cookie / CSRF / security-header mechanics when browser auth needs them
live Management projection / SSE when a real Presentation consumer needs it
Cedar PolicyService when multi-principal/policy consumers arrive
ApprovalService when a real durable approval consumer arrives
full Management coverage as capabilities enter Product
OpenClaw Machine Operations Plane
Configuration / Secret / NetworkAccess / AIRuntime
Subject / Messaging / Behavior
backup / restore / update / package lifecycle
```

P1 may establish reusable seams that have **multiple already-known consumers**.

Examples:

```text
ManagementClient
→ CLI now
→ external Presentation later
→ OpenClaw later

OS credential adapter
→ BootstrapKeyProvider now
→ local CLI session token now
→ SecretBackend later

Runtime read-only snapshot
→ P1 Management now
→ external Presentation later
→ OpenClaw diagnostics later
```

These are not speculative abstractions.

---

# 2. Verified starting truth

At Plan authoring time:

```text
master
0dcc79380d51db6bc5677b0740cb4175f0f460d0
docs: freeze H4-Min and H6 product contracts
```

The executor MUST re-read current `master` before mutation.

Required semantic baseline:

```yaml
H3: CLOSED
T0: COMPLETED
T1: COMPLETED
T1C: COMPLETED
T2: COMPLETED

P1: ELIGIBLE_NOT_AUTHORIZED
P2: NOT_STARTED
P3: NOT_STARTED
P4: NOT_STARTED
O1: NOT_STARTED

ProductHost: NOT_IMPLEMENTED
GUIRepository: EXTERNAL
MachineOperationsRoute: OPENCLAW_EXTERNAL
```

A newer documentation-only commit does not automatically invalidate this Plan.

---

# 3. Plan installation

The first repository mutation MUST install this Plan at:

```text
project/plans/active/product/
  p1-headless-product-host-initial-management-plane-2026-09-02.md
```

and update:

```text
project/plans/INDEX.md
```

P1 must be the only active Product Plan.

Do not activate P2 or O1 in parallel.

---

# 4. Required reading

Before implementation read current versions of:

```text
AGENTS.md
packages/AGENTS.md

project/governance/project-charter.md
project/governance/constitution.md
project/governance/pre-production-evolution.md
project/governance/compatibility-obligations.json

docs/product/product-shape.md
docs/product/control-plane-experience.md

docs/architecture/system-architecture.md
docs/architecture/authority-and-core-concepts.md
docs/architecture/management-authority.md
docs/architecture/management-presentation.md
docs/architecture/machine-operations.md
docs/architecture/end-to-end-flows.md
docs/architecture/configuration.md

specs/core/identity-generation.md
specs/core/service-capability-readiness.md
specs/core/contract-versioning.md
specs/runtime/bootstrap-closure.md
specs/runtime/host-ownership.md
specs/runtime/runtime-supervision.md
specs/data/canonical-schema.md
specs/data/persistence-transactions.md
specs/execution/execution-lineage.md
specs/execution/evidence.md
specs/management/system-authority.md

project/dependencies/dependency-routing.json
project/dependencies/decision-ledger.md
project/dependencies/implementation-routing.md
project/engineering/repository/toolchain.md
project/qualification/dependency-status.json
project/qualification/dependencies.md
project/roadmap/development-roadmap.md

packages/bootstrap/bootstrap-runtime/**
packages/data/canonical-schema/**
packages/data/persistence/**
packages/runtime/runtime-kernel/**

integration/foundation/README.md
integration/foundation/test/foundation-executable-spine.integration.test.ts
integration/foundation/test/runtime-kernel-managed-host.integration.test.ts
```

Historical Plans are evidence only.

---

# 5. Task 0 — bounded pre-implementation cleanup

Before adding Product code, perform a focused current-tree audit.

This is NOT a new Foundation stabilization stage.

## 5.1 Remove the release-age gate

Current PRE_PRODUCTION policy no longer uses dependency release age as a
selection criterion.

Change:

```text
pnpm-workspace.yaml
minimumReleaseAge: 1440
```

to:

```text
minimumReleaseAge: 0
```

and change:

```text
project/dependencies/dependency-routing.json
repositoryMaterialization.minimumReleaseAge
```

to:

```text
0
```

Current repository verifiers already accept a non-negative integer, so do not
rewrite the verification system merely to remove the wait period.

Current dependency rule becomes:

```text
need a package
→ read current registry/upstream
→ use the current latest release appropriate to the adopted role
→ verify Node/TS/ESM/peer/API compatibility
→ exact-pin it in Catalog
→ run the smallest sufficient conformance
```

Release age itself is not a blocker.

Do not rewrite historical completed Plans that recorded the previous policy.

## 5.2 Correct current stale terminology

Audit living/current docs for stale internal Operator terminology.

Known current corrections include:

```text
docs/architecture/end-to-end-flows.md
  "CLI / HTTP / Operator / Web or Desktop client"
  → current Management clients / external Presentation / Machine Operations wording

docs/architecture/configuration.md
  "Operator context"
  → System Assistant / Machine Operations context where that is the actual meaning
```

Do not rewrite historical Plans.

Do not remove the current `System Assistant` Product label or the independent
Machine Operations Plane.

## 5.3 Executable-code deletion audit

Search production source for obsolete implementation tied to superseded
assumptions:

```text
OperatorAssistant
OperatorService
Operator Chat
PresentationIntent runtime owner
Browser/Desktop UI implementation
Electron
internal OpenClaw runtime
legacy/compat/deprecated aliases created only by development history
```

Classification:

```text
A. current code with a current or confirmed future semantic owner
   → KEEP

B. closed Foundation primitive with a confirmed later consumer
   → KEEP

C. current production code that exists only for a superseded Product assumption
   and has no remaining owner
   → DELETE

D. historical qualification fixture/evidence
   → KEEP unless independently dead/redundant

E. uncertain
   → do not delete; report
```

Do NOT delete:

```text
WorkQueue
DurableExecution
Signal
EffectOperation
RuntimeKernel
Foundation qualification
```

merely because P1 does not start them yet.

They have confirmed P3/P4/later Product consumers.

At Plan authoring time no Product/UI/Operator production package exists; do not
manufacture a cleanup campaign if the audit confirms there is nothing real to
delete.

---

# 6. Current dependency selection rule

For every dependency first materialized by P1:

```text
use current registry `latest` release
```

unless the `latest` release is demonstrably incompatible with an already-frozen
current boundary such as:

```text
Node 24
TypeScript 7 consumer compile
ESM / NodeNext
Fastify current major line where the adopted route explicitly fixes that line
required API
native platform closure
```

Do not choose an older release merely because it is older.

Do not choose an old major merely because a previous Plan mentioned it.

If `latest` is incompatible with a frozen adopted role:

```text
1. prove the incompatibility;
2. determine whether the role itself should move to the new capable line;
3. prefer current/latest capable line;
4. only pin an older version when a concrete incompatibility requires it.
```

Exact package versions are selected at execution time and pinned in Catalog.

At Plan authoring time, current `latest` observations were:

```text
fastify                 5.12.1
@fastify/swagger        9.8.1
@fastify/rate-limit     11.2.0
@hey-api/openapi-ts     0.99.0
@oclif/core             5.0.0
@inquirer/password      5.1.2
@napi-rs/keyring        2.0.0
```

These observations are not version Authority; re-query before editing Catalog.

---

# 7. Preserve deferred HTTP/browser dependency roles

Do NOT delete these current adopted roles merely because P1 does not consume
them:

```text
http.cookie
http.security-headers
http.csrf
http.sse
```

They are retained for the confirmed external Presentation direction.

P1 simply does not materialize their packages.

Likewise retain:

```text
policy.model / policy.binding
ApprovalService architecture
```

for their confirmed future consumers.

"not used in P1" does not mean "invalid architecture".

---

# 8. Dependency Authority corrections/materialization

P1 must correct exact package identity where current Authority is too abstract
or wrong for implementation.

## 8.1 CLI

Current role:

```text
cli.framework → oclif
```

Correct package identity to:

```text
@oclif/core
```

Do not install the `oclif` generator package merely to scaffold files.

Use current `latest` `@oclif/core`.

## 8.2 Management client generator

Materialize:

```text
management.client-generator
→ @hey-api/openapi-ts
```

using current `latest`.

## 8.3 OpenAPI projection

Add/materialize:

```text
management.openapi
→ @fastify/swagger
```

behind the Product Host HTTP adapter.

No Swagger UI in P1.

## 8.4 CLI protected secret input

Add/materialize:

```text
cli.password-prompt
→ @inquirer/password
```

No handwritten TTY echo-suppression implementation.

## 8.5 OS credential adapter

Materialize the already-adopted OS credential/keyring route with:

```text
@napi-rs/keyring
```

using current `latest` on profiles where it operates.

Do not claim all platform profiles PASS from one platform.

## 8.6 P1 packages to materialize

Current P1 dependency set is intentionally small:

```text
fastify
@fastify/swagger
@fastify/rate-limit
@hey-api/openapi-ts
@oclif/core
@inquirer/password
@napi-rs/keyring
```

plus existing repository dependencies.

Do not add:

```text
@fastify/swagger-ui
@fastify/cookie
@fastify/csrf-protection
@fastify/helmet
@fastify/sse
Cedar
AI SDK
provider SDK
OpenClaw
```

in P1.

Retained future role != installed dependency.

---

# 9. Package topology

Create these Product packages:

```text
packages/system/os-credential/
  @heptalogos/os-credential

packages/system/management/
  @heptalogos/management

packages/application/product-host/
  @heptalogos/product-host

packages/application/management-client/
  @heptalogos/management-client

packages/application/cli/
  @heptalogos/cli
```

Create:

```text
integration/product-host/
```

for Product process qualification.

This topology is justified by independent current/future consumers:

```text
os-credential
→ Bootstrap + CLI now, SecretBackend later

management
→ HTTP now, all Management clients later

management-client
→ CLI now, external Presentation + OpenClaw later

product-host
→ executable composition owner

cli
→ first complete headless client
```

Do not split authentication, sessions, read models, HTTP routes, OpenAPI,
discovery, or password verification into separate packages in P1.

---

# 10. Workspace boundary tags

Add:

```text
area:application
area:client
```

because the repository currently lacks tags that truthfully describe Product
Host and external-client packages.

Suggested dependency directions:

```text
area:client
→ shared/bootstrap/service/client as actually required

area:application
→ shared/bootstrap/data/execution/runtime/service/work-queue as actually required
```

The exact rule should remain no broader than necessary.

Required prohibitions:

```text
CLI
  !→ Persistence
  !→ RuntimeKernel
  !→ HostOwnership
  !→ CanonicalSchema
  !→ pg/Kysely

ManagementClient
  !→ ProductHost
  !→ Persistence
  !→ RuntimeKernel

Management
  !→ Fastify
  !→ oclif
  !→ @napi-rs/keyring

ProductHost
  !→ integration/foundation
```

Do not create a generic "frontend" area.

---

# 11. Production-vs-integration boundary

Production packages MUST NOT import:

```text
integration/**
test/**
```

Extend the existing boundary checker if needed.

Do not create a second checker if existing Nx/Oxlint/repository verification can
express the rule.

`integration/foundation/**` remains qualification evidence and MUST NOT become a
production composition dependency.

---

# 12. Persistence repository seam cleanup

P1 introduces the first non-Foundation semantic repository owner.

Current surface:

```text
@heptalogos/persistence/foundation-repository
executeFoundationSql
useFoundationReadTransaction
useFoundationMutationTransaction
```

has now become unnecessarily stage-specific.

Because this repository is PRE_PRODUCTION, do not create:

```text
foundation-repository
+
semantic-repository
+
compat alias
```

Rename/generalize the single current seam to a neutral current surface, for
example:

```text
@heptalogos/persistence/repository

executeRepositorySql
useRepositoryReadTransaction
useRepositoryMutationTransaction
```

Mechanically migrate existing current consumers.

Delete the old `foundation-repository` public subpath and old names.

No compatibility alias.

This change MUST preserve:

```text
one PersistenceService
one transaction context
one Host fence
no second pool
no root Kysely/pg handle exposed to domain owners
```

This is consumer-driven generalization, not Foundation rearchitecture.

---

# 13. OS credential package

`@heptalogos/os-credential` owns generic platform credential mechanics only.

Minimal API:

```ts
interface OsCredentialKey {
  readonly service: string;
  readonly account: string;
}

interface OsCredentialStore {
  exists(key: OsCredentialKey): Promise<boolean>;
  set(key: OsCredentialKey, secret: string): Promise<void>;
  delete(key: OsCredentialKey): Promise<void>;
  withCredential<T>(
    key: OsCredentialKey,
    use: (secret: string) => Promise<T>,
  ): Promise<T>;
}
```

The package may adapt the actual `@napi-rs/keyring` `Entry` API.

Do not create a fictitious zeroization guarantee for immutable JavaScript
strings.

Required guarantees are practical:

```text
no deliberate durable plaintext cache
no logs
no Product DTO containing credential plaintext
callback-scoped exposure
provider error normalization
```

Do not implement SecretService in P1.

---

# 14. Credential namespace

Use installation-scoped namespace:

```text
service:
  Heptalogos/<InstallationId>
```

Bootstrap accounts:

```text
bootstrap/private-postgres-bootstrap-superuser
bootstrap/private-postgres-host-lease-role
bootstrap/private-postgres-runtime-role
bootstrap/private-postgres-migration-role
bootstrap/private-postgres-durable-execution-role
```

CLI session account:

```text
management/current-administrator-session
```

Do not store OpenClaw credentials here by default.

---

# 15. Production BootstrapKeyProvider

P1 MUST close the existing production gap: Foundation has a
`BootstrapKeyProvider` contract but the existing executable qualification path
uses test credential fixtures.

Implement the production adapter in Product Host using
`@heptalogos/os-credential`.

Map exactly the existing Bootstrap key purposes.

## Fresh installation

If canonical BootstrapState has no authoritative private PostgreSQL identity:

```text
ensure all required bootstrap credentials exist
→ generate missing values
→ store them in OS credential store
→ then permit private PostgreSQL initialization
```

Generate credentials with cryptographically random bytes encoded as a
PostgreSQL-safe secret.

## Existing installation

If private PostgreSQL identity already exists and a required credential is
missing:

```text
FAIL CLOSED / RECOVERY REQUIRED
```

Do not:

```text
regenerate the credential
fallback to env
fallback to plaintext file
use default/empty password
reinitialize PostgreSQL
```

This is state correctness, not optional security hardening.

---

# 16. ProductGenerationId — simplified P1 materialization

P1 MUST use a real content-derived `ProductGenerationId`.

Do not use:

```text
random UUID
test constant
timestamp
plain version string
```

Do not build the full future shipping/SBOM artifact-generation framework in P1.

Use one small deterministic P1 generation descriptor.

Recommended descriptor:

```ts
interface ProductGenerationDescriptorV1 {
  readonly schemaVersion: 1;
  readonly product: "heptalogos";
  readonly sourceContentDigest: string;
  readonly lockfileSha256: string;
  readonly managementContractVersion: string;
}
```

`sourceContentDigest` MUST be deterministically derived from the Product source
inputs used by the current build.

A small build script may hash the sorted production source/package/config files
that actually contribute to P1.

Exclude:

```text
tests
integration fixtures
docs
generated timestamps
absolute paths
random values
```

Then derive:

```text
digestCanonicalJson(
  "heptalogos.product-generation/v1",
  descriptor
)
→ ProductGenerationId
```

This satisfies current content-digest identity without designing final
source-less shipping/update generation semantics.

Future product packaging may refine the generation descriptor under a later
authorized Product/Update Plan.

PRE_PRODUCTION means no compatibility bridge is required for that future
refinement.

---

# 17. Product Host inputs

P1 is not an installer.

The built Product Host consumes:

```text
--anchor-root <path>
--postgres-bin <path>
--initial-postgres-port <port>   only when initializing a new installation
```

Existing authoritative installation state wins.

Do not add:

```text
configuration framework
port auto-discovery race
installer
service wrapper
```

to solve these bootstrap inputs.

Management HTTP uses an OS-assigned loopback port and does not need a normal
configuration setting in P1.

---

# 18. Product Host startup sequence

Use the existing Bootstrap public surface.

Normative sequence:

```text
1. parse bootstrap inputs
2. derive ProductGenerationId
3. prepare Bootstrap prelude
4. acquire Bootstrap ownership
5. initialize/read BootstrapState
6. provision or validate Bootstrap credentials
7. prepare private PostgreSQL
8. initialize current canonical schema
9. hand private PostgreSQL to Host Authority
10. create Time / ExecutionContext / Persistence / Lineage / Evidence
11. create RuntimeSubstrate / RuntimeKernel
12. start Management system-service
13. reconcile first-administrator claim
14. create Management Fastify app
15. listen on 127.0.0.1, OS-assigned port
16. atomically publish local endpoint descriptor
17. publish current first-claim plaintext file when still unclaimed
18. verify live Management compatibility/readiness
19. Host becomes Product READY
```

Do not duplicate Bootstrap, PostgreSQL, Host fencing, or Recovery logic.

---

# 19. Foundation services actually started by P1

Start only Foundation mechanics required by the current Product process:

```text
Bootstrap
Private PostgreSQL
Host Ownership
CanonicalSchema
Persistence
Time
ExecutionContext / Lineage
Evidence
RuntimeSubstrate
RuntimeKernel
```

Do not start merely-idle:

```text
WorkQueue
DBOS DurableExecution
Signal
EffectOperation
```

in P1.

Their code remains.

They enter the Product Host when P3/P4 create real durable work/effect
consumers.

This is staging, not deletion.

---

# 20. RuntimeKernel introspection seam

P1 needs real Management Read Models for:

```text
RuntimeGraph
CapabilityGraph
Readiness
```

Expose one read-only RuntimeKernel snapshot instead of giving Management access
to supervisor internals.

Minimal semantic information:

```text
operating mode
desired revision
MicroSystem identities
roles
ActualState
generation identity
service requirements/provisions
capability requirements/provisions
selected service bindings
selected capability bindings
```

Do not expose:

```text
service implementation objects
capability implementation objects
ServiceLease
CapabilityLease
GenerationFence
HostOwnershipToken
mutation handles
```

Management derives multiple read projections from this one snapshot.

Do not create a second runtime graph store.

---

# 21. Management system-service

Create one real Product Management MicroSystem.

Stable semantic identity:

```text
system.management
```

It publishes the current Management Service contract.

Do not create MicroSystems for:

```text
HTTP
OpenAPI
CLI
OS keyring
Persistence
```

just to make RuntimeGraph look complex.

A small truthful graph is correct.

---

# 22. Management package responsibilities

`@heptalogos/management` owns:

```text
Administrator
first claim
server sessions
P1 Management Problems
P1 wire schemas
CompatibilityDescriptor
P1 Read Models
SystemAction/SystemChangePlan contract types already frozen by T2
Management service implementation
Management repository
```

It does NOT own:

```text
Fastify
CLI
keyring
Bootstrap
RuntimeKernel internals
```

Implement the frozen SystemAction wire/types now because they are part of the
current Management contract.

Do NOT implement:

```text
generic action registry
fake action
generic ApprovalService
generic ManagementOperation
Cedar runtime
```

until a real action/policy consumer exists.

This preserves confirmed future contracts without building empty machinery.

---

# 23. Canonical P1 Management tables

Rewrite the current PRE_PRODUCTION canonical baseline rather than adding a
historical migration layer.

Add only:

```text
administrator
first_administrator_claim
server_session
```

No auth framework table universe.

---

# 24. Administrator state

Minimal canonical fields:

```text
administrator_id
auth_epoch

password algorithm
password salt/nonce
password verifier
Argon2 parameters
normalization identifier

created_at
password_changed_at
```

Exactly one current Administrator is allowed.

Do not add:

```text
email
username
display name
profile
security question
MFA tables
password history
```

in P1.

---

# 25. First-administrator claim state

Keep this state small.

Required fields:

```text
claim_id
secret_digest
created_at
expires_at
consumed_at nullable
```

There is at most one unconsumed current claim.

When an unclaimed installation needs a new claim, replace the unusable expired
current claim under a Host-fenced mutation.

Do not create a generic claim history state machine.

Evidence/Lineage can record the meaningful transition.

---

# 26. Server session state

Minimal fields:

```text
session_id
token_digest
administrator_id
auth_epoch
issued_at
expires_at
revoked_at nullable
```

No `last_authenticated_at` hot-write field in P1.

A session is valid iff:

```text
digest matches
not revoked
not expired
session auth_epoch == Administrator auth_epoch
```

---

# 27. Database mutation authority

P1 Management persistence follows the existing Host-fenced database model.

Do not give normal Management code arbitrary authoritative DML.

Add only the minimal database mutation functions required for:

```text
create/replace current first claim
consume exact claim + create Administrator atomically
create session
revoke session
```

Use the existing Host fence mechanics.

Runtime role:

```text
direct authoritative INSERT/UPDATE/DELETE
→ denied

exact Management mutation functions
→ allowed
```

Management repository accesses these through the generalized Persistence
repository seam.

Do not create a second pool.

---

# 28. Password mechanics

Use the current adopted:

```text
Node 24 node:crypto Argon2id
```

P1 password policy:

```text
NFKC normalization
minimum 15 Unicode code points
maximum 256 Unicode code points
no character-class rules
spaces allowed
Unicode allowed
```

Do not implement:

```text
password strength meter
breached-password service
password history
forced periodic rotation
```

in P1.

Use async Argon2id.

Store the actual Argon2 parameters with the verifier so they are explicit.

No password plaintext in:

```text
DB
logs
Problem
Evidence
Lineage
argv
```

---

# 29. First-claim secret

Generate:

```text
32 random bytes
→ base64url
```

Server canonical state stores SHA-256 digest only.

Plaintext exists only in:

```text
RUN first-claim file
CLI/request memory
```

Claim expires after a bounded first-run interval.

Use:

```text
30 minutes
```

for P1.

No generic ClaimService.

---

# 30. Claim reconciliation

At Host startup:

```text
Administrator exists
→ no valid first claim
→ remove stale claim file best-effort

Administrator absent
→ if current unexpired claim + matching local file exists:
     reuse
  else:
     generate a new claim
     atomically replace current unconsumed claim
     publish local plaintext claim file
```

If the process crashes after DB claim commit but before plaintext publication,
next start may replace that unusable unconsumed claim.

No compatibility state machine is needed.

---

# 31. Claim consumption

Flow:

```text
rate limit
→ validate request
→ validate/normalize new Administrator password
→ hash claim plaintext to digest
→ hash password outside DB transaction
→ Host-fenced mutation transaction
→ revalidate:
     no Administrator
     claim exact
     claim unconsumed
     claim unexpired
     digest exact
→ create Administrator
→ consume claim atomically
→ commit
→ remove matching local claim file best-effort
```

Concurrent replay loses cleanly.

---

# 32. Session login

Current login has one input:

```text
password
```

Flow:

```text
rate limit
→ normalize
→ read Administrator verifier
→ async Argon2 verify
→ on success generate 32 random token bytes
→ return base64url token once
→ store SHA-256 token digest + session state canonically
```

No username.

Use the same external invalid-credential Problem for wrong password and other
credential-probing distinctions where appropriate.

---

# 33. Session lifetime

P1 default:

```text
7 days
```

No refresh-token subsystem.

Logout revokes the exact current session.

Password-changing mechanics are not a P1 endpoint, but `auth_epoch` is retained
because the T2 contract already uses it as the session invalidation fence.

---

# 34. Authentication rate limiting

Because the first real auth endpoints now exist, use the already-adopted
`@fastify/rate-limit`.

Simple P1 limits are sufficient:

```text
claim:
  5 attempts / minute / loopback client

login:
  10 attempts / minute / loopback client
```

No account lockout.

Do not build a custom rate limiter.

---

# 35. Management HTTP server

Use Fastify.

P1 transport posture:

```text
bind 127.0.0.1 only
port 0
trustProxy false
bounded request body
JSON only
no static files
no HTML
no CORS setup
no browser cookie
no CSRF
no SSE
no WebSocket
```

This is not a claim that future Management remains loopback-only forever.

External Presentation requirements may later evolve the transport.

---

# 36. Stable discovery endpoint

Expose:

```text
GET /.well-known/heptalogos-management
```

This endpoint is public on loopback and returns:

```text
schema version
installation identity
CompatibilityDescriptor
current API base path
```

Current API base:

```text
/management/v1
```

Clients fail explicitly on unsupported discovery/contract versions.

Do not infer compatibility from 404.

---

# 37. P1 HTTP API

Public loopback routes:

```text
GET  /.well-known/heptalogos-management
POST /management/v1/bootstrap/claim
POST /management/v1/session
```

Authenticated:

```text
DELETE /management/v1/session/current

GET /management/v1/system/status
GET /management/v1/host
GET /management/v1/runtime/graph
GET /management/v1/capabilities
GET /management/v1/readiness
```

Do not expose P2/P3 routes.

No fake empty SystemAction endpoint.

---

# 38. Management Problems

Use the existing canonical Problem model projected as RFC 9457 Problem Details.

P1 needs stable codes for at least:

```text
management.first_claim_unavailable
management.first_claim_expired
management.first_claim_invalid
management.first_claim_consumed
management.administrator_exists
management.invalid_credentials
management.session_invalid
management.session_expired
management.session_revoked
management.rate_limited
management.contract_unsupported
management.host_fence_lost
management.not_ready
```

No stack traces or secrets in HTTP Problem responses.

---

# 39. Wire schema single source

P1 Management request/response schemas live in `@heptalogos/management`.

Use existing TypeBox/JSON Schema / SchemaRuntime ownership.

One schema chain:

```text
Management wire schemas
→ Fastify route schemas
→ OpenAPI
→ generated ManagementClient
```

Do not maintain independent:

```text
DTO interfaces
Fastify schemas
openapi.yaml
client models
```

by hand.

No Zod.

---

# 40. OpenAPI

Use latest `@fastify/swagger`.

Generate OpenAPI from the real route schemas.

No Swagger UI.

The OpenAPI artifact must contain exactly the P1 HTTP surface and canonical
Problem schemas.

Add a deterministic generation/check target.

Do not create a general API-governance framework.

---

# 41. ManagementClient

Use latest `@hey-api/openapi-ts`.

Generate only what is needed:

```text
TypeScript types
fetch-based client
```

Do not generate:

```text
React hooks
TanStack Query
Zod
Angular
Axios-specific stack
```

unless a later actual Presentation repository chooses them.

`@heptalogos/management-client` root must remain portable.

It is a first-class future external Presentation/OpenClaw dependency.

---

# 42. Local ManagementClient adapter

Provide a Node-only local adapter/subpath for CLI:

```text
load anchor/lifecycle roots
read local endpoint descriptor
call public well-known endpoint
verify live installation/contract identity
load/store current CLI session token through OS credential adapter
create authenticated ManagementClient
```

Do not put filesystem/keyring dependencies in the portable client root.

---

# 43. Local endpoint descriptor

After HTTP successfully listens, atomically publish:

```text
RUN/management-endpoint.json
```

Keep it small:

```ts
interface ManagementEndpointDescriptorV1 {
  readonly schemaVersion: 1;
  readonly installationId: InstallationId;
  readonly bootId: BootId;
  readonly origin: string;
}
```

No session/claim/database/Host Authority secret.

The file is discovery metadata only.

Before sending a stored session token, the client MUST connect to the public
well-known endpoint and verify the live installation/contract.

A stale file after crash is tolerated.

---

# 44. Endpoint descriptor shutdown cleanup

Graceful shutdown deletes the descriptor only if its `bootId` still belongs to
the current process.

An old process must not delete a newer Host descriptor.

No discovery journal.

---

# 45. First-claim file

Publish:

```text
RUN/management-first-claim.json
```

only when no Administrator exists.

Minimal fields:

```text
schemaVersion
claimId
claimSecret
expiresAt
```

Canonical database digest remains Authority.

Delete matching file after successful claim.

Stale file can never revive a consumed canonical claim.

---

# 46. P1 Read Models

Implement:

```text
CompatibilityDescriptor
SystemStatus
Host
RuntimeGraph
CapabilityGraph
Readiness
```

These are projections only.

Do not introduce a second canonical state store for them.

---

# 47. CompatibilityDescriptor

Use the T2 contract.

P1 current values include:

```text
InstanceId
ContinuityEpochId
ProductGenerationId
core contract version
supported client contract range
Problem schema version
```

Do not fabricate a SystemAction catalog revision if no action catalog exists.

---

# 48. Host Read Model

Expose safe identity/state only:

```text
InstallationId
InstanceId
BootId
ContinuityEpochId
ProductGenerationId
Host state
Management HTTP state
```

Do not expose:

```text
HostOwnershipToken
database credentials
Bootstrap lock/token internals
raw DB connection
```

---

# 49. RuntimeGraph / CapabilityGraph

Both are derived from the one RuntimeKernel introspection snapshot.

No second registry.

Empty capability collections are valid if the P1 runtime has none.

Do not invent fake services/capabilities to make the graph look complete.

---

# 50. Readiness

P1 readiness covers only current P1 requirements:

```text
Host active
Persistence usable
RuntimeKernel active
Management system-service running
HTTP listening
endpoint descriptor current
Administrator bootstrap state coherent
```

Do not mark missing future:

```text
provider
Subject
Messaging
OpenClaw
GUI
```

as FAILED.

They are not current P1 requirements.

---

# 51. SystemStatus

Small aggregate:

```text
ProductGenerationId
Host status
Management status
Administrator bootstrap:
  UNCLAIMED | CLAIM_READY | CLAIMED
P1 readiness
observedAt
```

No claim secret.

---

# 52. CLI

Use current/latest `@oclif/core`.

Executable:

```text
heptalogos
```

Current commands:

```text
heptalogos admin claim
heptalogos auth login
heptalogos auth logout

heptalogos contract
heptalogos status
heptalogos host status
heptalogos runtime graph
heptalogos capability graph
heptalogos readiness
```

Do not scaffold future P2/P3 command namespaces merely as placeholders.

---

# 53. CLI password input

Use latest `@inquirer/password` for interactive input.

Support:

```text
--password-stdin
```

for deterministic non-interactive use.

Do not support:

```text
--password <plaintext>
password environment variable
```

For stdin, remove only one terminal line ending; do not trim arbitrary
whitespace.

---

# 54. CLI session token

On successful login:

```text
store current opaque session token
→ @heptalogos/os-credential
```

Never print it.

Authenticated commands:

```text
discover live Host
verify well-known identity/compatibility
load token
call ManagementClient
```

If the server reports the token expired/revoked/invalid, delete the stale local
token best-effort.

No direct database fallback.

---

# 55. CLI machine mode

Every read command supports:

```text
--json
```

Machine mode:

```text
stdout = exactly one JSON result
stderr = diagnostics
no ANSI
no spinner
stable exit classes
```

Human formatting is not the machine contract.

Suggested exit classes:

```text
0 success
2 invalid CLI input
3 authentication/authorization
4 Host unavailable
5 contract incompatibility
6 canonical conflict/precondition
7 server/internal failure
```

Do not create one exit code per Problem.

---

# 56. Product Host executable

Create:

```text
heptalogos-host
```

as a built JavaScript executable owned by `@heptalogos/product-host`.

The Host CLI itself has only bootstrap/process arguments and may use Node
built-ins.

Do not use oclif to build the daemon.

Qualification MUST execute built JS, not TypeScript strip-types.

---

# 57. Product Host shutdown

Terminal shutdown only.

Handle:

```text
SIGINT
SIGTERM
Host ownership loss
```

Order:

```text
stop Management HTTP admission
remove current endpoint descriptor
close RuntimeKernel/supervisor
close Persistence
use existing Bootstrap/Host maintenance handoff to stop private PostgreSQL
release terminal ownership
exit
```

Use existing idempotent ownership mechanics.

Do not create:

```text
ApplicationSupervisor
self-restart engine
pause/resume lifecycle
```

---

# 58. Lineage / Evidence

Record meaningful canonical mutations:

```text
Administrator claimed
session created
session revoked
```

with current Lineage/Evidence conventions.

Never record:

```text
password
claim secret
session token
database credential
password verifier material
```

Routine status polling does not need durable Evidence merely because it
happened.

---

# 59. Time Authority

Management domain time uses current `TimeService` for:

```text
claim creation/expiry
session issue/expiry
ReadModel observedAt
```

Do not scatter `Date.now()` across the semantic package.

---

# 60. P1 does not implement normal SystemAction execution yet

The T2 SystemAction contract remains current and its types/schemas belong in
Management.

P1 has no real current cross-domain Product mutation such as:

```text
configuration.activate
model-binding.set
subject.start
```

Therefore P1 does not need:

```text
SystemAction registry
plan endpoint
execute endpoint
Approval
ManagementOperation
Cedar runtime
```

P2/P3 will instantiate the frozen contract with real owners.

This is not deleting future SystemAction.

---

# 61. P1 does not implement Configuration/Secret/Network/AIRuntime

P1 MUST NOT implement:

```text
ConfigurationService
SecretService
NetworkAccess
AIRuntime
provider SDK
ModelBinding
```

The OS credential adapter is allowed because it has current Bootstrap/CLI
consumers and a confirmed future SecretBackend consumer.

Do not turn it into SecretService early.

---

# 62. P1 does not implement Subject/Messaging

No:

```text
Subject
Subject Chat
MessageFact
ConversationMailbox
Reaction
BehaviorIntent
DecisionCommit
CommunicationCommit
```

P3/P4 remain intact.

---

# 63. P1 does not implement GUI

No:

```text
React
Vue
Svelte
Electron
HTML app
dashboard
Home
Dock
Subject Orb
Dynamic Island
```

Product docs describing these remain valid requirements for the external
Presentation repository.

---

# 64. P1 does not implement OpenClaw

No:

```text
OpenClaw process
Gateway
Skill
Tool
branding patch
Control UI
credential
```

O1 becomes eligible after P1 proves a real Management client surface.

Machine Operations architecture remains current.

---

# 65. Current future HTTP mechanics remain deferred, not deleted

The dependency roles for:

```text
cookie
security headers
CSRF
SSE
```

stay current.

When the external Presentation repository proves a browser/live requirement:

```text
real requirement
→ Host transport contract evolves
→ latest compatible adopted package is materialized
```

No need to pre-install idle packages today.

---

# 66. Product process qualification project

Create:

```text
integration/product-host/
```

It may prepare temporary:

```text
Installation Anchor
initial PostgreSQL port
isolated keyring namespace
```

It MUST launch the actual built Product Host.

Do not reimplement Product Host composition in test support.

---

# 67. Qualification scenario Q1 — fresh real boot

Launch built `heptalogos-host` against a fresh Installation.

Prove:

```text
existing Bootstrap initializes private PostgreSQL
production BootstrapKeyProvider is used
Host Authority becomes ACTIVE
real ProductGenerationId is used
RuntimeKernel starts
Management service runs
loopback HTTP listens
endpoint descriptor exists
first claim exists
P1 readiness is true
```

No test credential provider.

---

# 68. Qualification scenario Q2 — claim/login/CLI/read models

Using built `heptalogos` CLI:

```text
discover Host
claim first Administrator
claim replay rejected
login
session stored through OS credential adapter
status
host status
runtime graph
capability graph
readiness
contract
logout
```

Prove no direct DB/runtime import path in CLI.

---

# 69. Qualification scenario Q3 — restart and Host exclusion

Restart same Installation.

Prove:

```text
same persistent Installation/Administrator
new BootId
same ProductGenerationId for same build
no new first claim
login still works
```

While one Host is active, a second Host for the same Installation cannot acquire
Host Authority or overwrite its endpoint descriptor.

---

# 70. Qualification scenario Q4 — crash/stale discovery/shutdown

Hard-kill after endpoint publication.

Prove:

```text
stale descriptor can remain
client does not treat it as Authority
new Host publishes a new boot descriptor only after becoming ready
```

Also prove graceful SIGTERM/SIGINT closes Management and private PostgreSQL via
the existing terminal handoff.

---

# 71. Qualification scenario Q5 — missing bootstrap credential

After a real initialized Installation exists, remove one required bootstrap OS
credential.

Restart.

Expected:

```text
fail closed
no automatic replacement
no plaintext fallback
no database reinitialization
```

This proves the production BootstrapKeyProvider truth.

---

# 72. Qualification scenario Q6 — Host fence / database authority

Prove:

```text
runtime role direct authoritative DML denied
Management mutations use Host-fenced functions
stale/lost Host Authority blocks canonical Management mutation
```

No bypass via raw pg/Kysely.

---

# 73. Qualification scenario Q7 — generated contract chain

Prove:

```text
Fastify route schemas
→ OpenAPI
→ generated ManagementClient
```

are in sync.

Generated client can:

```text
discover contract
login
query authenticated ReadModel
receive canonical Problem
```

No duplicated handwritten client model.

---

# 74. Qualification scenario Q8 — repository/product boundary

Prove:

```text
built JS Product Host used
built JS CLI used
actual latest selected dependencies installed
no production import from integration/**
CLI has no DB/Runtime/Host internal dependency
Management has no Fastify/oclif/keyring dependency
future cookie/CSRF/SSE/Cedar packages are not accidentally installed
GUI absent
OpenClaw absent
P2/P3/P4 code absent
```

Run full repository gates.

---

# 75. Native keyring qualification

On the actual current development/qualification profile, exercise:

```text
create
read through callback
replace
delete
not-found
process restart/reopen
```

using the exact current `@napi-rs/keyring` selected by P1.

Record the actual platform.

Do not infer:

```text
Windows PASS
Linux PASS
macOS PASS
service/headless PASS
```

from another profile.

If the actual profile cannot support the adopted keyring route, report the real
blocker and use the already-authorized platform-specific credential-provider
route only through normal dependency/implementation governance.

Do not add plaintext fallback.

---

# 76. Unit/focused tests

Keep focused tests for:

```text
OS credential error normalization
Bootstrap fresh-vs-existing credential policy
ProductGeneration deterministic digest
Administrator single-row invariant
claim expiry/replay/concurrency
Argon2 verify/failure
session create/expire/revoke/authEpoch
Problem redaction
Runtime introspection contains no Authority handles
endpoint descriptor stale/bootId logic
CLI machine output
OpenAPI/client generation drift
```

Do not create a large generic test harness.

---

# 77. Canonical schema tests

Verify:

```text
three P1 Management tables
single Administrator invariant
single current unconsumed claim invariant
session FK/digest uniqueness
Host-fenced mutation functions
runtime direct DML denial
```

Do not add migration-compatibility tests.

PRE_PRODUCTION baseline is rewritten directly.

---

# 78. Dependency/import tests

At minimum enforce:

```text
management !→ fastify
management !→ @oclif/core
management !→ @napi-rs/keyring

management-client !→ product-host
management-client !→ persistence/runtime

cli !→ product-host
cli !→ persistence/runtime/host-ownership/pg/kysely

product-host !→ integration/**
```

Use existing repository boundary tooling.

---

# 79. Generated-artifact discipline

Do not manually edit generated client code.

Add only the minimal generation/check targets necessary to prove:

```text
OpenAPI current
ManagementClient current
```

Do not create a generic schema registry/build framework.

---

# 80. Current repository verification

Before final completion run current equivalents of:

```text
format:check
lint
typecheck
tsc6
test
build
check:static
check:repo
check:unused
check:duplicates
docs:api:check
verify
git diff --check
```

plus the real Product Host process qualification.

Ordinary GitHub Actions remain non-blocking under current policy.

---

# 81. Documentation updates

Update current package/implementation docs for the Product packages.

At minimum:

```text
packages/README.md
packages/INDEX.md
packages/system/README.md
packages/application/README.md
each new package README.md
integration/README.md
integration/product-host/README.md
```

Permanent docs explain current ownership, not P1 chronology.

Do not leave:

```text
temporary
for P1 only
legacy
old path
phase migration
```

language in permanent package surfaces unless it describes an actual current
contract.

---

# 82. Current Authority updates

Update only current living Authority required by actual implementation:

```text
dependency routing / ledger / status
pnpm Catalog / lockfile
roadmap
Plans index
qualification evidence
package indexes
```

Historical completed Plans remain untouched.

---

# 83. No compatibility baggage

Because PRE_PRODUCTION has no declared compatibility obligation:

```text
rename foundation-repository
→ update all current consumers
→ delete old path
```

Do not add:

```text
deprecated alias
legacy export
compat wrapper
dual endpoint
old client DTO reader
```

for development history.

---

# 84. Implementation sequence

Execute in this order.

## P1.0 — install Plan / baseline

```text
install active Plan
record current SHA
run current baseline gates
```

## P1.1 — cleanup current Authority

```text
minimumReleaseAge → 0
stale current Operator wording correction
bounded executable dead-code audit
```

## P1.2 — dependency refresh

```text
query registry/upstream latest
correct @oclif/core identity
materialize current latest P1 packages
exact-pin Catalog
update dependency Authority
```

## P1.3 — topology/boundaries

```text
create package groups/packages
add client/application boundaries
production-vs-integration import rule
```

## P1.4 — Persistence seam cleanup

```text
rename/generalize foundation-repository
migrate current consumers
delete old public path
```

## P1.5 — OS credential + BootstrapKeyProvider

```text
keyring adapter
production Bootstrap provider
fresh provisioning
existing-install fail-closed
```

## P1.6 — ProductGeneration

```text
small deterministic source descriptor
content digest
runtime use
```

## P1.7 — Management persistence/auth

```text
canonical schema rewrite
repository
first claim
Administrator
session
Argon2
```

## P1.8 — Runtime introspection + Management service

```text
read-only snapshot
Management MicroSystem
Read Models
```

## P1.9 — Product Host + HTTP

```text
real production composition
Fastify
rate limiting
discovery files
shutdown
```

## P1.10 — OpenAPI + client

```text
@fastify/swagger
OpenAPI
Hey API client
local adapter
```

## P1.11 — CLI

```text
@oclif/core
@inquirer/password
commands
session keyring
machine mode
```

## P1.12 — Product qualification

Run Q1–Q8 plus focused unit/schema/import/native keyring tests.

## P1.13 — closure

```text
full repository gates
qualification truth
docs
Plan completion
STOP
```

---

# 85. Hard blockers

A blocker is evidence, not permission to create a parallel framework.

Examples:

```text
latest @napi-rs/keyring cannot operate on the required current profile
latest @oclif/core cannot compile/run under current Node/TS baseline
latest @hey-api/openapi-ts cannot generate the required fetch client
latest Fastify line contradicts the frozen current HTTP route
existing Bootstrap cannot support production Host composition
Host-fenced persistence cannot safely support Management repository
```

Response:

```text
collect minimal reproduction
classify:
  implementation defect
  dependency route incompatibility
  Spec/Architecture gap
report and follow current governance
```

Do not choose an old version solely for comfort.

Do not self-build generic mechanics merely because the newest library exposed a
migration task.

---

# 86. Things that are NOT blockers

These are expected P1 states:

```text
RuntimeGraph is small
CapabilityGraph is empty
no fixed Management port
no GUI
no cookies
no SSE
no Cedar
no ApprovalService
no provider
no Subject
no Messaging
no OpenClaw
WorkQueue/DBOS not started in Product Host yet
```

Do not expand scope to make the product look more complete than the current
slice.

---

# 87. Acceptance criteria

P1 is complete only when:

```yaml
dependencyPolicy:
  minimumReleaseAge: 0
  currentLatestSelectionRule: true
  exactCatalogPins: true

cleanup:
  staleCurrentOperatorTerminologyCorrected: true
  obsoleteExecutableProductCodeAuditPerformed: true
  confirmedFutureFoundationCodePreserved: true
  oldFoundationRepositorySurfaceRemoved: true
  compatibilityAliasAdded: false

productHost:
  builtExecutable: PASS
  existingBootstrapUsed: true
  duplicateBootstrap: false
  existingHostAuthorityUsed: true
  realProductGenerationId: PASS
  productionBootstrapKeyProvider: PASS
  loopbackManagement: PASS
  gracefulShutdown: PASS

management:
  Administrator: PASS
  firstClaim: PASS
  opaqueSession: PASS
  Argon2id: PASS
  rateLimit: PASS
  compatibilityDescriptor: PASS
  systemStatus: PASS
  hostReadModel: PASS
  runtimeGraph: PASS
  capabilityGraph: PASS
  readiness: PASS

managementFutureContracts:
  SystemActionTypesPreserved: true
  genericSystemActionRuntime: false
  CedarArchitecturePreserved: true
  CedarRuntime: false
  ApprovalArchitecturePreserved: true
  ApprovalRuntime: false

contracts:
  OpenAPI: PASS
  generatedManagementClient: PASS
  singleWireSchemaSource: true

cli:
  builtExecutable: PASS
  protectedPasswordInput: PASS
  localSessionCredentialStore: PASS
  machineJson: PASS
  directDbAccess: false

futureProductRoutes:
  externalPresentationArchitecturePreserved: true
  cookieRolePreserved: true
  csrfRolePreserved: true
  securityHeadersRolePreserved: true
  sseRolePreserved: true
  OpenClawArchitecturePreserved: true

notStarted:
  GUI: true
  OpenClawIntegration: true
  ConfigurationService: true
  SecretService: true
  NetworkAccess: true
  AIRuntime: true
  Subject: true
  Messaging: true

qualification:
  Q1_Q8: PASS
  actualKeyringProfile: PASS_OR_EXPLICIT_BLOCKER
  crossPlatformClaimsOnlyAsObserved: true

repository:
  fullGates: PASS
```

---

# P1 completion record — 2026-09-03

```yaml
state: COMPLETED
repositoryBaseline: master
startingRepositoryHead: 0dcc79380d51db6bc5677b0740cb4175f0f460d0
completionCommit: recorded by the Git completion commit for this Plan
activeProductPlan: NONE
nextEligiblePlans:
  P2: ELIGIBLE_NOT_AUTHORIZED
  O1: ELIGIBLE_NOT_AUTHORIZED
ordinaryGitHubActions: DISABLED_CURRENT_EXECUTION_POLICY
verification:
  pnpmVerify: PASS
  productHostIntegrationSkipNxCache: PASS
  generatedClientDriftCheck: PASS
  gitDiffCheck: PASS
  knowledgeAndRepositoryChecks: PASS
```

The exact current P1 dependency materialization is:

```yaml
fastify: 5.12.1
"@fastify/swagger": 9.8.1
"@fastify/rate-limit": 11.2.0
"@hey-api/openapi-ts": 0.99.0
"@oclif/core": 5.0.0
"@inquirer/password": 5.2.0
"@napi-rs/keyring": 2.0.0
node: 24.20.0
pnpm: 11.24.0
postgres: 18.6
minimumReleaseAge: 0
```

The built Product Host and reference CLI were executed on Windows x64 with
the repository-local PostgreSQL 18.6 toolchain and the native Windows OS
credential store. Q1 through Q8 all passed in four real integration cases;
the native keyring create/read/replace/delete/not-found profile passed, and
credential reuse across a child-process Host restart passed.

The remaining profile-scoped properties are deliberately `NOT_RUN`: Linux or
macOS keyring/Product Host execution, source-less artifact execution,
installed service-account ACL qualification, hardware power-loss testing, and
final cross-platform CI. These do not reopen this bounded P1 closure.

The former `foundation-repository` Persistence and WorkQueue public surfaces
were renamed to the single current `repository` integration surfaces and the
old paths were deleted. No compatibility alias, bridge, fallback, migration,
or second repository pool was added. RuntimeGraph/CapabilityGraph remain
read-only projections from the RuntimeKernel snapshot. The confirmed future
Management, Presentation, Machine Operations/OpenClaw, provider, Cedar,
Approval, Subject, and Messaging architecture/dependency roles remain
documented but unimplemented.

The final repository gates and their evidence are recorded in the completion
report for this execution. No Product GUI, OpenClaw integration,
ConfigurationService, SecretService, NetworkAccess, AIRuntime, Subject,
Messaging, Cedar runtime, or Approval runtime was started.

---

# 88. Completion

When P1 acceptance passes:

1. Record exact current dependency versions actually selected.
2. Record actual qualification platform/results.
3. Move this Plan to:

```text
project/plans/completed/product/
  p1-headless-product-host-initial-management-plane-2026-09-02.md
```

4. Mark `COMPLETED`.
5. Update `project/plans/INDEX.md`.
6. Update Roadmap current truth.
7. Leave no active Product Plan.
8. Mark:

```text
P2 = ELIGIBLE_NOT_AUTHORIZED
O1 = ELIGIBLE_NOT_AUTHORIZED
```

9. Do not create either next Plan.
10. STOP.

---

# 89. Final report

Coding Agent final report MUST state:

```text
starting SHA
final commits

deleted/renamed obsolete current surfaces
anything audited but intentionally retained because it has a confirmed future owner

minimumReleaseAge policy change
latest exact package versions selected
dependency Authority changes

new packages
Persistence repository seam result
production BootstrapKeyProvider result
actual keyring profile/result
ProductGeneration derivation

canonical Management schema
Administrator/claim/session behavior
HTTP routes
Read Models
OpenAPI
generated ManagementClient
CLI commands

Q1–Q8 results
full repository gates

explicit confirmation:
  no GUI
  no OpenClaw integration
  no provider/AIRuntime
  no Subject/Messaging
  no Cedar runtime
  no Approval runtime
  confirmed future architecture/dependency roles were not deleted

P1 state
P2/O1 eligibility state
```

Do not append a P2 or O1 implementation Plan.

---

# 90. Final STOP state

Successful P1 means:

```text
Foundation
= still CLOSED

Heptalogos Product
= real headless Product Host exists

Management
= real canonical loopback API exists
= generated ManagementClient exists
= complete P1 CLI exists

future UI
= still external
= Management contract can evolve for its real requirements
= browser/live mechanics remain retained future roles

Machine Operations
= OpenClaw route preserved
= not implemented yet

P2/O1
= eligible, not started
```

Then:

**STOP.**
