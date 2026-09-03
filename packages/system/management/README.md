# @heptalogos/management

## Purpose

management owns the canonical Management semantics: the single
Administrator, first-administrator claim, server-side sessions, complete
Problem projections, the bounded current SystemAction plan/execute contract,
and enveloped read-only Host, Runtime, Capability, Product, and Readiness
projections. It is the semantic service behind HTTP, the generated client, and
the reference CLI.

## Owns

- Administrator, first-claim, and session durable models and fenced repository operations.
- Password normalization/hash policy and authentication decisions.
- Current Management wire schemas, CompatibilityDescriptor, Problems,
  ReadModelEnvelope, and strongly typed Runtime/Capability projections.
- The Management wire schemas reuse the canonical `LineageContextRef` type and
  schema owned by `@heptalogos/execution-lineage`; Management does not define a
  second lineage contract.
- SystemActionDefinition, SystemChangePlan, and SystemActionExecuteResult
  contracts plus the eight current Product prerequisite action routes.
- Product prerequisite reads for Configuration, Secret metadata, NetworkAccess,
  GatewayProfile, ModelProfile, ModelBinding, and AIRuntime readiness.
- The system.management MicroSystem definition and service contract.

## Does not own

- Fastify, OpenAPI transport, CLI parsing, native keyring, Bootstrap, or Runtime internals.
- Generic SystemAction registries, durable approval/operation stores, Cedar
  execution, or future domain mutations.
- A second database, transaction pool, or read-model store.
- Public repository, password/hash, token, or Argon2 mechanics.

## Verification

Run unit/schema tests and Product Host integration scenarios against the real
canonical PostgreSQL baseline. Route schemas, OpenAPI, and generated
ManagementClient are one checked projection chain.

## Knowledge references

- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Service, capability, and readiness Spec`](../../../specs/core/service-capability-readiness.md)
- [`Data, evidence, and persistence Architecture`](../../../docs/architecture/data-evidence-persistence.md)
