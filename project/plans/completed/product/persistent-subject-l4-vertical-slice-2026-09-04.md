# Persistent Subject L4 Vertical Slice

**State:** `COMPLETED`  
**Mode:** `RAPID_EVOLUTION / PRE_PRODUCTION`  
**Task class:** `PRODUCT_IMPLEMENTATION + CURRENT-AUTHORITY_CORRECTION`  
**Date:** `2026-09-04`  
**Primary outcome:** materialize one persistent logical Subject and one built-in Administrator ↔ Subject Chat path through canonical MessageFact, durable WorkItem/DBOS execution, minimal Reaction, `subject.primary`, immutable DecisionCommit, optional CommunicationCommit, `subject.expression`, and exactly-once local outbound MessageFact.

This file records the completed executable Plan. Supporting files in the handoff
pack were implementation aids only and did not supply missing material decisions.

---

# 0. Entry condition

Do not install this Plan while the Gateway-first Plan is still active.

Required entry truth:

```yaml
gatewayImplementationQualification: PASS
liveNewAPIGatewayQualification: PASS | BLOCKED
activeProductImplementationPlan: NONE
```

A `BLOCKED` live NewAPI qualification is allowed. It limits external-live claims but does not block this implementation Plan.

After installation there must be exactly one active Product Plan: this file.

---

# 1. Product question answered

This Plan answers one whole Product question:

> Can one persistent logical Subject accept a canonical local chat fact, own a durable cognition obligation, make a fenced REPLY/SILENCE decision through the configured AIRuntime, preserve that decision across crash/retry, and expose exactly one canonical local reply when REPLY is committed?

The target path is:

```text
Product Host
→ persistent Subject
→ subject.start
→ Subject READY
→ Subject Chat send
→ inbound MessageFact
→ ConversationMailbox revision
→ durable WorkItem
→ Reaction
→ AIRuntime(subject.primary)
→ BehaviorIntent(REPLY | SILENCE)
→ deterministic Review
→ DecisionCommit
   ├─ SILENCE → terminal
   └─ REPLY
      → CommunicationCommit
      → AIRuntime(subject.expression)
      → canonical outbound MessageFact
→ Subject Chat query/catch-up
```

This is one vertical Product capability. Do not split it into separate Foundation, Messaging, Reaction, or “stabilization” Plans.

---

# 2. Required context

Read in normal repository order:

```text
AGENTS.md
packages/AGENTS.md
project/governance/project-charter.md
this Plan

specs/subject/subject-base.md
specs/messaging/messaging-subject-chat.md
specs/subject/reaction-behavior.md
specs/system/ai-runtime.md
specs/management/system-authority.md
specs/data/persistence-transactions.md
specs/execution/work-item.md
specs/execution/durable-dispatch.md
specs/execution/signal.md
specs/execution/execution-lineage.md
specs/execution/evidence.md

packages/execution/work-queue/**
packages/execution/durable-execution/**
packages/execution/signal/**
packages/runtime/runtime-kernel/**
packages/data/persistence/**
packages/data/canonical-schema/**
packages/system/ai-runtime/**
packages/system/management/**
packages/application/product-host/**
packages/application/management-client/**
packages/application/cli/**

integration/foundation/support/durable-work-fixture.ts
integration/foundation/support/durable-work-child.ts
```

Read `docs/architecture/subject.md` and `docs/architecture/authority-and-core-concepts.md` only to synchronize the current/future boundary described in this Plan. Do not use older broad cognition nouns as an implementation checklist.

Do not consult completed/superseded Plans unless a current fact cannot be resolved from current Authority.

---

# 3. Non-goals and forbidden expansion

The following are explicitly outside this Plan:

```text
Persona
Memory
Relationship
Attention
Living State
Appraisal
Epistemic State
Commitments
Reflection
Diary
Dream
Advanced Observation Window
debounce/patience/typing timers
proactive messaging
external IM / OneBot / Milky
media / voice / files
MCP
tools / tool calls
AI SDK Agent / WorkflowAgent
generic ActionPlan framework
PromptProgram framework
reviewer agent
second cognition scheduler
generic EventBus
generic UnitOfWork / TransactionCoordinator
generic workflow engine
new retry engine
provider fleet/failover
second HTTP server
WebSocket/SSE requirement
GUI/Desktop/Web implementation
OpenClaw integration
backup/restore/update closure
source-less or cross-platform release qualification
```

Do not add machinery for these future areas merely because Architecture documents retain future-facing semantic seams.

---

# 4. Standing engineering decisions

## 4.1 Reuse existing mechanics

The Product Host must compose the already-adopted owners:

```text
PostgreSQL/Kysely     → canonical persistence mechanics
Signal                → wakeup hint
WorkQueue             → canonical durable WorkItem owner
DBOS durable-execution→ durable dispatch/recovery mechanics
RuntimeKernel         → generation-fenced WorkHandler registration
AIRuntime             → gateway/model invocation mechanics and provenance
Fastify               → HTTP mechanics
@fastify/swagger      → OpenAPI projection mechanics
Hey API               → generated client mechanics
SchemaRuntime/Ajv     → canonical schema validation
```

Do not write a process-memory queue, custom workflow runtime, local scheduler, raw DBOS consumer, second HTTP framework, or hand-written generated-client replacement.

## 4.2 Package topology

Create exactly these new workspace packages unless an existing package already owns the same semantic role:

```text
packages/product/subject/          @heptalogos/subject
packages/product/messaging/        @heptalogos/messaging
packages/application/subject-chat-client/  @heptalogos/subject-chat-client
```

