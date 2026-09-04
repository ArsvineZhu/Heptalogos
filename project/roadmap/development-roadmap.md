# Heptalogos Development Roadmap

**Status:** LIVING ROADMAP / planning guidance<br>
**Date:** 2026-09-04<br>
**Current repository locus:** master after Foundation closure<br>
**Foundation closure baseline:** PR #32, merge commit 51317428a89b5545d3ac614f1012d869a1251203; retained as evidence, not a current HEAD pin<br>
**Architecture baseline:** `docs/architecture/` design state 2026-08-20

> This document owns development sequencing, Horizon truth, and qualification guidance. It does not replace the canonical Human Architecture, current Specs, Governance, Dependencies, Qualification, or active Plan. Update this Roadmap when evidence changes sequencing or eligibility; update the relevant canonical owner when semantics change.

---

## 1. Purpose

Earlier work established the trustworthy engineering and contract spine:
repository/toolchain governance, cross-platform process mechanics, canonical
serialization/digest/identity/Problem primitives, BootstrapState, recoverable
BootstrapStateStore, per-boot BootstrapJournal, and the pre-PostgreSQL bootstrap
substrate with strict installation/instance location, independent roots,
no-stale-takeover ownership, and ownership-guarded state mutation.

The earlier engineering and bootstrap work did **not** establish the complete
executable Foundation. The progress metric is therefore “system invariants
proven by executable scenarios”, not “packages/interfaces/tests added”.

The roadmap has four jobs:

1. preserve hard architectural dependency edges;
2. expose work that can safely proceed in parallel;
3. place implementation/product qualification at the first point where evidence is useful;
4. prevent feature pressure from bypassing ownership, authority, durability, lifecycle, and recovery.

---

## 2. Roadmap model: dependency DAG, not a rigid waterfall

The project should not be driven by one fixed sequence of feature milestones.
Use three interacting tracks.

### 2.1 Capability track

Build closed system capabilities such as:

- owning an installation/instance safely;
- owning canonical PostgreSQL mutation authority;
- reconciling a runtime graph;
- surviving asynchronous/crash boundaries;
- safely administering the system;
- composing replaceable generations;
- completing a minimal Subject interaction loop;
- surviving update/restore/pressure/release conditions.

A capability may span several packages. A package is not a milestone.

### 2.2 Risk-retirement track

An ADOPTED dependency is not re-selected by default, but its exact integration should be qualified before the product becomes structurally dependent on unproven behavior.

High-value examples:

- private PostgreSQL process/ownership/fence behavior;
- Cordis lifecycle/scope/disposal behind RuntimeSubstrate;
- DBOS static durable dispatcher + queue/recovery/applicationVersion behavior;
- Cedar WASM loading/authorization boundary;
- AI SDK provider/model/tool mechanics without agent-runtime leakage;
- MCP protocol-era/transport behavior;
- source-less/native artifact closure.

These are bounded evidence gates, not alternate product implementations.

### 2.3 Product-qualification track

Product qualification proves exact shipping reality: exact package/binary closure, real OS/service/headless behavior, source-less artifacts, crash/restart, update/restore, real protocols/providers. It should not block every semantic milestone, but it must close before the corresponding product claim/release gate.

### 2.4 Executable Truth ratchet

Every Horizon identifies the strongest executable proof it owns. Package,
interface, and unit-test counts do not substitute for that outcome. The proof
levels are:

```text
L1 package correctness
L2 real component composition
L3 process-level executable composition
L4 product vertical slice
```

Foundation may grow only while its current executable spine remains green. The
closed asynchronous Foundation capability owns real PostgreSQL, real DBOS, one
canonical WorkItem, and boot/work/stop/restart. The Subject vertical slice owns
a real Product L4 path: accepted MessageFact → bounded conversation proposal →
optional CommunicationCommit → independent Expression → local outbound fact.

---

## 3. Fixed edges versus flexible ordering

### 3.1 Hard edges

The following are architecture-level ordering constraints and should not be casually reordered:

1. **Normal canonical mutation requires proven Host ownership.** Bootstrap ownership must hand off to PostgreSQL Host lease + HostOwnershipFence/HostOwnershipToken before normal writes/effect dispatch are admitted.
2. **Canonical truth precedes asynchronous obligation.** External/canonical facts are committed before WorkItem processing becomes authoritative.
3. **Required Evidence/Lineage identity is established at the authority transition, not reconstructed later.**
4. **Durable work/effects require explicit version, generation, attempt and uncertainty semantics before real external integration depends on them.**
5. **Normal Product Management mutation follows the current SystemAction plan/execute path and owning Service before CLI/HTTP/Management clients project it. Policy authorization, Approval, and durable operation semantics enter only when a real current consumer or requirement needs them.**
6. **Real AI/provider and Driver use requires Configuration/Secret/Network/Capability policy boundaries; raw SDK objects do not become Authority.**
7. **Basic Subject interaction must work without Persona/Memory/Relationship/Attention implementations.** Advanced cognition cannot become a hidden Subject Base prerequisite.
8. **Presentation remains a projection.** External Browser/Desktop/GUI consumers can be researched and can drive Host contract requirements, but they cannot define backend Authority or be implemented in this repository.
9. **Adopted dependency routes remain directives until evidence explicitly reopens a role decision.**

### 3.2 Flexible edges

The roadmap intentionally leaves these adjustable:

- package/workspace splits;
- exact milestone boundaries;
- how much Runtime Kernel and Persistence work proceeds in parallel after bootstrap ownership is established;
- whether StorageWorkspace/DataLifecycle pieces are pulled earlier to support a concrete owner;
- which real model provider or IM protocol is qualified first;
- how early UI prototypes consume mock/contract data;
- whether a capability horizon is one PR or several milestones;
- exact timing of L3 cross-platform/source-less qualification, provided claims remain truthful.

---

## 4. Capability sequence

The capability sections describe system maturity and dependency pressure; they
are not a mandatory one-section-one-Plan mapping.

## Engineering and Contract Spine — COMPLETE

### Outcome

The repository can safely evolve Foundation code with truthful gates and stable primitive contracts.

### Existing foundation

- root pnpm/Nx/TS7 toolchain and verification gates;
- `foundation-contracts` canonical JSON/digest/UUIDv7/Problem primitives;
- versioned BootstrapState + recoverable BootstrapStateStore;
- per-BootId BootstrapJournal;
- atomic publication boundary;
- cross-platform repository process substrate;
- an optional manually dispatched verification utility; ordinary GitHub Actions
  remain disabled under the current execution policy.

### What this foundation does not prove

