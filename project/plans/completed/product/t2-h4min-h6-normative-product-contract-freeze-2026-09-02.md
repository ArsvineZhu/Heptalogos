# T2 — H4-Min & H6 Normative Product Contract Freeze

**State:** `COMPLETED`<br>
**Mode:** `PRE_PRODUCTION`<br>
**Task class:** `NORMATIVE_PRODUCT_CONTRACT_FREEZE`<br>
**Current maturity:** `T1C_COMPLETED / PRODUCT_IMPLEMENTATION_NOT_STARTED`<br>
**Source authorization:** `tmp/T2-H4Min-H6-Normative-Product-Contract-Freeze-2026-09-02.md`<br>
**Completion path:** `project/plans/completed/product/t2-h4min-h6-normative-product-contract-freeze-2026-09-02.md`

## Mission and stop rule

Freeze the smallest decision-complete normative contracts required for the
first real headless Heptalogos Product slice after H3. The output is current
implementation Authority for Product Host, normal Management, provider
prerequisites, Subject, built-in Subject Chat, and the minimal H6 behavior
commit spine. This Plan writes knowledge only; TypeScript or pseudocode in a
Spec is contract description, not executable implementation.

When the eight Specs and the S1–S16 paper execution audit are coherent, move
this Plan to its completed path, leave no active Product implementation Plan,
and STOP. Do not start P1.

## Verified starting truth

Before mutation verify the live repository rather than pinning a handoff SHA:

```yaml
H3: CLOSED
T0: COMPLETED
T1: COMPLETED
T1C: COMPLETED
repositoryProductBoundary: HEADLESS_PRODUCT_HOST
guiImplementationRepository: EXTERNAL_PRESENTATION_REPOSITORY
machineOperationsRoute: INDEPENDENT_OPENCLAW_RUNTIME
activeProductImplementationPlan: NONE
productCodePostH3: NOT_STARTED
```

The expected baseline is `master` at the post-T1C documentation state, but a
legitimate later commit must be preserved after inspection.

## Authorization ceiling

Authorized:

```yaml
normativeSpecs: true
specsIndex: true
boundedArchitectureCorrections: true
roadmapCurrentTruth: true
planLifecycle: true
```

Forbidden:

```yaml
executableCode: true
packageTopology: true
workspaceTopology: true
dependencyInstallation: true
dependencyVersionPinning: true
lockfileMutation: true
databaseMigration: true
generatedOpenAPIArtifact: true
generatedManagementClient: true
CLIImplementation: true
HTTPServerImplementation: true
providerLiveCall: true
SubjectRuntimeImplementation: true
MessagingImplementation: true
OpenClawImplementation: true
OpenClawSkillOrToolImplementation: true
GUIImplementation: true
qualificationPassFabrication: true
```

Do not add compatibility aliases, legacy readers, deprecated bridges,
upcasters, dual schemas, or fallback paths. PRE_PRODUCTION history creates no
compatibility obligation.

## Governing semantic decisions

Preserve these standing rules: Subject is not a Model; canonical state is
greater than Prompt; proposals do not become Authority; Subject Authority,
System Authority, Product Authority, and Machine/Deployment Authority remain
distinct; canonical truth precedes durable work; Foundation contracts and
Host fencing are reused; no speculative machinery is admitted.

The current H4-Min/H6 decisions are:

```yaml
configurationSource: MANAGED_REVISION
secretPlaintextInProductConfig: FORBIDDEN
networkProviderTransportControl: REQUIRED_WHEN_CONTROLLABLE
aiModelBindings: [subject.primary, subject.expression]
aiTools: NOT_AUTHORIZED
mcp: NOT_AUTHORIZED
providerFleet: NOT_AUTHORIZED
managementProjection: OPENAPI
managementClient: REQUIRED
referenceCLI: REQUIRED
currentAdministratorCount: 1
cedarH4Min: DEFERRED_BUT_ADOPTED_FUTURE_ROUTE
genericApprovalService: NOT_AUTHORIZED
genericManagementOperation: NOT_AUTHORIZED
remoteManagementFirstSlice: NOT_REQUIRED
SSEFirstSlice: NOT_REQUIRED
subjectCount: 1
subjectDesiredStates: [STOPPED, RUNNING]
subjectChatPlatform: heptalogos-subject-chat
subjectChatContent: TEXT_ONLY
subjectChatExternalDrivers: NOT_AUTHORIZED_IN_H6
behaviorOutcomes: [REPLY, SILENCE]
reviewerAgent: NOT_AUTHORIZED
advancedObservationWindow: NOT_AUTHORIZED
```