Create `packages/product/README.md` as the group map. Do not create a group-level `package.json`.

`@heptalogos/messaging` owns canonical conversation/MessageFact/Subject Chat semantics and remains independent of Subject implementation.

`@heptalogos/subject` owns persistent Subject authority, ConversationMailbox, Reaction/Behavior Authority, and the Reaction WorkHandler.

`@heptalogos/subject-chat-client` is generated from ProductHost-owned Subject Chat OpenAPI and owns no business rules.

Do not create workspace packages for `reaction`, `decision`, `communication`, `mailbox`, `context`, `subject-chat-server`, or `behavior-intent` by noun alone.

## 4.3 Dependency direction

Required stable direction:

```text
foundation/data/execution/runtime/system
        ↓
@heptalogos/messaging
        ↓
@heptalogos/subject
        ↓
ProductHost composition
        ↓
Subject Chat HTTP projection / generated client
```

Messaging must not import Subject. Subject may import Messaging contracts/queries.

The atomic inbound transaction is solved by a narrow Messaging-owned current-consumer callback/port supplied by Subject through ProductHost composition. Do not introduce a generic event system.

---

# 5. Current-Authority corrections required before implementation

Apply these changes first because the current Specs otherwise force duplicate truth or leave commit-time fencing underspecified.

## 5.1 Subject durable Authority vs current status projection

Rewrite `specs/subject/subject-base.md` so the durable canonical record is:

```ts
interface SubjectAuthorityRecord {
  readonly schemaVersion: 1;
  readonly subjectId: SubjectId;
  readonly installationId: InstallationId;
  readonly desiredState: "STOPPED" | "RUNNING";
  readonly authorityRevision: number;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
  readonly lineageContextRef: LineageContextRef;
}
```

`actualState` is not a second durable column. The Subject owner exposes a canonical current projection:

```ts
interface SubjectStatus {
  readonly schemaVersion: 1;
  readonly subjectId: SubjectId;
  readonly desiredState: "STOPPED" | "RUNNING";
  readonly actualState:
    | "STOPPED"
    | "STARTING"
    | "READY"
    | "ACTIVE"
    | "DEGRADED"
    | "BLOCKED"
    | "STOPPING"
    | "FAILED";
  readonly authorityRevision: number;
  readonly blockers: readonly SubjectBlocker[];
}
```

The projection is Subject-owned canonical current truth, not UI inference, but it is derived from current durable intent plus current owned runtime/dependency facts.

Current L4 is required to materially produce only states justified by actual facts. Do not fabricate machinery merely to exercise every enum member.

At minimum:

```text
Desired STOPPED and no committed communication still draining → STOPPED
Desired STOPPED with current obligation still quiescing/draining → STOPPING
Desired RUNNING + all hard prerequisites usable + no current Reaction → READY
Desired RUNNING + hard prerequisites usable + current nonterminal Reaction → ACTIVE
Desired RUNNING + missing hard prerequisite → BLOCKED
```

`DEGRADED` remains legal but no optional current capability is invented to trigger it.

`FAILED` remains legal only for an observed Subject-owned control failure that cannot truthfully be represented as dependency BLOCKED. Do not add a durable failure latch solely to populate the state.

`STARTING` may be a short-lived current projection while start/reconciliation work is genuinely in progress; no durable STARTING field is created.

## 5.2 Provider wording

Subject readiness language must use current gateway/model terminology, not provider-vendor identity. Hard prerequisites include current Host Authority, Persistence/Work/Lineage, usable `subject.primary`, usable `subject.expression`, required gateway Secret/NetworkAccess, and AIRuntime readiness.

## 5.3 AIRuntime GenerationResult identity

Add the existing canonical binding identity to GenerationResult:

```ts
readonly modelBindingId: ModelBindingId;
```

`bindingRevision` without the corresponding `modelBindingId` is insufficient durable provenance once DecisionCommit consumes the result.

## 5.4 AIRuntime commit-time admissibility seam

Extend the existing AIRuntime owner with one narrow transaction-aware validator used by consuming canonical commit paths. Semantics:

```ts
assertGenerationAdmissibleForCommit(
  transaction,
  provenance,
): Promise<void>
```

Exact function name is local. The semantic requirement is fixed.

For a GenerationResult, the validator must fail unless the transaction observes the still-current:

```text
modelBindingId
bindingRevision
modelProfileId
modelProfileGeneration
gatewayProfileId
configurationRevisionId required by current invocation semantics
```

It must not perform external network/model I/O and must not create a second AIRuntime state machine.

The consuming Subject DecisionCommit/Expression-acceptance transaction calls this owner seam inside the same Host-fenced canonical transaction that commits the semantic result.

## 5.5 WorkQueue transaction-aware creation seam

Refactor the existing `WorkQueueService.create()` implementation into two owner-preserving phases while keeping `create()` as the normal convenience path:

```ts
prepareCreate(request): Promise<PreparedWorkCreation>
commitPrepared(transaction, prepared): Promise<WorkCreationResult>
create(request): Promise<WorkCreationResult>
```

Exact names may vary; semantics may not.

`prepareCreate` owns all operations that must not occur inside the caller's canonical transaction:

```text
request validation
exact WorkHandler resolution
payload schema/canonicalization
profile/class/partition validation
current ExecutionContext capture
configuration-binding resolution
WorkAdmissionPort.beforeCreate
normalized notBefore/stateReason
lineage context preparation
```

`PreparedWorkCreation` is ephemeral implementation data. It is not durable state, serializable Product Authority, or a public lifecycle object.

