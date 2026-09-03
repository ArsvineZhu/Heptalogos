# @heptalogos/product-host

## Purpose

product-host is the first real headless Product Host executable. It composes
the existing Bootstrap, private PostgreSQL, Host Ownership, Persistence,
RuntimeKernel, and Management service, then exposes the canonical Management
contract over loopback HTTP.

## Owns

- Build-time ProductGeneration and BootstrapRuntimeGeneration materialization;
  runtime imports the checked identities without repository scanning.
- The single Bootstrap-to-Host composition and terminal shutdown order.
- Management HTTP admission, discovery, claim/session routes, OpenAPI
  artifact, endpoint descriptor, and live first-claim publication/rotation.
- A safe public handle limited to Product identity, loopback origin, abort
  signal, and terminal close.

## Does not own

- Bootstrap, PostgreSQL, Host fence, Persistence, or Runtime semantics.
- GUI/Presentation, OpenClaw/Machine Operations, gateway/model semantics,
  Subject, Messaging,
  or future SystemAction execution.

## Verification

Check build identities and the ProductHost-owned OpenAPI artifact, then qualify
the built `heptalogos-host` process with the Product Host scenarios. The process
must run from a repository-external working directory, but that evidence is not
source-less release-form qualification.

## Knowledge references

- [`Bootstrap closure Spec`](../../../specs/runtime/bootstrap-closure.md)
- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Management and Presentation Architecture`](../../../docs/architecture/management-presentation.md)
