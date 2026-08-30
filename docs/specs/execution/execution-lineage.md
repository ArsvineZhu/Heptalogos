# Execution Lineage Contract

## Scope

This Spec defines the Heptalogos-owned semantic execution lineage used by
current Foundation boundaries. It does not make telemetry the product source
of truth.

## Ownership

`execution-lineage` owns Activity/ExecutionContext propagation and the lineage
service. Domain owners retain Authority over their own objects and outcomes.

## Invariants

- `LIN-001` Every meaningful lifecycle, Service/Capability/Contribution,
  WorkItem, Management, network/model, effect, recovery, and shutdown boundary
  MUST be able to enter semantic lineage.
- `LIN-002` `ActivityId`, `TraceId`, and `SpanId` are different identities. A
  sampled or lost telemetry projection MUST NOT erase required Activity,
  Evidence, or Audit truth.
- `LIN-003` ExecutionContext MUST distinguish origin, ownership, purpose,
  semantic target, principal/authority, subject/resource scope, and telemetry
  correlation where present.
- `LIN-004` Cross-process, durable-wait, cross-generation, and restart handoff
  MUST use an explicit versioned LineageContextRef; process-local context alone
  is not durable.
- `LIN-005` The graph MUST represent parent/child, causation, links,
  supersession, resume, fan-out, and fan-in without fabricating synchronous
  call stacks for asynchronous work.
- `LIN-006` Host-injected Package, Generation, MicroSystem, and Contribution
  origin cannot be forged by an Extension.
- `LIN-007` Severity, importance, retention class, and sensitivity are
  orthogonal. Secret plaintext MUST NOT enter Activity, telemetry, Evidence,
  or Replay payloads.
- `LIN-008` Required retained Activity/Evidence/Audit facts MUST be committed
  through their owning durable boundary; exporter failure cannot silently omit
  them.

## Lifecycle

Bootstrap may use bounded early observability before PostgreSQL. Normal lineage
then continues the same causal chain. Shutdown records a terminal or
interrupted stage.

## References

- [`execution-lineage.md`](../../architecture/execution-lineage.md)
- [`execution-lineage`](../../../packages/execution-lineage/README.md)
- [`evidence.md`](./evidence.md)
