# @heptalogos/durable-execution

## Purpose

`durable-execution` is the bounded DBOS adapter boundary for Heptalogos
durable execution. It resolves the installed DBOS 4.27.6 package, provisions
its vendor schema through migration Authority, and owns the Host-bound DBOS
pool, process-global binding, and lifecycle boundary.

## Owns

- Exact installed DBOS package and CLI resolution.
- DBOS-specific child-process invocation, environment sanitization, timeout,
  output bounds, and diagnostic redaction.
- DBOS vendor-schema provisioning through the canonical migration Authority.
- The caller-owned DBOS system pool, process-global static workflow binding,
  and bounded Host lifecycle coordination.
- Heptalogos-owned contracts that keep DBOS implementation objects private.

## Does not own

- Canonical WorkItem state or WorkQueue mutation Authority.
- Host ownership, Bootstrap orchestration, private PostgreSQL lifecycle, or
  normal persistence.
- Product schema migration or canonical WorkItem persistence.
- DBOS classes, workflow handles, queue objects, or PostgreSQL pools as public
  Heptalogos contracts.

## Public surface

The entry point exposes normalized package-resolution, schema-provisioning, and
Host-bound runtime contracts. Process and vendor details remain package-
private; callers do not receive DBOS SDK, Execa, XState, or `pg` objects.

The runtime uses the Host `InstanceId` as DBOS `executorID`, while each BootId
only scopes the surrounding Host lifecycle. `DurableCodeVersion` is passed as
DBOS `applicationVersion`; it is an execution-version fence and is not a
replacement for the canonical WorkItem generation or revision fences.

## Dependencies and boundaries

The package uses the adopted DBOS 4.27.6, Execa, PostgreSQL driver, and XState
routes. It may consume Foundation, Host ownership, and WorkQueue contracts. It
must not import `bootstrap-runtime`, `private-postgres`, `persistence`,
`runtime-kernel`, or `signal`; those owners remain outside this adapter.

## Change constraints

Resolve DBOS only from the installed package metadata and package-contained
CLI file. Invoke it through the current Node executable with `shell: false`, a
required bounded timeout, sanitized inherited PostgreSQL environment, and
bounded redacted diagnostics. Keep provider classes, process results, DBOS
configuration, and lifecycle mechanics behind Heptalogos-owned contracts.

## Verification

Run `pnpm nx run durable-execution:test`, its typecheck and lint targets, and
the repository dependency, boundary, documentation, and hygiene gates. Real
DBOS schema, queue, and crash-recovery claims require the PostgreSQL and
process integration scenarios recorded in the
[`durable execution qualification record`](../../docs/qualification/results/Q-ASYNC-01.md).
Those records are platform- and candidate-scoped: a result on one platform
does not establish a cross-platform, source-less, or service/headless product
claim. The current correction candidate records its exact platform scope and
remaining `NOT_RUN` boundaries in that qualification record.

## Architecture references

- [`S01 — 启动、恢复与运行时监督`](../../docs/architecture/contracts/startup-recovery-runtime-supervision.md)
- [`S03 — 持久化、事务与 EffectFence`](../../docs/architecture/contracts/persistence-transactions-effect-fence.md)
- [`S13 — Foundation Service/Capability/Readiness`](../../docs/architecture/contracts/foundation-service-capability-readiness-catalog.md)
- [`S15 — Foundation 横切合同`](../../docs/architecture/contracts/foundation-cross-cutting-contracts.md)