OpenClaw remains an external Machine Operations route and is not a Heptalogos
AIRuntime binding, Host-owned credential, internal assistant runtime, or H6
readiness dependency. External Presentation remains a first-class consumer of
Host-owned contracts without owning domain Authority.

## Required reading and installation order

Before substantive mutation, read the current versions of the root execution
contract, project governance, Product and Architecture pages, dependency and
qualification Authority, Roadmap, Plans README/INDEX, completed T1/T1C Plans,
Specs INDEX, and the Foundation Specs listed by the source authorization. The
first repository mutation is installation of this active Plan plus its single
active row in `project/plans/INDEX.md`.

## Required primary output

Create exactly these current normative Specs:

```text
specs/system/configuration.md
specs/system/secret.md
specs/system/network-access.md
specs/system/ai-runtime.md
specs/management/system-authority.md
specs/subject/subject-base.md
specs/messaging/messaging-subject-chat.md
specs/subject/reaction-behavior.md
```

Each Spec must contain Scope, Ownership, useful normative types, stable
requirement IDs, lifecycle/transitions where applicable, failure semantics,
persistence/transaction semantics where applicable, Management/consumer
projection where applicable, explicit current-slice exclusions, and
References. Requirement prefixes are `CFG`, `SEC`, `NET`, `AIR`, `MGMT`,
`SUBJ`, `MSG`, and `REACT`.

Update only the following additional current owners, except trivial links
caused by the new Specs:

```text
docs/architecture/ai-runtime.md
docs/architecture/messaging.md
specs/INDEX.md
project/roadmap/development-roadmap.md
project/plans/INDEX.md
```

Any other material Architecture correction is a PLAN_GAP.

## Bounded Architecture corrections

1. `docs/architecture/ai-runtime.md` must define exactly the current
   Heptalogos ModelBinding roles `subject.primary` and `subject.expression`.
   Remove current `operator.primary` and `system-assistant.primary` semantics;
   OpenClaw model configuration remains OpenClaw-owned.

2. `docs/architecture/messaging.md` must route local built-in Subject Chat
   outbound as:

   ```text
   CommunicationCommit → canonical outbound MessageFact → query/catch-up/live projection
   ```

   Local Presentation disconnect is not EffectOperation uncertainty. Preserve
   the existing EffectOperation route only for future external Messaging
   effects.

## Contract requirements

### Configuration (`CFG`)

Own `ConfigurationDefinition`, immutable `ConfigurationRevision`,
`ConfigurationActivation`, effective resolution, and Management metadata.
Normal H4-Min writes use PostgreSQL-backed `MANAGED_REVISION`; bootstrap file
configuration is only the pre-PostgreSQL boundary. Do not create a generic
source/codec/file-watch framework.

The definition distinguishes owner, version, scope, JSON Schema, classification
(`PRODUCT_INVARIANT`, `INSTALLATION_CONFIG`, `SUBJECT_CONFIG`,
`RESOURCE_CONFIG`), visibility, manageability, activation impact, sensitivity,
default authority, and consumer references. Revisions bind definition/version,
scope/resource, validated canonical value, source, creation time, and lineage.
Activations bind active/previous revision, impact, effective time,
lineage/evidence. Proposal is not active; invalid input preserves the previous
active revision; activation is Host-fenced and runtime consumers must resolve
the active revision. Secret plaintext is never a configuration value and
unsupported current shapes fail explicitly.

### Secret (`SEC`)

Own `SecretRef`, `SecretMetadata`, `SecretService`, the semantic backend
contract, and normal Product secret lifecycle. Define create/set, replace,
revoke, metadata read, and authorized ephemeral resolution. There is no normal
plaintext reveal/export/list operation. Plaintext never enters Product state,
logs, Problem, Evidence, Activity attributes, WorkItem payloads, Management
output, argv, or durable caches. BootstrapKeyProvider and OpenClaw/Machine
Operations credentials remain separate. Backend selection and native/source-
less qualification are implementation evidence, not this Plan.

### NetworkAccess (`NET`)

