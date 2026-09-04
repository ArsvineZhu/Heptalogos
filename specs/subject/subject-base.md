# Subject Base Contract

## Scope

This Spec owns the minimal persistent Subject identity, lifecycle, readiness,
and Subject authority revision required by the minimal Subject slice. It does not own
Persona, Memory, Relationship, Attention, Living State, Diary, Dream, or
advanced cognition.

## Ownership

Subject Core owns SubjectId continuity, Subject Desired/Actual state,
authorityRevision, hard minimal Subject-slice readiness interpretation, and lifecycle admission.
System Authority owns the management action that requests DesiredState.
Runtime supervision and reconciliation own process-local convergence and actual
runtime observation. Configuration, Secret, NetworkAccess, and AIRuntime own
their prerequisite semantics.

A Subject record is canonical Product state. A process-local Subject object,
model instance, conversation, Host process, login session, or OpenClaw runtime
is not Subject identity.

## Identity and normative type

The current Product model has one active logical Subject per logical
Installation. SubjectId survives Host restart, provider/model changes,
ModelBinding changes, Presentation disconnect, Reaction completion, and
Product process restart.

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

SubjectId is a stable semantic identity. It is not derived from a ModelProfile,
GatewayProfile, ModelBinding, SessionId, ReactionId, or Host generation.
Host startup does not create a new Subject because an in-process object is
absent.

DesiredState and authorityRevision are durable Subject Authority. ActualState
is a Subject-owned current projection derived from durable intent and current
runtime/dependency facts; it is not a second durable column. Host restart
recomputes ActualState without resetting DesiredState. Presentation cannot
infer or assign ActualState.

## Desired State

Exactly:

```text
STOPPED
RUNNING
```

subject.start mutates DesiredState to RUNNING through System Authority.
subject.stop mutates DesiredState to STOPPED through System Authority. The
request records the current Subject authority revision and required
Lineage/Evidence. Clients never assign arbitrary ActualState.

## Actual State

Exactly:

```text
STOPPED
STARTING
READY
ACTIVE
DEGRADED
BLOCKED
STOPPING
FAILED
```

The canonical meanings are:

| ActualState | Meaning                                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STOPPED     | DesiredState is STOPPED; new Subject cognition is not admitted and no current activation is active.                                                       |
| STARTING    | DesiredState is RUNNING; hard prerequisites are being resolved or activated and usable cognition readiness has not been reached.                          |
| READY       | DesiredState is RUNNING; all hard Subject-slice prerequisites are ready and no current Reaction is executing.                                             |
| ACTIVE      | DesiredState is RUNNING; hard prerequisites remain acceptable and at least one current Reaction is active.                                                |
| DEGRADED    | DesiredState is RUNNING; the current bounded conversation communication path remains usable while an optional or non-hard current capability is degraded. |
| BLOCKED     | DesiredState is RUNNING; a hard prerequisite is absent/unready and the Subject has not entered an intrinsic unrecoverable failure.                        |
| STOPPING    | DesiredState is STOPPED; new cognition admission is closed and current process-memory work is quiescing or cancelling. Durable truth remains.             |
| FAILED      | Subject-owned runtime/control logic itself cannot safely continue and the failure is not truthfully a dependency BLOCKED condition.                       |

Missing dependency is not automatically FAILED. A runtime control defect may be
FAILED even when dependencies are otherwise ready.

## Lifecycle and readiness

The normal reconciliation path is:

```text
DesiredState = STOPPED
→ STOPPED

DesiredState = RUNNING
→ STARTING
→ hard readiness evaluation
→ READY
→ ACTIVE while a Reaction is active
→ READY after current Reaction completion
```

Optional capability degradation may project READY or ACTIVE to DEGRADED while
the current reply/silence path remains usable. A missing hard prerequisite projects
the running desired state to BLOCKED. Setting DesiredState to STOPPED closes new
cognition admission and converges through:

```text
READY / ACTIVE / DEGRADED / BLOCKED
→ STOPPING
→ STOPPED
```

A Subject-owned unrecoverable control failure may converge to FAILED. Recovery
re-evaluates dependencies and owner control; it does not fabricate READY or
silently rewrite DesiredState.

Hard prerequisites for the minimal Subject slice are:

