# Heptalogos Development Roadmap

**Status:** LIVING ROADMAP / planning guidance<br>
**Date:** 2026-08-27<br>
**Repository baseline:** current `master` integration baseline after H2 post-merge reconciliation and Ubuntu/Linux residual qualification<br>
**Architecture baseline:** `docs/architecture/` design state 2026-08-20

> This document is a roadmap, not an Architecture Corpus authority and not an Implementation Plan. It guides future plan decomposition, sequencing, risk retirement, and acceptance. If it conflicts with the Architecture Corpus, the Corpus wins. If implementation evidence invalidates roadmap assumptions without invalidating architecture semantics, update the roadmap rather than silently changing the Corpus.

---

## 1. Purpose

M1 established a trustworthy engineering and contract spine: repository/toolchain governance, cross-platform process mechanics, canonical serialization/digest/identity/Problem primitives, BootstrapState, recoverable BootstrapStateStore, per-BootId BootstrapJournal, and controlled review/CI closure. M2 then closed the pre-PostgreSQL bootstrap substrate: strict installation/instance locator and independent roots, per-boot early journaling, no-stale-takeover bootstrap ownership, and ownership-guarded BootstrapState mutation.

M1 and M2 did **not** establish the complete executable Foundation. The next era of development should therefore change the progress metric from “packages/interfaces/tests added” to “system invariants proven by executable scenarios.”

The roadmap has four jobs:

1. preserve hard architectural dependency edges;
2. expose work that can safely proceed in parallel;
3. place implementation/product qualification at the first point where evidence is useful;
4. prevent feature pressure from bypassing ownership, authority, durability, lifecycle, and recovery.

---

## 2. Roadmap model: dependency DAG, not a rigid waterfall

The project should not be driven by one fixed sequence of numbered feature milestones. Use three interacting tracks.

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

---

## 3. Fixed edges versus flexible ordering

### 3.1 Hard edges

The following are architecture-level ordering constraints and should not be casually reordered:

1. **Normal canonical mutation requires proven Host ownership.** Bootstrap ownership must hand off to PostgreSQL Host lease + HostOwnershipFence/HostOwnershipToken before normal writes/effect dispatch are admitted.
2. **Canonical truth precedes asynchronous obligation.** External/canonical facts are committed before WorkItem processing becomes authoritative.
3. **Required Evidence/Lineage identity is established at the authority transition, not reconstructed later.**
4. **Durable work/effects require explicit version, generation, attempt and uncertainty semantics before real external integration depends on them.**
5. **Management mutation goes through SystemAction/Policy/Approval/Operation semantics before CLI/HTTP/Operator projections become authoritative.**
6. **Real AI/provider and Driver use requires Configuration/Secret/Network/Capability policy boundaries; raw SDK objects do not become Authority.**
7. **Basic Subject interaction must work without Persona/Memory/Relationship/Attention implementations.** Advanced cognition cannot become a hidden Subject Base prerequisite.
8. **Presentation remains a projection.** GUI/Web can be researched in parallel but cannot define backend Authority.
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

## 4. Development horizons

The horizons describe **system maturity**, not a mandatory one-horizon-one-milestone mapping.

## H0 — Trusted Engineering & Contract Spine — DONE (M1)

### Outcome

The repository can safely evolve Foundation code with truthful gates and stable primitive contracts.

### Existing foundation

- root pnpm/Nx/TS7 toolchain and verification gates;
- `foundation-contracts` canonical JSON/digest/UUIDv7/Problem primitives;
- versioned BootstrapState + recoverable BootstrapStateStore;
- per-BootId BootstrapJournal;
- atomic publication boundary;
- cross-platform repository process substrate;
- manual-only CI/review/squash closure process for the current live PR.

### What H0 does not prove

It does not prove private PostgreSQL, runtime supervision, durable work, system management, Subject behavior, extension lifecycle, real packaging, or product recovery.

---

## H1 — Own the Machine: Installation, Paths, Bootstrap and Host Ownership

### Question answered

> Can a Heptalogos installation reliably identify itself, locate its independent lifecycle roots, obtain exclusive bootstrap ownership, start/validate its private PostgreSQL, and hand ownership to exactly one normal Host without an authority gap?

### Current progress (2026-08-27)

Current H-stage truth:

