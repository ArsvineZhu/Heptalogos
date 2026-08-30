# Identity and Generation Contract

## Scope

This Spec defines the identity categories used by current Foundation and
Runtime contracts. It does not define external protocol identifiers or product
features.

## Ownership

`foundation-contracts` owns the branded identity primitives. Domain owners own
the semantic meaning and lifecycle of their identifiers.

## Invariants

- `ID-001` Stable semantic names such as `ServiceId`, `CapabilityId`, and
  `ContributionId` MUST be namespaced and MUST NOT change because of a boot,
  installation, database surrogate key, or registration order.
- `ID-002` Generated instance and event identities MUST use the repository's
  UUIDv7 identity primitive where the contract calls for a generated identity.
- `ID-003` Product and package generations MUST use canonical content-digest
  identities, not generated instance IDs.
- `ID-004` `ProductGenerationId`, `PackageGenerationId`, durable-code version,
  contract/schema version, and protocol revision are distinct version axes.
- `ID-005` An identifier is not an authentication, authorization, or secret
  boundary. Explicit time fields remain the time Authority; UUID ordering does
  not replace domain time.

## References

- [`authority-and-core-concepts.md`](../../docs/architecture/authority-and-core-concepts.md)
- [`glossary.md`](../../docs/reference/glossary.md)
- [`foundation-contracts`](../../packages/foundation-contracts/README.md)