Own Host-originated managed outbound transport policy: requester, destination,
method, headers and credential classification, timeout/deadline, request and
response budgets, redirect policy, expanded compressed-body budget, AbortSignal,
ExecutionContext, and Lineage. Use Node/Undici behind the owner boundary.
Redirects reauthorize and sensitive headers do not cross unauthorized origins.
Streaming budgets are enforced; transport timeout/reset becomes structured
knowledge and does not imply an external effect failed. Spawned processes and
MCP stdio are `OPAQUE_EXTERNAL` unless genuinely controlled. No proxy fleet,
VPN manager, service mesh, retry engine, or broker is created.

### AIRuntime (`AIR`)

Own ProviderProfile, ModelProfile, ModelBinding, InvocationSpec, runtime
materialization, structured generation result, provenance, and abort/timeout
boundary. SDK/client objects are not Product Authority. Bind InvocationSpec to
the exact ModelBinding revision. Validate structured output through JSON
Schema and the existing SchemaRuntime/Ajv Authority. Provider failures before
DecisionCommit cannot fabricate behavior. Secret resolution is authorized and
ephemeral; controllable provider traffic uses NetworkAccess. Exclude AI SDK
Agent/WorkflowAgent, tools, autonomous loops, MCP, failover fleet, reviewer,
embedding, and vision/files without a hard current consumer.

### System Authority (`MGMT`)

Own normal Product Management, its canonical contract, Read Models, one
Administrator principal, first-run local one-shot claim, opaque server-side
sessions, SystemAction definitions, side-effect-free SystemChangePlan,
precondition-bound execute, and aligned HTTP/OpenAPI, ManagementClient, and
oclif reference CLI projections. Planning cannot mutate, write network, read
secret plaintext, access raw DBOS/root DB, or mutate runtime.

H4-Min confirmation is exact-plan revalidation; do not instantiate Cedar,
generic durable ApprovalService, or generic ManagementOperation without a
current consumer. Cedar remains adopted future mechanics, not rejected.
Subject/model/Extension cannot invoke Administrator mutations; ordinary Product
Management never becomes arbitrary shell/filesystem/DBOS/root authority.
P1 is loopback by default; remote exposure, SSE/WebSocket, browser transport,
and cookie-only auth are not first-slice requirements. Machine Operations may
use Management as an authenticated client when deliberately configured, while
break-glass OS authority remains outside this Spec.

### Subject Base (`SUBJ`)

Own one persistent logical Subject identity, DesiredState `STOPPED|RUNNING`,
ActualState `STOPPED|STARTING|READY|ACTIVE|DEGRADED|BLOCKED|STOPPING|FAILED`,
monotonic `authorityRevision`, and hard H6 readiness. Identity survives Host
restart, binding/provider changes, Presentation disconnect, and process restart.
Desired state is mutated through System Authority; Actual state is reconciled
by the Subject owner. Missing hard prerequisites yield `BLOCKED`, not
`FAILED`; OpenClaw, GUI, external IM, MCP, and advanced cognition are not hard
H6 prerequisites. Authentication does not start the Subject.

### Messaging & Subject Chat (`MSG`)

Own the built-in direct `heptalogos-subject-chat` platform, canonical immutable
text `MessageFact`, stable identities, idempotent `clientMessageId`, mailbox
revision advancement, durable inbound WorkItem, and canonical query/catch-up
ordering. Admission is allowed only for Subject `READY|ACTIVE|DEGRADED`; other
states reject without a MessageFact. Same idempotency key and canonical input
returns the existing result; changed input is an identity conflict.

Inbound commits MessageFact, idempotency binding, mailbox revision/reference,
WorkItem, and required Lineage/Evidence atomically as applicable, then may emit
a Signal hint. Local outbound is CommunicationCommit to exactly one canonical
outbound MessageFact, never local EffectOperation. External messaging later
uses the existing EffectOperation owner. Silence is not an empty message.

### Reaction & Behavior Authority (`REACT`)

Own ConversationMailbox organization, Reaction, ContextProjection,
BehaviorIntent, deterministic Review, immutable DecisionCommit,
CommunicationCommit, expression, silence, supersession, and exactly-once local
outbound materialization. Current BehaviorIntent is only `REPLY` or `SILENCE`.
Primary model output is a proposal; Review fences Reaction openness, Subject
`authorityRevision`, mailbox revision, target conversation, binding/generation,
and current constraints before commit. A changed mailbox revision supersedes
the old Reaction without a timer/scheduler. A DecisionCommit survives crash and
prevents re-decision. `SILENCE` is terminal success with no CommunicationCommit
or outbound message. `REPLY` creates one CommunicationCommit; expression cannot
change the decision, target, or authorize System/external action. Expression
failure preserves the decision and resumes; an existing outbound MessageFact
prevents duplicate reply.

