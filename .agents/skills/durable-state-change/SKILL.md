---
name: durable-state-change
description: Use when an already-authorized change alters canonical schema, durable identity, persistent state, transaction boundaries, journals, or cross-process/cross-generation payloads.
---

# Durable State Change

Use this procedure only when the active Plan has already decided the semantic
change. It checks implementation facts; it does not admit new product state or
choose an owner.

## Inspect

Identify:

- the new semantic fact and its canonical owner;
- the existing representation and why it cannot express the fact;
- the Host/transaction fence and mutation boundary;
- process, generation, restart, provider, and deletion/reset implications;
- the explicit version and declared compatibility obligation;
- the Plan-specified proof boundary.

If the semantic distinction, owner, compatibility behavior, or required proof is
not decided by the Plan and current Specs, report PLAN_GAP.

## Implement

Keep product state distinct from provider or engine state. Establish required
lineage/evidence through the owning commit boundary. Keep external I/O,
inference, approval, long media work, and durable sleep outside a mutation
transaction when the current contract requires snapshot/revision then
validate-and-commit.

In PRE_PRODUCTION, rewrite the canonical current shape, update current callers,
fixtures, readers, writers, and tests, reset project-owned state when required,
and remove obsolete internal aliases, bridge migrations, fallback readers, and
writers. An approved low-cost future-facing semantic seam is not obsolete just
because it has no current consumer.

## Verify

Use the weakest boundary that proves the claim: pure contract tests for local
shape, real PostgreSQL for transaction/constraint behavior, or process/
cross-process proof for restart semantics. A mock or in-memory result does not
prove durable persistence. Record only PASS, FAIL, NOT_RUN, or BLOCKED for the
boundary actually exercised.

Read the Contract Versioning Spec at
../../../specs/core/contract-versioning.md and the Persistence Transactions
Spec at ../../../specs/data/persistence-transactions.md.