It does not prove private PostgreSQL, runtime supervision, durable work, system management, Subject behavior, extension lifecycle, real packaging, or product recovery.

---

## Installation, Bootstrap, and Host Ownership — COMPLETE

### Question answered

> Can a Heptalogos installation reliably identify itself, locate its independent lifecycle roots, obtain exclusive bootstrap ownership, start/validate its private PostgreSQL, and hand ownership to exactly one normal Host without an authority gap?

### Current status (2026-09-03)

Installation, bootstrap, host ownership, canonical truth, runtime composition,
and asynchronous Foundation semantics are complete/closed at their respective
semantic boundaries. Product qualification remains property-scoped:

```yaml
current_product_qualification:
  windows_real_postgres: PASS
  ubuntu_linux_real_postgres: PASS
  macos_real_postgres: NOT_RUN
  source_less: NOT_RUN
  service_headless: NOT_RUN
  service_account_acl: NOT_RUN
  hardware_power_loss: NOT_RUN
```

The recorded evidence proves real PostgreSQL on Windows and Ubuntu/Linux;
macOS real PostgreSQL, source-less execution, installed service/headless
execution, service-account ACLs, and hardware power-loss behavior remain
`NOT_RUN`. Those boundaries remain at their recorded states and are not
implied by Foundation closure.

The Foundation evidence is maintained in
[`Q-RUNTIME-01`](../qualification/results/Q-RUNTIME-01.md)
and
[`Q-PERSISTENCE-01`](../qualification/results/Q-PERSISTENCE-01.md).
Historical implementation and qualification detail remains in completed plans
and historical qualification records rather than in this living roadmap.

### Capability closure

The horizon should realize the minimum executable chain around:

- InstallationId / InstanceId / BootId;
- PathProfile + protected bootstrap locator;
- independent lifecycle root mapping and path safety;
- BootstrapRuntime / ProductGeneration selection boundary;
- bootstrap ownership adapter (`@bybrave/proper-lockfile2` route);
- BootstrapKeyProvider minimum boundary;
- PrivatePostgresProfile / PrivatePostgresController;
- dedicated HostLeaseConnection;
- HostOwnershipFence / HostOwnershipToken;
- forward and reverse bootstrap ↔ Host ownership handoff;
- bounded bootstrap/recovery Problems and lineage handoff.

### Exit scenarios

A horizon-closing implementation should be able to prove scenarios such as:

- two Host attempts cannot both acquire normal mutation authority;
- a stale/old Host cannot commit after a newer Host publishes its token;
- already-entered old transactions serialize correctly against ownership transfer;
- lease connection loss fences/quiesces the Host rather than silently reconnecting and resuming;
- unknown/mismatched PostgreSQL data directory/identity/port is rejected rather than silently reinitialized;
- normal stop/maintenance performs reverse handoff without a no-owner window;
- independent roots work without assuming a common parent;
- Windows path/case/junction and POSIX symlink semantics are tested at the level claimed.

### Evidence / qualification

- use real PostgreSQL for ownership-fence concurrency semantics;
- primary development-platform qualification can precede full cross-platform shipping qualification;
- exact PostgreSQL minor/runtime packaging is refreshed at the implementation/qualification boundary, not frozen forever in this roadmap;
- source-less/service-mode product closure may remain later, but claims must remain `NOT_RUN` until exercised.

### Explicit non-goals

Do not pull RuntimeReconciler, DBOS, Subject, Messaging, AI or full Management
into this installation/ownership capability merely to make the demo impressive.

---

## Canonical Truth: Persistence, Schema, Time, and Minimal Lineage — COMPLETE

This capability was developed alongside runtime composition after host ownership
semantics became available.

### Question answered

> Once the Host is the owner, can every normal canonical mutation go through a single governed transaction boundary with stable identity, time, causal context and required evidence?

### Capability closure

- PersistenceService boundary over `pg` + Kysely;
- HostOwnershipFence automatically enforced by mutating transaction wrapper;
- schema/migration ownership discipline;
- TimeService minimum Instant/monotonic semantics;
- SchemaRuntime (TypeBox + Ajv non-mutating profile);
- ExecutionContext / Activity identity core;
- AsyncLocalStorage + OTel Context propagation boundary;
- minimum retained Activity/Evidence semantics for authoritative transitions;
- scoped storage primitives are pulled into canonical truth only if a concrete
  Foundation owner requires them; otherwise StorageWorkspace implementation
  waits for its first real consumer.

### Exit scenarios

- stale Host token mutation fails through the normal PersistenceService path;
- required causal/evidence ref and canonical mutation commit atomically where contract requires;
- read-only paths cannot accidentally obtain a normal mutation handle;
- transaction lifetime cannot span LLM/network/human waits;
- explicit Instant is preserved as time Authority;
- caller input validation is non-mutating;
- framework/raw Kysely/pg objects do not leak into stable Service/Extension contracts.

### Why Lineage starts here

Execution Lineage is cross-cutting. Delaying it until observability work would
force every later boundary to be retrofitted. Canonical truth should establish
the **identity/context/required-record skeleton**, not the final query UI,
exporter fleet or unlimited retention model.

---

## Runtime Composition: RuntimeSubstrate and Kernel Semantics — COMPLETE

This capability depends on canonical truth and supplies the runtime boundary for
durable work.

### Question answered

> Can Heptalogos deterministically reconcile what should run versus what is actually runnable, while keeping lifecycle mechanics separate from product semantics?

### Capability closure

- thin `RuntimeSubstrate` over the ADOPTED Cordis line;
- MicroSystem identity/instance/generation;
- runtime-owned activation scopes and resource disposal;
- RuntimeGraph using graphlib mechanics;
- ServiceRegistry and CapabilityRegistry semantic boundaries;
- Host-owned Service/Capability facades rather than raw provider objects;
- Desired/Actual state vocabulary;
- GenerationFence;
- Readiness evaluation;
- OperatingMode semantics;
- deterministic ReconcilePlan / RuntimeReconciler behavior.

### Mandatory risk-retirement gate: Cordis

Cordis is currently an adopted route, but its 4.x line is still release-candidate software and recent upstream reports touch lifecycle/disposal/continuation behavior. Therefore runtime composition should begin with a narrow conformance boundary covering exactly the Cordis mechanics Heptalogos intends to rely on:

- scope ownership;
- activation/disposal;
- dependency reaction;
- async lifecycle races;
- parent/child isolation;
- failure diagnostics;
- clean shutdown.

The response to a failure is **not** to silently create a parallel DI/runtime. If the exact adopted line has a hard blocker, reopen the role decision with evidence or pin a proven compatible upstream patch/version behind the same adapter.

