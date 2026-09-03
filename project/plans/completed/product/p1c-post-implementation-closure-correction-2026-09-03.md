# P1C — Post-Implementation Closure Correction

**State:** `COMPLETED`
**Mode:** `PRE_PRODUCTION`
**Task class:** `PRODUCT_IMPLEMENTATION_CORRECTION`
**Reviewed implementation commit:** `bcb5a2ba65ba929f39373da9781ddd3248936741`
**Parent implementation:** `P1 — Real Headless Product Host & Initial Management Plane`
**Primary purpose:** correct bounded P1 contract/truth defects before P2 or O1 begins
**P2:** `BLOCKED_BY_P1C_AND_RELEASE_FORM_QUALIFICATION`
**O1:** `BLOCKED_BY_P1C_AND_RELEASE_FORM_QUALIFICATION`
**Next required gate after P1C:** `P1R — Release-Form Product Qualification`
**Foundation H3:** remains `CLOSED`
**GUI:** remains outside this repository
**OpenClaw:** retained future Machine Operations route; not implemented in P1C
**Intended active path:** `project/plans/active/product/p1c-post-implementation-closure-correction-2026-09-03.md`
**Completion path:** `project/plans/completed/product/p1c-post-implementation-closure-correction-2026-09-03.md`

---

# 0. Review verdict

P1 established the correct product direction:

```text
real built Product Host
existing Bootstrap / Host Authority
canonical Administrator + session state
loopback Management HTTP
OpenAPI-derived ManagementClient
reference CLI
OS credential adapter
real process qualification
```

The implementation is not rejected and MUST NOT be rewritten wholesale.

Review of commit:

```text
bcb5a2ba65ba929f39373da9781ddd3248936741
feat: add headless Product Host and Management plane
```

found a bounded set of defects that make the current `P1 = COMPLETED` claim
premature:

```text
A. executable truth
   build identity is reconstructed from repository source at runtime.

B. lifecycle truth
   an unclaimed installation loses its valid first claim after 30 minutes.

C. normative contract conformance
   SystemAction wire/types promised by P1 are absent;
   ReadModel and Problem wire shapes under-project T2.

D. public/build boundary quality
   generated-client production is coupled to ProductHost internals;
   several package roots expose implementation/Authority-adjacent objects.
```

P1C fixes only these defects and then STOPs.

---

# 1. Starting truth

At review time:

```yaml
master: bcb5a2ba65ba929f39373da9781ddd3248936741

H3: CLOSED
T2: COMPLETED
P1:
  implementation: PRESENT
  recordedState: COMPLETED
  reviewState: CORRECTION_REQUIRED

P2: NOT_AUTHORIZED_UNTIL_P1C
O1: NOT_AUTHORIZED_UNTIL_P1C
```

The current dependency policy is correct:

```text
minimumReleaseAge = 0
use current/latest package release unless a concrete frozen-boundary
incompatibility is proven
exact-pin selected direct versions in Catalog
```

P1C MUST NOT restore a release-age gate.

---

# 2. What P1C is NOT

P1C is not:

```text
a second P1 implementation
a new Foundation stabilization phase
a dependency refresh sweep
a GUI stage
an OpenClaw stage
a provider stage
a Subject/Messaging stage
a Cedar/Approval stage
a packaging/update framework
```

Do not touch confirmed future code/roles merely because P1 does not currently
instantiate them.

Specifically retain current future Authority for:

```text
external Browser/Desktop Presentation
cookie / CSRF / security headers
SSE/live Management projection
Cedar PolicyService
ApprovalService
OpenClaw Machine Operations
Configuration / Secret / NetworkAccess / AIRuntime
Subject / Messaging / Behavior
backup / restore / update / package lifecycle
```

Also retain closed Foundation code with confirmed later Product consumers:

```text
WorkQueue
DurableExecution
Signal
EffectOperation
RuntimeKernel
```

---

# 3. Review findings

## R1 — ProductGeneration depends on source repository at runtime

Current:

```text
packages/application/product-host/src/generation.ts
```

walks repository inputs at ProductHost startup.

`startProductHost()` defaults that root to:

```text
process.cwd()
```

and the ProductHost qualification launches the built JS process with:

```text
cwd = repositoryRoot
```

Thus current evidence proves a built entry point can execute **inside the source
repository**, not that the built Product Host carries its own generation
identity.

Required correction:

```text
generation computation → build time
runtime → import/consume materialized identity only
```

No full release/SBOM framework.

---

## R2 — BootstrapRuntimeGeneration is not content-derived

Current ProductHost derives the Bootstrap runtime generation from a constant
semantic object representing package/contract identity.

That digest does not change when Bootstrap runtime implementation content
changes.

`BootstrapRuntimeGenerationId` is a content-digest generation identity.

Required correction:

```text
Bootstrap runtime generation → build-time content digest of Bootstrap runtime
implementation inputs
```

No second release system.

---

## R3 — first-administrator claim expires permanently until restart

Current claim TTL:

```text
30 minutes
```

