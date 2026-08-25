# @heptalogos/schema-runtime

## Purpose

`schema-runtime` provides generic runtime schema compilation and validation
mechanics used by Foundation contracts. It wraps the adopted AJV and TypeBox
route behind a small typed result interface so callers can validate data without
coupling their public contracts to a validator implementation. It is a generic
mechanics package, not a product schema Authority.

## Owns

- `SchemaValidator` and validation issue/result contracts.
- Runtime compilation and validation through `compileSchema`.
- The `./typebox` integration surface for approved schema construction.

## Does not own

- Product/domain schema definitions or migration policy.
- Compatibility obligations, upcasting, or fallback parsing.
- Persistence, serialization Authority, or runtime lifecycle.
- Transport-specific schema behavior.

## Public surface

The root entry point exports schema validation issue/result/validator types and
`compileSchema`. The `./typebox` subpath exposes the explicitly routed TypeBox
mechanics. Consumers should translate results into their own domain contracts
without exposing AJV internals as product Authority.

## Dependencies and boundaries

It depends on AJV and TypeBox only. Keep it deterministic and side-effect free;
do not add database, filesystem, framework, or network behavior. Current
PRE_PRODUCTION shapes are defined by their owning package, and unsupported
shapes must fail according to that package's contract.

## Verification

Run `pnpm nx run schema-runtime:test`, lint, typecheck, and the schema contract
tests for any validation behavior change. Run boundary and full repository
gates when public exports change.

## Architecture references

Read Corpus 02, 12, 15, 16, 19, 24, and S15 before changing compilation,
validation results, or TypeBox routing.
