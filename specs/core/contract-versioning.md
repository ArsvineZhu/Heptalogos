# Contract Versioning Contract

## Scope

This Spec defines version identity and compatibility behavior for current
durable, cross-process, cross-generation, replay, and exported contracts.

## Ownership

The owner of each contract defines its version and reader behavior. Governance
defines whether historical compatibility is an obligation.

## Invariants

- `VER-001` Every durable or cross-boundary payload MUST carry an explicit
  contract/schema version where its owning contract requires versioning.
- `VER-002` A versioned contract does not imply historical compatibility.
  Compatibility exists only for a declared obligation in
  [`compatibility-obligations.json`](../../project/governance/compatibility-obligations.json).
- `VER-003` With `CompatibilityEpoch = PRE_PRODUCTION`, the current canonical
  shape remains one V1. Obsolete project-development shapes MUST be rejected,
  reset, rewritten, or deleted; they MUST NOT create legacy readers, bridge
  migrations, aliases, or dual formats.
- `VER-004` Unsupported future versions MUST fail explicitly at the owning
  boundary. A transport serializer or framework default is not a contract
  reader.
- `VER-005` Product generation, durable-code version, package generation,
  contract/schema version, and protocol revision MUST NOT be conflated.

## Failure Semantics

An unsupported or incompatible shape is a bounded validation or recovery
outcome. It does not authorize silent coercion or fallback parsing.

## References

- [`pre-production-evolution.md`](../../project/governance/pre-production-evolution.md)
- [`constitution.md`](../../project/governance/constitution.md)
- [`canonical-schema`](../../packages/data/canonical-schema/README.md)
