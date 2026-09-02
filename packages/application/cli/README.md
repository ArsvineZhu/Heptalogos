# @heptalogos/cli

## Purpose

cli is the complete reference heptalogos client over management-client. It
provides protected first-claim/login input, opaque session-keyring storage,
machine-readable reads, and stable exit classes.

## Owns

- The oclif command tree: admin claim, auth login/logout, contract, status,
  host status, runtime graph, capability graph, and readiness.
- Protected TTY/stdin password input and CLI diagnostics/JSON projection.
- The local session token keyring account.

## Does not own

- Database, RuntimeKernel, HostOwnership, Bootstrap, or canonical schema access.
- Management semantics, GUI, OpenClaw, or future action namespaces.

## Verification

Qualify the built heptalogos executable for protected input, discovery, token
handling, JSON stdout discipline, and the absence of direct Foundation imports.

## Knowledge references

- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Management and Presentation Architecture`](../../../docs/architecture/management-presentation.md)