### Exit scenarios

Use deliberately small synthetic MicroSystems rather than real Subject/Messaging:

- A provides Service X; B requires X; C provides optional Capability Y;
- missing hard service leads to explicit waiting/blocked state;
- provider failure degrades only the affected graph;
- service replacement quiesces dependents in safe order;
- capability withdrawal/rebind recomputes readiness without pretending it is a hard Service restart;
- old generation cannot receive new calls/commit generation-fenced outcomes;
- shutdown disposes owned process-memory resources with bounded settlement.

### Explicit non-goals

Kernel must not absorb database, workflow engine, package manager, HTTP stack, AI SDK or policy engine semantics.

---

## Durable Work, Signal, Effects, and Recovery Semantics — CLOSED

### Prerequisites

Requires enough canonical truth to own transactions/lineage and enough runtime
composition to resolve generation-pinned handlers.

### Question answered

> Can the system make a durable promise, crash anywhere around dispatch/processing/external effects, and resume without losing the obligation or inventing false certainty?

### Current progress (2026-09-02)

```yaml
foundationAsyncExecution: CLOSED
foundationFunctional: COMPLETE
foundationExecutableSpine: PASS
foundationClosure: CLOSED
currentRepositoryWork: NONE
activeImplementationPlan: NONE
nextAuthorizedPlan: NONE
githubActions: DISABLED_CURRENT_EXECUTION_POLICY
```

Current Foundation closure evidence:

```yaml
localQualification: PASS
finalCandidateRevalidation: PASS
independentReview: PASS
finalCrossPlatformCI: NOT_RUN
merge: PASS
```

The asynchronous Foundation implementation includes the canonical work request
snapshot, fair-scan projection, durable DBOS boundary, and the real-process
boot/work/stop and same-Instance restart scenarios. The terminal-commit
restart scenario, durable maintenance entry before retirement, prevention of
abandoned PREPARED intent, one package-private Host reacquisition owner, and
the split integration ownership boundary are also recorded as completed
Foundation evidence. This does not close all product qualification boundaries.
Windows and Ubuntu/Linux evidence is current for the recorded scenarios;
macOS, source-less, service/headless, and ResourceGovernor qualification remain
individually scoped and must not be inferred from another platform or
candidate. The closed capability is retained as chronology in the completed
records; historical stage labels are not current Product identity.

The current repository locus is master. The Foundation closure merge baseline
is PR #32 at
51317428a89b5545d3ac614f1012d869a1251203; the former development branch and
candidate SHAs remain qualification provenance, not the current repository
locus. Foundation closure is a Horizon statement and does not imply macOS,
source-less, service/headless, service-account ACL, hardware power-loss,
ResourceGovernor, or release/shipping qualification. Ordinary GitHub Actions
are disabled under the current execution policy; local repository gates and the
recorded evidence define the closure route.

The completed Foundation remediation Plan is
[`Foundation Remediation Bundle — Closure Correction — 2026-09-01`](../plans/completed/foundation/foundation-remediation-bundle-2026-09-01.md);
the current property evidence remains in
[`Q-BOOT-01`](../qualification/results/Q-BOOT-01.md) and the other property
records under `project/qualification/results/`.

### Implementation decomposition

- Canonical work/handler/signal semantics are separated from the DBOS adapter.
- DBOS supplies durable workflow, queue, and first-order crash mechanics.
- EffectOperation adds only the bounded external-effect uncertainty boundary.
- Real `CONFIG_PINNED` ConfigurationRevision resolution remains a system
  administration concern; configuration-free handlers fail closed for a pinned
  binding until that owner is present.
- Real PressureSnapshot/ResourceGovernor remains an operational continuity
  concern; WorkAdmissionPort exposes only the current queue boundary.

### Capability closure

- WorkItem canonical state + transition rules;
- dispatchRevision / DispatchAttemptId fencing;
- generation/config binding policy;
- DurableExecutionService adapter over DBOS;
- static `dispatchWorkItem(WorkItemId, dispatchRevision)` workflow shell;
- DBOS Queue as scheduling mechanics, not Authority;
- SignalService over LISTEN/NOTIFY + canonical rescan;
- cancellation/supersession contract;
- retry classification;
- durable LineageContextRef across waits/restarts;
- minimal Resource/Admission classes required by queue execution.

The external-effect boundary is deliberately narrow:

```text
canonical EffectOperation
prepared → dispatching → succeeded | failed | uncertain
Host/Effect fence
no automatic redispatch of uncertain effects
minimal reconciliation/idempotency seam where the external system supports it
```

It does not include a full NetworkAccess platform, general retry engine,
provider fleet, full messaging Driver stack, ResourceGovernor, Backup/Restore
framework, global effect broker, or automatic multi-step compensation.

### DBOS provider boundary

DBOS 4.x is active and capable, but queue, recovery and application-version
behavior continues to evolve. When this boundary is qualified, use the exact
selected version and directly exercise:

- real PostgreSQL;
- queue dispatch/recovery;
- duplicate reconciliation;
- applicationVersion / old workflow drain behavior;
- crash after canonical WorkItem commit but before engine dispatch;
- crash after authoritative outcome but before workflow checkpoint;
- queue pressure/recovery;
- source-less behavior later at product-qualification level.

Do not expose DBOS admin/control-plane semantics as Heptalogos Management Authority.

### Exit scenarios

At minimum, kill the process around key boundaries and prove:

- committed PENDING WorkItem is rediscovered after a lost dispatch;
- same WorkItem/revision duplicate dispatch is idempotent;
- stale revision attempt cannot commit;
- lost LISTEN/NOTIFY only increases latency;
- external effect timeout can remain `uncertain`;
- no generic automatic retry turns uncertainty into duplicate reality;
- restart preserves causal lineage links.

### Foundation closure history

The earlier Foundation remediation and review history is preserved in the
completed Plan and property records linked above. This living Roadmap keeps the
resulting semantic capabilities and provider routes current; it does not create
a universal stabilization stage, candidate-freeze procedure, or second
hardening pass. The adopted Cordis, DBOS, PostgreSQL, WorkItem, Signal, and
Effect boundaries remain current and are governed by their Specs.

### Product Entry — bounded product route

The route from closed Foundation semantics to the first real Product slice is:

```text
Product Authority convergence
        ↓
Product/Machine Operations boundary correction
        ↓
Normative Product contract freeze
        ↓
Product Host + minimum Management spine
        ↓
Provider prerequisites
        ↓
Subject Base + Messaging + Subject Chat
        ↓
Reaction + communication Authority
        ↓
Subject vertical-slice proof
        ↓
bounded property qualification
```