ProductHost reconciles/publishes a claim at startup.

Readiness requires an Administrator or an unexpired claim.

No live Host path rotates an expired claim.

Therefore an untouched fresh installation eventually becomes:

```text
unclaimed
claim expired
Management NOT_READY
no new claim until Host restart
```

Required correction:

```text
one ProductHost-owned local timer
→ rotate/re-publish claim after expiry while still unclaimed
→ cancel after successful claim / Host close
```

No WorkItem, DBOS, generic scheduler, or durable timer framework.

---

## R4 — P1 promised SystemAction contract types but omitted them

The completed P1 Plan explicitly required current Management to implement the
frozen SystemAction wire/types and its acceptance claimed:

```yaml
SystemActionTypesPreserved: true
```

Current `@heptalogos/management` contains no:

```text
SystemActionDefinition
SystemChangePlan
SystemActionExecuteResult
```

Required correction:

```text
implement types + TypeBox/JSON Schema only
```

Do NOT implement:

```text
action registry
fake action
plan endpoint
execute endpoint
Cedar runtime
ApprovalService
ManagementOperation
```

P2/P3 provide the first real action consumers.

---

## R5 — common ReadModel envelope is missing

T2 froze:

```text
ResourceRef
ReadModelEnvelope<T>
```

Current P1 authenticated reads return independent top-level objects.

This omits common cross-client metadata such as:

```text
contractVersion
resource identity
continuityEpochId
```

from the shared shape.

Required correction:

```text
implement one current ReadModelEnvelope
wrap system/status, host, runtime/graph, capabilities, readiness
```

### Normative adjustment discovered by implementation

T2 currently makes:

```text
lineageContextRef
```

mandatory on every ReadModelEnvelope.

A point-in-time status read is not automatically a durable/cross-process causal
handoff. Creating retained Activity/Lineage only to satisfy a field would be
unnecessary machinery.

P1C MUST change the Management Spec to:

```ts
lineageContextRef?: LineageContextRef
```

for ordinary ReadModelEnvelope.

When a meaningful lineage already exists, include it.

Do not create a new Activity per status poll.

Do not weaken lineage requirements for durable work, mutation, action plan, or
cross-process causal handoff.

---

## R6 — Management Problem wire drops canonical semantics

Current canonical Problems have:

```text
problemCode
category
retryClass
title
detail
```

Current HTTP Management Problem drops:

```text
category
retryClass
```

Required correction:

```text
ManagementProblemDetails + schema + OpenAPI + generated client
must preserve category and retryClass
```

This is current machine-consumer value for CLI, future Presentation, and
OpenClaw.

PRE_PRODUCTION rules require rewriting current V1 directly.

Do not create management.v2 or a compatibility reader.

---

## R7 — Runtime/Capability schemas are weaker than the actual contract

Current TypeScript interfaces model RuntimeGraph structure, but current TypeBox
schemas use broad forms such as:

```text
Record<string, unknown>
```

for current system/capability objects.

That makes generated OpenAPI/client substantially weaker than the actual
Management contract.

Required correction: explicit current schemas for:

```text
RuntimeBindingSnapshot
RuntimeRequirementSnapshot
RuntimeProvisionSnapshot
RuntimeCapabilityRequirementSnapshot
RuntimeCapabilityProvisionSnapshot
RuntimeSystemSnapshot
RuntimeGraphEdge
RuntimeCapabilityGraphEntry
```

No new schema framework.

---

## R8 — ManagementClient root leaks generated implementation

Current root:

```text
export * from "./generated/index.js"
```

and public `ManagementClient` exposes a generated `transport`.

This turns Hey API generator internals into Heptalogos public API.

Required correction:

```text
root exports only stable Heptalogos facade + selected stable result/error types
generated code remains package-internal
transport remains closure-private
```

No `/generated` compatibility subpath.

---

## R9 — client generation secretly imports ProductHost implementation

Current ManagementClient generator imports:

```text
../../product-host/dist/index.js
```

to build the Fastify app and call `swagger()`.

This is a hidden build-time reverse dependency from client generation to
ProductHost implementation.

Required direction:

```text
Management schemas
→ ProductHost HTTP schemas
→ ProductHost generates OpenAPI artifact
→ ManagementClient generator reads artifact
→ generated client
```

Do not create a new OpenAPI package.

---

## R10 — ProductHost public handle exposes Authority-adjacent internals

Current ProductHost public return/root exposes objects including:

```text
BootstrapManagedHostContext
MicroSystemSupervisor
FastifyInstance
ManagementService
```

The Host context includes Authority state that is not a general ProductHost
consumer contract.

Required public handle:

```ts
interface ProductHostHandle {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly productGeneration: ProductGenerationId;
  readonly origin: string;
  readonly signal: AbortSignal;
  close(): Promise<void>;
}
```

Equivalent naming is allowed.

Must not expose raw:

```text
HostOwnershipToken
BootstrapManagedHostContext
MicroSystemSupervisor
FastifyInstance
ManagementService
PersistenceService
```