## Cross-Spec ownership and transaction audit

Do not duplicate Foundation owners for Problem, identity/generation,
Service/Capability/Readiness, Host fencing, WorkItem, Durable Dispatch,
EffectOperation, Lineage, Evidence, PostgreSQL transactions, or canonical
schema. The eight new Specs own only the Product concepts named above.

The final Specs must make these boundaries explicit:

```text
configuration revision → Host-fenced canonical commit → runtime reconciliation
configuration activation → canonical activation commit → post-commit reconcile
SystemAction execute → DesiredState mutation → reconcile → ActualState
inbound chat → MessageFact + idempotency + mailbox + WorkItem + evidence → commit
model I/O outside transaction → deterministic Review → fenced DecisionCommit
DecisionCommit → CommunicationCommit → expression outside transaction → outbound MessageFact
future external message → CommunicationCommit → EffectOperation → external Driver
```

External I/O never occurs inside a PostgreSQL mutation transaction. Preserve
these failure distinctions: invalid configuration keeps the previous active
revision; unavailable secrets and provider/network hard dependencies block
readiness; Subject-owned runtime control can be `FAILED`; pre-Decision model
failure creates no behavior; new inbound work supersedes an old open Reaction;
expression failure preserves committed decision/communication; local
Presentation disconnect does not create uncertainty; external ambiguous effect
remains EffectOperation `UNCERTAIN`.

## Mandatory S1–S16 paper execution audit

For every scenario record start state, request/event, semantic owner, canonical
transaction(s), durable obligation, revision/fence, resulting state, failure
truth, recovery path, and Spec clauses. The audit must establish:

| Scenario                 | Required decision-complete path                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| S1 stopped Subject       | reads work; Subject Chat rejects without MessageFact                                                                           |
| S2 provider setup        | Secret → ProviderProfile → ModelProfile → both bindings → configuration activation → readiness                                 |
| S3 start                 | plan/execute Desired RUNNING → STARTING → readiness → READY; client never writes Actual                                        |
| S4 missing binding       | Desired RUNNING → BLOCKED, not FAILED                                                                                          |
| S5 repair binding        | current binding → reconcile to STARTING/READY; identity unchanged                                                              |
| S6 normal reply          | idempotent inbound → WorkItem → primary → proposal → Review → Decision → Communication → expression → outbound fact → catch-up |
| S7 silence               | SILENCE DecisionCommit → terminal Reaction; no CommunicationCommit/message                                                     |
| S8 new message           | mailbox N+1 supersedes pre-commit N; no DecisionCommit for N and no scheduler                                                  |
| S9 crash after inbound   | committed MessageFact/WorkItem is recovered by Foundation obligation processing                                                |
| S10 primary failure      | no DecisionCommit, CommunicationCommit, or outbound fact                                                                       |
| S11 crash after decision | resume communication/expression without re-decision                                                                            |
| S12 expression failure   | decision/communication survive; retry expression; no fake message                                                              |
| S13 crash after outbound | find existing fact; no second reply; complete obligation                                                                       |
| S14 lost send response   | same sender/conversation/key/content returns existing result; no duplicate cognition                                           |
| S15 stop                 | Desired STOPPED → close admission → STOPPING → STOPPED; identity remains                                                       |
| S16 OpenClaw path        | typed OpenClaw tool/exec → authenticated Management API/CLI; no special Operator endpoint or Host privileged token             |

If a scenario requires a genuinely new owner, durable distinction, provider,
trust direction, multi-Subject model, compatibility obligation, or effect
semantics, stop that branch as PLAN_GAP. Missing fields, Problem codes,
ReadModel status, or cross-references are resolved in the current owner and do
not justify a ninth subsystem.

## Dependencies, versioning, and persistence

Do not reopen adopted routes: AI SDK 7, Node/Undici, Fastify, Hey API, oclif,
TypeBox/Ajv, PostgreSQL/pg/Kysely, DBOS/DBOS Queue, Cordis, Graphlib, Execa,
OpenClaw for Machine Operations, Cedar as future authorization mechanics, and
the OS-composed SecretBackend strategy. Do not install or pin any dependency.

