# @heptalogos/durable-execution

## Purpose

`durable-execution` is the bounded DBOS adapter boundary for Heptalogos
durable execution. This package currently resolves the installed DBOS 4.27.6
package and runs its CLI through a shell-free, bounded process adapter. Later
runtime work will add the Host-bound DBOS lifecycle behind the same boundary.

## Owns

- Exact installed DBOS package and CLI resolution.
- DBOS-specific child-process invocation, environment sanitization, timeout,
  output bounds, and diagnostic redaction.
- Heptalogos-owned contracts that keep DBOS implementation objects private.

## Does not own

- Canonical WorkItem state or WorkQueue mutation Authority.
- Host ownership, Bootstrap orchestration, private PostgreSQL lifecycle, or
  normal persistence.
- Product schema migration; DBOS vendor-schema provisioning is a later
  capability within this package.
- DBOS classes, workflow handles, queue objects, or PostgreSQL pools as public
  Heptalogos contracts.

## Public surface

The entry point exposes the exact DBOS package resolver and its normalized
Heptalogos package-resolution contract. Process and vendor details remain
package-private; callers do not receive DBOS SDK, Execa, or `pg` objects.

## Dependencies and boundaries

The package uses the adopted DBOS 4.27.6, Execa, PostgreSQL driver, and XState
routes. It may consume Foundation, Host ownership, and WorkQueue contracts. It
must not import `bootstrap-runtime`, `private-postgres`, `persistence`,
`runtime-kernel`, or `signal`; those owners remain outside this adapter.

## Change constraints

Resolve DBOS only from the installed package metadata and package-contained
CLI file. Invoke it through the current Node executable with `shell: false`, a
required bounded timeout, sanitized inherited PostgreSQL environment, and
bounded redacted diagnostics. Keep provider classes and process results behind
Heptalogos-owned contracts.

## Verification

Run `pnpm nx run durable-execution:test`, its typecheck and lint targets, and
the repository dependency, boundary, documentation, and hygiene gates. Real
DBOS schema and lifecycle claims belong to the later PostgreSQL integration
tasks and must not be inferred from these adapter unit tests.

## Architecture references

- [`S01 — 启动、恢复与运行时监督`](../../docs/architecture/contracts/startup-recovery-runtime-supervision.md)
- [`S03 — 持久化、事务与 EffectFence`](../../docs/architecture/contracts/persistence-transactions-effect-fence.md)
- [`S13 — Foundation Service/Capability/Readiness`](../../docs/architecture/contracts/foundation-service-capability-readiness-catalog.md)
- [`S15 — Foundation 横切合同`](../../docs/architecture/contracts/foundation-cross-cutting-contracts.md)
