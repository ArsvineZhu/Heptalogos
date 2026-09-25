# P1 — Subject Conversation Communication Spine Correction

**State:** COMPLETED
**Repository baseline:** `ddb42f09c83149c024b8165a122c59d1724a5066`
**Change class:** bounded Product semantic rewrite with an in-plan current-truth precondition
**Primary owner:** `@heptalogos/subject`
**Compatibility:** none; repository is PRE_PRODUCTION

## 0. Execution precondition — current-truth convergence

This is part of P1. It is **not** a P0C task, does not create a second Plan, and
does not introduce a STOP point before the implementation work below. Correct
the standing knowledge first, then continue directly into the P1 code rewrite.

### 0.1 Remove development-stage residue from standing knowledge

Architecture, Specs, Glossary, Product docs, package READMEs, engineering
guidance, and qualification guidance describe current semantics. They must not
retain development-stage narration such as:

```text
P1 will ...
P3 target ...
P3/P4 ...
current branch ...
implementation lag ...
will be deleted in the next Plan ...
```

Plan identities and sequencing belong in `project/plans/**` and the Roadmap.
Standing knowledge should state the normative/current contract directly. During
the active edit window it is acceptable for code to be temporarily behind that
contract; do not memorialize that transient state in Architecture/Specs.

At minimum inspect the P0-touched standing files and remove stage residue from:

```text
project/governance/constitution.md
docs/architecture/ai-runtime.md
docs/architecture/authority-and-core-concepts.md
docs/architecture/configuration.md
docs/architecture/end-to-end-flows.md
docs/architecture/execution-model.md
docs/architecture/machine-operations.md
docs/architecture/messaging.md
docs/architecture/platform-distribution.md
docs/architecture/subject.md
docs/product/external-integrations.md
docs/product/product-goals.md
docs/reference/external-integrations.md
docs/reference/glossary.md
packages/product/subject/README.md
specs/messaging/messaging-subject-chat.md
specs/subject/reaction-behavior.md
specs/subject/subject-base.md
specs/system/ai-runtime.md
```

Also inspect standing files that P0 did not touch but still assume a generic
`BehaviorIntent`/`DecisionCommit`, especially:

```text
docs/architecture/research-subsystem-integration.md
project/qualification/verification-system.md
project/engineering/repository/architecture-review.md
```

Historical completed/superseded Plans and historical qualification records are
chronology and are not rewritten merely to rename old concepts.

### 0.2 Keep the Constitution technology-independent

The Constitution may require distinct Subject, System, and Machine/Deployment
Authority/trust/failure/privilege domains. It must **not** permanently freeze an
OpenClaw implementation detail such as "two Gateway processes".

Current Architecture may still require separate Subject and Machine Operations
OpenClaw runtime instances/Gateways because that is the selected present
isolation route. The constitutional invariant is only that shared technology
must not collapse authority, privileged credentials, trust, lifecycle, or
failure domains.

### 0.3 Correct external-integration lifecycle ownership

`docs/product/external-integrations.md` must not apply one operator-owned
lifecycle rule to every external dependency. Distinguish:

```text
Operator-owned external service/runtime
├─ model gateway (for example NewAPI)
├─ Machine Operations OpenClaw
└─ FFmpeg prerequisite when a capability requires it

Product-managed runtime dependency
└─ Subject OpenClaw Runtime when that integration exists
```

The operator-owned class is independently deployed/administered and is not
started by Product Host. The Product-managed Subject runtime may be distributed,
started, supervised, stopped, and replaced by the Product while remaining a
provider/runtime mechanic rather than Subject identity or canonical semantic
state. Do not implement OpenClaw in P1; this correction only removes conflicting
lifecycle authority text.

### 0.4 Keep Machine Operations as AuthorityHandoff, not a normal Subject tool

Subject-facing Architecture may list ordinary world interfaces/capabilities such
as Messaging, information/network services, application capabilities, and
authorized files/resources. Machine Operations is different:

```text
Subject-originated machine/deployment intent
→ AuthorityHandoff
→ Machine Operations authority independently evaluates/authorizes
```

Do not describe the high-privilege System Assistant/Machine Operations plane as
an ordinary Subject capability merely because both runtimes may use OpenClaw.