`commitPrepared`:

- accepts an existing `PersistenceMutationTransactionContext`;
- creates/inserts the canonical WorkItem using the WorkQueue owner/repository;
- retains/completes the WorkQueue Activity/Lineage required by current WorkItem semantics;
- publishes `WORK_AVAILABLE_TOPIC` through the existing transactional SignalPublisher only for a new insert;
- performs no external I/O;
- opens no nested persistence transaction.

`create()` must reuse these phases rather than retain a duplicate implementation.

Do not expose the WorkQueue repository to Messaging/Subject and do not create a generic transaction coordinator.

## 5.6 Architecture current/future synchronization

Update only the necessary current sections of:

```text
docs/architecture/subject.md
docs/architecture/authority-and-core-concepts.md
```

to distinguish:

```text
CURRENT L4
BehaviorIntent
Deterministic Review
DecisionCommit
CommunicationCommit
Expression
ConversationMailbox

FUTURE RESEARCH / SEMANTIC SEAMS
CognitiveOpportunity
ReactionWorkspace
Yield
PromptProgram
ActionPlan
Advanced Observation Window
```

Do not delete approved future meaning. Do not implement future machinery.

---

# 6. Canonical identities

Add current L4 identities to the existing Foundation identity owner using the repository's established UUIDv7/namespaced/content-digest conventions. At minimum:

```text
SubjectId
MessagingAccountId
CanonicalConversationId
CanonicalMessageId
ReactionId
DecisionCommitId
CommunicationCommitId
```

`MessagingPlatformId` may use the existing namespaced-ID mechanism and the current constant logical platform:

```text
heptalogos-subject-chat
```

Do not create another identity library.

The built-in Subject Chat account/conversation identities are created once per Installation and persisted. They are not regenerated on Host restart.

---

# 7. Canonical persistence

Add one new current capability migration:

```text
packages/data/canonical-schema/src/migrations/
  0003-product-subject-l4.ts
```

Register it in the current migration provider. This is a real new Product capability, so a new migration is appropriate. Do not rewrite `0001`/`0002` for Subject state.

The migration materializes only:

```text
subject_authority
messaging_conversation
conversation_mailbox
reaction
decision_commit
communication_commit
message_fact
```

Use existing `heptalogos.work_item`, Activity, Lineage, Evidence, Administrator, and gateway tables rather than duplicating them.

### 7.1 `subject_authority`

Required shape:

```text
subject_id                  uuid PK
installation_id             uuid UNIQUE NOT NULL
desired_state               STOPPED | RUNNING
authority_revision          bigint >= 1
created_at                  timestamptz(3)
updated_at                  timestamptz(3)
lineage_context_ref         jsonb
```

No `actual_state` column.

### 7.2 `messaging_conversation`

One built-in conversation per Installation:

```text
conversation_id             uuid PK
installation_id             uuid UNIQUE NOT NULL
platform_id                 text = heptalogos-subject-chat
administrator_id            uuid NOT NULL
administrator_account_id    uuid NOT NULL
subject_id                  uuid NOT NULL
subject_account_id          uuid NOT NULL
last_sequence               bigint >= 0
created_at                  timestamptz(3)
lineage_context_ref         jsonb
```

The current Product does not need a generic account registry table.

### 7.3 `conversation_mailbox`

Required shape:

```text
conversation_id             uuid PK
mailbox_revision            bigint >= 0
consumed_through_sequence   bigint >= 0
open_reaction_id            uuid NULL
updated_at                  timestamptz(3)
lineage_context_ref         jsonb
```

Do not persist `pendingMessageRefs` as an ever-growing JSON array. Pending facts are derived from canonical MessageFact sequence:

```text
sequence > consumed_through_sequence
```

Update the normative mailbox type accordingly.

### 7.4 `reaction`

Required durable semantics:

```text
reaction_id                         uuid PK
conversation_id                     uuid NOT NULL
observed_mailbox_revision           bigint NOT NULL
observed_through_sequence           bigint NOT NULL
observed_subject_authority_revision bigint NOT NULL
state                               OPEN | SUPERSEDED | DECIDED | DELIBERATED_SILENT | REPLIED | FAILED
owner_work_item_id                  uuid NOT NULL
owner_activity_ref                  jsonb or existing canonical ActivityRef storage form
created_at                          timestamptz(3)
updated_at                          timestamptz(3)
lineage_context_ref                 jsonb
```

Enforce one current open Reaction through mailbox compare-and-set ownership; a partial uniqueness guard for an OPEN reaction may be used if it directly strengthens the same invariant without creating a second owner.

### 7.5 `decision_commit`

One immutable DecisionCommit per Reaction:

```text
decision_commit_id                  uuid PK
reaction_id                         uuid UNIQUE NOT NULL
subject_id                          uuid NOT NULL
subject_authority_revision          bigint NOT NULL
mailbox_revision                    bigint NOT NULL
decision_kind                       REPLY | SILENCE
behavior_intent                     jsonb NOT NULL
behavior_intent_digest              text sha256 NOT NULL
primary_invocation_id               uuid NOT NULL
primary_model_binding_id            uuid NOT NULL
primary_binding_revision            bigint NOT NULL
primary_model_profile_id            uuid NOT NULL
primary_model_profile_generation    bigint NOT NULL
primary_gateway_profile_id          uuid NOT NULL
primary_configuration_revision_id   uuid NOT NULL
primary_protocol                    openai-chat | openai-responses
committed_at                        timestamptz(3)
lineage_context_ref                 jsonb
```

