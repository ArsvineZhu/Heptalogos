# Reaction and Communication Authority Contract

## Scope

This Spec owns the minimal Subject conversation cognition and communication
commit spine:

```text
ConversationMailbox
Reaction
ContextProjection
ConversationReactionProposal
deterministic Review
CommunicationCommit
expression
no-communication
mailbox supersession
exactly-once local outbound materialization
```

It does not define the total Subject behavior space, Persona, Memory,
Relationship, Attention, Living State, advanced Observation Window, proactive
behavior, tools, MCP, external Messaging, or a second scheduler.

The current branch still contains the pre-P1 `BehaviorIntent`,
conversation-specific `DecisionCommit`, and `REPLY/SILENCE` implementation.
Those are explicitly implementation lag; they are not the current conceptual
Subject ontology and are not to be extended as a generic decision framework.

## Ownership and current flow

Reaction and Behavior Authority owns the semantic cognition episode and
committed behavior records. MessagingService owns MessageFact. Subject Core
owns Subject identity, state, and authorityRevision. AIRuntime owns model
invocation and provider provenance. WorkItem/DBOS own durable processing
mechanics and obligation projection. Persistence owns Host-fenced transactions;
Lineage and Evidence own causal proof.

The corrected current-slice target for P1 is:

```text
accepted MessageFact
→ ConversationMailbox revision
→ Reaction acquisition
→ ContextProjection
→ AIRuntime invocation: subject.primary
→ ConversationReactionProposal
   ├─ NO_COMMUNICATION → successful terminal Reaction
   └─ COMMUNICATE(semantic content)
        → deterministic Review
        → CommunicationCommit
        → AIRuntime invocation: subject.expression
        → structural acceptance
        → canonical outbound MessageFact
        → terminal Reaction
```

`NO_COMMUNICATION` creates no CommunicationCommit or outbound MessageFact. It
is a legitimate local completion result, not a global durable Silence entity.
No AI tool call occurs in the current AIRuntime target; OpenClaw proposal tools
belong to the later P3 integration.

## ConversationMailbox

```ts
interface ConversationMailbox {
  readonly schemaVersion: 1;
  readonly conversationId: CanonicalConversationId;
  readonly mailboxRevision: number;
  readonly consumedThroughSequence: number;
  readonly openReactionId?: ReactionId;
}
```

Every accepted relevant inbound MessageFact advances mailboxRevision. An
openReactionId is acquired with canonical compare-and-set semantics so
concurrent WorkItems cannot create multiple current Reactions for one mailbox
revision. Pending inbound facts are queried from Messaging by canonical sequence
after consumedThroughSequence; they are not copied into the mailbox. Mailbox
organizes MessageFact references and supersession but does not copy or re-own
MessageFact truth.

Do not add attention scores, debounce deadlines, typing state, patience,
Observation Window scheduling, or a timer merely to implement supersession.

## Reaction

```ts
interface Reaction {
  readonly schemaVersion: 1;
  readonly reactionId: ReactionId;
  readonly conversationId: CanonicalConversationId;
  readonly observedMailboxRevision: number;
  readonly observedThroughSequence: number;
  readonly observedSubjectAuthorityRevision: number;
  readonly state:
    | "OPEN"
    | "SUPERSEDED"
    | "NO_COMMUNICATION"
    | "COMMUNICATION_COMMITTED"
    | "REPLIED"
    | "FAILED";
  readonly ownerWorkItemRef: WorkItemRef;
  readonly ownerActivityRef: ActivityRef;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
}
```

Reaction is semantic cognition state, not DBOS workflow state. The normal
state meaning is:

```text
OPEN
→ primary proposal and review remain outstanding

OPEN → SUPERSEDED
→ mailbox or another current fence invalidates pre-commit work

OPEN → NO_COMMUNICATION
→ the considered communication opportunity completed without communication

OPEN → COMMUNICATION_COMMITTED
→ one CommunicationCommit exists; Expression/outbound may remain

COMMUNICATION_COMMITTED → REPLIED
→ the committed communication produced the one outbound MessageFact

OPEN → FAILED
→ owner cannot safely continue and the failure is not a dependency BLOCKED result
```

A retry reconciles from the existing canonical Reaction/CommunicationCommit/
outbound facts and does not re-run a completed communication decision. Failure
classification uses existing Foundation WorkItem and Problem semantics.

## ContextProjection