```yaml
M5B: CLOSED
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: CLOSED
H1: CLOSED
H2A_1: CLOSED
H2A_2: CLOSED
H2A_3: CLOSED
H2A: FUNCTIONALLY_COMPLETE
H2B: CLOSED
H2_FUNCTIONAL: COMPLETE
H2_STABILIZATION: CLOSED
H2: CLOSED
H3: ELIGIBLE
```

H2B is closed and H2 is now closed after the H2-S behavior candidate completed
its externally supplied Independent Review, final manual cross-platform CI with
candidate revalidation, squash merge, and this post-merge reconciliation.
The H2-S local qualification and fresh PostgreSQL 18.6 qualification are also
`PASS`.

H1 functional implementation and stabilization are `CLOSED`. Current product
qualification is property-scoped:

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

H2A and H2B are functionally complete, H2-S stabilization is `CLOSED`, and H3
is `ELIGIBLE`. H2 closure is not product-qualification closure. The current
evidence proves real PostgreSQL on Windows and Ubuntu/Linux; macOS real
PostgreSQL, source-less execution, installed service/headless execution,
service-account ACLs, and hardware power-loss behavior remain `NOT_RUN`. Those
boundaries remain at their recorded states and are not implied by H2 closure.

Current H2-S stabilization status:

```yaml
H2_STABILIZATION: CLOSED
localQualification: PASS
freshPostgreSQL18_6: PASS
independentReview: PASS
finalCrossPlatformCI: PASS
finalCandidateRevalidation: PASS
merge: PASS
```

The H2-S closure evidence is maintained in
[`Q-RUNTIME-01`](../qualification/results/Q-RUNTIME-01.md)
and
[`Q-PERSISTENCE-01`](../qualification/results/Q-PERSISTENCE-01.md).
The completed implementation/correction plan is
[`H2-S context-efficient package governance correction`](../plans/completed/foundation/h2s-review-correction-context-efficient-package-governance.md).
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

Do not pull RuntimeReconciler, DBOS, Subject, Messaging, AI or full Management into H1 merely to make the demo impressive.

---

## H2A — Own Canonical Truth: Persistence, Schema, Time and Minimal Lineage

**Parallel-capable with H2B after H1 semantics are available.**

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
- scoped storage primitives are pulled into H2A only if a concrete H2A Foundation owner requires them; otherwise StorageWorkspace implementation waits for its first real consumer.

### Exit scenarios

- stale Host token mutation fails through the normal PersistenceService path;
- required causal/evidence ref and canonical mutation commit atomically where contract requires;
- read-only paths cannot accidentally obtain a normal mutation handle;
- transaction lifetime cannot span LLM/network/human waits;
- explicit Instant is preserved as time Authority;
- caller input validation is non-mutating;
- framework/raw Kysely/pg objects do not leak into stable Service/Extension contracts.

### Why Lineage starts here

Execution Lineage is cross-cutting. Delaying it until observability work would force every later boundary to be retrofitted. H2A should establish the **identity/context/required-record skeleton**, not the final query UI, exporter fleet or unlimited retention model.

---

## H2B — Own Runtime Composition: RuntimeSubstrate and Kernel Semantics

**Parallel-capable with H2A; H3 requires both to be sufficiently closed.**

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

Cordis is currently an adopted route, but its 4.x line is still release-candidate software and recent upstream reports touch lifecycle/disposal/continuation behavior. Therefore H2B should begin with a narrow conformance boundary covering exactly the Cordis mechanics Heptalogos intends to rely on:

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

## H3 — Survive Asynchrony: Durable Work, Signal, Effect and Recovery Semantics

### Prerequisites

Requires enough of H2A to own canonical transactions/lineage and enough of H2B to resolve generation-pinned handlers.

### Question answered

> Can the system make a durable promise, crash anywhere around dispatch/processing/external effects, and resume without losing the obligation or inventing false certainty?

### Current progress (2026-08-29)

```yaml
H3: OPEN
H3A: ACTIVE
H3A_1: CLOSED
H3A_2: ACTIVE
H3B: NOT_ELIGIBLE
H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: NOT_ELIGIBLE
activeImplementationPlan: docs/plans/active/foundation/h3a2-dbos-durable-execution-crash-recovery-2026-08-29.md
```