```text
current Host Authority
required Persistence, Work, and Lineage foundations
subject.primary usable
subject.expression usable
required provider Secret resolution
required provider NetworkAccess
usable AIRuntime route
```

The same ModelProfile may serve both binding roles. The current AIRuntime-based
Subject path remains a bounded implementation slice; a future Product-supervised
Subject OpenClaw Runtime is a separate integration and is not silently merged
with the independent Machine Operations OpenClaw role. OpenClaw, System
Assistant, GUI, external IM, MCP, and advanced cognition are not hard readiness
dependencies for this current Subject Base contract.

authorityRevision is monotonic. DesiredState changes and other later-authorized
Subject governance mutations increment it. Incoming messages advance
ConversationMailbox revision instead and do not need to increment
authorityRevision. Reaction review binds the observed authorityRevision.

## Admission and Management projection

Built-in Subject Chat cognition admission is allowed only in:

```text
READY
ACTIVE
DEGRADED
```

It is rejected in STOPPED, STARTING, BLOCKED, STOPPING, and FAILED. Messaging
and Reaction own the exact MessageFact and WorkItem result.

Management projects SubjectId, DesiredState, ActualState, authorityRevision,
readiness reasons, and lifecycle impact. A projection cannot assign ActualState
or claim READY from SDK object existence.

## Transactions and failure semantics

DesiredState mutation is one Host-fenced canonical transaction owned by Subject
Core through System Authority, including the expected authorityRevision and
required Lineage/Evidence. Runtime reconciliation and process/resource changes
occur after commit. ActualState changes are owner observations/reconciliation,
not client writes.

If a hard provider, Secret, NetworkAccess, Persistence, Work, Lineage, or
binding prerequisite is missing, the state is BLOCKED and the canonical
Problem identifies the dependency. A Subject-owned control failure is FAILED.
Host fence loss prevents stale lifecycle mutation. A Host restart preserves
SubjectId and desired intent; it does not silently reset DesiredState.

The canonical Problem projection distinguishes at least:

```text
subject.not_accepting_chat
subject.blocked
subject.not_ready
subject.invalid_desired_state
subject.stale_authority_revision
subject.lifecycle_control_failed
subject.host_fence_lost
```

## Invariants

- SUBJ-001 SubjectId is persistent identity, not model, provider, session, process, or Host identity.
- SUBJ-002 Desired and Actual state are distinct canonical facts.
- SUBJ-003 Missing hard readiness while DesiredState is RUNNING yields BLOCKED, not fabricated READY or automatic FAILED.
- SUBJ-004 Login or unlock does not imply Subject RUNNING.
- SUBJ-005 Host restart does not silently rewrite DesiredState.
- SUBJ-006 Start and stop mutate DesiredState through System Authority; ActualState reconciles.
- SUBJ-007 Readiness derives from explicit prerequisites, not SDK object existence.
- SUBJ-008 authorityRevision fences pre-commit decisions and later Subject governance.
- SUBJ-009 OpenClaw/System Assistant availability is not Subject readiness.
- SUBJ-010 Advanced cognition is not a minimal Subject-slice prerequisite.
- SUBJ-011 STOPPED, STARTING, BLOCKED, STOPPING, and FAILED reject new built-in Subject Chat cognition admission.
- SUBJ-012 READY, ACTIVE, and DEGRADED are canonical states, not local UI inference.

## Current-slice exclusions

This Spec does not define:

```text
multiple logical Subjects or tenants
Persona
Memory
Relationship
Attention
Living State
Diary or Dream
advanced Observation Window
external IM admission
MCP
OpenClaw dependency
GUI lifecycle
Subject-owned model/provider implementation
physical SQL schema or migrations
```

## References

- [Subject architecture](../../docs/architecture/subject.md)
- [Authority and core concepts](../../docs/architecture/authority-and-core-concepts.md)
- [System Authority Spec](../management/system-authority.md)
- [AI Runtime Spec](../system/ai-runtime.md)
- [Messaging and Subject Chat](../messaging/messaging-subject-chat.md)
- [Reaction and Behavior Authority](./reaction-behavior.md)
- [Service, Capability, and Readiness](../core/service-capability-readiness.md)
- [Host Ownership](../runtime/host-ownership.md)
- [Persistence Transactions](../data/persistence-transactions.md)
- [Execution Lineage](../execution/execution-lineage.md)