### 0.5 Remove generic DecisionCommit assumptions from standing guidance

The current project does not have a timeless generic Subject `DecisionCommit`.
Update standing research/verification/review language accordingly:

- Global Attention does not own WorkQueue or the relevant Subject/domain commit
  authority; do not name obsolete `DecisionCommit` as that universal fence.
- Proactive Behavior may create future CognitiveOpportunity/proposals, but its
  eventual action/communication semantics must pass the owning Subject/domain
  authority and Effect fence actually defined at that time. Do not pre-freeze a
  `BehaviorIntent → DecisionCommit → ActionPlan` pipeline.
- Voice/Multimodal preserves one Subject and the same owning communication/action
  semantics; it does not require a generic DecisionCommit object.
- Verification crash guidance should speak in authority boundaries such as
  "proposal before authoritative domain commit", "CommunicationCommit before
  expression/outbound", and Effect dispatch boundaries, rather than a universal
  DecisionCommit stage.
- Repository architecture review should ask whether a model/tool/client bypasses
  the **owning domain/Subject commit or SystemAction**, not whether everything
  passes `DecisionCommit`.

### 0.6 Small wording corrections

Before code work, remove remaining chatbot-centric wording such as:

```text
message → Subject → model → decision → local response
current reply/silence path
```

Use bounded cognition / optional communication terminology instead.

Run only the existing cheap documentation/static checks needed to catch broken
links or malformed standing knowledge, then continue directly into §1. Do not
create a new gate, qualification record, review ceremony, or completion record
for this precondition.

## 1. Goal

Rewrite the current conversation-triggered L4 slice so it no longer treats
`REPLY | SILENCE` as the Subject's global behavior ontology, while preserving
the valuable separation between accepted communication semantics and final
human-facing Expression.

The target current slice is:

```text
accepted MessageFact
→ ConversationMailbox
→ Reaction
→ bounded context projection
→ current conversation cognition proposal
   ├─ NO_COMMUNICATION
   │    → deterministic acceptance
   │    → Reaction completes
   │    → no CommunicationCommit
   │    → no outbound MessageFact
   │
   └─ COMMUNICATE(semantic content)
        → deterministic Review
        → CommunicationCommit
        → Expression
        → one outbound MessageFact
```

This Plan does not define the future total Subject action space.

## 2. Required context

Read current versions:

```text
AGENTS.md
project/governance/constitution.md
docs/architecture/subject.md
docs/architecture/authority-and-core-concepts.md
specs/subject/subject-base.md
specs/subject/reaction-behavior.md
specs/messaging/messaging-subject-chat.md
specs/system/ai-runtime.md
specs/execution/work-item.md
specs/execution/effect-operation.md

packages/product/subject/**
packages/product/messaging/**
packages/system/ai-runtime/**
packages/system/work-queue/**
packages/application/product-host/**
packages/**/canonical-schema/** or the current canonical schema owner
```

Inspect the exact current SQL/schema owner before changing persistence. Do not
create a migration compatibility path for development-only rows.

## 3. Decisions

### 3.1 Replace `BehaviorIntent`

Delete the broad current `BehaviorIntent` contract from the current Subject
slice. The current primary invocation returns one bounded proposal:

```ts
type ConversationReactionProposal =
  | {
      readonly schemaVersion: 1;
      readonly kind: "COMMUNICATE";
      readonly semanticContent: {
        readonly schemaVersion: 1;
        readonly content: string;
      };
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "NO_COMMUNICATION";
    };
```

Rules:

- `content` is semantic material to convey, not final chat wording.
- target conversation is fixed by the Reaction and is not model-selected or
  echoed in the proposal;
- current purpose is deterministically `reply`/conversation response and is
  not model-selected;
- `NO_COMMUNICATION` has no mandatory free-text explanation;
- this type is explicitly current-slice scoped and must not be named as the
  total Subject behavior contract.

Use the existing AIRuntime structured-output/schema mechanics for this current
implementation. Do not introduce OpenClaw or AI Tool machinery in P1; those are
separate runtime-integration semantics and are not required to correct this
communication slice.