Internal build helpers should not be root exports.

---

## R11 — Management root exports private mechanics

Current Management root exposes:

```text
createManagementRepository
ManagementRepository
Argon2 parameters
password hash/verify helpers
digest/token helpers
```

These are package implementation mechanics.

Required root:

```text
semantic Management contracts/types/schemas
SystemAction contract types/schemas
ManagementService contract/factory
safe Problem projection helpers needed by HTTP adapter
```

Repository/password internals stay private.

No deprecated compatibility export.

---

## R12 — readiness contains fabricated/duplicated truth

Current readiness:

```text
managementServiceRunning = true
```

while ProductHost's value named:

```text
runtimeKernelActive
```

is currently derived from whether `system.management` is RUNNING.

These fields do not represent two independent truths.

Required:

```text
managementServiceRunning
→ derive from system.management ActualState == RUNNING

runtimeKernelActive
→ derive from Runtime supervisor/kernel lifecycle being open/usable
```

If no current lifecycle accessor exists, add the smallest read-only accessor.

No new state machine.

---

## R13 — Runtime snapshot uses an unsafe boundary cast

Current ProductHost adapts:

```text
RuntimeKernelReadOnlySnapshot
as unknown as
Management RuntimeIntrospectionSnapshot
```

Required:

```text
field-by-field pure adapter in ProductHost
compiler verifies both sides
```

Do not make Management depend on RuntimeKernel just to avoid the mapping.

---

## R14 — qualification current truth must be corrected

The original P1 qualification record is valid historical evidence for what was
run.

Do not delete it.

But current qualification must not claim final corrected P1 closure while:

```text
generation identity requires repository cwd/source scan
SystemAction wire/types are absent
claim lifecycle has a long-running expiry gap
```

Add a P1C correction qualification and point current Product truth at it after
the correction passes.

---

# 4. Authorized scope

P1C may modify:

```text
packages/application/product-host/**
packages/application/management-client/**
packages/application/cli/** only for changed contract adaptation

packages/system/management/**
packages/runtime/runtime-kernel/** only for minimal truthful lifecycle accessor

integration/product-host/**

specs/management/system-authority.md

project/qualification/**
project/roadmap/development-roadmap.md
project/plans/**

affected package README/index/API docs
```

P1C may adjust generated OpenAPI/client files.

No new third-party package is expected.

A proposed new package/dependency is a PLAN_GAP unless directly proven
necessary.

---

# 5. First mutation / sequencing state

Install this Plan first:

```text
project/plans/active/product/
  p1c-post-implementation-closure-correction-2026-09-03.md
```

Update Plan index.

While active, Roadmap current truth becomes:

```yaml
P1:
  implementation: PRESENT
  closure: CORRECTION_REQUIRED

P1C: ACTIVE
P1R: REQUIRED_AFTER_P1C
P2: BLOCKED_NOT_AUTHORIZED
O1: BLOCKED_NOT_AUTHORIZED
```

Do not rewrite completed P1 history into ACTIVE.

---

# 6. C1 — build-time generation identities

## 6.1 Remove runtime scan

Production ProductHost startup must not:

```text
scan packages/**
read source from process.cwd()
read pnpm-lock.yaml at runtime
require repositoryRoot for generation
```

Remove `repositoryRoot` from ProductHost options when it exists only for this
runtime generation scan.

## 6.2 One small ProductHost build generator

Create one ProductHost-owned build script, for example:

```text
packages/application/product-host/scripts/generate-build-identities.mjs
```

It materializes a generated source/artifact, for example:

```text
packages/application/product-host/src/generated/build-identities.ts
```

containing current:

```text
ProductGenerationId
BootstrapRuntimeGenerationId
```

Do not create a general release metadata subsystem.

## 6.3 Product generation input

Preserve P1's current simple whole-product source policy, but execute it at build
time.

Hash deterministic production inputs already intended by current P1 logic:

```text
production package source
production package manifests/build config relevant to current build
root current build/toolchain inputs selected by P1
pnpm-lock.yaml
```

Exclude:

```text
dist
node_modules
coverage
tmp
.git
.nx
tests
integration fixtures
README/docs
generated build-identity file itself
timestamps
absolute paths
```

Sort normalized paths.

## 6.4 Bootstrap generation input

Use a separate digest over:

```text
packages/bootstrap/bootstrap-runtime/src/**
bootstrap-runtime package/build metadata required by its build
```

Add other owned inputs only when current Bootstrap ownership requires them.

Do not use:

```text
Git SHA
timestamp
random ID
contract version alone
```

as generation identity.

## 6.5 Runtime

Runtime imports the generated identities.

It does not recompute them.

## 6.6 Gates

Add minimal:

```text
generate:build-identities
check:build-identities
```

or equivalent current Nx targets.

---

# 7. C2 — first-claim live maintenance

ProductHost owns exactly one local timer while unclaimed.

Flow:

```text
Host starts
→ Management ensureFirstAdministratorClaim()
→ publish claim file
→ schedule current expiresAt
```

On timer:

```text
ensureFirstAdministratorClaim()
→ expired claim replaced by existing Management canonical mutation
→ publish replacement claim file
→ schedule replacement expiry
```

On Administrator claimed:

```text
clear timer
remove matching claim file
```

On Host close:

```text
clear timer
```

If renewal fails:

```text
do not spin
schedule one local retry after 5 seconds while still unclaimed
Readiness remains truthful
```

No:

```text
WorkItem
DBOS
generic scheduler
durable timer table
Configuration setting
public claim-lifetime CLI flag
```

A package-private timer/clock test seam is allowed.

---

# 8. C3 — SystemAction contract completion

Implement/export current types and schemas:

```text
SystemActionId
SystemChangePlanId
ResourceRef
TargetPrecondition
SystemActionDefinition
SystemChangePlan
SystemActionExecuteResult
```

Use current identity primitives:

```text
SystemActionId
→ stable namespaced semantic ID

SystemChangePlanId
→ UUIDv7 generated identity

digests
→ current canonical/Management digest primitive
```

Implement frozen T2 fields, including:

```text
actionVersion
input/output schema refs
targetKind
riskClass
applyMode

normalizedInputDigest
targetPreconditions
affectedSemanticOwners
configuration/readiness/Subject impact
restart/reconcile impact
planDigest
createdAt
lineageContextRef

postconditionsVerified
evidenceRefs
```

No action runtime or endpoint in P1C.

---

# 9. C4 — ReadModelEnvelope + bounded Spec correction

Update `specs/management/system-authority.md`:

```ts
interface ReadModelEnvelope<T> {
  readonly schemaVersion: 1;
  readonly contractVersion: string;
  readonly resource: ResourceRef;
  readonly observedAt: Instant;
  readonly productGeneration: ProductGenerationId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly data: T;
  readonly lineageContextRef?: LineageContextRef;
}
```

Add explicit rule:

> Ordinary stateless Management reads do not create retained Activity/Lineage
> solely to fill the envelope. Include a LineageContextRef when meaningful
> current lineage already exists.

This does not weaken mutation/durable-work lineage.

Wrap P1 authenticated reads:

```text
GET /management/v1/system/status
GET /management/v1/host
GET /management/v1/runtime/graph
GET /management/v1/capabilities
GET /management/v1/readiness
```

Suggested `ResourceRef`:

```text
system-status         → InstallationId
host                  → InstanceId
runtime-graph         → InstallationId
capability-graph      → InstallationId
management-readiness  → InstallationId
```

ResourceRefs are projections, not new DB rows.

Move common:

```text
contract version
observedAt
ProductGenerationId
ContinuityEpochId
```

to the envelope instead of duplicating them inside data where no independent
meaning exists.

---

# 10. C5 — complete Problem projection

Add to current Management Problem wire type/schema:

```text
category
retryClass
```

Ensure:

```text
toManagementProblemDetails()
Fastify response schema
OpenAPI
ManagementClient
CLI error adaptation
```

preserve them.

Keep current:

```text
MANAGEMENT_CONTRACT_VERSION = management.v1
```

because PRE_PRODUCTION versioning requires one current V1 and no development
compatibility bridge.

---

# 11. C6 — strong current Runtime/Capability schemas

Replace broad `Record<string, unknown>` shapes for current core fields with
explicit TypeBox schemas matching current runtime contracts:

```text
RuntimeBindingSnapshot
RuntimeRequirementSnapshot
RuntimeProvisionSnapshot
RuntimeCapabilityRequirementSnapshot
RuntimeCapabilityProvisionSnapshot
RuntimeSystemSnapshot
RuntimeGraphEdge
RuntimeCapabilityGraphEntry
```

Use literal unions for finite current states/roles where current Runtime already
defines them.

Generated client must expose useful typed fields without consumer casts.

Do not model future Runtime states.

---

# 12. C7 — truthful Runtime projection/readiness

Replace unsafe:

```text
as unknown as RuntimeIntrospectionSnapshot
```

with a pure ProductHost adapter.

Derive:

```text
managementServiceRunning
→ system.management ActualState == RUNNING
```

Derive:

```text
runtimeKernelActive
→ supervisor/kernel open/usable state
```

If necessary, add only a tiny read-only lifecycle accessor to RuntimeKernel.

If `endpointDescriptorCurrent` only means "successfully published by this
process", rename it to a truthful name such as:

```text
endpointDescriptorPublished
```

rather than adding filesystem polling.

Regenerate current wire/client shapes.

---

# 13. C8 — ProductHost public surface containment

Public ProductHost handle should contain only safe application state:

```text
InstallationId
InstanceId
BootId
ProductGenerationId
origin
AbortSignal
close()
```

Equivalent naming is acceptable.

Do not publicly return:

```text
BootstrapManagedHostContext
HostOwnershipToken
MicroSystemSupervisor
FastifyInstance
ManagementService
PersistenceService
```

Remove root exports for implementation/build helpers unless a real external
consumer exists:

```text
createManagementHttpApp
generation derivation helpers
argv parse helpers
```

`bin.ts` uses only safe fields.

---

# 14. C9 — Management root containment

Remove public root exports of:

```text
createManagementRepository
ManagementRepository
Argon2 parameter constants
password normalize/hash/verify helpers
Management secret digest helper
random token helper
```

These remain package-private.

Public root retains:

```text
Management semantic types/schemas
ReadModel envelope/types/schemas
SystemAction types/schemas
ManagementService interface/factory
Problem projection helpers needed by ProductHost HTTP adapter
```

No internal/legacy compatibility subpath.

---

# 15. C10 — ProductHost-owned OpenAPI artifact

ProductHost owns OpenAPI generation.

Create a generated artifact under ProductHost, e.g.:

```text
packages/application/product-host/generated/management.openapi.json
```

Use current repository generated-file conventions if another exact path is
better.

ProductHost gets:

```text
generate:openapi
check:openapi
```

The ProductHost generator may internally:

```text
construct schema-only Fastify app
ready()
swagger()
write deterministic JSON
close()
```

It must not start PostgreSQL.

ManagementClient generator changes to:

```text
read ProductHost OpenAPI artifact
→ run @hey-api/openapi-ts
→ write generated client
```

It MUST NOT import ProductHost `dist` or source code.

Nx can declare an explicit target dependency on ProductHost OpenAPI generation.

No new OpenAPI package.

---

# 16. C11 — ManagementClient facade containment

Root must not:

```ts
export * from "./generated/index.js";
```

Public `ManagementClient` must not expose generated `transport`.

Generated client stays closure-private.

Export stable Heptalogos-owned aliases for current results/errors as needed, for
example:

```text
ManagementDiscoveryResult
SystemStatusResult
HostReadModelResult
RuntimeGraphResult
CapabilityGraphResult
ReadinessResult
ManagementProblemDetails
```

Future generator upgrades must not require external Presentation/OpenClaw code
to import Hey API generated filenames directly.

No `/generated` compatibility export.

---

# 17. C12 — qualification truth

Keep original:

```text
project/qualification/results/Q-P1-PRODUCT-HOST-01.md
```

unchanged as historical P1 evidence.

Create:

```text
project/qualification/results/Q-P1C-PRODUCT-HOST-01.md
```

or the exact current naming-style equivalent.

Update current qualification projection after P1C passes.

While P1C is active, do not present the original P1 record as final proof of the
corrected properties.

---

# 18. Focused P1C qualification

P1C does not re-run every old scenario independently when existing regression
targets already cover it.

It MUST prove the corrected properties below and then run the existing P1
regression suite/full repository gate.

## Q-C1 — built Host outside repository cwd

Launch built ProductHost with:

```text
cwd = temp directory outside repository
```

Pass explicit valid:

```text
anchor root
PostgreSQL binary root
initial PostgreSQL port for fresh install
```

Do not place source tree/lockfile in cwd.

PASS requires ProductHost reaches READY and generation identities are available.

This proves runtime generation no longer needs repository cwd.

It does NOT claim source-less shipping qualification.

## Q-C2 — build identity determinism

Prove:

```text
same included Product inputs → same ProductGenerationId
change included Product input → different ProductGenerationId

same Bootstrap runtime inputs → same BootstrapRuntimeGenerationId
change Bootstrap runtime input → different BootstrapRuntimeGenerationId
```

Use temporary build fixtures if necessary.

## Q-C3 — claim rotation without Host restart

With a package-private controlled timer/clock:

```text
fresh unclaimed Host
→ claim A
→ pass expiry
→ claim B published
→ A invalid
→ B valid
→ readiness coherent
→ claim B succeeds
→ no more rotation after Administrator exists
```

Shutdown cancels timer.

## Q-C4 — SystemAction contract surface

Compile/schema test Management root:

```text
SystemActionDefinition present
SystemChangePlan present
SystemActionExecuteResult present
wire schemas present
```

Also prove no action runtime/endpoint exists.

## Q-C5 — read envelope

Generated OpenAPI/client for each P1 read contains:

```text
schemaVersion
contractVersion
resource
observedAt
productGeneration
continuityEpochId
data
optional lineageContextRef
```

No artificial Activity is required for a normal poll.

## Q-C6 — Problem semantics

Through real/injected HTTP + generated client, trigger:

```text
invalid input
invalid credentials
rate limit
contract mismatch
```

Each Problem carries:

```text
problemCode
category
retryClass
status
title
detail
schemaVersion
```

## Q-C7 — generated graph types

Compile a consumer using current ManagementClient.

Current Runtime/Capability structures must be typed and must not require
`Record<string, unknown>` casts for their core current fields.

## Q-C8 — public surfaces

Static/API tests prove:

```text
ProductHost root:
  no Host context
  no supervisor
  no Fastify
  no ManagementService
  no generation/build helpers

Management root:
  no repository
  no password/hash/token helpers
  SystemAction contract present

ManagementClient root:
  no generated wildcard
  no public generated transport
```

