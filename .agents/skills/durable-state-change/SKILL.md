---
name: durable-state-change
description: Use when changing a canonical schema, durable identity, persistent field or state, transaction boundary, journal, or cross-process/cross-generation payload.
---

# Durable State Change

## Admission rule

New durable state is admitted only when the product currently distinguishes a
new semantic fact that must survive the relevant durability boundary. Storage
convenience, a framework status, a test setup, or a future consumer is not a
semantic distinction.

For every proposed field, status, revision, journal entry, identity, or payload
change, answer these questions before editing:

1. What new fact does it mean?
2. Which current consumer or invariant requires that fact?
3. Why can an existing state or field not represent it?
4. Who owns the canonical meaning and mutation?
5. What transaction and Host-fence boundary protects it?
6. Does it cross a process, generation, restart, or provider boundary?
7. What version and declared compatibility obligation apply?
8. What is the recovery and deletion/reset behavior?
9. What exact verification claim will prove it?
10. Which active plan authorizes the semantic change?

If a question has no current answer, use `PLAN_GAP` or reject the new state
through [`scope-control`](../scope-control/SKILL.md). Do not invent a status to
make an implementation step visible.

## State categories

| Category                      | Meaning                                                       | Common mistake to prevent                        |
| ----------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Canonical product state       | Durable business/operation fact owned by a Heptalogos service | Treating a projection or engine row as Authority |
| Derived projection            | Recomputable view or index of canonical truth                 | Adding a second mutation owner                   |
| Engine-private state          | DBOS/provider workflow, queue, checkpoint, or vendor record   | Exposing provider state as product API           |
| Process-local transient state | Handle, task, listener, cache, or in-memory progress          | Calling it restart durable                       |
| Diagnostic/evidence record    | Causal/provenance observation with its own retention rules    | Treating telemetry or a log as canonical outcome |

The category is part of the contract. Moving a value between categories is a
semantic boundary change and requires the corresponding owner, Spec, and plan.

## Transaction and fencing checks

Inspect the owning repository and transaction boundary. Normal canonical
mutation must use the existing Host fence/token, required lineage/evidence
rules, and the owning commit boundary. Keep model inference, network I/O,
approval, long media work, and durable sleep outside a mutation transaction when
the current contract requires snapshot/revision then validate-and-commit.

Keep product state distinct from provider state even when they share a database.
Cross-process payloads must carry the version and identity needed to reject a
stale, unsupported, or unsafe reader; framework serialization is not a product
contract.

## PRE_PRODUCTION and deletion

Inspect declared compatibility obligations. With
`CompatibilityEpoch = PRE_PRODUCTION`, rewrite the current canonical shape,
update callers and tests, rewrite the development baseline, reset project-owned
state when required, and delete obsolete readers, writers, aliases, bridge
migrations, and fallback parsers. Load
[`preproduction-evolution`](../preproduction-evolution/SKILL.md) for the ordered
replacement procedure.

## Verification

Choose a claim-matched test: current schema/vector/property checks for local
contracts; real PostgreSQL for transaction/constraint behavior; process or
cross-process proof for restart significance. A mock or in-memory result does
not prove durable persistence. Record exactly `PASS`, `FAIL`, `NOT_RUN`, or
`BLOCKED` with the exercised boundary.

## Output record

```text
New semantic fact:
Current consumer/invariant:
Existing representation and why insufficient:
State category:
Canonical owner and mutation Authority:
Transaction/fence boundary:
Restart/cross-process impact:
Version and compatibility obligation:
Reset/deletion action:
Verification claim and state:
Plan authorization:
```

Read the [Contract Versioning Spec](../../../docs/specs/core/contract-versioning.md)
and [Persistence Transactions Spec](../../../docs/specs/data/persistence-transactions.md).