The current ContextProjection includes only:

```text
current selected/pending conversation MessageFacts
Subject identity and current state
current Product/governance constraints needed by behavior
current model/capability facts required for invocation
```

It is invocation input, not long-lived Subject state. It does not include
Persona, Memory, Relationship, Attention, or other advanced cognition state.

## ConversationReactionProposal

The current bounded conversation proposal has exactly two classes:

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

`semanticContent` is material to convey, not final chat wording. The target
conversation is fixed by the Reaction; the proposal does not select or echo a
recipient. The current purpose is deterministically a conversation response,
not a model-selected action. `NO_COMMUNICATION` has no mandatory free-text
explanation.

For the current Subject slice, semantic content uses this versioned JSON Schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "heptalogos://schema/conversation-semantic-content/1",
  "type": "object",
  "required": ["schemaVersion", "content"],
  "properties": {
    "schemaVersion": { "const": 1 },
    "content": { "type": "string", "minLength": 1 }
  },
  "additionalProperties": false
}
```

This is a semantic payload to express, not a final MessageFact and not a
SystemAction. It contains no tool, system mutation, external effect, Memory,
Relationship, or proactive-message fields.

## Deterministic Review

Review is Product code, not another model. Before either accepted result commits,
it verifies:

```text
ConversationReactionProposal schema and domain validity
Reaction still OPEN
Subject state still permits commit
Subject authorityRevision unchanged
mailboxRevision unchanged
Reaction still owns the open-reaction fence
primary invocation provenance remains admissible
current Product constraints permit the outcome
```

If mailboxRevision changed, the Reaction is atomically marked SUPERSEDED. It
does not create CommunicationCommit or outbound MessageFact.
The newer accepted MessageFact already owns a WorkItem; no timer or debounce
subsystem is added.

For `COMMUNICATE`, the same Host-fenced transaction writes:

```text
CommunicationCommit
+ Reaction → COMMUNICATION_COMMITTED
+ required Lineage/Evidence
```

For `NO_COMMUNICATION`, the same transaction writes:

```text
Reaction → NO_COMMUNICATION
+ mailbox consumed cursor/fence release
+ required Lineage/Evidence
```

There is no intermediate durable DecisionCommit state in the corrected slice.

The transaction revalidates the Subject authority revision, mailbox revision,
open-Reaction fence, and provider provenance at the point of commit. A
post-commit Subject stop does not erase a CommunicationCommit; Expression and
local outbound materialization may finish without re-decision.

Re-entry is reconciliation-style and follows canonical state in this order:

```text
outbound MessageFact exists → finalize without expression
Reaction is NO_COMMUNICATION → complete without model invocation
CommunicationCommit exists and outbound does not → expression/materialization only
Reaction is SUPERSEDED → complete superseded outcome
Reaction is OPEN → primary proposal, Review, and accepted result
```

The current implementation still has the old DecisionCommit re-entry path;
that is P1 implementation lag and is not a reason to preserve the old contract.

## CommunicationCommit

For `COMMUNICATE`, deterministic Review creates exactly one immutable
CommunicationCommit directly:

```text
CommunicationCommitId
ReactionId
SubjectId
subjectAuthorityRevision
mailboxRevision
conversationId
purpose = reply
semanticContent = { schemaVersion: 1, content: string }
semanticContentDigest
accepted primary invocation provenance
committedAt
Lineage/Evidence
```

CommunicationCommit authorizes the communication obligation but does not claim
that a MessageFact already exists. A crash after this commit resumes expression
and outbound materialization without re-deciding.

## Expression

Expression uses the current subject.expression ModelBinding. Its input is the
committed CommunicationCommit semantic payload plus only allowed language or
presentation context.

Expression may vary wording, register, politeness, interpersonal tone, brevity,
organization, punctuation, or emoji/platform style. It cannot change:

```text
whether communication occurs
target conversation
recipient
material facts or commitments
purpose in a materially different sense
SystemAction
consequential external action
permission/authority
```

Structural acceptance requires:

```text
valid output schema
non-empty text for COMMUNICATE
no extra authority-bearing action or tool fields
current binding and generation remain admissible
```

Deterministic structural validation does not prove full natural-language
semantic equivalence. The current risk is bounded by the committed semantic
payload, narrow expression input, text-only output, and no authority-bearing
expression fields.

## Outbound materialization

The local outbound obligation is:

```text
CommunicationCommit
→ idempotently materialize exactly one outbound MessageFact
```

The MessageFact references CommunicationCommit. If a crash occurs after the
MessageFact commits but before WorkItem completion, retry finds that fact,
does not invoke expression to create another reply, and completes the
obligation.

## Failure, recovery, and supersession

If subject.primary fails before an accepted terminal proposal:

```text
no CommunicationCommit
no outbound MessageFact
```

Use existing Foundation retry classification only when legitimately retryable.
There is no fake fallback response or provider fleet.

If expression fails after CommunicationCommit:

```text
CommunicationCommit survives
no fake outbound MessageFact
retry resumes expression
the accepted communication decision is not replaced
```

A new accepted inbound advances mailboxRevision. A pre-commit Reaction holding
an old revision becomes SUPERSEDED and cannot commit. This strict current-slice rule does
not add a scheduler or Advanced Observation Window.

The canonical Problem projection distinguishes at least:

```text
reaction.invalid_proposal
reaction.superseded
reaction.stale_subject_authority
reaction.stale_mailbox
reaction.subject_not_ready
reaction.model_unavailable
reaction.output_schema_invalid
reaction.expression_failed
reaction.commit_conflict
```

## Invariants

- REACT-001 Mailbox organizes MessageFact references; it does not re-own Messaging truth.
- REACT-002 One current open Reaction owns a mailbox revision at a time.
- REACT-003 Reaction state is semantic cognition state, not DBOS workflow state.
- REACT-004 Primary model output is a ConversationReactionProposal only.
- REACT-005 Deterministic Review fences Subject authorityRevision and mailboxRevision.
- REACT-006 A stale or superseded Reaction cannot create CommunicationCommit.
- REACT-007 NO_COMMUNICATION is a successful local terminal outcome and creates no outbound MessageFact.
- REACT-008 A CommunicationCommit is immutable accepted communication Authority.
- REACT-009 Re-entry after CommunicationCommit never re-runs primary cognition.
- REACT-010 COMMUNICATE leads to exactly one current CommunicationCommit.
- REACT-011 Expression cannot alter communication choice, target, or authorize System/external action.
- REACT-012 Expression failure does not erase or replace CommunicationCommit.
- REACT-013 Accepted expression materializes exactly one outbound MessageFact.
- REACT-014 Crash after outbound commit does not produce a second reply.
- REACT-015 Primary failure before accepted proposal produces no fake canonical behavior.
- REACT-016 The current Subject slice has no tools, MCP, Persona, Memory, Relationship, Attention, or proactive behavior.
- REACT-017 New-message supersession uses mailbox revision; no new scheduler.
- REACT-018 Local Subject Chat outbound creates no EffectOperation.
- REACT-019 Later external effects remain fenced by existing EffectOperation.
- REACT-020 Committed model/provider provenance remains attributable through Lineage/Evidence.

## Persistence and current-slice exclusions

Model I/O and expression I/O occur outside canonical PostgreSQL mutation
transactions. Review and accepted-result commit use a Host-fenced
compare-and-set transaction with required Lineage/Evidence. For COMMUNICATE,
CommunicationCommit is the canonical accepted communication record; for
NO_COMMUNICATION, Reaction is finalized without one. MessageFact
materialization is idempotent at the Messaging owner boundary. Physical SQL
schema and migrations are not defined here.

This Spec does not define:

```text
Persona, Memory, Relationship, Attention, or advanced cognition
Advanced Observation Window
reviewer agent
AI tools or MCP
SystemAction or external-action intent classes
proactive messaging
external Messaging Driver implementation
provider failover
generic scheduler or debounce subsystem
```

## References

- [Subject Base Spec](./subject-base.md)
- [Messaging and Subject Chat](../messaging/messaging-subject-chat.md)
- [AI Runtime Spec](../system/ai-runtime.md)
- [System Authority Spec](../management/system-authority.md)
- [Reaction architecture](../../docs/architecture/subject.md)
- [Messaging architecture](../../docs/architecture/messaging.md)
- [Work Item](../execution/work-item.md)
- [Effect Operation](../execution/effect-operation.md)
- [Persistence Transactions](../data/persistence-transactions.md)
- [Execution Lineage](../execution/execution-lineage.md)
- [Evidence](../execution/evidence.md)
- [Contract Versioning](../core/contract-versioning.md)