## Q-C9 — OpenAPI generation direction

Prove:

```text
ProductHost generates OpenAPI artifact
ManagementClient generator consumes the artifact
ManagementClient generator imports no ProductHost code
OpenAPI drift check PASS
client drift check PASS
```

## Q-C10 — readiness truth

Prove:

```text
Management MicroSystem not RUNNING
→ managementServiceRunning false

Runtime supervisor not usable/open
→ runtimeKernelActive false

normal P1 running state
→ both true
```

No hardcoded readiness boolean.

## Q-C11 — P1 regression

Re-run current relevant P1 ProductHost/Management/CLI/schema/boundary qualification
and full repository verify.

No regression in:

```text
claim/login/logout
session keyring
Host exclusion
Host fence
stale endpoint handling
graceful shutdown
```

---

# 19. Dependency policy

No new dependency is expected.

Do not perform a general dependency-update sweep under P1C.

If a directly touched P1 dependency must be reselected, current rule remains:

```text
current/latest release
→ verify Node 24 / TS7 / ESM / peer/API/native compatibility
→ exact pin
```

Release age is not a selection criterion.

Keep future role decisions intact:

```text
cookie
CSRF
security headers
SSE
Cedar
OpenClaw
```

---

# 20. Code deletion policy

Expected P1C removals are P1-created accidental surfaces, not future product
capabilities:

```text
runtime source-tree generation scan
repositoryRoot generation input
ProductHost generation/build helper root exports
ProductHost raw Authority-adjacent handle fields
Management repository/password root exports
ManagementClient generated wildcard root export
ManagementClient public transport
ManagementClient generator ProductHost code import
unsafe Runtime `as unknown as` adapter
hardcoded readiness boolean
```

No compatibility aliases.

Do not delete confirmed later Foundation/Product machinery.

---

# 21. Documentation

Update permanent package docs to describe the corrected current surfaces.

At minimum update affected:

```text
ProductHost README
Management README
ManagementClient README
integration/product-host README
package/API indexes as required
Roadmap
Qualification current projection
```

Permanent docs do not contain:

```text
old P1 path
legacy
deprecated compatibility
temporary P1C workaround
```

Historical Plans/qualification preserve chronology.

---

# 22. Execution order

1. Install P1C Plan and block P2/O1.
2. Correct build-time Product/Bootstrap generation.
3. Add live first-claim rotation.
4. Complete SystemAction types/schemas.
5. Correct Management Spec ReadModel lineage optionality.
6. Implement ReadModelEnvelope + Problem semantics + strong graph schemas.
7. Correct Runtime adapter/readiness truth.
8. Reduce ProductHost/Management public roots.
9. Move OpenAPI generation ownership to ProductHost artifact.
10. Reduce ManagementClient facade and generation coupling.
11. Regenerate OpenAPI/client.
12. Run Q-C1 through Q-C11.
13. Run full repository gates.
14. Publish P1C qualification/current-truth update.
15. Complete Plan and STOP.

Do not begin P2/O1.

---

# 23. Full verification

Run current equivalents of:

```text
format:check
lint
typecheck
TS6 compatibility lane
test
build
check:static
check:repo
check:unused
check:duplicates
docs:api:check
OpenAPI drift check
ManagementClient generation check
ProductHost process qualification
git diff --check
full verify
```

Ordinary GitHub Actions remain non-blocking under current execution policy.

---

# 24. Acceptance

P1C completes only when:

```yaml
generation:
  productRuntimeRepoScan: false
  bootstrapConstantGeneration: false
  productBuildIdentity: PASS
  bootstrapBuildIdentity: PASS
  repositoryCwdRequired: false

claim:
  liveRotation: PASS
  restartRequiredAfterExpiry: false
  genericSchedulerAdded: false

systemAction:
  typesAndSchemas: PASS
  runtimeRegistry: false
  fakeActions: false

readModel:
  ResourceRef: PASS
  envelope: PASS
  contractVersion: true
  productGeneration: true
  continuityEpoch: true
  optionalLineageForStatelessRead: true
  artificialActivityPerPoll: false

problem:
  problemCode: true
  category: true
  retryClass: true
  status: true

graphSchemas:
  runtimeTyped: true
  capabilitiesTyped: true
  coreUnknownRecords: false

runtimeTruth:
  unsafeUnknownCast: false
  managementServiceRunningDerived: true
  runtimeKernelActiveDerived: true
  hardcodedReadiness: false

productHostPublic:
  HostContext: false
  Supervisor: false
  Fastify: false
  ManagementService: false
  buildHelpers: false

managementPublic:
  repository: false
  passwordMechanics: false
  SystemActionContracts: true

openApi:
  owner: PRODUCT_HOST
  artifact: PASS
  drift: PASS

managementClient:
  importsProductHostCodeForGeneration: false
  generatedWildcardRoot: false
  publicTransport: false
  stableFacade: true
  drift: PASS

contractVersion:
  current: management.v1
  legacyBridge: false
  dualVersion: false

futureAuthority:
  externalPresentationPreserved: true
  cookiePreserved: true
  csrfPreserved: true
  securityHeadersPreserved: true
  ssePreserved: true
  CedarPreserved: true
  ApprovalPreserved: true
  OpenClawPreserved: true

scope:
  P2Started: false
  O1Started: false
  GUIStarted: false
  SubjectStarted: false
  AIRuntimeStarted: false
  FoundationReopened: false

qualification:
  QC1_QC11: PASS
  originalP1EvidencePreserved: true
  correctedCurrentEvidencePublished: true

repository:
  fullGates: PASS
```