These are semantic planning steps, not additional permanent architecture layers
or mandatory numbered stages.

The current product boundary is:

```yaml
repositoryProductBoundary: HEADLESS_PRODUCT_HOST
guiImplementationRepository: EXTERNAL_PRESENTATION_REPOSITORY
externalPresentationFirstClassConsumer: true
permanentManagementTarget: COMPLETE_HEADLESS_SURFACE
referenceCliTarget: COMPLETE_MANAGEMENT_CLIENT
machineOperationsRoute: INDEPENDENT_OPENCLAW_RUNTIME
```

This repository owns the headless Product Host, canonical services,
Management/API/read-model/projection surfaces, Subject Chat backend and
complete reference CLI. It does not implement Browser, Desktop, Electron or
other GUI Presentation applications. A real external Presentation requirement
may drive a new Host-owned contract or read model, but it cannot acquire
domain Authority.

The Machine Operations workstream is parallel product/operations planning:

```text
Authority boundary correction
        ↓
OpenClaw integration baseline
    - exact upstream qualification
    - independent service/process integration
    - trust/credential separation
    - first Heptalogos operational Skill
    - first typed Management tool where useful
        ↓
Operational tool/Skill expansion with Management/API growth
        ↓
Distribution, branding, and license closure before shipping bundle
```

OpenClaw integration does not block the first Subject semantic proof unless a
concrete current dependency requires it. These are planning descriptions, not
permanent architecture layer names.

Current Product Authority and normative-contract status:

```yaml
productAuthorityConvergence: COMPLETED
machineOperationsBoundary: COMPLETED
normativeContractFreeze: COMPLETED
normativeProductContracts: FROZEN_FOR_FIRST_PRODUCT_SLICE
productHost:
  implementation: PRESENT
  closure: CLOSED_CORRECTED
productHostQualification: HISTORICAL_PARTIAL_WINDOWS_PROFILE
releaseFormProductQualification: REQUIRED_FOR_CORRESPONDING_SHIPPING_RUNTIME_CLAIM
releaseFormQualificationBlocksIndependentSemanticDevelopment: false
releaseFormQualificationBlocksIndependentProviderSemanticDevelopment: false
releaseFormQualificationBlocksIndependentOpenClawMachineOperations: false
qualificationRecordAuthority: EVIDENCE_STATUS_ONLY
providerPrerequisites: COMPLETED
liveGatewayQualification: BLOCKED
machineOperationsIntegration: ELIGIBLE_NOT_AUTHORIZED
activeProductImplementationPlan: NONE
currentProductWork: P1_SUBJECT_COMMUNICATION_SPINE_CORRECTION_COMPLETED
nextEligibleProductWork: P2_CONFIGURATION_SURFACE_CATCH_UP
ordinaryGitHubActions: DISABLED_CURRENT_EXECUTION_POLICY
```

The normative contract work completed the eight current Product Specs and the
cross-Spec paper execution audit. The Product Host work materialized the first
headless Product Host, initial Management plane, generated client, and
reference CLI under its separately authorized Plan. The closure correction completed the bounded
corrections to build-carried generation identity, first-claim continuity,
Management contract projection, readiness truth, and package public/build
boundaries. The original Product Host qualification remains historical evidence, while
the corrected current qualification is recorded separately. The frozen current-slice
decisions include MANAGED_REVISION-only normal configuration,
SecretRef-only Product secret references, controllable provider transport
through NetworkAccess, the two Subject model bindings, one Administrator,
plan-bound SystemAction execution, deferred-but-adopted Cedar, no generic
ApprovalService or ManagementOperation, direct text-only Subject Chat, and a
bounded conversation-triggered cognition slice with optional communication and
independent Expression. The current implementation uses bounded optional
communication and direct CommunicationCommit Authority; release-form Product
qualification is required before making the corresponding source-less,
service, platform, or shipping/runtime claim. It is not a universal
prerequisite for later semantic/product development, provider-prerequisite
implementation, or independent OpenClaw Machine Operations work that does not
depend on that boundary. Each workstream remains subject to its own plan and
evidence boundary. OpenClaw remains an adopted external Machine Operations
route and is not a provider or Subject readiness dependency.

The gateway-first AIRuntime and external-integration Plan is completed in
project/plans/completed/product/gateway-first-airuntime-external-integration-posture-2026-09-03.md.
Its local implementation qualification is PASS; the protected live gateway
qualification remains BLOCKED and is not inferred from the local fixture. The
Persistent Subject L4 Vertical Slice remains a completed historical baseline in
project/plans/completed/product/persistent-subject-l4-vertical-slice-2026-09-04.md;
its pre-P1 REPLY/SILENCE qualification is not the current conversation shape.
The P1 Subject communication-spine correction is completed in
project/plans/completed/product/p1-subject-communication-spine-correction-2026-09-04.md.
Its current local communication-spine qualification is PASS for the executed
Windows boundary, while unexecuted external and shipping boundaries remain
NOT_RUN. The Product Reality Convergence sequence is the following bounded
planning guidance, with only one implementation Plan active at a time:

```text
documentation semantic correction
→ current communication-spine correction
→ configuration catch-up
→ Subject OpenClaw runtime integration
→ source-less portable product reality
→ first real IM / Observation Window research
```

This is sequencing guidance, not a rigid waterfall. P0 corrected current-truth
documentation and P1 corrected the current communication spine; both are
complete. P2–P4 are successor specs and require separate activation, each
stopping at its own completion boundary. No Product implementation Plan is
currently active.

### Product prerequisites — provider foundations and minimum Management spine

This is a bounded prerequisite set for the first Product slice, not a new
Horizon. Its initial implementation slice contains only the consumers needed
to enter real Product work; it is not the permanent ceiling for the
repository Management product.

Provider prerequisites:

- minimal Configuration ownership;
- minimal Secret ownership;
- minimal NetworkAccess policy boundary;
- AIRuntime gateway/model binding boundary.

Minimum Management spine:

- canonical Management Contract;
- minimum canonical Read Models for the first Product Host;
- minimum SystemAction and System Authority semantics;
- ManagementClient;
- loopback Management HTTP/OpenAPI as needed by that contract.

The permanent repository target is a complete headless Management API over
every administratively meaningful capability that has entered the product,
together with a complete reference CLI. A later Presentation consumer may
require additional Host-owned projections or queries; those are legitimate
contract evolution and do not turn the initial Product prerequisite slice into the final
Management scope.

Full system administration remains a broader capability closure. The following
are not required before the Subject vertical slice unless a hard current
consumer exists: the complete CLI
universe, complete Cedar policy surface, generic/full Approval, remote
administration, every management resource, Extension/package lifecycle,
backup/restore management, Product Update management, and the remainder of
full system-administration capability.

