# @heptalogos/product-host

## Purpose

product-host is the first real headless Product Host executable. It composes
the existing Bootstrap, private PostgreSQL, Host Ownership, Persistence,
RuntimeKernel, Management, Messaging, and Subject services, then exposes the
canonical Management and Subject Chat contracts over one loopback HTTP
listener.

## Owns

- Build-time ProductGeneration and BootstrapRuntimeGeneration materialization;
  runtime imports the checked identities without repository scanning.
- The single Bootstrap-to-Host composition and terminal shutdown order.
- Management HTTP admission, discovery, claim/session routes, OpenAPI
  artifact, endpoint descriptor, and live first-claim publication/rotation.
- Product composition of the persistent Subject and Messaging owners with the
  existing DBOS, WorkQueue, Signal, AIRuntime, and lifecycle boundaries.
- Subject Chat HTTP admission/read routes and their generated client artifact.
- A safe public handle limited to Product identity, loopback origin, abort
  signal, and terminal close.

## Does not own

- Bootstrap, PostgreSQL, Host fence, Persistence, or Runtime semantics.
- Bootstrap, PostgreSQL, Host fence, Persistence, Runtime, Subject, Messaging,
  gateway/model, and DBOS/WorkQueue semantic meaning.
- GUI/Presentation, OpenClaw/Machine Operations, and future Product behavior.

## Verification

Check build identities and the ProductHost-owned OpenAPI artifact, then qualify
the built `heptalogos-host` process with the Product Host scenarios. The process
must run from a repository-external working directory, but that evidence is not
source-less release-form qualification.

## Knowledge references

- [`Bootstrap closure Spec`](../../../specs/runtime/bootstrap-closure.md)
- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Management and Presentation Architecture`](../../../docs/architecture/management-presentation.md)
