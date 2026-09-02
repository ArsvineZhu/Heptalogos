# @heptalogos/product-host

## Purpose

product-host is the first real headless Product Host executable. It composes
the existing Bootstrap, private PostgreSQL, Host Ownership, Persistence,
RuntimeKernel, and Management service, then exposes the canonical Management
contract over loopback HTTP.

## Owns

- ProductGeneration derivation and built Host process argument handling.
- The single Bootstrap-to-Host composition and terminal shutdown order.
- Management HTTP admission, discovery, claim/session routes, OpenAPI
  projection, endpoint descriptor, and first-claim publication.

## Does not own

- Bootstrap, PostgreSQL, Host fence, Persistence, or Runtime semantics.
- GUI/Presentation, OpenClaw/Machine Operations, providers, Subject, Messaging,
  or future SystemAction execution.

## Verification

Qualify the built heptalogos-host process with the Q1-Q8 Product Host
scenarios. Production tests launch this executable rather than reimplementing
Host composition in fixtures.

## Knowledge references

- [`Bootstrap closure Spec`](../../../specs/runtime/bootstrap-closure.md)
- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Management and Presentation Architecture`](../../../docs/architecture/management-presentation.md)
