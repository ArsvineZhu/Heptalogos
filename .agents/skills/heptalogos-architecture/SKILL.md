---
name: heptalogos-architecture
description: Use when a Heptalogos change alters architecture boundaries, semantic ownership, authority, Service/Capability contracts, Foundation scope, cross-domain flows, or when implementation reality conflicts with or cannot be classified by the Architecture Corpus.
---

# Heptalogos Architecture

Use this skill as the architecture fallback. It is not a substitute for the domain skills.

## Authority route

Documentation root from this file: `../../../docs/`
Route index: `../../heptalogos/corpus-routes.json`

Read first:

- [Project / engineering constitution](../../../docs/governance/constitution.md)
- [Product and differentiation](../../../docs/product/product-goals.md)
- [Architecture principles / anti-NIH](../../../docs/governance/engineering-principles.md)
- [Core concepts and Authority](../../../docs/architecture/authority-and-core-concepts.md)
- [System architecture](../../../docs/architecture/system-architecture.md)
- [Terminology](../../../docs/reference/glossary.md)
- [Architecture review checklist](../../../docs/engineering/repository/architecture-review.md)
- [Stabilization and compatibility governance](../../../docs/governance/pre-production-evolution.md)
- [Mechanics Ownership and Library-First playbook](../../../docs/engineering/playbooks/mechanics-ownership-and-library-first.md)

Load conditional references from the route index only when the change crosses those concerns.

## Procedure

1. State the exact product semantic or authority being changed.
2. Identify the canonical state owner, mutation authority, and derived projections.
3. Classify the change as Foundation, advanced research hook, presentation, integration, or generic mechanics.
4. Trace the affected end-to-end flow and every cross-domain contract.
5. Check whether the current Corpus already expresses the scenario. Prefer composition of existing contracts over creating a new Foundation abstraction.
6. If generic mechanics are needed, use the Mechanics Ownership and Library-First playbook and `heptalogos-dependencies` before choosing or implementing them.
7. If the proposal changes architecture, update every affected normative projection in the same change; do not leave a local code-only architecture decision.
8. Define claim-matched verification with `heptalogos-verification` when the change alters failure, recovery, protocol, platform, or release behavior.
9. For stabilization closure, treat the current Ready PR as the review candidate; keep Git revision identity inside Git/GitHub/CI rather than copying it into project records.

## Stop conditions

Stop and surface the conflict instead of implementing when:

- the approved plan contradicts the Corpus;
- two normative Corpus documents assign different owners/authorities;
- a new abstraction would duplicate an existing Service/Capability/primitive;
- Foundation work would require choosing an advanced-cognition algorithm/backend not explicitly scoped;
- the task cannot be classified without changing architecture.
- the approved plan is not decision-complete for a non-trivial choice;
- current implementation preserves project-history compatibility without a declared obligation.

While `CompatibilityEpoch=PRE_PRODUCTION`, do not infer a compatibility
obligation from merged commits, retained developer databases, local fixtures,
or previous development builds. Keep one canonical V1 and reject/reset obsolete
development shapes; never add V2/V3, legacy readers, upcasters, bridge
migrations, aliases, shims, or dual formats solely for repository history.

For Hn-S work, route Corpus 26 directly and stop as `PLAN_GAP` when a required
architecture/scope/compatibility decision is absent from Corpus + the approved
plan. Do not create an allowlist or local exception to make the hygiene gate
pass.

## Completion

The design must preserve constitution invariants, use one canonical authority per fact, keep framework mechanics below Heptalogos contracts, and leave no contradictory Corpus projection behind.