The route therefore keeps these decisions explicit:

```yaml
fullSystemAdministrationRequiredBeforeSubjectSlice: false
fullPackageLifecycleRequiredBeforeSubjectSlice: false
operatorAndPresentationRecognizedAsProductRequirements: true
```

Full package and data lifecycle is likewise not a prerequisite for the
first-party Subject slice. It remains responsible for broader replaceable and
third-party generations when a hard product consumer exists.

### Normative Product Contract ownership map

The normative contract work froze the following ownership map before
implementation plans write implementation code. These are current normative Specs, not package or
workspace topology:

| Planned Spec target                       | ID    | Owned contract                                                                                                         |
| ----------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| specs/system/configuration.md             | CFG   | Configuration source, revision, and activation.                                                                        |
| specs/system/secret.md                    | SEC   | SecretRef, SecretService, backend boundary, and no-plaintext handling.                                                 |
| specs/system/network-access.md            | NET   | Managed outbound network policy.                                                                                       |
| specs/system/ai-runtime.md                | AIR   | Gateway, model, protocol, binding, and invocation boundary.                                                            |
| specs/management/system-authority.md      | MGMT  | Management Contract, Read Models, minimum SystemAction, and System Authority.                                          |
| specs/subject/subject-base.md             | SUBJ  | Subject identity, Desired/Actual state, authority revision, and readiness prerequisites.                               |
| specs/messaging/messaging-subject-chat.md | MSG   | Canonical messaging facts and built-in Subject Chat.                                                                   |
| specs/subject/reaction-behavior.md        | REACT | Reaction, bounded conversation proposals, Review, CommunicationCommit, Expression, no-communication, and supersession. |

The contract map should split these targets further only when a genuine semantic owner and
current consumer require it. ConversationReactionProposal, Review,
CommunicationCommit, Expression, and ConversationMailbox do not each become
separate Specs by noun alone. PresentationIntent remains a Presentation
projection concern and does not create an internal assistant or Host Authority
contract by itself.

The completed contract and Product Host Plans record the contract freeze and
initial implementation. The closure correction is complete. Release-form
qualification remains required for its corresponding shipping/runtime claim,
but it is not a universal blocker for provider prerequisites or independent
OpenClaw integration that does not depend on that boundary. Those workstreams
remain separately scoped and require their own authorization and evidence.
This route does not introduce a temporary direct mutation API.

### Exclusions around the first Product slice

The first normative freeze does not pull the following into the Subject
vertical-slice critical path: Persona, Memory, Relationship, Attention, Advanced Observation Window,
Living State, Appraisal, Epistemic State, Commitments, Reflection, Diary,
Dream, external IM, MCP, full CapabilityBroker, full package lifecycle,
backup/restore, Product Update, or a complete Presentation visual
specification.

System Assistant and external Control Plane Presentation remain real Product
requirements. Their first useful experience can begin with Assistant Explain
and Navigate, followed by bounded Operate through the normal Management
API/CLI and, where the Host is unavailable, machine repair through the
independent Machine Operations route. Presentation consumes canonical
contracts and never becomes Authority; a GUI frontend is not a Subject-slice
prerequisite.

---

## Broader System Administration — conditional future capability

### Boundary

The current Product slice already has one canonical Management path: an
authenticated Administrator requests a side-effect-free SystemAction plan,
confirms its exact digest, and the owning Service performs and verifies the
mutation. This broader capability is not a prerequisite for entering Provider
or Subject work.

Policy authorization, durable Approval, and durable operation state are
conditional product capabilities. They enter only when a real current
consumer/requirement needs a distinction that the current one-Administrator
plan/execute path does not own. Cedar remains the adopted policy-evaluation
mechanics route for that future boundary; this roadmap does not instantiate it.

### Capability when a current consumer exists

- Configuration, Secret, NetworkAccess, and AIRuntime ownership as their
  current consumers enter Product;
- one-Administrator authentication/session and current SystemAction
  plan/execute semantics;
- policy authorization through the adopted Cedar adapter only when current
  policy rules require it;
- durable approval requests only for a current cross-session or multi-approver
  requirement;
- durable operation state only when the target owner does not already own
  progress and a current long-running operation requires it;
- the canonical Management Contract, generated client, and reference CLI
  projections for the capabilities that have entered Product.

### Qualification timing

Cedar looks operationally healthy enough that it need not be an early
Foundation blocker. Qualify `@cedar-policy/cedar-wasm` when a current policy
consumer first enters this capability, especially Node/ESM/WASM/source-less
loading behavior. Cedar remains ALLOW/DENY mechanics; Heptalogos owns
principal/action/resource/context and cannot outsource SystemAction semantics
or any approval decision.

### Exit scenarios

- every behavior-affecting value introduced by this capability is classified;
- proposed config source != active config, and invalid source preserves LKG active revision;
- plan is side-effect-free and execution revalidates preconditions;
- when approval is required, it binds plan digest/revisions and becomes stale when material impact changes;
- when policy is required, protected mutation fails closed when Policy is unavailable;
- System Assistant absence does not prevent CLI/normal Management;
- CLI and HTTP/clients project the same machine-readable Problem/SystemAction semantics;
- no arbitrary shell/SQL/root-filesystem path becomes a management shortcut.

---

## Capability and Package Lifecycle: Safe Composition and Storage Governance

### Important decomposition

Do **not** make the full third-party Extension Package Manager a prerequisite for every first-party feature. The common MicroSystem/Service/Capability/Generation model is already part of the runtime composition capability. This area closes the broader package/data lifecycle needed for replaceable and third-party generations.

### Question answered

> Can the Host accept a declared package/generation, understand what it owns before executing it, safely stage/activate/retire it, and preserve data/config/durable references across lifecycle transitions?

### Capability closure

- StorageWorkspaceService scoped handles;
- DataLifecycleRegistry / DataOwner descriptors;
- managed ExtensionStateStore convenience (only if useful, not mandatory for owners);
- Package/Generation/Contribution descriptors;
- manifest-first static validation;
- package acquisition/staging/integrity/provenance via adopted mechanics;
- contract compatibility registry;
- deterministic Service/Capability provider selection;
- CapabilityBroker core boundary;
- permission/trust/execution-domain metadata;
- disable/uninstall/purge separation;
- generation-retirement/pending physical purge semantics;
- migration/upcast compatibility fences;
- NetworkAccessService and Artifact/Blob foundations as required for package/provider integration.

### Exit scenarios