Store accepted proposal provenance needed to explain and fence the decision. Do not persist SDK objects, raw secret, or an entire prompt/runtime object graph.

### 7.6 `communication_commit`

Exactly one current communication authorization per REPLY DecisionCommit:

```text
communication_commit_id       uuid PK
decision_commit_id            uuid UNIQUE NOT NULL
conversation_id               uuid NOT NULL
subject_authority_revision    bigint NOT NULL
purpose                       text NOT NULL
semantic_content              jsonb NOT NULL
semantic_content_digest       text sha256 NOT NULL
created_at                    timestamptz(3)
lineage_context_ref           jsonb
```

A SILENCE DecisionCommit has no CommunicationCommit.

### 7.7 `message_fact`

Required shape:

```text
message_id                         uuid PK
conversation_id                    uuid NOT NULL
sequence                           bigint >= 1
direction                          INBOUND | OUTBOUND
sender_kind                        ADMINISTRATOR | SUBJECT
sender_account_id                  uuid NOT NULL
recipient_kind                     ADMINISTRATOR | SUBJECT
recipient_account_id               uuid NOT NULL
text                               text non-empty
client_message_id                  text NULL
accepted_input_digest              text sha256 NULL
caused_by_communication_commit_id  uuid NULL
created_at                         timestamptz(3)
lineage_context_ref                jsonb
```

Constraints:

```text
UNIQUE(conversation_id, sequence)

INBOUND:
  client_message_id required
  accepted_input_digest required
  caused_by_communication_commit_id null

OUTBOUND:
  client_message_id null
  accepted_input_digest null
  caused_by_communication_commit_id required and UNIQUE
```

Idempotency key scope is current conversation + sender account + `client_message_id`. Use a partial unique index over non-null inbound keys.

Do not create a separate generic IdempotencyService/table for this current path.

### 7.8 Grants and owner discipline

Apply the repository's current revoke/grant pattern. Normal runtime role receives only the DML permissions needed by owning services. Do not broaden root/database authority.

---

# 8. Subject identity and lifecycle

## 8.1 Initialization

The first normal Product Host startup after migration ensures one `SubjectAuthorityRecord` exists for the Installation. This does not depend on an Administrator already existing.

Creation occurs under Host-fenced canonical mutation and is idempotent by `installation_id` uniqueness.

The built-in Subject Chat identity set requires the canonical AdministratorId. Therefore:

```text
startup with existing Administrator
→ ensure built-in conversation identities idempotently

first installation before Administrator claim
→ Subject exists, conversation identity is not fabricated
→ successful first Administrator claim
→ ensure built-in conversation identities in a separate idempotent Messaging mutation
→ if that follow-up fails, next startup or first authenticated Subject Chat/Subject start reconciliation retries it
```

Do not widen the atomic Administrator-claim transaction merely to create Messaging state. The claim remains Management-owned; Messaging setup is a recoverable idempotent current-capability initialization.

If records already exist, reuse exact IDs. Host restart, model/gateway change, Management session change, and ProductGeneration change do not create a new logical Subject.

Initial durable desired state:

```text
STOPPED
```

Do not create `subject.create` as a Management action.

## 8.2 Management actions

Materialize the already-normative current actions:

```text
subject.start
subject.stop
```

Both use normal SystemAction plan/execute semantics.

Input binds expected `subjectId` and `authorityRevision`.

`subject.start` commits:

```text
desiredState STOPPED → RUNNING if needed
authorityRevision + 1 only for a material desired-state change
required Lineage/Evidence
```

An already-RUNNING request may return the current state as an idempotent/no-op result if this matches existing SystemAction conventions; do not increment the revision for a semantic no-op.

`subject.stop` commits RUNNING → STOPPED and increments authorityRevision. New built-in Subject Chat cognition admission closes immediately after commit.

Do not map these actions to RuntimeKernel MicroSystem desired state. The Subject service MicroSystem remains a running Product service while the logical Subject is STOPPED.

## 8.3 Stop effect on current cognition

The authorityRevision increment fences pre-DecisionCommit work.

A pre-commit Reaction observing the old Subject revision cannot DecisionCommit and converges to SUPERSEDED/CANCELLED according to current WorkItem/Reaction semantics.

A DecisionCommit already committed before stop remains canonical. A REPLY CommunicationCommit already committed remains an obligation and may finish local outbound materialization. Stop does not erase committed behavior Authority.

This distinction allows truthful STOPPING projection without inventing rollback.

## 8.4 Readiness

For Desired RUNNING, Subject readiness is derived from current owner reads, not persisted separately.

Hard L4 prerequisites:

```text
current Host Authority
Persistence available
Execution Lineage/Evidence available
built-in Messaging conversation identity available for the canonical Administrator/Subject
Signal/WorkQueue/DurableExecution path available
Reaction WorkHandler currently registered for the Product generation
subject.primary binding usable
subject.expression binding usable
required GatewayProfile/Secret/NetworkAccess usable
AIRuntime route usable
```

OpenClaw, GUI, external IM, MCP, Memory, Persona, Relationship, Attention, and other advanced cognition are not prerequisites.

---

# 9. Product Host durable execution composition

Product Host must bring the already-qualified Foundation durable work spine into the real Product process.

## 9.1 Schema initialization

During Host handoff/migration Authority, compose:

```text
createCanonicalSchemaInitializer(...)
+
createDurableExecutionSchemaProvisioner(...).ensureCurrent(authority)
```

Do not let normal runtime DML own DBOS vendor schema creation.

## 9.2 Build/runtime identities