All exported/durable contracts follow `specs/core/contract-versioning.md`.
Unsupported current shape fails explicitly; version fields do not promise
historical development-client support. Specs may define semantic records but
must not alter SQL migrations or physical schema. Do not prescribe package
directories from Spec paths.

## Completion and verification

When all acceptance conditions are proven:

1. Move this Plan to `project/plans/completed/product/` and mark it
   `COMPLETED`.
2. Update `project/plans/INDEX.md` and Roadmap: `T2: COMPLETED`,
   `normativeProductContracts: FROZEN_FOR_FIRST_PRODUCT_SLICE`, and
   `P1: ELIGIBLE_NOT_AUTHORIZED` with no active implementation Plan.
3. Do not create P1, source packages, generated OpenAPI/client output,
   migrations, OpenClaw integration, or GUI work.

Run only existing repository checks covering knowledge/docs routing, Spec link
integrity, Markdown formatting, repository consistency, hygiene, JSON touched
by the Plan, and `git diff --check`; use the cheap canonical aggregate if
applicable. Do not install dependencies, call providers, run OpenClaw, run GUI
tests, or claim Product/platform qualification.

## Completion acceptance

The completed state must prove:

```yaml
startingAuthority: { H3: CLOSED, T1: COMPLETED, T1C: COMPLETED }
knownCorrections:
  { operatorPrimaryRemoved: true, localChatEffectOperationRemoved: true }
eightSpecs: PRESENT
managedRevisionOnly: true
secretRefCanonical: true
networkRedirectsAndBudgets: true
aiBindings: [subject.primary, subject.expression]
operatorBinding: false
toolsMcpAgents: false
oneAdministratorAndFirstClaim: true
opaqueSessions: true
planExecuteAndOpenAPIClientCLI: true
cedarDeferredNotRejected: true
genericApprovalAndManagementOperation: false
subjectDesiredActualAndPersistentIdentity: true
subjectMissingBindingBlocked: true
chatIdempotentCanonicalInbound: true
localOutboundEffectOperation: false
reconnectCatchup: true
mailboxAndAuthorityRevisionFences: true
replySilenceDecisionCommunicationContract: true
crossSpecS1ThroughS16: DECISION_COMPLETE
executableDependencyPackageDatabaseOpenClawGuiChanges: false
P1: ELIGIBLE_NOT_AUTHORIZED
repositoryChecks: PASS
```

## Execution record: S1–S16 paper audit

The following audit was performed against the eight current Specs. Each entry
records the required start state, event, owner, canonical transaction,
durable obligation, fence, result, failure truth, recovery path, and clauses.

### S1 — Host with Subject stopped

- Start: persistent Subject exists with DesiredState STOPPED and ActualState STOPPED; Management read models are available.
- Event and owner: Administrator requests a read or sends built-in Subject Chat input; System Authority owns reads and Subject Core/MessagingService own admission.
- Transaction and obligation: a read is read-only; a chat rejection creates no MessageFact, mailbox revision, or WorkItem, so there is no durable cognition obligation.
- Fence: read consistency is projection-scoped; no mutation fence is acquired for the rejected send.
- Result and failure truth: reads succeed; send returns messaging.subject_not_accepting and the Subject remains STOPPED.
- Recovery and clauses: after subject.start and readiness reconciliation, a new send may be admitted; SUBJ-011, MSG-004, and MSG-005.

### S2 — Configure provider path

- Start: one Installation and Subject exist; provider configuration, SecretRef, profiles, or bindings may be absent and Subject readiness may be BLOCKED.
- Event and owner: Administrator uses System Authority to set/replace a Secret, create or update provider/model profile state, set subject.primary and subject.expression, and activate required Configuration; SecretService, ConfigurationService, and AIRuntime own their records.
- Transaction and obligation: each canonical revision, profile/binding change, and activation persists through the owning Host-fenced transaction with required Lineage/Evidence; runtime materialization is a post-commit obligation, not transaction I/O.
- Fence: expected active configuration/binding revisions and Host ownership fence are revalidated before activation or binding commit.
- Result and failure truth: active configuration resolves to MANAGED_REVISION and readiness is recomputed; plaintext never enters Product state. Missing/revoked Secret, unavailable NetworkAccess, or unusable binding yields dependent BLOCKED.
- Recovery and clauses: correct the referenced active revision/binding and reconcile; identity is unchanged. CFG-003, CFG-006–CFG-012, SEC-001–SEC-006, AIR-002–AIR-010, and MGMT-007–MGMT-009.