- manifest can be inspected without executing package code;
- immutable generation never contains mutable config/data;
- staging rejects path escapes/case collisions/special entries according to policy;
- uninstall does not silently delete retained data/config/secrets;
- DataOwner remains known when runtime/package is disabled;
- pending durable work keeps required compatible generation/data reader alive;
- generation B activation cannot break A-pinned durable work without migration/drain/block decision;
- owned process-memory background resources drain on retirement; crash-surviving obligations are WorkItems instead.

### Deferred execution domains

WASM sandbox/runtime selection remains deferred until a real sandbox-required workload enters scope. Node Permission Model or `node:vm` must not be promoted to a malicious-code sandbox claim.

---

## Subject Vertical Slice: Minimal End-to-End Interaction

### Question answered

> Can one persistent Subject receive a message, produce a bounded conversation proposal, optionally commit communication, and deliver a response while preserving Authority, durability, provenance and explicit uncertainty — with all advanced cognition unavailable?

### Intentional scope

Use the smallest product-relevant vertical slice:

- one Subject;
- built-in Subject Chat direct transport first;
- one real model provider/profile after provider conformance;
- no Persona implementation;
- no Memory implementation;
- no Relationship/Attention/Living State/etc. implementation;
- minimal context/prompt/reaction contracts only;
- full system administration is not required before this slice;
- full package lifecycle is not required before this slice;
- System Assistant and external Control Plane Presentation are recognized
  product requirements, while the Subject slice does not require their full
  implementation.

The current Subject L4 implementation proves a bounded conversation cognition
path with optional communication, direct CommunicationCommit Authority,
independent Expression, mailbox/authority fencing, and local exactly-once
outbound materialization. This remains a bounded slice rather than the total
Subject behavior ontology; broader runtime scope follows the Product Reality
Convergence sequence.

### Capability closure

- SubjectService persistent identity, desired state, status projection, and
  authority revision;
- canonical MessagingService facts and Subject Chat ingress;
- ConversationMailbox ordering and supersession semantics;
- AIRuntimeService over AI SDK provider/model mechanics;
- ModelProfile/Binding conformance and commit-time provenance fencing;
- bounded ContextProjection;
- ConversationReactionProposal, deterministic Review, optional
  CommunicationCommit, and independent Expression boundaries;
- durable WorkQueue/DBOS Reaction execution with required lineage/evidence;
- exactly-once local outbound MessageFact materialization.

### Mandatory framework-leakage guard: AI SDK 7

AI SDK 7 now offers broad agent-platform features, including approvals, durable WorkflowAgent execution and other higher-level agent runtime mechanisms. Heptalogos should deliberately use only the mechanics assigned to `AIRuntime` (provider/model/stream/structured output/tool projection/usage/abort/telemetry as appropriate). Do not let AI SDK WorkflowAgent, approval or harness abstractions replace Subject, DurableExecutionService, ApprovalService, RuntimeReconciler or System Authority.

### Exit scenario

Prove one complete path:

`Subject Chat ingress → durable MessageFact → WorkItem → Reaction → ContextProjection → model Activity → conversation proposal → Review → optional CommunicationCommit → Expression → local outbound MessageFact`.

Then prove non-happy cases:

- no usable model → Subject Desired remains RUNNING but Actual is BLOCKED;
- model failure before commit follows existing AIRuntime/WorkQueue Problem
  classification; no provider fleet or fallback is added;
- crash before accepted communication does not invent a committed response;
- crash after CommunicationCommit but before delivery recovers the communication obligation;
- live external gateway qualification remains a separate evidence boundary;
- no-communication is a valid local terminal Reaction outcome where applicable.

### Key architectural test

If this horizon cannot work while every advanced cognition Service is `UNAVAILABLE`, the Foundation layering is wrong and should be corrected before adding cognition.

---

## Messaging, Protocol, Media, and Provider Integration

### Question answered

> Can the already-correct Subject/Foundation semantics survive protocol diversity, reconnects, media, remote tools and external trust boundaries?

### Capability expansion

- first real external IM Driver (Milky/OneBot chosen by current product needs, not architectural ideology);
- reconnect/session/protocol-revision conformance;
- Artifact/media acquisition and limits;
- additional model provider(s) only when useful for provider substitution/failover proof;
- MCP client adapter and Capability mapping;
- NetworkAccess destination/proxy/TLS/redirect/size policy;
- explicit external-process egress visibility;
- protocol-specific effect reconciliation/idempotency where available.

### MCP timing

MCP TypeScript SDK v2 is now a stable release line for the 2026-07-28 specification, but modern protocol behavior is explicitly negotiated rather than something the product should assume from package major alone. Therefore qualification belongs here: protocol era/revision is recorded as data, modern/legacy behavior is tested, and unsupported server-driven requests are rejected unless mapped to Heptalogos Authority.

### Exit scenarios

- Driver reconnect cannot duplicate canonical facts;
- external IM remains transport identity, not interchangeable with Subject Chat;
- media arrival can suspend/resume cognition through durable facts/work;
- MCP remote tool metadata never grants trust/Authority by self-declaration;
- stdio external process egress is reported as opaque unless a real sandbox/proxy controls it;
- provider/Driver failure only degrades relevant Capability/Readiness.

---

## Recovery and Shipping Closure: Lifecycle, Backup, Restore, Update, and Pressure

### Question answered

> Can the system preserve truth and operability across destructive maintenance, heterogeneous storage, pressure, upgrade/rollback and real shipping environments?

### Capability closure

- mature DataLifecycleRegistry across all actual owners;
- BackupCoordinator + heterogeneous BackupParticipant closure;
- destructive Restore/RecoveryOperation + ContinuityEpoch reconciliation;
- purge/tombstone/backup-retention fences;
- ResourceGovernor pressure/admission semantics;
- Maintenance and Emergency Read-Only modes;
- ProductGeneration update/stage/LKG/rollback;
- TUF trust/update boundary;
- source-less packaging and ReleaseManifest/SBOM;
- native/WASM/executable closure qualification;
- OS service/headless behavior where shipping profile requires it;
- Windows/macOS/Linux product qualification to the level actually claimed;
- graceful shutdown and crash matrix expansion.

### Timing rule

Full recovery and shipping closure is not required before every Subject or
external-integration experiment. However, **valuable real user state must not
be treated as safely supported until backup/restore/update/lifecycle claims
have corresponding evidence**.

### Exit scenarios