The Product Host already carries `PRODUCT_GENERATION_ID` and Bootstrap generation identity.

Add a deterministic first-party Subject package generation identity for the Reaction WorkHandler target. Derive it from the current `packages/product/subject` build inputs using the existing build-identity generator pattern; emit it in generated ProductHost build identities as a `PackageGenerationId`.

Add/derive one `DurableCodeVersion` for the current Product durable worker code. For this first first-party-only Product slice it may be deterministically derived from `PRODUCT_GENERATION_ID` under a separate content-digest domain. Do not build a package-generation registry.

## 9.3 One current WorkQueue profile

Create one immutable Host-composed profile for Subject cognition, e.g. semantic identity:

```text
work.subject-reaction
```

It is partitioned by `conversationId` with:

```text
partition.concurrency = 1
```

This serializes durable attempts for one conversation while allowing the existing WorkQueue/DBOS mechanics to remain the scheduler.

Current global/worker concurrency may use small implementation constants appropriate to one local Subject. Do not add a ConfigurationDefinition until a real current Product need exists to tune them.

Use a current resource-admission class such as:

```text
resource.subject-reaction
```

with the existing explicit WorkAdmissionPort. No new resource-governance framework is authorized.

## 9.4 Reaction WorkHandler

Register one generation-pinned WorkHandler contribution owned by the Subject MicroSystem, with a payload containing only the durable cognition trigger needed to re-read canonical state:

```ts
{
  schemaVersion: 1,
  conversationId: CanonicalConversationId,
  acceptedMessageId: CanonicalMessageId
}
```

The MessageId is allocated before the inbound transaction and becomes canonical only if that transaction commits. The WorkItem does **not** carry a prospective mailboxRevision that would have to be guessed outside the transaction. The handler always reads the current canonical mailbox when it executes.

Do not embed full MessageFact history, prompts, secrets, or model output in the WorkItem payload.

Use:

```text
configurationBindingPolicy = LATEST_COMPATIBLE_AT_ATTEMPT
restoreReplayClass = RECONCILE_REQUIRED
```

unless current Foundation contract evidence requires a narrower equivalent.

## 9.5 Runtime startup order

The final Product Host must not publish normal Subject Chat readiness until the durable spine is usable.

Required ordering intent:

```text
private PostgreSQL ready
→ canonical + DBOS schema current
→ Host Authority active
→ ExecutionContext/Persistence/Lineage/Evidence
→ Signal service
→ Configuration/Secret/NetworkAccess/AIRuntime
→ Messaging + Subject services
→ RuntimeKernel definitions/reconcile including Reaction WorkHandler
→ WorkQueueService / WorkAttemptExecutor
→ DurableExecutionRuntime start
→ WorkQueueReconciler start
→ Management + Subject Chat HTTP listener
→ endpoint publication/readiness
```

The exact object construction order may differ where dependency injection requires it, but the published readiness dependency may not be weakened.

## 9.6 Shutdown

Normal Product Host close:

```text
stop accepting HTTP requests
→ stop WorkQueue reconciler
→ close/drain DurableExecution runtime within existing bounded policy
→ close Signal resources
→ close RuntimeKernel supervisor
→ close Persistence
→ stop private PostgreSQL through existing Host maintenance path
```

Do not mutate Subject DesiredState to STOPPED merely because the process is shutting down. Restart preserves logical intent.

A crash may leave canonical WorkItem/Reaction obligations nonterminal; existing DBOS/WorkQueue recovery mechanics own replay/reconciliation.

---

# 10. Messaging and built-in Subject Chat

## 10.1 Current protocol

Exactly:

```text
one logical platform = heptalogos-subject-chat
one Administrator account
one Subject account
one direct conversation
text only
```

No groups, media, reactions, editing, delete, typing state, read receipt, or proactive send.

## 10.2 Authentication vs Authority

Subject Chat uses the existing Administrator session token for authentication identity.

The HTTP adapter resolves the token to the canonical current Administrator principal using the existing Management authentication/session owner.

After authentication the request enters Messaging Authority, **not** SystemAction/System Authority.

No second password/session/token store is created.

## 10.3 Inbound atomic path

Before the canonical transaction:

1. validate protocol body and canonical non-empty text;
2. read Subject current admission/status;
3. allocate a candidate CanonicalMessageId and prepare the Subject cognition obligation, including `WorkQueue.prepareCreate(...)` for the exact Reaction WorkHandler target using `{ conversationId, acceptedMessageId }`;
4. compute canonical accepted-input digest for idempotency.

Then one Host-fenced canonical transaction owned by Messaging commits:

```text
revalidate current Subject chat admission / authority fence needed by the path
lock/read current conversation sequence
resolve clientMessageId idempotency
if existing identical:
  return existing accepted result; do not advance mailbox or insert work
if existing different:
  fail messaging.idempotency_conflict
else:
  allocate next canonical conversation sequence
  insert inbound MessageFact
  advance messaging_conversation.last_sequence
  invoke Subject's narrow transaction-aware accepted-inbound callback
    → advance ConversationMailbox.mailboxRevision
    → commitPrepared WorkItem in the same transaction
  record required Lineage/Evidence
commit
```

The Subject callback is a real current cross-owner seam because the Messaging Spec requires MessageFact + mailbox + WorkItem to become one atomic accepted fact/obligation boundary. It is not a generic event bus.

Signal publication remains transaction-bound through WorkQueue and is only a wakeup hint.

No model/network I/O occurs in this transaction.

## 10.4 Cursor/query