### S3 — Start Subject

- Start: persistent Subject is STOPPED with a current Administrator session; hard prerequisites are inspectable.
- Event and owner: subject.start is planned and executed through System Authority; Subject Core owns DesiredState and Runtime supervision owns ActualState convergence.
- Transaction and obligation: exact SystemChangePlan execution commits DesiredState RUNNING and required Lineage/Evidence; reconciliation is the durable target obligation.
- Fence: plan digest, expected Subject authorityRevision, and Host ownership are checked; client never writes ActualState.
- Result and failure truth: STOPPED → STARTING → readiness evaluation → READY when all hard prerequisites are ready.
- Recovery and clauses: retry reconciliation from canonical DesiredState; missing prerequisites are BLOCKED and owner control failure is FAILED. MGMT-007–MGMT-009, SUBJ-002, SUBJ-003, SUBJ-006, and SUBJ-007.

### S4 — Missing binding

- Start: Subject DesiredState RUNNING; subject.expression or another hard binding is absent/unusable.
- Event and owner: readiness evaluation by Subject Core/AIRuntime.
- Transaction and obligation: no new product mutation or generic ManagementOperation; the existing Subject reconciliation obligation observes dependency readiness.
- Fence: current ModelBinding revision and Subject authorityRevision are read/fenced by the readiness owner.
- Result and failure truth: ActualState is BLOCKED, not FAILED and not READY; chat cognition is rejected.
- Recovery and clauses: provide a current binding through System Authority and reconcile; SUBJ-003, SUBJ-007, SUBJ-011, AIR-003, AIR-004, AIR-012.

### S5 — Binding repaired

- Start: the same Subject has DesiredState RUNNING and ActualState BLOCKED because a hard binding was missing.
- Event and owner: Administrator commits a current ModelBinding; AIRuntime and Subject Core recompute readiness.
- Transaction and obligation: the binding revision and required evidence commit under the Host fence; existing Subject reconciliation remains the obligation.
- Fence: binding revision, configuration revision, and Subject authorityRevision prevent stale readiness from becoming current.
- Result and failure truth: Subject converges BLOCKED → STARTING → READY when all hard prerequisites pass; no new Subject identity is created.
- Recovery and clauses: repeat readiness evaluation or report the still-missing dependency; SUBJ-001, SUBJ-003, SUBJ-008, AIR-003, AIR-004, AIR-010.

### S6 — Normal reply

- Start: Subject is READY, ACTIVE, or DEGRADED; the direct Administrator↔Subject conversation exists.
- Event and owner: Subject Chat accepts send(clientMessageId); MessagingService owns MessageFact and idempotency, WorkItem owns processing, Reaction/Behavior Authority owns cognition.
- Transaction and obligation: one Host-fenced transaction commits inbound MessageFact, idempotency binding, mailbox revision/reference, WorkItem, and required Lineage/Evidence; the WorkItem is the durable cognition obligation. Model and expression I/O are outside mutation transactions.
- Fence: sender/conversation idempotency key, mailboxRevision, Subject authorityRevision, ModelBinding revision, Reaction open-reaction CAS, and Host ownership fence.
- Result and failure truth: MessageFact → WorkItem → primary proposal → Review → DecisionCommit → CommunicationCommit → expression → exactly one outbound MessageFact → query/catch-up.
- Recovery and clauses: Foundation WorkItem recovery resumes the current stage; an existing DecisionCommit or outbound MessageFact prevents re-decision/duplicate reply. MSG-001–MSG-010, REACT-001–REACT-014, AIR-003–AIR-010.

### S7 — Deliberated silence

- Start: an open Reaction has a valid current ContextProjection and subject.primary result.
- Event and owner: primary proposes BehaviorIntent(SILENCE); deterministic Review and Reaction owner decide admission.
- Transaction and obligation: fenced DecisionCommit transaction commits SILENCE and terminal Reaction state; the WorkItem completes with no communication obligation.
- Fence: Reaction OPEN, mailboxRevision, Subject authorityRevision, target conversation, binding/generation, and open-reaction ownership.
- Result and failure truth: DecisionCommit(kind=SILENCE) → DELIBERATED_SILENT is successful behavior; no CommunicationCommit or outbound MessageFact exists.
- Recovery and clauses: retry reads the DecisionCommit and completes without expression or re-decision; REACT-004–REACT-009 and MSG-011.