The H3A-1 implementation includes complete creation-request envelope
snapshotting, the canonical fair-scan projection index, and cross-platform
bootstrap-runtime test budgets. It is accepted as the current product baseline
by the completed H3A-1 governance recovery record. Existing implementation and
Draft cross-platform evidence remains preserved, while Independent Review and
final manual CI remain `NOT_RUN`; they are not inferred from the GitHub merge
fact. H3A-2 is now active under its decision-complete DBOS durable execution
and crash recovery plan.

### Implementation decomposition

- H3A-1 implements canonical work/handler/signal semantics without DBOS.
- H3A-2 materializes DBOS durable mechanics and crash recovery.
- H3B adds EffectOperation and uncertainty.
- Real `CONFIG_PINNED` ConfigurationRevision resolution remains H4-owned; H3A
  uses configuration-free handlers and fails closed for pinned binding.
- Real PressureSnapshot/ResourceGovernor remains H8-owned; H3A establishes
  explicit WorkAdmissionPort semantics.

### Capability closure

- WorkItem canonical state + transition rules;
- dispatchRevision / DispatchAttemptId fencing;
- generation/config binding policy;
- DurableExecutionService adapter over DBOS;
- static `dispatchWorkItem(WorkItemId, dispatchRevision)` workflow shell;
- DBOS Queue as scheduling mechanics, not Authority;
- SignalService over LISTEN/NOTIFY + canonical rescan;
- cancellation/supersession contract;
- EffectOperation state machine and conservative uncertainty;
- retry classification;
- durable LineageContextRef across waits/restarts;
- minimal Resource/Admission classes required by queue execution.

### Mandatory risk-retirement gate: DBOS

DBOS 4.x is active and capable, but queue, recovery and application-version behavior continues to evolve. Qualification should therefore use the exact version selected when H3 begins and directly exercise:

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

---

## H4 — Operate the Machine: Configuration, Secrets, Authentication and System Authority

### Question answered

> Can an administrator inspect and change the system through one canonical authority path, with explicit planning, policy, approval, durability and verification?

### Capability closure

- ConfigurationDefinition/Source/Revision/Activation model;
- SchemaRuntime-backed typed Configuration Surface;
- BootstrapKeyProvider remains separate from normal SecretService;
- SecretService + platform-composed SecretBackend;
- first-administrator one-shot local claim;
- opaque PostgreSQL-backed normal sessions;
- PolicyService with Cedar adapter;
- ApprovalService;
- SystemAction registry, side-effect-free plan and governed execute/verify;
- ManagementOperation durable lifecycle;
- canonical Management Contract;
- complete reference CLI projection;
- minimal HTTP/OpenAPI/client projection where needed by the contract, not as a separate business layer.

### Qualification timing

Cedar looks operationally healthy enough that it need not be an early Foundation blocker. Qualify `@cedar-policy/cedar-wasm` when PolicyService first enters this horizon, especially Node/ESM/WASM/source-less loading behavior. Cedar remains ALLOW/DENY mechanics; Heptalogos owns principal/action/resource/context and cannot outsource Approval or SystemAction semantics.

### Exit scenarios

- every behavior-affecting value introduced by this stage is classified;
- proposed config source != active config, and invalid source preserves LKG active revision;
- plan is side-effect-free and execution revalidates preconditions;
- approval binds plan digest/revisions and becomes stale when material impact changes;
- protected mutation fails closed when Policy is unavailable;
- Operator AI absence does not prevent CLI/normal Management;
- CLI and HTTP/clients project the same machine-readable Problem/SystemAction semantics;
- no arbitrary shell/SQL/root-filesystem path becomes a management shortcut.

---

## H5 — Compose Safely: Storage Governance, Generations, Capabilities and Package Lifecycle

### Important decomposition

Do **not** make the full third-party Extension Package Manager a prerequisite for every first-party feature. The common MicroSystem/Service/Capability/Generation model is already part of H2B. H5 closes the broader package/data lifecycle needed for replaceable and third-party generations.

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

## H6 — Prove Subject Base: Minimal End-to-End Interaction

### Question answered

> Can one persistent Subject receive a message, deliberate, commit a behavior decision and deliver a response while preserving Authority, durability, provenance and explicit uncertainty — with all advanced cognition unavailable?

### Intentional scope

Use the smallest product-relevant vertical slice:

