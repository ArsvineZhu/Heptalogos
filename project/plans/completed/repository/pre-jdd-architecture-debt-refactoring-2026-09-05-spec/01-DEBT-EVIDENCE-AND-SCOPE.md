# 01 — Debt Evidence and Scope

## 1. Evidence standard

This audit does not classify code by style preference. Each mandatory target has
observed current evidence.

## 2. Portable packaging — mandatory REWRITE

Current assembler behavior includes:

```text
preserve all workspace manifests
→ pnpm deploy --legacy + hoisted node linker
→ rewrite workspace: dependency specs
→ repair source workspace with pnpm install
→ remove self-links / pnpm metadata
→ continue artifact assembly
```

This caused repeated TEMP layouts and one-off probes during real Product
qualification.

Observed maintenance pressure:

- build operation mutates the source workspace;
- correctness depends on a later repair step;
- package-manager-owned workspace semantics are reimplemented locally;
- output cleanup depends on pnpm internal layout details;
- failure halfway through can leave developer state damaged.

This satisfies Provider Bypass + Failure Amplification + Debug Amplification.

## 3. Subject OpenClaw — mandatory REFACTOR

One adapter currently owns:

- Heptalogos configuration projection;
- Secret resolution;
- provider config serialization;
- state/workspace paths;
- port allocation;
- direct child-process spawn/stop;
- Gateway handshake;
- tool catalog validation;
- run/event correlation;
- abort/wait;
- runtime replacement;
- automatic retry/backoff recovery;
- readiness and diagnostics.

Necessary Gateway protocol complexity is real. The ownership aggregation is not.

Additional evidence:

- repository routing already says Execa owns process mechanics;
- other real process owners already use Execa;
- child stop logic duplicates mature process behavior;
- autonomous three-attempt recovery is not a Subject semantic contract;
- secrets currently enter plaintext config/argv surfaces that upstream can avoid.

## 4. Management — mandatory ABSTRACT + REFACTOR

The same `actionId` distinction is independently interpreted by multiple
functions for:

```text
normalization
preconditions
semantic owners
impact
runtime reconciliation
dispatch
postcondition verification
```

A single new action therefore requires synchronized edits across many places.
This is direct Change Amplification.

The package also keeps `productOwners` / execution dependencies optional solely
for legacy unit fixtures. That is Test-Created Architecture.

The refactor is therefore justified even if total LOC does not decrease.

## 5. Subject — mandatory REFACTOR

The Subject semantic owner currently combines:

```text
SQL row shape and decoding
Subject authority lifecycle
Subject status/readiness
inbound admission
ConversationMailbox / Reaction persistence
ContextProjection
OpenClaw proposal handling
deterministic Review
CommunicationCommit
Expression invocation
outbound materialization
crash/re-entry
WorkQueue handler/failure classification
```

A provider-provenance change, SQL schema change, Reaction change, or Expression
change all force work in the same implementation unit.

This is Ownership Ambiguity + Context Amplification.

## 6. AIRuntime — mandatory REFACTOR

Current service combines:

- Gateway/Model/Binding persistence;
- route validation;
- readiness;
- commit admissibility;
- Secret/Network resolution;
- AI SDK Chat/Responses provider construction;
- timeout/abort;
- structured generation;
- usage/evidence projection.

AI SDK provider upgrades and routing-authority changes are different reasons to
change. They require a clean internal seam.

## 7. Messaging — bounded REFACTOR

Messaging is smaller but repeats the pre-JDD pattern:

- row types and SQL;
- cursor encoding;
- canonical semantics;
- Subject inbound consumer coordination.

External IM Driver work is a likely next Product horizon. Extracting persistence
now reduces expected expansion pressure and keeps Driver work from growing a
second SQL/transport coupling.

No new Messaging abstraction layer is authorized beyond repository/cursor
separation.

## 8. ProductHost integration verification — mandatory REFACTOR

The current integration file covers unrelated executable scenarios:

- first administrator claim/login/session;
- read-model projections;
- stale endpoint replacement;
- Host credential/ACL failure;
- HTTP Problem semantics/rate limiting;
- Configuration/AI Management actions;
- Subject Chat;
- OpenClaw child lifecycle;
- Subject stop/start;
- crash before proposal;
- crash after CommunicationCommit;
- outbound-before-WorkItem completion;
- Expression configuration consumer proof.

The existing `support/` directory already provides shared fixtures. Splitting
tests therefore needs no new test framework.

## 9. Explicit KEEP evidence

### RuntimeKernel

Although `supervisor.ts` is large, the package already separates:

- service/capability/work-handler registries;
- runtime graph and reconciler;
- readiness;
- generation fence;
- lifecycle lineage;
- model/contracts.

Supervisor owns current runtime state and execution of a reconciliation plan.
No mandatory restructuring is justified by current evidence.

### WorkQueue

Already split by actual mechanics:

- admission;
- attempt executor;
- identity;
- repository;
- reconciler;
- runtime composition;
- service.

Use this as the internal structural reference.

### PrivatePostgres

Controller already delegates:

- process adapter;
- cluster layout;
- cluster inspection;
- lifecycle state machine;
- lifecycle process operations;
- runtime profile;
- credentials.

Do not churn it.

### Persistence / Configuration

Current responsibilities are bounded and the recent Configuration work has a
real consumer-backed multi-definition implementation. Keep.

## 10. Audit expansion rule during execution

The Coding Agent may discover another pre-JDD hotspot. It may include it in this
Plan only when all are true:

1. the file/package is touched by this Plan or blocks one of its acceptance
   conditions;
2. concrete current evidence shows the same categories of maintenance pressure;
3. the fix is local and decision-complete under existing Architecture;
4. it does not open a new product feature or generic framework role.

Otherwise record the observation in the final completion note and leave it for
future Rolling Wave planning.

This prevents “pre-JDD audit” from becoming repository-wide aesthetic churn.