---

# 25. Completion state

After all acceptance criteria pass:

```yaml
P1:
  implementation: PRESENT
  closure: CLOSED_CORRECTED

P1C: COMPLETED

P2: ELIGIBLE_NOT_AUTHORIZED
O1: ELIGIBLE_NOT_AUTHORIZED

activeProductPlan: NONE
```

Move Plan to:

```text
project/plans/completed/product/
  p1c-post-implementation-closure-correction-2026-09-03.md
```

Update Plans index, Roadmap, and Qualification current truth.

Do not mark as PASS without execution:

```text
source-less shipping
Linux ProductHost
macOS ProductHost
service mode
remote Management
browser Presentation
OpenClaw integration
```

Q-C1 proves only that generation no longer depends on source-repository cwd.

---

# 26. Final report

Coding Agent final report MUST state:

```text
starting SHA
files changed

ProductGeneration correction
BootstrapRuntimeGeneration correction
Q-C1 / Q-C2

claim rotation correction
Q-C3

SystemAction contracts added
Q-C4

ReadModel Spec correction + envelope
Problem category/retryClass
typed Runtime/Capability schemas
Q-C5 / Q-C6 / Q-C7

Runtime adapter/readiness correction
ProductHost public surface
Management public surface
OpenAPI generation ownership
ManagementClient facade/generation
Q-C8 / Q-C9 / Q-C10

P1 regression Q-C11
full repository gates
new qualification evidence

explicit confirmation:
  no P2
  no O1
  no GUI
  no OpenClaw integration
  no Subject/Messaging
  no AIRuntime/provider
  no Cedar runtime
  no Approval runtime
  retained future roles were not removed

P1C final state
P2/O1 eligibility
```

Do not append the next implementation Plan.

---

# 27. STOP

Successful P1C means:

```text
P1 architecture
= retained

Product Host
= built identity is carried by build
= no runtime repository scan for generation
= unclaimed installation remains claimable while Host stays alive
= no Authority internals in public handle

Management
= frozen SystemAction wire contract actually exists
= common machine-consumable ReadModel envelope exists
= canonical Problem semantics survive HTTP/client projection
= Runtime/Capability schemas are strongly typed
= readiness reports observed truth

ManagementClient
= generated from ProductHost-owned OpenAPI artifact
= no hidden ProductHost implementation import
= stable Heptalogos facade only

future requirements
= preserved, not prematurely instantiated

P2 / O1
= eligible, not started
```

Then:

**STOP.**

---

# 31. Mandatory next gate — P1R Release-Form Product Qualification

P1C only corrects the current Product Host implementation and its repository
qualification truth.

It does **not** prove the actual product release form.

The current P1/P1C process tests still execute artifacts that originate from
the repository build graph. Even Q-C1 only proves that runtime generation
identity no longer depends on `repositoryRoot` / repository `cwd`. It does not
prove production dependency closure, native-binary closure, release directory
layout, launcher behavior, bundled PostgreSQL behavior, or installed-product
permissions.

Therefore P1R is mandatory before P2 or O1 begins.

## 31.1 P1R purpose

P1R answers:

> Can the current Product Host + ManagementClient + CLI operate from the same
> artifact shape that a user would actually receive, without relying on the
> source repository, workspace symlinks, development dependencies, test
> fixtures, Nx/pnpm execution context, or repository-relative paths?

P1R is a **Product qualification / packaging-risk retirement gate**.

It is not another Product feature stage.

## 31.2 Required release-shaped artifact

P1R MUST assemble an isolated Product root containing only runtime/release
inputs.

Conceptually:

```text
Heptalogos Product Root
├── host launcher/runtime
├── CLI launcher/runtime
├── production JS/runtime closure
├── required native runtime payloads
├── Product metadata / generation identity
├── Management contract/client runtime
├── private PostgreSQL runtime payload if that is the current release design
├── required third-party licenses/notices
└── no repository source/workspace dependency
```

The exact packaging mechanism is a P1R implementation decision.

Do not assume that copying `dist/**` alone is a release artifact.

## 31.3 Forbidden dependencies in release qualification

The released Product root MUST NOT require:

```text
repository .git
packages/** source tree
integration/**
project/**
specs/**
docs/**
Nx
pnpm workspace resolution
workspace:* symlinks
repository node_modules layout
devDependencies
Vitest
test fixtures
HEPTALOGOS_TEST_* variables
repository-local generated files that were not materialized into the artifact
```

