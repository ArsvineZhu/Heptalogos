# Reaction and Behavior Authority Contract

## Scope

This Spec owns the minimal Subject cognition and behavior commit spine:

```text
ConversationMailbox
Reaction
ContextProjection
BehaviorIntent
deterministic Review
DecisionCommit
CommunicationCommit
expression
silence
mailbox supersession
exactly-once local outbound materialization
```

It does not define Persona, Memory, Relationship, Attention, Living State,
advanced Observation Window, proactive behavior, tools, MCP, external
Messaging, or a second scheduler.

## Ownership and current flow

Reaction and Behavior Authority owns the semantic cognition episode and
committed behavior records. MessagingService owns MessageFact. Subject Core
owns Subject identity, state, and authorityRevision. AIRuntime owns model
invocation and provider provenance. WorkItem/DBOS own durable processing
mechanics and obligation projection. Persistence owns Host-fenced transactions;
Lineage and Evidence own causal proof.

The current flow is:

```text
accepted MessageFact
→ ConversationMailbox revision
→ Reaction acquisition
→ ContextProjection
→ AIRuntime invocation: subject.primary
→ BehaviorIntent proposal
→ deterministic Review
→ DecisionCommit
        ├─ SILENCE → terminal Reaction
        └─ REPLY
             → CommunicationCommit
             → AIRuntime invocation: subject.expression
             → structural acceptance
             → canonical outbound MessageFact
             → terminal Reaction
```

No AI tool call occurs.

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
    "OPEN" | "SUPERSEDED" | "DECIDED" | "DELIBERATED_SILENT" | "REPLIED" | "FAILED";
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

OPEN → DECIDED
→ DecisionCommit exists; downstream reply work may remain

DECIDED → DELIBERATED_SILENT
→ committed SILENCE completed

DECIDED → REPLIED
→ committed REPLY produced the one outbound MessageFact

OPEN → FAILED
→ owner cannot safely continue and the failure is not a dependency BLOCKED result
```

A retry that discovers an existing DecisionCommit continues from it and does
not create another decision. Failure classification uses existing Foundation
WorkItem and Problem semantics.

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

## BehaviorIntent

There are exactly two current proposal classes:

```ts
type BehaviorIntent =
  | {
      readonly schemaVersion: 1;
      readonly kind: "REPLY";
      readonly conversationId: CanonicalConversationId;
      readonly purpose: string;
      readonly semanticContent: CanonicalJsonValue;
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "SILENCE";
      readonly reasonClass:
        "DELIBERATED_AND_SILENT" | "UNABLE_TO_RESPOND" | "SUPPRESSED_BY_POLICY";
    };
```

For the current Subject slice, semanticContent uses the versioned BehaviorSemanticContentV1 JSON
Schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "heptalogos://schema/behavior-semantic-content/1",
  "type": "object",
  "required": ["schemaVersion", "text"],
  "properties": {
    "schemaVersion": { "const": 1 },
    "text": { "type": "string", "minLength": 1 }
  },
  "additionalProperties": false
}
```

This is a semantic payload to express, not a final MessageFact and not a
SystemAction. It contains no tool, system mutation, external effect, Memory,
Relationship, or proactive-message fields.

## Deterministic Review

Review is Product code, not another model. Before DecisionCommit, it verifies:

```text
BehaviorIntent schema and domain validity
Reaction still OPEN
Subject state still permits commit
Subject authorityRevision unchanged
mailboxRevision unchanged
Reaction still owns the open-reaction fence
target conversation is current
AIRuntime binding/generation result remains admissible
current Product constraints permit the outcome
```

If mailboxRevision changed, the Reaction is atomically marked SUPERSEDED. It
does not create DecisionCommit, CommunicationCommit, or outbound MessageFact.
The newer accepted MessageFact already owns a WorkItem; no timer or debounce
subsystem is added.

The commit transaction must call the AIRuntime transaction-aware provenance
assertion inside the same Host-fenced transaction. It validates the exact
primary `modelBindingId`/revision, ModelProfile generation, GatewayProfile, and
active transport ConfigurationRevision recorded by GenerationResult. Expression
uses the same assertion before outbound MessageFact materialization.

Re-entry is reconciliation-style and follows canonical state in this order:

```text
outbound MessageFact exists → finalize without expression
DecisionCommit SILENCE exists → finalize silence
DecisionCommit REPLY + CommunicationCommit exists → expression/materialization only
DecisionCommit REPLY exists without CommunicationCommit → create/reuse CommunicationCommit
no DecisionCommit → primary, Review, and commit
```

An existing DecisionCommit never causes `subject.primary` to decide again.

## DecisionCommit

DecisionCommit is immutable canonical Subject behavior Authority:

```text
DecisionCommitId
ReactionId
SubjectId
subjectAuthorityRevision
mailboxRevision
decision kind = REPLY | SILENCE
accepted BehaviorIntent payload/digest
model invocation/proposal provenance
committedAt
Lineage/Evidence
```

The DecisionCommit transaction revalidates all review fences and commits the
decision, reaction state, and required causal records together. A crash or
retry that finds DecisionCommit continues downstream work and never invokes
subject.primary to decide again.

## Silence

The successful silence path is:

```text
BehaviorIntent(SILENCE)
→ DecisionCommit(kind=SILENCE)
→ Reaction DELIBERATED_SILENT
→ WorkItem completes
→ no CommunicationCommit
→ no outbound MessageFact
```

Silence is not an empty string, timeout, provider error, or missing result.

## CommunicationCommit

For REPLY, create exactly one immutable CommunicationCommit after
DecisionCommit:

```text
CommunicationCommitId
DecisionCommitId
conversationId
semantic content and purpose to express
reply target semantics
Subject authority revision/digest
createdAt
Lineage/Evidence
```

CommunicationCommit authorizes the communication obligation but does not claim
that a MessageFact already exists. A crash after this commit resumes expression
and outbound materialization without re-deciding.

## Expression

Expression uses the current subject.expression ModelBinding. Its input is the
committed CommunicationCommit semantic payload plus only allowed language or
presentation context.

Expression cannot change:

```text
REPLY versus SILENCE
target conversation
whether a SystemAction occurs
whether an external consequential action occurs
DecisionCommit identity
CommunicationCommit identity
```

Structural acceptance requires:

```text
valid output schema
non-empty text for REPLY
bound CommunicationCommit identity and revision
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

If subject.primary fails before DecisionCommit:

```text
no DecisionCommit
no CommunicationCommit
no outbound MessageFact
```

Use existing Foundation retry classification only when legitimately retryable.
There is no fake fallback response or provider fleet.

If expression fails after DecisionCommit and CommunicationCommit:

```text
DecisionCommit survives
CommunicationCommit survives
no fake outbound MessageFact
retry resumes expression
primary decision is not replaced
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
- REACT-004 Primary model output is a BehaviorIntent proposal only.
- REACT-005 Deterministic Review fences Subject authorityRevision and mailboxRevision.
- REACT-006 A stale or superseded Reaction cannot create DecisionCommit.
- REACT-007 DecisionCommit is immutable canonical behavior Authority.
- REACT-008 Existing DecisionCommit prevents re-decision after crash or retry.
- REACT-009 SILENCE is successful terminal outcome and creates no outbound MessageFact.
- REACT-010 REPLY DecisionCommit leads to exactly one current CommunicationCommit.
- REACT-011 Expression cannot alter reply/silence choice, target, or authorize System/external action.
- REACT-012 Expression failure does not erase or replace committed decision.
- REACT-013 Accepted expression materializes exactly one outbound MessageFact.
- REACT-014 Crash after outbound commit does not produce a second reply.
- REACT-015 Primary failure before DecisionCommit produces no fake canonical behavior.
- REACT-016 The current Subject slice has no tools, MCP, Persona, Memory, Relationship, Attention, or proactive behavior.
- REACT-017 New-message supersession uses mailbox revision; no new scheduler.
- REACT-018 Local Subject Chat outbound creates no EffectOperation.
- REACT-019 Later external effects remain fenced by existing EffectOperation.
- REACT-020 Committed model/provider provenance remains attributable through Lineage/Evidence.

## Persistence and current-slice exclusions

Model I/O and expression I/O occur outside canonical PostgreSQL mutation
transactions. Review and DecisionCommit use a Host-fenced compare-and-set
transaction with required Lineage/Evidence. CommunicationCommit is canonical
after DecisionCommit. MessageFact materialization is idempotent at the
Messaging owner boundary. Physical SQL schema and migrations are not defined
here.

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
