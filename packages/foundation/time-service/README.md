# @heptalogos/time-service

## Purpose

`time-service` provides the time contract used by Foundation components that
need monotonic elapsed measurements, wall-clock instants, time zones, or
deterministic test time. It makes time an injectable dependency so lifecycle,
transaction, evidence, and qualification tests do not silently depend on the
machine clock.

## Owns

- `TimeService`, `FakeTimeService`, and monotonic tick contracts.
- Elapsed nanosecond and timezone value types.
- System and fake service constructors.
- Time-zone identifier parsing.

## Does not own

- Scheduling, timers, durable work, or retry policy.
- Lifecycle ownership, persistence, Evidence, or wall-clock product policy.
- A global mutable clock or a second time abstraction.

## Public surface

The package exports the time contracts, `createFakeTimeService`,
`createSystemTimeService`, and `parseTimeZoneId`. Consumers request the service
through their owning composition, preserving monotonic versus human-local time
semantics instead of coupling domain code to raw clock calls.

## Dependencies and boundaries

It depends only on `foundation-contracts`. Keep the implementation small and
side-effect limited to the system-clock adapter. Time values are inputs to
other owners; this package does not decide retention, lifecycle, scheduling, or
configuration policy.

## Verification

Run `pnpm nx run time-service:test`, lint, typecheck, and deterministic fake-time
tests. Changes affecting elapsed or timezone semantics require the impacted
lifecycle, persistence, or Evidence tests as well.

## Architecture references

- [`Time Spec`](../../../specs/execution/time.md)
- [`Persistence transaction Spec`](../../../specs/data/persistence-transactions.md)
- [`Evidence Spec`](../../../specs/execution/evidence.md)
- [`Execution lineage Spec`](../../../specs/execution/execution-lineage.md)
- [`Contract versioning Spec`](../../../specs/core/contract-versioning.md)
- [`Execution model Architecture`](../../../docs/architecture/execution-model.md)
