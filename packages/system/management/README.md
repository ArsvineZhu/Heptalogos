# @heptalogos/management

## Purpose

management owns the canonical P1 Management semantics: the single
Administrator, first-administrator claim, server-side sessions, stable
Problem projections, wire schemas, and read-only Host, Runtime, and Readiness
projections. It is the semantic service behind HTTP, the generated client, and
the reference CLI.

## Owns

- Administrator, first-claim, and session durable models and fenced repository operations.
- Password normalization/hash policy and authentication decisions.
- P1 Management wire schemas, CompatibilityDescriptor, Problems, and Read Models.
- The system.management MicroSystem definition and service contract.

## Does not own

- Fastify, OpenAPI transport, CLI parsing, native keyring, Bootstrap, or Runtime internals.
- Generic SystemAction registries, approval engines, Cedar execution, or future domain mutations.
- A second database, transaction pool, or read-model store.

## Verification

Run unit/schema tests and Product Host integration scenarios against the real
canonical PostgreSQL baseline. Route schemas, OpenAPI, and generated
ManagementClient are one checked projection chain.

## Knowledge references

- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Service, capability, and readiness Spec`](../../../specs/core/service-capability-readiness.md)
- [`Data, evidence, and persistence Architecture`](../../../docs/architecture/data-evidence-persistence.md)