- one Subject;
- built-in Subject Chat direct transport first;
- one real model provider/profile after provider conformance;
- no Persona implementation;
- no Memory implementation;
- no Relationship/Attention/Living State/etc. implementation;
- minimal context/prompt/reaction contracts only.

### Capability closure

- SubjectService identity/Desired/Actual/authority revision;
- canonical MessagingService facts;
- Subject Chat ingress;
- ConversationMailbox minimum domain ordering/supersession semantics;
- AIRuntimeService over AI SDK provider/model mechanics;
- ModelProfile/Binding conformance;
- ContextProjection core facets;
- typed PromptProgram/PromptManifest;
- ReactorCoordinator basic lifecycle;
- BehaviorIntent/Review/DecisionCommit/CommunicationCommit/Expression boundary;
- EffectOperation-backed outbound delivery;
- required lineage/evidence through the whole path.

### Mandatory framework-leakage guard: AI SDK 7

AI SDK 7 now offers broad agent-platform features, including approvals, durable WorkflowAgent execution and other higher-level agent runtime mechanisms. Heptalogos should deliberately use only the mechanics assigned to `AIRuntime` (provider/model/stream/structured output/tool projection/usage/abort/telemetry as appropriate). Do not let AI SDK WorkflowAgent, approval or harness abstractions replace Subject, DurableExecutionService, ApprovalService, RuntimeReconciler or System Authority.

### Exit scenario

Prove one complete path:

`Subject Chat ingress → durable MessageFact → WorkItem → Reaction → ContextProjection → model Activity → Behavior/Review → DecisionCommit → CommunicationCommit → EffectOperation → delivery outcome`.

Then prove non-happy cases:

- no usable model → Subject Desired remains RUNNING but Actual is BLOCKED;
- model failure before commit can retry/fail over according to inference policy;
- crash before DecisionCommit does not invent a committed response;
- crash after DecisionCommit but before delivery recovers obligation;
- delivery timeout after dispatch can remain uncertain;
- silence is a valid terminal Subject decision where applicable.

### Key architectural test

If this horizon cannot work while every advanced cognition Service is `UNAVAILABLE`, the Foundation layering is wrong and should be corrected before adding cognition.

---

## H7 — Integrate External Reality: IM, MCP, Media and Provider Diversity

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

## H8 — Make It Survivable and Shippable: Lifecycle, Backup, Restore, Update, Pressure and Product Closure

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

Full H8 product closure is not required before every H6/H7 development experiment. However, **valuable real user state must not be treated as safely supported until backup/restore/update/lifecycle claims have corresponding evidence**.

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

The Foundation critical path must not force all product research to wait until H8.

## R-A — Advanced Cognition Research

Research may begin earlier in isolated prototypes/fixtures, preferably once H6 integration contracts are sufficiently concrete, but it is **not** a Foundation release dependency.

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

Research findings may cause Architecture Corpus evolution, but prototype convenience cannot silently introduce a second scheduler, messaging stack, authority path, secret store, workspace, backup mechanism or Subject identity.

## R-B — Presentation / Interaction Research

Desktop/Web/UI/Apple-design exploration can continue in parallel. Early prototypes may use contract mocks or generated test data. The transition to authoritative UI occurs only through the canonical Management/Subject client contracts. Presentation state never becomes product Authority.

## R-C — Evaluation Infrastructure

As soon as Basic Subject scenarios stabilize, begin accumulating reproducible interaction episodes and metrics that can later compare advanced cognition interventions. This lane should be designed as research evaluation, distinct from Foundation correctness/product qualification.

---

## 6. Cross-cutting capabilities are progressively realized, not “done once”

### 6.1 Execution Lineage

- H1: bootstrap activity/journal identity and handoff;
- H2A: ExecutionContext/Activity core and required causal records;
- H2B: runtime lifecycle/reconcile/service/capability instrumentation;
- H3: WorkItem/durable/effect causation;
- H4: management/policy/approval chains;
- H6/H7: subject/model/messaging/MCP chains;
- H8: retention/query/purge/restore/operational completeness.

### 6.2 Storage/Data Lifecycle

- H1: PathProfile/root safety;
- H2A: scoped Foundation storage primitives;
- H4: configuration backing/secret placement;
- H5: StorageWorkspace/DataOwner/package ownership;
- H8: heterogeneous backup/restore/purge/resource accounting.

### 6.3 Configuration

