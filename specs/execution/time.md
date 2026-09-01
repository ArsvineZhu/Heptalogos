# Time Contract

## Scope

This Spec defines the time semantics used by current Foundation execution and
durability contracts.

## Ownership

`time-service` owns the typed time provider and testable clock boundary. Domain
owners define the meaning of their timestamps.

## Invariants

- `TIME-001` Persisted absolute times MUST use an explicit `Instant`; a local
  machine clock string or generated identifier is not time Authority.
- `TIME-002` Timeout, elapsed, latency, drain, and retry measurements MUST use
  monotonic elapsed duration semantics.
- `TIME-003` Human-local schedules MUST retain IANA timezone and originating
  local-time semantics, plus a resolved Instant when applicable.
- `TIME-004` Current consumers MUST use the TimeService boundary when behavior
  depends on wall-clock or elapsed time, allowing deterministic qualification.
- `TIME-005` Clock jumps, DST, and timezone changes MUST NOT silently rewrite a
  committed durable obligation; each owning contract defines its re-evaluation
  rule.

## References

- [`Execution model`](../../docs/architecture/execution-model.md)
- [`time-service`](../../packages/foundation/time-service/README.md)
