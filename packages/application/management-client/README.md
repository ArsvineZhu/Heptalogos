# @heptalogos/management-client

## Purpose

management-client is the stable Heptalogos TypeScript/fetch facade generated
from the ProductHost-owned Management OpenAPI artifact. Its portable root
contains no generated-module wildcard, public transport, filesystem, native
keyring, Product Host code, Persistence, or Runtime dependency. Node-local
discovery and session storage are exposed only from the `./node` entry point.

## Owns

- Closure-private generated client transport/types from the checked OpenAPI
  artifact.
- Stable aliases for discovery, Problem, authenticated ReadModel, and bootstrap
  request/result surfaces.
- A Node-only local adapter for the installation anchor, endpoint descriptor,
  well-known identity, and session token.

## Does not own

- Management semantics, HTTP server implementation, authentication state, or DB access.
- GUI state, React hooks, Axios, Zod, or a second handwritten DTO model.

## Verification

Run ProductHost OpenAPI generation/check and client drift tests. The generated
source is never hand-edited; Management schemas feed ProductHost HTTP schemas,
which materialize the sole client-generation input artifact.

## Knowledge references

- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Management and Presentation Architecture`](../../../docs/architecture/management-presentation.md)