- backup enumerates logical DataOwners rather than copying one root/DB;
- restore to a different physical PathProfile preserves logical ownership and creates a new ContinuityEpoch where required;
- old sessions/approvals/nonterminal effects are reconciled rather than blindly resurrected;
- Program/package replacement preserves Config/Data/Secret according to lifecycle contract;
- disk/DB/queue/provider pressure causes explicit throttle/shedding/block behavior before uncontrolled failure where possible;
- source-less artifact proves exact native/WASM/executable closure and licenses;
- update failure returns through verified LKG/recovery path rather than assuming the normal runtime is healthy.

---

## 5. Parallel research lanes

The Foundation critical path must not force all product research to wait until
recovery and shipping closure.

## Advanced Cognition Research

Research may begin earlier in isolated prototypes/fixtures, preferably once the
Subject integration contracts are sufficiently concrete, but it is **not** a
Foundation release dependency.

Each subsystem (Memory, Persona, Relationship, Attention, Appraisal, Epistemic State, Commitments, Reflection, etc.) should have its own research program:

- Hypothesis;
- Baseline;
- Intervention;
- Episodes/dataset;
- metrics;
- ablation;
- failure modes;
- integration contract used;
- what canonical state it owns;
- what it only proposes;
- portability/lifecycle requirements.

Research findings may refine the relevant Human Architecture, Spec, or project owner, but prototype convenience cannot silently introduce a second scheduler, messaging stack, Authority path, secret store, workspace, backup mechanism, or Subject identity.

## Presentation and Interaction Research

Desktop/Web/UI/Apple-design exploration can continue in the external
Presentation workstream. Early prototypes may use contract mocks or generated
test data. The transition to authoritative UI occurs only through the
canonical Management/Subject client contracts. Presentation state never
becomes product Authority.

Electron/Desktop work remains external Presentation research and qualification.
Electron is an optional future carrier technology; this repository does not
implement a Desktop shell or add a GUI dependency.

## Evaluation Infrastructure Research

As soon as Basic Subject scenarios stabilize, begin accumulating reproducible interaction episodes and metrics that can later compare advanced cognition interventions. This lane should be designed as research evaluation, distinct from Foundation correctness/product qualification.

---

## 6. Cross-cutting capabilities are progressively realized, not “done once”

### Execution Lineage

- bootstrap activity/journal identity and handoff;
- ExecutionContext/Activity core and required causal records;
- runtime lifecycle/reconcile/service/capability instrumentation;
- WorkItem/durable/effect causation;
- management/policy/approval chains;
- Subject/model/messaging/MCP chains;
- retention/query/purge/restore/operational completeness.

### Storage and Data Lifecycle

- PathProfile/root safety;
- scoped Foundation storage primitives;
- configuration backing/secret placement;
- StorageWorkspace/DataOwner/package ownership;
- heterogeneous backup/restore/purge/resource accounting.

### 6.3 Configuration

Configuration governance starts whenever the first behavior-affecting value appears. The full ConfigurationService closes in system administration, but no earlier capability is permitted to create a large uncontrolled literal/config debt pile.

### 6.4 Resource governance

Start with bounded budgets/timeouts and ownership metadata; add canonical pressure/admission semantics as real queue/database/network/media workloads appear; close full failure-injection/resource behavior in recovery and shipping closure.

### 6.5 Product qualification

Do not wait for one giant final test campaign. Maintain a rolling matrix where each dependency/system claim remains `PASS | FAIL | NOT_RUN | BLOCKED` at the correct evidence level.

---

## 7. Risk register and retirement timing

| Risk                                     | Current interpretation                                                       | Earliest useful retirement point | Roadmap response                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Cordis 4.x lifecycle maturity            | ADOPTED, but current 4.x line is RC and has recent lifecycle/disposal issues | runtime composition              | narrow RuntimeSubstrate conformance first; exact pin from fresh evidence; no parallel production runtime |
| Private PostgreSQL packaging/ownership   | architecture-critical, cross-platform/native/process behavior                | installation and ownership       | real PG ownership/fence early; source-less/service packaging may close later                             |
| DBOS queue/recovery/version behavior     | active 4.x, recent queue/recovery/version changes                            | durable work                     | exact-version real-PG crash/recovery qualification around static dispatcher                              |
| Cedar WASM product loading               | healthy upstream, but WASM loading is packaging boundary                     | system administration            | qualify Node/ESM/WASM path at PolicyService integration; source-less later                               |
| AI SDK framework capture                 | SDK 7 now offers full agent/workflow/approval abstractions                   | Subject vertical slice           | strict AIRuntime adapter scope; framework leakage gate                                                   |
| MCP v2 protocol transition               | stable v2 line, modern protocol negotiation explicit                         | messaging/provider integration   | protocol era/revision as data; modern/legacy conformance as claimed                                      |
| External IM/provider uncertainty         | protocol/runtime differences                                                 | messaging/provider integration   | only claim live support after real conformance                                                           |
| Native/source-less closure               | many future WASM/native/executables                                          | recovery and shipping closure    | ReleaseManifest/SBOM/exact artifact qualification; changed closure invalidates evidence                  |
| Backup/restore semantic complexity       | cross-owner and external reality cannot be rolled back                       | recovery and shipping closure    | do not defer ownership metadata; close destructive reconciliation before release-grade state             |
| Advanced cognition architecture pressure | high temptation to hard-wire Memory/Persona into Subject                     | parallel research                | keep Foundation hooks generic; research hypotheses/evaluation separate                                   |

---

## 8. Current external technology snapshot (2026-08-21; non-Authority)

This snapshot informs risk timing only. Exact versions must be refreshed when a future Implementation Plan freezes its Catalog/artifact closure.

- PostgreSQL 18 remains the current stable major; an earlier qualification
  snapshot used PostgreSQL 18.6, released 2026-08-13. PostgreSQL 18.5 was not
  released because of a regression in the release sequence. Staying on the
  adopted 18 line is consistent with current upstream support reality; exact
  patch evidence is refreshed by each implementation plan.
- DBOS TypeScript 4.x remains actively maintained. Recent 4.24/4.25 changes include queue/recovery/version behavior and formal deprecation of its internal admin server. This reinforces both exact-version qualification and Heptalogos-owned Management Authority.
- Cordis current 4.x package line is still `4.0.0-rc.*`; recent open reports concern async lifecycle/disposal/continuation behavior. This does not automatically reopen the adopted role, but it makes early RuntimeSubstrate conformance a priority.
- AI SDK 7 is now a broad agent platform with approvals/durable agent workflow capabilities. For Heptalogos, these higher-level abstractions are a framework-leakage hazard unless deliberately excluded from Authority roles.
- MCP TypeScript SDK v2 is a stable release line for the 2026-07-28 spec, with explicit modern/legacy protocol negotiation. Protocol revision must remain product data.
- Cedar/cedar-wasm 4.12 is active and mature enough that the main risk is integration/product WASM closure rather than policy-model selection.