### 3.2 Remove current conversation-specific `DecisionCommit`

The current `DecisionCommit` adds a durable state between proposal acceptance
and the only current authoritative downstream consequence. For this bounded
slice there is no current requirement for an independently reusable generic
Decision entity.

Delete:

```text
DecisionCommit type
DecisionCommit SQL/table/rows owned only by this slice
DecisionCommitId use in Subject communication flow
REPLY/SILENCE DecisionCommit recovery branches
DecisionCommit-specific Problems/tests/current standing docs
```

If `DecisionCommitId`, `createDecisionCommitId`, or another Foundation contract
exists only for this obsolete current slice after the rewrite, delete it too. Do
not preserve an unused branded identity because historical Plans mention it.

Do not create a replacement generic `Decision`, `ActionPlan`, `ActionCommit`,
behavior registry, or decision framework.

Because the project is PRE_PRODUCTION, rewrite the current schema baseline or
current migration directly as owned by the repository. Do not add an upcaster,
legacy table reader, copy migration, alias, dual write, or compatibility shim.

### 3.3 `CommunicationCommit` becomes the current communication Authority

For `COMMUNICATE`, deterministic Review and canonical commit produce one
immutable CommunicationCommit directly.

Required semantic shape:

```ts
interface CommunicationCommit {
  readonly schemaVersion: 1;
  readonly communicationCommitId: CommunicationCommitId;
  readonly reactionId: ReactionId;
  readonly subjectId: SubjectId;
  readonly subjectAuthorityRevision: number;
  readonly mailboxRevision: number;
  readonly conversationId: CanonicalConversationId;
  readonly purpose: "reply";
  readonly semanticContent: {
    readonly schemaVersion: 1;
    readonly content: string;
  };
  readonly semanticContentDigest: string;

  // accepted primary generation provenance needed to prove the origin of the
  // communication decision. Preserve existing stable identities rather than
  // inventing another provenance object.
  readonly primaryInvocationId: string;
  readonly primaryModelBindingId: string;
  readonly primaryBindingRevision: number;
  readonly primaryModelProfileId: string;
  readonly primaryModelProfileGeneration: number;
  readonly primaryGatewayProfileId: string;
  readonly primaryConfigurationRevisionId: string;
  readonly primaryProtocol: "openai-chat" | "openai-responses";

  readonly committedAt: Instant;
  readonly lineageContextRef: LineageContextRef;
}
```

Use existing branded identifier/provenance types where already owned; the
literal field listing above defines semantics, not a requirement to duplicate
existing primitives.

### 3.4 Reaction states

Replace the current state vocabulary with only the states current execution
needs:

```text
OPEN
SUPERSEDED
NO_COMMUNICATION
COMMUNICATION_COMMITTED
REPLIED
FAILED
```

Meaning:

```text
OPEN
→ cognition proposal not canonically accepted yet

SUPERSEDED
→ pre-commit observation/authority fence is stale

NO_COMMUNICATION
→ this bounded conversation Reaction completed successfully without a communication

COMMUNICATION_COMMITTED
→ one CommunicationCommit exists and Expression/outbound may still be pending

REPLIED
→ the committed communication materialized the current outbound MessageFact

FAILED
→ the Reaction cannot safely progress under existing failure semantics
```

Do not preserve `DECIDED` or `DELIBERATED_SILENT` aliases.

### 3.5 Deterministic Review

Before either accepted result commits, revalidate in the same Host-fenced
transaction:

```text
Reaction is OPEN
Subject desired/current state permits pre-commit cognition acceptance
Subject authorityRevision equals the Reaction's observed revision
mailboxRevision equals the observed revision
Reaction owns the current open-reaction fence
primary AIRuntime provenance is still admissible
proposal schema/domain bounds are valid
```

For COMMUNICATE, the same transaction writes:

```text
CommunicationCommit
+ Reaction -> COMMUNICATION_COMMITTED
+ required Lineage/Evidence
```

For NO_COMMUNICATION, the same transaction writes:

```text
Reaction -> NO_COMMUNICATION
+ mailbox consumed cursor/fence release
+ required Lineage/Evidence
```