### S8 — New message during primary invocation

- Start: Reaction N is OPEN and holds mailbox revision N while subject.primary I/O is in progress.
- Event and owner: a new accepted inbound MessageFact advances ConversationMailbox to N+1; MessagingService owns admission and mailbox owner owns supersession.
- Transaction and obligation: the new inbound transaction commits its MessageFact, mailbox revision, and WorkItem; the old Reaction has no new durable obligation after supersession.
- Fence: old mailboxRevision N, open-reaction CAS, Subject authorityRevision, and Host fence are checked at Review/DecisionCommit.
- Result and failure truth: old model result is stale, Reaction N becomes SUPERSEDED, and no DecisionCommit, CommunicationCommit, or outbound MessageFact is created for N.
- Recovery and clauses: the WorkItem for N+1 handles current work; no timer, debounce, or Observation Window scheduler is added. MSG-002–MSG-005, REACT-005, REACT-006, REACT-017.

### S9 — Crash after MessageFact commit

- Start: inbound MessageFact, mailbox revision, and WorkItem commit succeeded; cognition process stops before primary invocation.
- Event and owner: Foundation WorkItem/durable execution recovery resumes the obligation; MessagingService remains fact owner.
- Transaction and obligation: the committed WorkItem is the durable obligation; no second inbound fact is created.
- Fence: WorkItem dispatch revision, Host ownership, mailbox revision, and canonical MessageFact identity.
- Result and failure truth: accepted input remains canonical and is eventually eligible for processing; process death is not message loss.
- Recovery and clauses: existing Foundation recovery/rescan resumes processing; MSG-002, MSG-003, REACT-003, and Work Item/Durable Dispatch Specs.

### S10 — Primary provider fails before commit

- Start: Reaction is OPEN with a valid mailbox/Subject fence; subject.primary invocation is admitted.
- Event and owner: provider, Secret, NetworkAccess, or schema invocation failure occurs before DecisionCommit; AIRuntime reports the failure and Reaction owner classifies it.
- Transaction and obligation: no DecisionCommit transaction commits; the current WorkItem remains the bounded retry/failure obligation under Foundation classification.
- Fence: no behavior commit is admitted unless Review and all revisions remain valid.
- Result and failure truth: no DecisionCommit, CommunicationCommit, or outbound MessageFact; no fake fallback response.
- Recovery and clauses: retry only when existing WorkItem classification permits it; otherwise retain structured failure. AIR-005, AIR-006, AIR-009, REACT-015.

### S11 — Crash after DecisionCommit

- Start: immutable DecisionCommit exists for a REPLY; process stops before downstream communication completes.
- Event and owner: WorkItem recovery discovers DecisionCommit; Reaction/Behavior Authority owns continuation.
- Transaction and obligation: DecisionCommit is the canonical behavior fact; CommunicationCommit/expression/outbound materialization remain the downstream obligation.
- Fence: DecisionCommit identity, Subject authorityRevision, mailboxRevision, CommunicationCommit uniqueness, and Host fence.
- Result and failure truth: continuation proceeds without invoking subject.primary again and without changing the decision.
- Recovery and clauses: read existing commit, create at most the one CommunicationCommit, then resume expression; REACT-007, REACT-008, REACT-010, REACT-014.

### S12 — Expression fails

- Start: DecisionCommit and CommunicationCommit for REPLY exist; no outbound MessageFact exists.
- Event and owner: subject.expression fails or is interrupted; AIRuntime reports failure and Reaction owner retains committed authority.
- Transaction and obligation: DecisionCommit/CommunicationCommit survive; expression retry is the existing WorkItem obligation and no fake message is committed.
- Fence: CommunicationCommit identity/revision, Subject authorityRevision, binding/generation, and idempotent outbound MessageFact key.
- Result and failure truth: primary decision remains unchanged; outbound delivery is not falsely reported as successful.
- Recovery and clauses: retry expression and materialize the single outbound fact; REACT-011–REACT-013 and REACT-020.

### S13 — Crash after outbound MessageFact