---

## 9. Rules for deriving future Implementation Plans

Every future plan should answer the following before listing tasks.

### 9.1 Roadmap position

- Which horizon/capability closure does this plan advance?
- Is it on the hard critical path, a parallel capability lane, a risk-retirement probe, product qualification, or research?
- What is deliberately left for a later horizon?

### 9.2 Authority and invariants

- Which typed owner (`docs/architecture/`, `specs/`, or `project/`) owns the semantics?
- Who owns canonical state?
- Which object is proposal, which is Authority?
- What Desired/Actual split exists?
- What uncertainty must remain expressible?

### 9.3 Entry evidence

- Which prerequisites are actually PASS?
- Which remain NOT_RUN but are not required for this plan?
- Which dependency roles are ADOPTED, and what exact qualification is needed now?

Do not restate old evidence as PASS if the exact artifact/version/platform changed.

### 9.4 Closed executable scenario

A plan should end with one or more whole scenarios, not merely files/interfaces. Define:

- happy path;
- dependency unavailable;
- invalid input/config;
- cancellation/quiesce;
- crash/restart if state/durable work is involved;
- stale generation/revision if replacement is involved;
- pressure/resource case when relevant;
- security/permission failure when relevant.

### 9.5 Framework/library boundary

For every adopted generic provider:

- name the Heptalogos adapter/facade boundary;
- state which mechanics are delegated;
- state which product semantics must not leak into/out of the provider;
- add static framework-leakage enforcement where practical.

### 9.6 Configuration discipline

Every newly introduced behavior-affecting value is classified as one of:

`PRODUCT_INVARIANT | INSTALLATION_CONFIG | SUBJECT_CONFIG | RESOURCE_CONFIG | SECRET | DERIVED_STATE | IMPLEMENTATION_CONSTANT`.

A plan that adds a temporary magic number should either classify it immediately or record why it is a true implementation constant.

### 9.7 Lineage/Evidence

For each meaningful boundary, state:

- Activity kind/causation;
- what must be durable Evidence/Audit;
- what is telemetry-only;
- sensitivity/retention expectations;
- what must be atomic with canonical mutation.

### 9.8 Verification class

Distinguish:

- Code Correctness;
- System Semantic Correctness;
- Product Qualification;
- Research Evaluation.

Do not use a mock or one OS to upgrade a product qualification claim.

### 9.9 Stop conditions

Plans should explicitly stop rather than improvise if:

- an adopted dependency has a genuine hard blocker;
- required correctness would violate a canonical Authority boundary;
- a fix requires introducing a second Authority/provider/runtime path;
- a supposedly local change pulls a later horizon’s subsystem into the critical path;
- cross-platform/native behavior would have to be overclaimed;
- the plan has grown into multiple independent capability closures.

### 9.10 Closure record

At completion record:

- exact HEAD/artifact/version;
- PASS/FAIL/NOT_RUN/BLOCKED per claim;
- remaining qualification debt;
- roadmap assumptions invalidated or confirmed;
- new GOTCHA/PLAYBOOK knowledge where the execution produced reusable engineering lessons.

---

## 10. What not to use as roadmap milestones

Avoid roadmap entries such as:

- “create 12 Foundation packages”;
- “implement all interfaces from a numbered Spec”;
- “add PostgreSQL”;
- “add DBOS”;
- “build AI module”;
- “build UI”;
- “finish extension system” without a closed scenario.

Prefer capability statements:

- “one Host owns canonical mutation authority across bootstrap→lease handoff”;
- “runtime deterministically reconciles provider failure/replacement”;
- “committed WorkItem survives crash before dispatch”;
- “administrator mutation is planned/authorized/durable and projected through CLI”;
- “one Subject Chat message completes the full Authority/effect loop.”

---

## 11. Roadmap revision triggers

Review and revise this roadmap when any of the following occurs:

1. A canonical Architecture or Spec owner changes a semantic invariant or Authority boundary;
2. an ADOPTED dependency fails its required implementation/product qualification;
3. an executable scenario reveals a missing hard dependency edge;
4. a horizon repeatedly requires mechanics from a later horizon, suggesting the decomposition is wrong;
5. a proposed milestone contains multiple independent capability closures and should be split;
6. product/research priorities change which soft-order lane should be accelerated;
7. a new platform/protocol/release constraint materially changes qualification cost;
8. evidence shows a planned subsystem is unnecessary or can be deferred without violating `foundation-complete`.

Do **not** revise the roadmap merely because a package/file layout changes.

---

## 12. Compact dependency map

```text
Engineering and contract spine  [COMPLETE]
  |
  v
Installation + bootstrap + private PostgreSQL + host ownership  [COMPLETE]
  |
  v
Canonical truth + runtime composition  [COMPLETE]
  |
  v
Durable work + Signal + Effect + crash recovery semantics  [CLOSED]
  |
  v
Product Authority convergence  [COMPLETE]
  |
  v
Product/Machine Operations boundary correction  [COMPLETE]
  |
  v
Normative Product contract freeze  [COMPLETE]
  |
  +--> Product Host + minimum Management spine  [COMPLETE]
  |        ↓
  |    Provider prerequisites  [ELIGIBLE; NOT AUTHORIZED]
  |        ↓
  |    Subject Base + Messaging + Subject Chat
  |        ↓
  |    Reaction + communication Authority
  |        ↓
  |    Subject vertical-slice proof
  |        ↓
  |    Messaging + MCP + media + provider diversity
  |        ↓
  |    Recovery + backup/restore/update/pressure/source-less/shipping closure
  |
  +--> Full system administration [parallel; not required before Subject proof]
  |
  +--> Full package/data lifecycle [parallel; not required before Subject proof]

  +--> Independent OpenClaw Machine Operations integration and distribution
       closure [parallel; not required before first Subject proof]
```

The arrows show dependency pressure, not a ban on parallel exploratory work.

---

## 13. Strategic interpretation

The Heptalogos critical path is not:

```text
database → API → AI → UI
```

It is:

```text
ownership
→ canonical authority
→ runtime lifecycle
→ durable obligation/uncertainty
→ system governance
→ safe composition
→ Subject interaction
→ operational continuity
→ advanced cognition research at scale
```

That ordering is the engineering expression of the project constitution: Subject continuity, explicit Authority, State > Prompt, Proposal != Authority, canonical truth before async processing, recovery independence, evidence before explanation, and library-first mechanics.

The roadmap should remain stable at this level while individual Implementation Plans remain free to adapt to evidence, upstream changes, platform realities and newly discovered constraints.
