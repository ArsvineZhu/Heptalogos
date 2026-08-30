# @heptalogos/bootstrap-runtime

## Purpose

`bootstrap-runtime` is the installation and recovery orchestration boundary that
exists before and around the normal product Runtime. It prepares Bootstrap
state, starts and maintains private PostgreSQL through the authorized
controller, and coordinates forward and reverse Host handoff. Its managed Host
contracts let higher-level integration compose Bootstrap, Host ownership, and
Runtime lifecycle without giving Bootstrap product Runtime semantics.

## Owns

- Bootstrap ownership and prelude orchestration.
- Private PostgreSQL startup and authorized maintenance handoff.
- Bootstrap recovery inspection and command execution.
- Managed Host lifecycle, quiescence, and handoff contracts.
- The managed Host's fenced durable-execution database authority and
  callback-scoped credential handoff.
- Bootstrap key-provider and installation-owner projections.

Durable execution is composed at the integration/Host lifecycle boundary. The
production Bootstrap surface does not import DBOS or own WorkQueue semantics;
planned reverse handoff drains the durable runtime before Host ownership and
private PostgreSQL cleanup are released.

## Does not own

- Runtime Kernel or Cordis mechanics in production source.
- Normal persistence/schema mutation authority.
- DBOS lifecycle or workflow mechanics; those belong to the durable-execution
  package composed by the Host boundary.
- A second Host lease or private PostgreSQL controller.
- Later-stage durable work, external effects, or product cognition.

## Public surface

The entry point exports Bootstrap locator/path and ownership types, recovery
inspection/commands, Bootstrap Prelude preparation, private PostgreSQL handoff
types, key-provider contracts, and managed Host lifecycle contracts. Production
callers use these interfaces; tests may compose Runtime packages at the
integration boundary.

## Dependencies and boundaries

The production dependency graph keeps `@heptalogos/runtime-kernel`,
`@heptalogos/runtime-substrate`, and `cordis` outside this package; they are
development composition dependencies for integration tests only. Authorized
PostgreSQL control follows Bootstrap-owned handoff, and post-Host cleanup
reacquires Bootstrap authority before control resumes.

## Verification

Run `pnpm nx run bootstrap-runtime:test`, the real PostgreSQL integration target,
recovery-process targets, and the boundary/dependency gates. Lifecycle changes
also require claim-matched Host and Runtime qualification. The durable-execution qualification's real
composition covers DBOS queue/admission behavior, process crash recovery, and
Host lifecycle settlement; product platform/source-less claims remain
separately scoped in the durable-execution qualification record.

The Foundation process-level composition proof is the explicit
`pnpm nx run bootstrap-runtime:test:foundation-spine` qualification target. It
uses real Bootstrap, Host ownership, PostgreSQL, Runtime, WorkQueue, DBOS, and
canonical WorkItem construction; it is not a claim that the H6 Product Runtime
or Subject vertical slice exists.

## Architecture references

- [`Bootstrap closure Spec`](../../specs/runtime/bootstrap-closure.md)
- [`Persistence transaction Spec`](../../specs/data/persistence-transactions.md)
- [`Service, capability, and readiness Spec`](../../specs/core/service-capability-readiness.md)
- [`Maintenance handoff Spec`](../../specs/runtime/maintenance-handoff.md)
- [`Storage lifecycle Architecture`](../../docs/architecture/storage-lifecycle.md)
