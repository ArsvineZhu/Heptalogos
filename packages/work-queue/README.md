# @heptalogos/work-queue

## Purpose

`work-queue` owns the canonical durable WorkItem contract and the reconciliation
boundary that projects committed work into an execution engine. It makes
durable work explicit, generation-bound, revision-fenced, and recoverable from
lost notifications or dispatch failures.

## Owns

- WorkItem, retry, admission, dispatch, and error-classification contracts.
- Immutable WorkQueue profile catalogs and partition-key invariants.
- Deterministic dispatch-attempt identity and the local WorkItem state machine.
- Host-fenced WorkItem repository and WorkQueue creation/reconciliation services.
- Engine-neutral attempt execution around generation-bound WorkHandlers.
- Canonical RUNNING recovery diagnostics over an engine inspection port.

## Does not own

- DBOS schema, workflow runtime, queue mechanics, or durable execution.
- Host ownership, canonical schema migration, ConfigurationService, or
  ResourceGovernor.
- Messaging/Subject semantics, external effects, or a second scheduler.
- Runtime generation lifecycle or a process-memory durable obligation store.

## Public surface

The entry point exports WorkItem contracts, dispatch-attempt identity helpers,
profile catalog validation, state-transition validation, repository/service
ports, and WorkQueue runtime components. The concrete canonical repository
factory is a restricted Foundation seam at
`@heptalogos/work-queue/foundation-repository`; it is not a general
root-package API. Engine-specific composition is outside this package; callers
must use the Persistence and Runtime Kernel ownership boundaries.

## Dependencies and boundaries

It depends on Foundation identities and canonical JSON, Execution Lineage,
Persistence, Time Service, Runtime Kernel WorkHandler leases, Signal, and the
adopted XState 5 local state-machine mechanic. Persistence remains the Host
fence and WorkItem Authority; Signal is only a best-effort wakeup hint.

## Change constraints

Keep WorkItem as the only product Authority for durable work. Require explicit
runtime options, admission, retry classification, generation/revision fences,
profile/partition validation, and bounded payload/outcome validation. Do not
add hidden backoff defaults, DBOS dependencies, per-item timers, or compatibility
readers for development history. Engine projection inspection may report
contradictions but must not mutate canonical WorkItem outcomes.

## Verification

Run `pnpm nx run work-queue:test`, lint, typecheck, build, and the repository
gates. Real PostgreSQL, Host-fence, and crash/recovery claims require the
qualification scenarios rather than in-memory tests alone. Durable-execution qualification covers
`beforeCreate`/`beforeDispatch` admission, DBOS queue profiles, and canonical
obligation retention; ResourceGovernor and `PressureSnapshot` remain H8-owned
and are not implemented here.

## Architecture references

- [`Work Item Spec`](../../docs/specs/execution/work-item.md)
- [`Durable dispatch Spec`](../../docs/specs/execution/durable-dispatch.md)
- [`Signal Spec`](../../docs/specs/execution/signal.md)
- [`Persistence transaction Spec`](../../docs/specs/data/persistence-transactions.md)
- [`Execution lineage Spec`](../../docs/specs/execution/execution-lineage.md)
- [`Execution model Architecture`](../../docs/architecture/execution-model.md)
