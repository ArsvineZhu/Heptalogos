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

- [H1-S0 Governance & Truth Reset](active/foundation/h1s-s0-governance-truth-reset.md) — `ACTIVE` (governing plan)
- [H1-S1 Foundation Authority & Canonical-State Stabilization](active/foundation/h1s-s1-foundation-authority-stabilization.md) — `ACTIVE` (execution-gated by the control record)
- [H1-S2 Clean-State Qualification & Closure](active/foundation/h1s-s2-clean-state-qualification-closure.md) — `ACTIVE` (execution-gated by the control record)

Governing H1-S plan: `h1s-s0-governance-truth-reset.md`
S1/S2 are approved but execution-gated by `h1s-control-record.md`.

## Completed

- [Repository Genesis](completed/repository/repository-genesis.md) — `COMPLETED`
- [Foundation M1 Development Spine](completed/foundation/m1-development-spine.md) — `COMPLETED`
- [Foundation M1 Final Corrective and Closure](completed/foundation/m1-final-corrective-and-closure.md) — `COMPLETED`
- [Foundation M2 Pre-PostgreSQL Bootstrap Substrate](completed/foundation/m2-pre-postgresql-bootstrap-substrate.md) — `COMPLETED`
- [Foundation M3 Private PostgreSQL Bootstrap & Identity](completed/foundation/m3-private-postgresql-bootstrap.md) — `COMPLETED` (implementation merged; qualification remains `PARTIAL`)
- [Foundation M4 Host Ownership Fence & Forward Handoff](completed/foundation/m4-host-ownership-fence-forward-handoff.md) — `COMPLETED` (implementation merged; qualification remains `PARTIAL`)
- [Foundation M5A Reverse Handoff & PostgreSQL Maintenance Window](completed/foundation/m5a-reverse-handoff-maintenance-window.md) — `COMPLETED`
- [Foundation M5B Bounded Bootstrap Recovery & H1 Closure](completed/foundation/m5b-bounded-bootstrap-recovery-h1-closure.md) — `COMPLETED`
