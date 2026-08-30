# Canonical Schema Contract

## Scope

This Spec defines the current canonical PostgreSQL schema and validation
boundary used by Foundation packages. It does not define owner-native Extension
schemas.

## Ownership

`canonical-schema` owns the current development baseline and schema initializer.
Domain packages own the meaning of their tables through their repository
contracts; `schema-runtime` owns generic validation mechanics.

## Invariants

- `SCHEMA-001` Current canonical schema is a single versioned baseline for the
  `PRE_PRODUCTION` tree. Development migration history does not create a
  compatibility reader requirement.
- `SCHEMA-002` Canonical tables, constraints, indexes, and functions MUST
  preserve the Authority and ownership defined by the owning Spec; projections
  and indexes do not become canonical truth.
- `SCHEMA-003` Canonical input validation MUST be non-mutating: no silent
  coercion, default insertion, or removal of unknown fields.
- `SCHEMA-004` Unsupported shape, schema version, or unknown required boundary
  MUST be rejected with bounded diagnostics at the owner boundary.
- `SCHEMA-005` Any stable cross-process digest MUST use the repository's
  versioned canonical JSON and domain/purpose-separated digest contract.
- `SCHEMA-006` When a current PRE_PRODUCTION shape changes, update callers/tests,
  rewrite the current baseline, reset project-owned state, and delete obsolete
  implementation rather than adding a historical bridge.

## Verification Claims

Schema conformance uses current vectors, strict validation, non-mutation checks,
unknown-field diagnostics, and real PostgreSQL where transaction/constraint
behavior is part of the claim.

## References

- [`persistence-transactions.md`](./persistence-transactions.md)
- [`pre-production-evolution.md`](../../project/governance/pre-production-evolution.md)
- [`canonical-schema`](../../packages/canonical-schema/README.md)
- [`schema-runtime`](../../packages/schema-runtime/README.md)
