# @heptalogos/work-queue

## Purpose

`work-queue` owns the canonical durable WorkItem contract and the reconciliation
boundary that projects committed work into an execution engine. It makes
durable work explicit, generation-bound, revision-fenced, and recoverable from
lost notifications or dispatch failures.

## Owns

- WorkItem, retry, admission, dispatch, and error-classification contracts.
- Deterministic dispatch-attempt identity and the local WorkItem state machine.
- Host-fenced WorkItem repository and WorkQueue creation/reconciliation services.
- Engine-neutral attempt execution around generation-bound WorkHandlers.

## Does not own

- DBOS schema, workflow runtime, queue mechanics, or durable execution.
- Host ownership, canonical schema migration, ConfigurationService, or
  ResourceGovernor.
- Messaging/Subject semantics, external effects, or a second scheduler.
- Runtime generation lifecycle or a process-memory durable obligation store.

## Public surface

The entry point exports WorkItem contracts, dispatch-attempt identity helpers,
state-transition validation, repository/service ports, and WorkQueue runtime
components. Engine-specific composition is outside this package; callers must
use the Persistence and Runtime Kernel ownership boundaries.

## Dependencies and boundaries

It depends on Foundation identities and canonical JSON, Execution Lineage,
Persistence, Time Service, Runtime Kernel WorkHandler leases, Signal, and the
adopted XState 5 local state-machine mechanic. Persistence remains the Host
fence and WorkItem Authority; Signal is only a best-effort wakeup hint.

## Change constraints

Keep WorkItem as the only product Authority for durable work. Require explicit
runtime options, admission, retry classification, generation/revision fences,
and bounded payload/outcome validation. Do not add hidden backoff defaults,
DBOS dependencies, per-item timers, or compatibility readers for development
history.

## Verification

Run `pnpm nx run work-queue:test`, lint, typecheck, build, and the repository
gates. Real PostgreSQL, Host-fence, and crash/recovery claims require the
qualification scenarios rather than in-memory tests alone.

## Architecture references

- [`S02 — 异步、WorkQueue、Durable 与 Time`](../../Architecture_Corpus/specs/S02-异步-WorkQueue-Durable-Time.md)
- [`S03 — 持久化、事务与 EffectFence`](../../Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md)
- [`S13 — Foundation Service/Capability/Readiness Catalog`](../../Architecture_Corpus/specs/S13-Foundation-Service-Capability-Readiness-Catalog.md)
- [`S15 — Foundation 横切合同`](../../Architecture_Corpus/specs/S15-Foundation横切合同.md)
- [`S16 — Execution Lineage Observability`](../../Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md)