Canonical conversation ordering is the per-conversation `sequence`.

Subject Chat query uses an opaque versioned cursor that encodes only what is required to resume after the last canonical sequence and validate the conversation/version.

Do not create a cursor registry table.

A typical query contract:

```text
GET messages after cursor
→ ordered ascending by sequence
→ bounded limit
→ nextCursor from last returned sequence
```

Reconnect always catches up from canonical MessageFact state. No live transport is required in this Plan.

## 10.5 Local outbound

Local outbound remains:

```text
CommunicationCommit
→ MessagingService materializeOutbound
→ exactly one OUTBOUND MessageFact
```

Use unique `caused_by_communication_commit_id` to enforce idempotence.

No EffectOperation is created for local Subject Chat.

---

# 11. ConversationMailbox and Reaction acquisition

## 11.1 Mailbox

The mailbox tracks cognition aggregation boundaries, not duplicate Messaging truth:

```ts
interface ConversationMailbox {
  readonly schemaVersion: 1;
  readonly conversationId: CanonicalConversationId;
  readonly mailboxRevision: number;
  readonly consumedThroughSequence: number;
  readonly openReactionId?: ReactionId;
}
```

Pending cognition input MessageFacts are queried from Messaging by canonical sequence range **and `direction = INBOUND`**. Outbound facts remain canonical conversation history but do not themselves create mailbox cognition obligations.

Each accepted inbound increments `mailboxRevision` exactly once.

## 11.2 Reaction acquisition

When the Reaction WorkHandler runs:

1. load WorkItem trigger and current mailbox;
2. confirm the acceptedMessageId exists as an inbound MessageFact;
3. if that inbound fact is already at or below the mailbox consumed boundary, terminally no-op/supersede the redundant WorkItem;
4. if no open Reaction owns current pending inbound work, acquire `openReactionId` by compare-and-set and insert one Reaction with observed mailbox/Subject revisions plus the current highest pending inbound `observedThroughSequence`;
5. if another current Reaction already owns the open fence, do not create a second current Reaction.

Multiple inbound WorkItems may collapse onto one Reaction when they arrive before execution: the Reaction consumes the canonical pending inbound range, while later redundant WorkItems observe that range as already consumed and terminally no-op.

The WorkQueue profile's `partition.concurrency = 1` reduces competing handler attempts but does not replace the canonical compare-and-set fence.

No Observation Window, debounce, or timer is added.

---

# 12. ContextProjection and primary invocation

## 12.1 Current ContextProjection

Build the primary ContextProjection from canonical reads only:

```text
SubjectId
current SubjectStatus and authorityRevision
current conversation identity
pending/selected MessageFacts from consumedThroughSequence+1 through observed boundary
current mailbox revision
current Product constraints needed for REPLY/SILENCE
current AIRuntime capability/binding facts needed to form InvocationSpec
```

It is ephemeral invocation input. Do not persist a ContextProjection table.

Do not include Persona, Memory, Relationship, Attention, tools, or speculative future fields.

## 12.2 BehaviorIntent schema

The primary model output is exactly the current two-class proposal:

```text
REPLY
SILENCE
```

For REPLY, the current semantic content remains the versioned object containing non-empty `text` semantic payload as defined by the Reaction Spec.

For SILENCE, keep only current reason classes.

Use SchemaRuntime/Ajv through AIRuntime's structured-output boundary. Primary output is proposal/evidence only.

## 12.3 No model-driven Review

Review is deterministic Product code. Do not call a reviewer model.

---

# 13. Deterministic Review and DecisionCommit

Before DecisionCommit, one Host-fenced canonical transaction revalidates all current fences:

```text
Reaction exists and state = OPEN
Reaction still owns mailbox.openReactionId
current mailboxRevision == Reaction.observedMailboxRevision
current Subject authorityRevision == Reaction.observedSubjectAuthorityRevision
current Subject state permits commit
conversation is current
BehaviorIntent schema/domain valid
AIRuntime.assertGenerationAdmissibleForCommit(transaction, primary GenerationResult)
current Product constraints permit result
```

If mailbox revision changed before DecisionCommit:

```text
Reaction → SUPERSEDED
clear/advance open-reaction ownership as appropriate
no DecisionCommit
no CommunicationCommit
no outbound MessageFact
```

If Subject authorityRevision changed, stale pre-commit work cannot commit.

On success insert immutable DecisionCommit and update Reaction state in the same transaction with required Lineage/Evidence.

After a DecisionCommit exists, retry never calls `subject.primary` to decide again.

---

# 14. SILENCE

Successful silence path:

```text
BehaviorIntent(SILENCE)
→ DecisionCommit(kind=SILENCE)
→ Reaction DELIBERATED_SILENT
→ mailbox consumed-through boundary advances for the decided input
→ openReactionId clears
→ WorkItem succeeds
```

No CommunicationCommit and no outbound MessageFact.

Silence is not a provider failure, timeout, empty string, or missing output.

---

# 15. REPLY / CommunicationCommit / expression

## 15.1 CommunicationCommit

After a REPLY DecisionCommit, create exactly one immutable CommunicationCommit. It contains the accepted semantic content/purpose and target conversation, not final natural-language authority beyond those semantics.

Retry first queries by `decision_commit_id`. If it already exists, reuse it.

## 15.2 Expression

Invoke `subject.expression` using:

```text
committed CommunicationCommit semantic content
allowed language/expression context
```

Expression may not change:

```text
REPLY vs SILENCE
target conversation
DecisionCommit identity
CommunicationCommit identity
SystemAction authorization
external-effect authorization
```