- Start: outbound MessageFact referencing CommunicationCommit is committed; WorkItem completion acknowledgement is absent.
- Event and owner: WorkItem recovery resumes local outbound materialization; MessagingService owns MessageFact uniqueness.
- Transaction and obligation: the existing outbound MessageFact satisfies the communication obligation; retry performs no second expression call.
- Fence: CommunicationCommit identity, outbound MessageFact uniqueness, WorkItem dispatch revision, and Host fence.
- Result and failure truth: one canonical reply exists and the obligation completes; crash is not a reason to create a duplicate.
- Recovery and clauses: query existing fact, mark downstream work complete, and retain Lineage/Evidence; MSG-008–MSG-010, REACT-013, REACT-014.

### S14 — Client loses inbound-send response

- Start: server committed an inbound MessageFact and result; client did not receive the response.
- Event and owner: client retries the same clientMessageId, sender, conversation, and canonical content; MessagingService owns idempotency.
- Transaction and obligation: idempotency lookup returns the existing fact/result and creates no new MessageFact or cognition WorkItem.
- Fence: conversation/sender/clientMessageId binding and canonical content digest.
- Result and failure truth: retry is successful idempotent retrieval; changed content under the same key returns idempotency conflict.
- Recovery and clauses: client can query/catch up from canonical messages; MSG-005, MSG-010, and MSG-011.

### S15 — Stop Subject

- Start: Subject DesiredState RUNNING and may have READY/ACTIVE/DEGRADED current work.
- Event and owner: Administrator plans and executes subject.stop; System Authority requests and Subject Core owns DesiredState/admission while Runtime reconciliation owns convergence.
- Transaction and obligation: fenced DesiredState STOPPED mutation commits; existing current work quiesces through the Subject lifecycle obligation.
- Fence: exact plan digest, Subject authorityRevision, Host ownership, and runtime admission fence.
- Result and failure truth: new cognition admission closes; READY/ACTIVE/DEGRADED/BLOCKED → STOPPING → STOPPED. SubjectId remains unchanged.
- Recovery and clauses: reconcile from canonical DesiredState; a control defect is FAILED, while dependency absence remains BLOCKED. MGMT-007–MGMT-009, SUBJ-005, SUBJ-006, SUBJ-011.

### S16 — Healthy OpenClaw management path

- Start: Product Host and normal Management API/CLI are healthy; OpenClaw is an independent external operations runtime.
- Event and owner: an authorized OpenClaw typed tool or exec chooses the normal authenticated Management API or CLI; Heptalogos System Authority owns any Product mutation and OpenClaw owns its external process/tool mechanics.
- Transaction and obligation: Product requests use the normal plan/execute and owning-Service transaction; generic machine exec has no invented Heptalogos SystemAction or Product WorkItem unless a real integration deliberately records one.
- Fence: normal Administrator session, action plan digest, target revisions, and Host fence for Heptalogos mutations; independent OS/deployment policy for machine actions.
- Result and failure truth: no special Operator endpoint, internal assistant runtime, or privileged OpenClaw credential stored by Host; machine-level actions remain outside Product Authority.
- Recovery and clauses: use Management/CLI while healthy and independent Machine Operations when the Host is unavailable; MGMT-001, MGMT-002, MGMT-014–MGMT-016, and Machine Operations Architecture.

Audit result: `DECISION_COMPLETE`; no scenario required a new semantic owner,
durable state machine, provider role, compatibility obligation, trust
direction, or external-effect semantic. No PLAN_GAP was found.

Final state:

```text
Foundation = CLOSED
Product Authority = CURRENT
H4-Min contracts = FROZEN
H6 Subject/Messaging/Behavior contracts = FROZEN
Product executable = NOT YET IMPLEMENTED
GUI = EXTERNAL / NOT IMPLEMENTED HERE
OpenClaw = ADOPTED EXTERNAL ROUTE / NOT YET INTEGRATED
P1 = ELIGIBLE, NOT STARTED
STOP
```

## Verified completion evidence

The final knowledge-plane verification was run against this tree:

```text
pnpm check:knowledge       PASS
pnpm check:repository      PASS
pnpm check:hygiene         PASS
pnpm check:boundaries      PASS
pnpm check:dependencies    PASS
pnpm check:package-layout  PASS
pnpm check:agents          PASS
pnpm format:check          PASS
git diff --check           PASS
```

The scope audit found no executable, dependency, package/workspace, lockfile,
physical database, generated client/OpenAPI, OpenClaw, or GUI changes. Product
qualification, provider calls, OpenClaw execution, GUI tests, and P1
implementation were not started.