Do not add `NoCommunicationCommit`, silence-reason records, or primary-provenance
columns to Reaction merely to replace DecisionCommit. The already-owned
GenerationResult/Activity/Evidence path records the accepted no-communication
proposal and provenance needed for attribution/research; Reaction only needs the
terminal semantic fact required for re-entry.

There is no intermediate durable decision state.

### 3.6 Subject stop semantics

`subject.stop` fences **new/pre-commit cognition**. It must not erase an already
committed human communication obligation.

Normative rule:

```text
before CommunicationCommit
+ stop/revision change
→ stale Reaction cannot commit

CommunicationCommit already exists
+ stop/revision change
→ committed communication remains canonical
→ Expression/outbound may finish
→ no re-decision
```

Do not let a post-commit desired-state change turn
`COMMUNICATION_COMMITTED` into `SUPERSEDED`.

### 3.7 Prepared inbound authority fence

`PreparedSubjectInbound.authorityRevision` already exists. Use it.

Inside `commitAcceptedInbound(...)` verify that the current Subject authority
revision equals the prepared revision and is currently admissible. Reject this
sequence:

```text
prepare at revision N
→ stop/start advances authority revision
→ commit old prepared inbound
```

Use the existing transaction; add no new coordination service.

### 3.8 ContextProjection is bounded current input

The current L4 projection reads exactly the MessageFacts selected for this
Reaction:

```text
sequence > consumedThroughSequence
AND sequence <= observedThroughSequence
```

Do not query all inbound history from sequence zero.

This Plan does not solve long-term conversational context. Historical context,
Memory and context selection remain future semantics. An accidental full-history
prompt is not accepted as a memory subsystem.

### 3.9 Expression remains independent

Keep a separate `subject.expression` invocation after CommunicationCommit.

Input:

```text
committed semantic content
fixed conversation/recipient context needed for language realization
allowed current language/social presentation context
```

Output:

```ts
{
  schemaVersion: 1;
  text: string;
}
```

Expression may vary phrasing, register, politeness, social tone, brevity,
organization, punctuation, emoji/platform style.

Expression may not change:

```text
whether communication occurs
target conversation/recipient
material facts or commitments
purpose in a materially different sense
SystemAction
consequential external action
permission/authority
```

Do not require the model to echo CommunicationCommit id/revision. Binding to the
commit is invocation/caller context, not semantic content that the model should
repeat.

### 3.10 Outbound materialization

Preserve the existing Messaging owner and idempotent local Subject Chat
materialization:

```text
CommunicationCommit
→ ExpressionResult
→ exactly one outbound MessageFact
```

The MessageFact must reference the CommunicationCommit using the existing
message/provenance mechanism.

P1 does not create EffectOperation for the local Subject Chat path. External IM
outbound effects remain later work.

## 4. Re-entry and crash behavior

On Reaction execution/retry, reconcile from canonical truth in this order:

```text
outbound MessageFact for CommunicationCommit exists
→ finalize REPLIED without Expression

CommunicationCommit exists and outbound does not
→ run/retry Expression + materialization only

Reaction is NO_COMMUNICATION
→ complete WorkItem without model invocation

Reaction is SUPERSEDED
→ complete superseded outcome

Reaction is OPEN
→ run primary proposal + Review
```

This gives the current useful recovery semantics without a separate
DecisionCommit recovery state.

### Meaningful crash proofs

Prove only current failure boundaries:

1. crash before canonical proposal acceptance → no CommunicationCommit; retry
   may run primary again;
2. crash after CommunicationCommit but before outbound → retry does not run
   primary; it resumes Expression/materialization;
3. crash after outbound MessageFact commit but before WorkItem completion → no
   duplicate outbound.

Do not construct a generic fault-injection framework. Use the existing
process/fixture orchestration or the narrowest direct mechanism already present.

## 5. Expected code changes

At minimum inspect/change:

```text
packages/product/subject/src/contracts.ts
packages/product/subject/src/service.ts
packages/product/subject/src/index.ts if exports changed
packages/product/subject/README.md

current canonical schema/migration owner for Subject tables
subject-focused unit/integration tests
Product Host L4 qualification fixture/result as needed
standing Architecture/Specs/Glossary touched by §0 and by exact implementation
  semantics; keep them stage-free current truth
```

