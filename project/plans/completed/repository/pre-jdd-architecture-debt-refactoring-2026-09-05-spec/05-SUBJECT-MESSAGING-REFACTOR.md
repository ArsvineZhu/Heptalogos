# 05 — Subject and Messaging Refactor

## Part A — Subject

### 1. Preserve semantic contract

Do not change:

```text
SubjectId continuity
Subject desired-state Authority revision
Prepared inbound authority fence
ConversationMailbox revision
Reaction
NO_COMMUNICATION
COMMUNICATE
CommunicationCommit
Expression separation
MessageFact causation
WorkItem/re-entry semantics
```

No generic world ActionPlan is introduced in this Plan.

### 2. Target internal ownership

Use internal modules equivalent to:

```text
src/
  contracts.ts
  repository.ts
  authority.ts
  reaction-executor.ts
  communication-executor.ts
  service.ts
  problems.ts
  index.ts
```

Exact names may vary, but the boundaries below may not.

### 3. `repository.ts`

Own only persistence mechanics:

- row interfaces/codecs;
- SQL column sets;
- reads/writes for SubjectAuthority;
- mailbox reads/updates;
- Reaction reads/writes;
- CommunicationCommit reads/writes;
- outbound-existence query needed for re-entry;
- ContextProjection canonical message reads if they are Subject-owned query
  mechanics.

Repository functions accept current Persistence transaction contexts. They do
not call OpenClaw/AIRuntime, decide proposals, or own WorkQueue scheduling.

Do not introduce:

```text
BaseRepository
GenericSqlRepository<T>
RepositoryRegistry
```

### 4. `authority.ts`

Own:

- ensure current Subject;
- read authority/status;
- start/stop desired state;
- authorityRevision fence;
- preparation admission facts;
- commitAcceptedInbound authority validation.

It may coordinate repository + WorkQueue prepare/commit through the current
atomic transaction seam.

It does not execute cognition.

### 5. `reaction-executor.ts`

Own one bounded cognition episode:

```text
acquire/restore Reaction
→ bounded ContextProjection
→ SubjectCognitionRuntime
→ deterministic proposal Review
→ NO_COMMUNICATION terminal
   OR
   CommunicationCommit
```

It owns stale authority/mailbox/provenance rejection and the current Reaction
state transitions.

It does not render final human wording.

### 6. `communication-executor.ts`

Own:

```text
existing CommunicationCommit
→ read Expression config
→ AIRuntime Expression
→ outbound MessageFact materialization
→ Reaction REPLIED
```

Re-entry rules remain:

- existing outbound fact => converge Reaction/WorkItem without duplicate send;
- CommunicationCommit without outbound => Expression resumes without primary
  cognition;
- NO_COMMUNICATION => no model rerun;
- stale primary proposal cannot commit.

### 7. `service.ts`

Becomes the Subject package facade/composition:

- wires the above internal owners;
- exposes `SubjectService`;
- exposes current Reaction WorkHandler definition/error classification.

It must not re-accumulate SQL codecs and the full cognition implementation.

### 8. Cognition config/provenance cleanup

Apply Decisions D09/D10:

- delete configurable `profile`;
- keep fixed `subject` runtime profile internally;
- `openclawVersion` is runtime evidence string, not patch literal type.

No old configuration upcaster.

### 9. Subject tests

Split package-level tests by owner if current test shape benefits, but do not
force a file-count target.

Focused proof must cover:

- stale prepared authority revision;
- ContextProjection only over pending bounded range;
- NO_COMMUNICATION terminal;
- COMMUNICATE → one commit;
- stale proposal rejection;
- CommunicationCommit → Expression;
- outbound idempotent re-entry;
- crash/restart seams already owned by ProductHost integration.

## Part B — Messaging

### 10. Why Messaging is included

External IM Drivers are a near-term Product pressure point. Current Messaging
still embeds SQL row/codecs and cursor mechanics in the semantic service.

### 11. Target

```text
src/
  contracts.ts
  repository.ts
  cursor.ts
  service.ts
  problems.ts
  index.ts
```

### 12. Repository owner

Move row/SQL persistence mechanics for:

- platforms/accounts/conversations;
- MessageFact reads/writes;
- platform-native identity dedupe;
- list/query primitives needed by current service.

Service remains responsible for canonical Messaging semantics and transaction
coordination with `MessagingInboundConsumer`.

### 13. Cursor owner

Move opaque cursor codec/bounds to `cursor.ts`.

Cursor remains an implementation detail unless already part of the public
wire contract. Do not create a general pagination framework.

### 14. Messaging acceptance

- public package exports/wire semantics unchanged;
- MessageFact canonical-before-async behavior unchanged;
- dedupe behavior unchanged;
- Subject inbound prepare+commit remains atomic with accepted MessageFact where
  current contract requires;
- service does not contain SQL row codecs after extraction.