Current expression output schema is exactly a bounded non-empty text result, e.g.:

```ts
{
  schemaVersion: 1,
  text: string
}
```

No tool/action fields.

Before accepting expression for canonical outbound materialization, validate its GenerationResult through AIRuntime's commit-time admissibility seam. If the binding/generation became stale, do not materialize that result as current; retry may re-express the already-committed CommunicationCommit with the current admissible expression binding. It may not re-decide.

## 15.3 Exactly-once local outbound

MessagingService inserts one outbound MessageFact keyed uniquely by `CommunicationCommitId`.

If a crash occurs after MessageFact commit but before WorkItem completion, retry finds the existing outbound fact and does not call expression again solely to create another reply.

After outbound materialization:

```text
Reaction → REPLIED
mailbox consumedThroughSequence advances through the decided input boundary
openReactionId clears
WorkItem succeeds
```

---

# 16. Retry, recovery, supersession

The WorkHandler is reconciliation-style and begins by reading canonical state.

Required re-entry order:

```text
outbound MessageFact exists for CommunicationCommit?
→ finalize Reaction/WorkItem without re-expression

DecisionCommit SILENCE exists?
→ finalize silent terminal state

DecisionCommit REPLY + CommunicationCommit exists?
→ expression/materialization only

DecisionCommit REPLY exists without CommunicationCommit?
→ create/reuse CommunicationCommit then expression

no DecisionCommit?
→ primary → Review → commit
```

Consequences:

```text
crash before DecisionCommit
→ primary may run again; no canonical behavior existed

crash after DecisionCommit
→ no second primary decision

crash after CommunicationCommit
→ continue expression only

crash after outbound MessageFact
→ no second outbound MessageFact
```

A new inbound message increments mailboxRevision. A primary result based on an older revision is rejected by deterministic Review and cannot DecisionCommit.

Do not proactively build early model-call cancellation in this Plan. The strict stale-result fence is the baseline. A later Observation Window/cancellation research Plan may use measured token/latency/supersession data.

---

# 17. Work failure classification

Reuse existing WorkItem retry/failure semantics.

The Subject-specific classifier may map current Problems into existing classes, for example:

```text
transient transport/dependency interruption → RETRY if current owner semantics explicitly classify retryable
current gateway/model binding missing        → WAITING_DEPENDENCY / dependency-unavailable
invalid model structured proposal            → terminal invalid for that attempt/Reaction as defined by owner
stale mailbox/subject revision               → canonical supersession, not provider failure
permanent Subject invariant violation         → terminal permanent
```

Do not implement an independent Reaction retry counter/backoff engine. Do not use hidden model-provider retries.

---

# 18. Management projection

Extend current Management coverage because Subject has now entered Product.

Required:

```text
subject.start action
subject.stop action
Subject read model:
  subjectId
  desiredState
  actualState
  authorityRevision
  readiness/blockers
```

`subject.start`/`subject.stop` must appear in:

```text
Management action catalog
OpenAPI
ManagementClient generated surface
reference CLI normal Management projection
```

Do not add Subject Chat send as a SystemAction.

Management may expose bounded Subject Chat conversation/message read links or summaries where the current System Authority Spec requires normal inspectability, but normal chat send remains the Subject Chat protocol surface.

---

# 19. Subject Chat HTTP and generated client

Use the same Product Host Fastify listener and Administrator bearer-session mechanics, but a distinct protocol/Authority prefix:

```text
/management/v1/**     → System Authority
/subject-chat/v1/**   → Messaging/Subject Authority
```

Minimum current Subject Chat operations:

```text
POST /subject-chat/v1/messages
GET  /subject-chat/v1/messages
GET  /subject-chat/v1/conversation   (optional only if needed by generated client/bootstrap identity discovery)
```

Do not create a second listener, second auth store, WebSocket, SSE, or browser-specific cookie flow.

Generate a separate ProductHost-owned OpenAPI artifact:

```text
packages/application/product-host/generated/subject-chat.openapi.json
```

Generate `@heptalogos/subject-chat-client` with the already-adopted Hey API path. Checked-in generated files are not hand-edited.

Management OpenAPI remains semantically separate even though the same Fastify application/listener hosts both route sets.

---

# 20. Local full-stack product proof without external credential

This Plan must not add an AIRuntime fake seam to Product code.

For deterministic full-stack qualification, run the real Product Host against a test-owned loopback OpenAI-compatible HTTP fixture configured through the normal GatewayProfile/ModelProfile/ModelBinding/NetworkAccess/AIRuntime path.

The fixture is outside Product Authority and returns controlled structured outputs for:

```text
primary REPLY
primary SILENCE
expression text
slow primary for supersession/crash scenarios as required
```

This proves the entire normal Product route except a real external gateway/upstream. It does not count as NewAPI/live-provider evidence.

The full local path must use:

```text
real private PostgreSQL
real canonical schema
real DBOS durable execution
real WorkQueue/Signal
real ProductHost process or process-equivalent built entrypoint
real Management HTTP/session
real Subject Chat HTTP
real generated clients where practical
real AIRuntime/NetworkAccess/AI SDK adapter code
loopback protocol fixture only at the external gateway boundary
```

---

# 21. Acceptance scenarios

## 21.1 Persistent identity/start

```text
first Host start
→ one SubjectId created, Desired STOPPED
→ Administrator plans/executes subject.start
→ Desired RUNNING, authorityRevision advances
→ prerequisites ready
→ SubjectStatus READY

Host restart
→ exact same SubjectId
→ Desired RUNNING preserved
→ current status recomputed from current facts
```