Configuration governance starts whenever the first behavior-affecting value appears. The full ConfigurationService closes in H4, but no earlier milestone is permitted to create a large uncontrolled literal/config debt pile.

### 6.4 Resource governance

Start with bounded budgets/timeouts and ownership metadata; add canonical pressure/admission semantics as real queue/database/network/media workloads appear; close full failure-injection/resource behavior in H8.

### 6.5 Product qualification

Do not wait for one giant final test campaign. Maintain a rolling matrix where each dependency/system claim remains `PASS | FAIL | NOT_RUN | BLOCKED` at the correct evidence level.

---

## 7. Risk register and retirement timing

| Risk                                     | Current interpretation                                                       | Earliest useful retirement point | Roadmap response                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Cordis 4.x lifecycle maturity            | ADOPTED, but current 4.x line is RC and has recent lifecycle/disposal issues | H2B start                        | narrow RuntimeSubstrate conformance first; exact pin from fresh evidence; no parallel production runtime |
| Private PostgreSQL packaging/ownership   | architecture-critical, cross-platform/native/process behavior                | H1                               | real PG ownership/fence early; source-less/service packaging may close later                             |
| DBOS queue/recovery/version behavior     | active 4.x, recent queue/recovery/version changes                            | H3                               | exact-version real-PG crash/recovery qualification around static dispatcher                              |
| Cedar WASM product loading               | healthy upstream, but WASM loading is packaging boundary                     | H4                               | qualify Node/ESM/WASM path at PolicyService integration; L3 source-less later                            |
| AI SDK framework capture                 | SDK 7 now offers full agent/workflow/approval abstractions                   | H6                               | strict AIRuntime adapter scope; framework leakage gate                                                   |
| MCP v2 protocol transition               | stable v2 line, modern protocol negotiation explicit                         | H7                               | protocol era/revision as data; modern+legacy conformance as claimed                                      |
| External IM/provider uncertainty         | protocol/runtime differences                                                 | H7                               | only claim live support after real conformance                                                           |
| Native/source-less closure               | many future WASM/native/executables                                          | H8                               | ReleaseManifest/SBOM/exact artifact qualification; changed closure invalidates evidence                  |
| Backup/restore semantic complexity       | cross-owner and external reality cannot be rolled back                       | H8, with contracts earlier       | do not defer ownership metadata; close destructive reconciliation before release-grade state             |
| Advanced cognition architecture pressure | high temptation to hard-wire Memory/Persona into Subject                     | parallel R-A                     | keep Foundation hooks generic; research hypotheses/evaluation separate                                   |

---

## 8. Current external technology snapshot (2026-08-21; non-Authority)

This snapshot informs risk timing only. Exact versions must be refreshed when a future Implementation Plan freezes its Catalog/artifact closure.

- PostgreSQL 18 remains the current stable major; the M3 qualification snapshot is PostgreSQL 18.6, released 2026-08-13. PostgreSQL 18.5 was not released because of a regression in the release sequence. Staying on the adopted 18 line is consistent with current upstream support reality; exact patch evidence is refreshed by each implementation plan.
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

- Which Corpus files/specs own the semantics?
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
- required correctness would violate Corpus Authority;
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
- “implement all interfaces from S01”;
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

1. Architecture Corpus changes a semantic invariant or Authority boundary;
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
H0  Engineering/Contract Spine  [DONE]
 |
 v
H1  Installation + Bootstrap + Private PG + Host Ownership
 |\
 | \
 v  v
H2A Canonical Persistence + Time + ExecutionContext/Lineage
H2B RuntimeSubstrate + Kernel/Reconciliation
 \  /
  \/
H3  Durable Work + Signal + Effect + Crash Recovery Semantics
 |
 v
H4  Config + Secret + Auth + Policy + Approval + Management + CLI
 |\
 | \
 |  +---------------------> Presentation research lane
 v
H5  Storage/DataOwner + Generation/Extension + Capability/Network substrate
 |\
 | \
 |  +---------------------> Advanced cognition research lane (contract-bound)
 v
H6  Subject Base + Subject Chat + Messaging + AI + Basic Reaction
 |
 v
H7  External IM + MCP + Media + Provider/Protocol Diversity
 |
 v
H8  Backup/Restore/Update/Pressure/Source-less/Cross-platform Product Closure
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
