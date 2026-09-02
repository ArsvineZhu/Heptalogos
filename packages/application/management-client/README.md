# @heptalogos/management-client

## Purpose

management-client is the generated TypeScript/fetch projection of the
canonical Management HTTP contract. Its portable root contains no filesystem,
native keyring, Product Host, Persistence, or Runtime dependency. Node-local
discovery and session storage are exposed only from the `./node` entry point.

## Owns

- Generated client transport/types from the checked OpenAPI document.
- The portable discovery, Problem, and authenticated request surface.
- A Node-only local adapter for the installation anchor, endpoint descriptor,
  well-known identity, and session token.

## Does not own

- Management semantics, HTTP server implementation, authentication state, or DB access.
- GUI state, React hooks, Axios, Zod, or a second handwritten DTO model.

## Verification

Run OpenAPI generation/check and client drift tests. The generated source is
never hand-edited; route schemas in management are the single wire source.

## Knowledge references

- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Management and Presentation Architecture`](../../../docs/architecture/management-presentation.md)