## 21.2 REPLY happy path

```text
Subject READY
→ SubjectChatClient sends text with clientMessageId
→ inbound MessageFact committed
→ mailbox revision + WorkItem committed atomically
→ durable dispatch
→ Reaction OPEN
→ real AIRuntime path primary returns REPLY proposal
→ deterministic Review
→ DecisionCommit(REPLY)
→ CommunicationCommit
→ real AIRuntime path expression
→ exactly one outbound MessageFact
→ query/catch-up returns inbound then outbound in canonical sequence
```

## 21.3 SILENCE

```text
primary returns SILENCE proposal
→ DecisionCommit(SILENCE)
→ DELIBERATED_SILENT
→ no CommunicationCommit
→ no outbound MessageFact
```

## 21.4 Idempotent inbound

```text
same clientMessageId + same canonical text
→ same accepted MessageFact/result
→ no duplicate MessageFact
→ no mailbox increment
→ no duplicate WorkItem

same clientMessageId + changed text
→ messaging.idempotency_conflict
```

## 21.5 Supersession

```text
message A → primary running
message B commits → mailboxRevision increments and owns a newer WorkItem
A primary returns
→ DecisionCommit transaction observes stale mailbox
→ A Reaction SUPERSEDED
→ no A DecisionCommit/CommunicationCommit/outbound fact
→ B remains processable
```

## 21.6 Stop fence

```text
pre-commit Reaction observes authorityRevision N
subject.stop commits Desired STOPPED and revision N+1
old Reaction cannot DecisionCommit
new chat admission rejected
same SubjectId and durable history remain inspectable
```

## 21.7 Crash/re-entry boundaries

Prove at least the canonical state outcomes around:

```text
before DecisionCommit
between DecisionCommit and CommunicationCommit
between CommunicationCommit and outbound MessageFact
immediately after outbound MessageFact commit
```

Use the strongest existing process/DBOS qualification mechanism practical without adding Product fault-injection hooks. Test-only orchestration may terminate a child process at externally observable boundaries.

## 21.8 Dependency unavailable

With Desired RUNNING but an unusable current `subject.primary`/`subject.expression` gateway route:

```text
SubjectStatus BLOCKED
new built-in Subject Chat cognition admission rejected
no fabricated READY
no fallback model/provider
```

---

# 22. Verification

Required focused package tests for changed owners plus cross-owner integration.

At minimum run:

```text
pnpm check:repo
pnpm verify
```

and the new Product Subject L4 integration target(s).

Do not require ordinary GitHub Actions.

Do not add a permanent repository gate for a one-time migration/history fact.

Do not create a testing matrix beyond the claims in this Plan.

---

# 23. Evidence and qualification records

Create bounded records under `project/qualification/results/` for the claims actually executed.

Recommended split:

```text
Q-SUBJECT-L4-LOCAL-01
  real ProductHost/PostgreSQL/DBOS/WorkQueue/HTTP/AIRuntime path
  loopback OpenAI-compatible external fixture

Q-SUBJECT-L4-LIVE-01
  same Subject path through a real operator-configured gateway/upstream
```

`Q-SUBJECT-L4-LOCAL-01` may PASS when its exact local path passes.

`Q-SUBJECT-L4-LIVE-01` remains `BLOCKED` while the operator cannot provide a protected gateway credential. Do not upgrade it from a loopback fixture.

Plan completion does not require the live external record to PASS. It does require the complete local Product route and all local semantic acceptance to PASS. This is an explicit scope decision so unavailable external credentials do not freeze semantic development.

Do not claim live NewAPI/upstream qualification until `Q-SUBJECT-L4-LIVE-01` actually passes.

---

# 24. Documentation/current truth

On completion update only current owners and necessary navigation:

```text
specs/subject/subject-base.md
specs/messaging/messaging-subject-chat.md
specs/subject/reaction-behavior.md
specs/system/ai-runtime.md
specs/management/system-authority.md

docs/architecture/subject.md
docs/architecture/authority-and-core-concepts.md

packages/README.md
packages/INDEX.md
packages/product/README.md
new package READMEs
ProductHost/clients READMEs as needed

project/roadmap/development-roadmap.md
project/plans/INDEX.md
qualification records
```

Current documents describe final current truth, not “during L4 we added…” chronology.

Do not add a project-wide documentation rewrite.

---

# 25. Plan completion

The Plan is complete when all of the following are true:

```text
current Authority corrections are merged
Subject/Messaging packages and schema are current
ProductHost runs the real durable WorkQueue/DBOS spine
subject.start/stop are normal Management actions
Subject Chat is a distinct Messaging protocol surface
inbound MessageFact + mailbox + WorkItem are atomic
primary proposal cannot bypass deterministic Review
DecisionCommit is immutable and crash-stable
SILENCE produces no outbound fact
REPLY produces exactly one CommunicationCommit and outbound MessageFact
stale mailbox/Subject/AIRuntime provenance cannot commit as current
local full-stack Product proof is PASS
pnpm check:repo is green
pnpm verify is green
no observed authorized blocker remains
```

A `BLOCKED` external-live gateway qualification did not keep this Plan active.
The local Product L4 proof and repository gates passed; the completion path is
`project/plans/completed/product/persistent-subject-l4-vertical-slice-2026-09-04.md`.
The live external qualification remains a separate `BLOCKED` record.

STOP. Do not immediately begin Observation Window, Memory, Persona, external IM,
OpenClaw integration, or another hardening pass under this authorization.