Update generated artifacts only through their current owner/generator.

## 6. Deletion requirements

Search the current branch for and remove current-runtime residues of:

```text
BehaviorIntent             // when referring to the old global-looking type
DecisionCommit             // current conversation slice
DELIBERATED_SILENT
DecisionCommit SILENCE/REPLY recovery branches
expression commit-id echo requirements
```

Historical completed Plans/qualification records remain history and should not
be rewritten merely to erase historical terminology. Current indexes/projections
must not present those historical shapes as current semantics.

## 7. Verification

Run the smallest existing verification that proves the changed owners, then the
real L4 path.

Required behavioral scenarios:

```text
A. one inbound -> NO_COMMUNICATION
   no CommunicationCommit
   no outbound MessageFact
   WorkItem succeeds

B. one inbound -> COMMUNICATE
   CommunicationCommit exists
   Expression runs
   exactly one outbound MessageFact exists

C. stop before communication commit
   stale Reaction cannot commit

D. stop after CommunicationCommit
   committed communication can still finish outbound

E. prepare inbound at old authority revision -> stop/start -> commit
   rejected as stale

F. a second accepted MessageFact supersedes only pre-commit Reaction work

G. bounded ContextProjection excludes already-consumed earlier inbound facts

H. the three crash/re-entry boundaries in §4
```

Keep qualification claims exact. If a crash scenario is not actually executed,
record `NOT_RUN`; do not keep a historical blanket PASS statement.

## 8. Non-goals

Do not implement:

```text
general world ActionPlan or Decision framework
OpenClaw Subject runtime
System Assistant / Machine Operations
AI tools/function calling as the permanent P1 protocol
Persona / Memory / Relationship / Attention
advanced Observation Window/debounce
external IM Driver
MCP
proactive messaging
generic scheduler
context-history framework
```

## 9. Completion

P1 is complete when the current executable L4 path proves optional
communication + durable CommunicationCommit + independent Expression with the
specified stop/re-entry semantics, old current-runtime Decision/SILENCE
machinery is deleted, focused verification is green, and current qualification
claims are truthful.

At completion, retain this authorized Plan under the repository's normal completed Product Plan location and update the Plan index/Roadmap current
state. Then STOP. Do not begin configuration work under P1.

## Completion record — 2026-09-04

P1 completed against repository baseline `ddb42f09c83149c024b8165a122c59d1724a5066`.
The current Subject conversation slice now uses
`ConversationReactionProposal` with `NO_COMMUNICATION` or
`COMMUNICATE(semanticContent)`, direct `CommunicationCommit` Authority,
independent `subject.expression`, bounded mailbox projection, and local
idempotent outbound `MessageFact` materialization. The current
conversation-specific `DecisionCommit` type, table, identity, states, and
runtime branches were removed by direct PRE_PRODUCTION rewrite.

The real Windows Product Host integration passed with built Product Host,
real private PostgreSQL 18.6, DBOS, WorkQueue/Signal, Management session,
Subject Chat HTTP, the real AIRuntime/NetworkAccess/AI SDK path, and a
loopback OpenAI-compatible fixture:

```text
pnpm nx run product-host-integration:test --skip-nx-cache
PASS — 2 test files, 11 tests
```

The required focused builds, tests, lints, formatting check, and
`git diff --check` also passed. Repository-level `pnpm check:static`,
`pnpm verify`, and `pnpm check:repo` also passed. Current qualification is
recorded in
[Q-SUBJECT-COMMUNICATION-SPINE-LOCAL-01](../../../qualification/results/Q-SUBJECT-COMMUNICATION-SPINE-LOCAL-01.md).
The executed local boundaries A, B, C, D, F, G, H1, and H2 are `PASS`.
E (the direct prepared-inbound transaction seam) and H3 (crash after outbound
commit before WorkItem completion) are `NOT_RUN`; cross-platform,
source-less, installed-service, and live-provider claims remain `NOT_RUN`.

P2 configuration catch-up, P3 Subject OpenClaw runtime, and P4 source-less
portable product reality were not activated by this Plan. No successor Plan
is active.
