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

## Active

No H1-S implementation plan remains active after local correction/evidence
closure. H1 remains `OPEN`; H2 remains `NOT_ELIGIBLE` pending external closure.

## Completed

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
- [H1-S review correction](completed/foundation/h1s-review-correction.md) — `COMPLETED` (RC-1..RC-6 and current-host qualification complete; independent review, final CI, and squash merge remain pending)
- [H1-S Stabilization Control Record](completed/foundation/h1s-control-record.md) — `COMPLETED` (H1 remains `OPEN`; H2 remains `NOT_ELIGIBLE`)
