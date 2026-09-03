# AGENTS.md

Repository-wide execution contract for Heptalogos.

## Work authorization

- Execute only the explicitly designated active Plan.
- An active Plan authorizes bounded implementation; it is not permanent
  semantic Authority.
- A material unresolved product, owner, provider, state, failure, or
  verification decision is `PLAN_GAP`.
- A Skill performs an authorized recurring procedure. It cannot supply a
  decision omitted by the Plan or expand the Plan's scope.

## Rapid PRE_PRODUCTION

```text
DevelopmentMode = RAPID_EVOLUTION
CompatibilityEpoch = PRE_PRODUCTION
```

Existing code, tests, docs, gates, abstractions, and development history have
no preservation privilege. Direct rewrite, deletion, replacement, merging, or
splitting is allowed when it makes the approved current design simpler.

- No undeclared compatibility bridges, aliases, shims, fallback readers, or
  migration paths.
- Minimal diff is not a project objective, and dependency count is not a
  quality metric.
- Prefer a suitable mature dependency when it lowers total maintenance burden.
- TDD is optional, not a repository workflow.
- Do not run a Red test merely to prove that not-yet-written code is absent.
- Do not add speculative recovery, hardening, validators, matrices, or
  meta-frameworks.
- A one-time development event does not justify a permanent test or gate.
- History does not create Authority, and a deleted historical identity is not
  a permanent negative repository requirement.

## Normal Coding context

Read only the context needed for the authorized operation, in this order:

1. root and affected scoped `AGENTS.md`;
2. Project Charter;
3. designated active Plan;
4. the Plan's Required Context;
5. affected current Specs and package documentation;
6. current code, tests, and focused verification;
7. a retained Skill when its narrow executor procedure applies.

Completed and superseded Plans, qualification history, broad architecture
rationale, and engineering procedures are not default implementation context.
Read them only when the active Plan explicitly requires a historical or
procedural fact.

## Ownership and mechanics

Keep canonical semantic mutation behind its owner. For non-trivial mechanics,
inspect the semantic owner, existing repository primitive, adopted provider,
Standard/Node/OS facility, and mature library before writing custom code.
Keep framework and provider objects behind the owning adapter boundary.

Do not apply `no current consumer -> delete` as a universal rule. A broken
current executable spine takes priority over unrelated expansion. This does
not make an approved low-cost future-facing semantic seam disposable. Preserve
current Architecture/Charter semantic seams; reject unsupported machinery, not
approved meaning.

Do not add a public interface, DI layer, test seam, state, worker, recovery
branch, validator, or abstraction for hypothetical reuse. New durable state,
security behavior, or recovery requires a current semantic distinction,
threat, or failure model in the authorized Plan.

## Evidence and current truth

Use only PASS, FAIL, NOT_RUN, or BLOCKED, and keep each claim within the proof
boundary that actually ran. A mock is not live-provider evidence; one platform
is not another; source-tree execution is not source-less packaging.
Current documents describe current truth. Git, completed Plans, and historical
Qualification records preserve chronology.

## Current execution policy

Ordinary GitHub Actions are disabled. Use the local entrypoints required by the
active Plan and keep `pnpm verify` runnable. Do not infer merge, review,
cross-platform, release, provider, or hardware claims from unrelated checks.

## Completion

When the authorized change is complete, its acceptance conditions and required
executable proof are green, and no observed authorized blocker remains, STOP.
Do not begin a second cleanup or hardening pass. Reopen only for new current
evidence, an accepted current-Horizon failure case, a current consumer or
invariant, or an explicit active-Plan requirement.

## Repository knowledge

When editing repository knowledge, update the canonical owner first and only
the necessary current indexes, README projections, links, and package
documentation. Keep file-type authoring guidance in the applicable scoped
guidance rather than duplicating it in every governed artifact.