A qualification harness may exist outside the Product root, but the launched
Product process may not import/read from it except for explicit test-driving
inputs such as a temporary installation root.

## 31.4 Release-form qualification levels

P1R MUST distinguish at least:

```text
RF-L1  source-less release-shaped artifact
RF-L2  installed/headless operating profile
RF-L3  cross-platform release artifact
```

P1R initial closure requires RF-L1 on the actually available qualification
platform.

RF-L2 and RF-L3 remain individually PASS / NOT_RUN unless actually executed.

Do not promote one platform to cross-platform release proof.

## 31.5 RF-L1 minimum scenarios

At minimum prove:

```text
R1 fresh installation from release Product root
R2 Product Host starts without repository/workspace
R3 private PostgreSQL starts from the release-selected runtime path
R4 first Administrator claim works
R5 CLI discovers Host from installation data, not repository topology
R6 login/read/logout works
R7 Host restart preserves Installation/Administrator/session semantics as owned
R8 native OS credential dependency resolves from release artifact
R9 ProductGeneration and BootstrapRuntimeGeneration are materialized and stable
R10 hard-kill/restart does not require repository recovery code
R11 release Product root contains no undeclared runtime dependency on dev files
R12 Management OpenAPI/generated client used by the release is the checked
    current artifact
```

If the current intended release design bundles PostgreSQL, RF-L1 MUST use the
bundled PostgreSQL payload.

Using `HEPTALOGOS_TEST_PG_BIN` is not sufficient for release-form PASS in that
case.

## 31.6 Release artifact closure audit

P1R MUST audit the actual artifact, not infer closure from package.json.

Audit at least:

```text
runtime JS dependency closure
native `.node` / platform binary closure
PostgreSQL executable/library closure
license/notice closure for bundled third-party runtime payloads
relative/absolute path assumptions
launcher entrypoints
ESM resolution
dynamic imports
optional dependency resolution
working-directory independence
write locations versus read-only program files
```

## 31.7 Product roots and writable state

Qualification MUST prove the Product can run with Program/Product files treated
as release content rather than a writable repository.

Normal mutable state must stay in the owning lifecycle roots:

```text
DATA
CONFIG
CACHE
RUN
LOG
```

or the current canonical root set.

The Product must not write runtime state back into:

```text
package directory
dist directory
release Product root
source-like program files
```

unless a current Product contract explicitly owns such a write.

## 31.8 Packaging mechanics are not Architecture authority

P1R may introduce the smallest packaging/build machinery required to produce
the real artifact.

It MUST NOT use qualification pressure to invent:

```text
generic updater
installer framework
plugin package manager
multi-channel release service
rollback framework
auto-update
artifact registry
remote deployment system
```

unless separately authorized.

## 31.9 Qualification truth after P1R

Only after RF-L1 passes may current Product truth say:

```yaml
sourceLessReleaseShapedProduct: PASS
releaseProductHost: PASS
releaseManagementClientCliPath: PASS
```

Still keep independently truthful:

```yaml
installedServiceHeadless: PASS | NOT_RUN
serviceAccountAcl: PASS | NOT_RUN
linuxReleaseArtifact: PASS | NOT_RUN
macosReleaseArtifact: PASS | NOT_RUN
windowsReleaseArtifact: PASS | NOT_RUN
hardwarePowerLoss: PASS | NOT_RUN
```

## 31.10 Sequencing consequence

Required sequence becomes:

```text
P1 implementation
→ P1C code/contract closure correction
→ P1R release-form Product qualification
→ P2 / O1 eligible
```

Reason:

```text
P2 and O1 will add more runtime dependencies and Product capabilities.
If release topology, native closure, path ownership, or launcher assumptions are
wrong, discovering that after P2/P3 would amplify correction cost.
```

P1R therefore retires Product-distribution risk before the dependency surface
grows.

## 31.11 P1C STOP remains strict

P1C itself MUST NOT implement P1R packaging.

At P1C completion:

```text
record P1R as next required gate
do not append P1R implementation code
do not start P2
do not start O1
STOP
```

A separate decision-complete P1R Plan must authorize that work.

---

# 32. Completion record

```yaml
completedAt: 2026-09-03
state: COMPLETED
startingRepositoryHead: bcb5a2ba65ba929f39373da9781ddd3248936741
completionEvidence: Q-C1_Q-C11_PASS
fullRepositoryGates: PASS
activeProductPlan: NONE
P1: CLOSED_CORRECTED
P1R: REQUIRED_NEXT_GATE
P2: ELIGIBLE_NOT_AUTHORIZED
O1: ELIGIBLE_NOT_AUTHORIZED
ordinaryGitHubActions: DISABLED_CURRENT_EXECUTION_POLICY
```

The original P1 qualification remains historical evidence; the corrected
current qualification is `Q-P1C-PRODUCT-HOST-01`. P1R is separately required
and was not implemented here. No P2, O1, GUI, OpenClaw, Subject, Messaging,
AIRuntime, provider, Cedar, or Approval work was started. STOP.
