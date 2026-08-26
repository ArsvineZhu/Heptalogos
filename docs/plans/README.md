# Implementation plans

Plan states are exactly:

```text
ACTIVE
COMPLETED
SUPERSEDED
ABANDONED
```

Filename recency is not plan authority. A task should name its governing active
plan explicitly; if multiple active plans could apply and none is designated,
surface the ambiguity rather than guessing.

## Decision completeness

An ACTIVE implementation plan is an executable specification, not an option memo.
Before execution it MUST resolve non-trivial choices affecting Authority,
semantic ownership, package/dependency boundaries, compatibility, durable
shape, stable identity, lifecycle/failure semantics, stage scope and required
evidence.

The executor may choose only semantics-equivalent local implementation details.
An unresolved non-trivial choice is `PLAN_GAP` and stops execution.

## Active

No active implementation plan is installed for the current branch.

## Completed

- [H2A-3 Canonical Execution Context, Time & Lineage Foundation](completed/foundation/h2a3-canonical-execution-context-time-lineage.md) — `COMPLETED` (PR #19 merged; final cross-platform CI remains `NOT_RUN` by operator direction)

- [Repository Genesis](completed/repository/repository-genesis.md) — `COMPLETED`
- [Foundation M1 Development Spine](completed/foundation/m1-development-spine.md) — `COMPLETED`
- [Foundation M1 Final Corrective and Closure](completed/foundation/m1-final-corrective-and-closure.md) — `COMPLETED`
- [Foundation M2 Pre-PostgreSQL Bootstrap Substrate](completed/foundation/m2-pre-postgresql-bootstrap-substrate.md) — `COMPLETED`
- [Foundation M3 Private PostgreSQL Bootstrap & Identity](completed/foundation/m3-private-postgresql-bootstrap.md) — `COMPLETED` (implementation merged; qualification remains `PARTIAL`)
- [Foundation M4 Host Ownership Fence & Forward Handoff](completed/foundation/m4-host-ownership-fence-forward-handoff.md) — `COMPLETED` (implementation merged; qualification remains `PARTIAL`)
- [Foundation M5A Reverse Handoff & PostgreSQL Maintenance Window](completed/foundation/m5a-reverse-handoff-maintenance-window.md) — `COMPLETED`
- [Foundation M5B Bounded Bootstrap Recovery & H1 Closure](completed/foundation/m5b-bounded-bootstrap-recovery-h1-closure.md) — `COMPLETED`
- [H1-S0 Governance & Truth Reset](completed/foundation/h1s-s0-governance-truth-reset.md) — `COMPLETED`
- [H1-S1 Foundation Authority & Canonical-State Stabilization](completed/foundation/h1s-s1-foundation-authority-stabilization.md) — `COMPLETED` (live PostgreSQL qualification was deferred to S2 and is now recorded there)
- [H1-S2 Clean-State Qualification & Closure](completed/foundation/h1s-s2-clean-state-qualification-closure.md) — `COMPLETED` (exact candidate local qualification is complete; external closure gates remain pending)
- [H1-S review correction](completed/foundation/h1s-review-correction.md) — `COMPLETED` (RC-1..RC-6 and current-host qualification complete; historical implementation phase)
- [H1-S Stabilization Control Record](completed/foundation/h1s-control-record.md) — `COMPLETED` (H1 is `CLOSED`; H2 is `ELIGIBLE`)
- [H2A-1 Host-Fenced Persistence Authority](completed/foundation/h2a1-host-fenced-persistence-authority.md) — `COMPLETED` (implementation/evidence PASS; external review, final CI, and squash merge PASS; qualification remains PARTIAL)
- [H2A-2 Canonical Schema & Continuity Authority](completed/foundation/h2a2-canonical-schema-continuity-authority.md) — `COMPLETED` (implementation/evidence PASS; external review, final CI, and squash merge PASS; qualification remains PARTIAL)
- [H2B Runtime Composition & Kernel](completed/foundation/h2b-runtime-composition-kernel.md) — `COMPLETED` (PR #22 merged; H2B closure reconciled in PR #23; final-head PostgreSQL rerun remains `NOT_RUN`)
- [H2-S Stabilization Closure](completed/foundation/h2-stabilization-closure.md) — `COMPLETED` (local implementation and Windows PostgreSQL 18.6 qualification complete; Independent Review, final cross-platform CI, and squash merge remain `NOT_RUN`)
- [H2-S review correction and governance simplification](completed/foundation/h2s-review-correction-governance-simplification.md) — `COMPLETED` (local qualification and fresh PostgreSQL 18.6 qualification PASS; Independent Review, final cross-platform CI, and merge remain `NOT_RUN`)
- [H2-S context-efficient package governance correction](completed/foundation/h2s-review-correction-context-efficient-package-governance.md) — `COMPLETED` (local qualification and fresh PostgreSQL 18.6 qualification PASS; Independent Review, final cross-platform CI, and merge remain `NOT_RUN`)
