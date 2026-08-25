# Package Agent Contract

## Scope

Runtime graph, reconciliation, registries, generation fences, readiness,
supervision, quiescence, and lifecycle lineage.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S01, S06, S13, S15, and S16

## Local rules

- Keep Runtime semantics above the substrate mechanics.
- STARTING activation must observe supervisor/owner cancellation cooperatively.
- Quiescence exits ACTIVE before retiring STARTING work and aborting it.
- Preserve generation fences and bounded drain/dispose behavior.
- Do not add Bootstrap, Host, PostgreSQL, or later-stage durable-effect ownership.

## Verification

Run package unit tests, lifecycle/cancellation regressions, typecheck, and the
TS6 lane; run Host integration when a cross-boundary claim changes.

## Stop

Stop for a second Runtime owner, uncancelable unbounded activation, framework
leakage, or semantics absent from Corpus and the active plan.
