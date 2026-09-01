# Evidence Contract

## Scope

This Spec defines current durable product evidence and replay evidence
boundaries. Operational telemetry remains a separate projection.

## Ownership

The owning domain or Foundation service creates Evidence; `evidence` provides
the typed persistence/service boundary. Qualification records own observed
qualification truth.

## Invariants

- `EVID-001` Evidence MUST be a typed durable causal/provenance record and MUST
  NOT be treated as a log, trace, or model explanation generated after the fact.
- `EVID-002` An Evidence envelope MUST carry identity/type, schema version,
  producer/generation, scope, timestamps, causation/correlation, sensitivity,
  lifecycle class, payload/reference, and digest as applicable.
- `EVID-003` Required Authority-transition, state-transition, package, and
  recovery evidence produced by current Foundation operations MUST follow the
  owning mutation's atomic or fail-safe rule.
- `EVID-004` Secret plaintext is always excluded. Sensitive or large content
  uses bounded redacted payloads, digests, or Artifact references according to
  retention policy.
- `EVID-005` Replay is `VERIFIED` only after required deterministic stages are
  actually rerun and match expected values; stored expected output alone is not
  verification.
- `EVID-006` Historical qualification evidence MUST remain distinct from
  current-candidate evidence and retains its original `PASS`, `FAIL`,
  `NOT_RUN`, or `BLOCKED` state.

## References

- [`execution-lineage.md`](../../docs/architecture/execution-lineage.md)
- [`verification-system.md`](../../project/qualification/verification-system.md)
- [`evidence`](../../packages/execution/evidence/README.md)
