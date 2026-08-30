---
name: durable-state-change
description: Use when changing a canonical schema, durable identity, persistent state, durable lifecycle state, transaction boundary, or cross-process/cross-generation payload.
---

# Durable State Change

## Trigger

Load this Skill when a change can alter restart-visible product truth or a
persisted/cross-boundary contract.

## Required inputs

- semantic owner and current canonical shape;
- state distinction and restart significance;
- transaction and Host-fence boundary;
- version and compatibility obligation;
- recovery and qualification requirements.

## Procedure

1. Apply the semantic distinction test: `NEW STATE REQUIRES A NEW SEMANTIC
DISTINCTION.`
2. Identify the canonical owner and derived projections.
3. Check transaction, fence, lineage/evidence, and generation boundaries.
4. Keep durable payloads explicitly versioned and separate product state from
   engine-private state.
5. Inspect declared compatibility obligations. With `PRE_PRODUCTION`, rewrite
   the current canonical V1, update callers/tests, reset project state, and
   delete obsolete shapes.
6. Run focused current-schema, persistence, restart, or cross-process proof that
   matches the claim.

## Stop / escalation

Use `PLAN_GAP` for an unresolved Authority, new durable state without a product
distinction, or compatibility behavior without a declared obligation. Do not
add legacy readers, dual formats, bridge migrations, or aliases for development
history.

## Output

Record owner, canonical shape, state distinction, transaction/fence,
compatibility decision, restart impact, and verification status.

Read [contract versioning](../../../docs/specs/core/contract-versioning.md) and
[persistence transactions](../../../docs/specs/data/persistence-transactions.md).
