# @heptalogos/configuration

## Purpose

configuration owns the current Product ConfigurationDefinition,
ConfigurationRevision, ConfigurationActivation, and effective-value semantics.
It provides the bounded managed-revision route consumed by NetworkAccess and
later Product services.

## Owns

- Code-owned definitions and their JSON Schema contracts.
- Immutable PostgreSQL-backed managed revisions.
- Explicit Host-fenced activation CAS and effective-value resolution.
- Configuration metadata and redacted read projections.

## Does not own

- Secret plaintext or OS credential storage.
- Configuration files, watchers, import/export, or a source registry.
- Provider SDK objects, runtime reconciliation, or Management authorization.
- A second persistence or transaction boundary.

## Verification

Run the configuration unit tests, typecheck, and the real PostgreSQL Product
Host integration when activation persistence or restart behavior changes.

## Knowledge references

- [Configuration Spec](../../../specs/system/configuration.md)
- [Persistence Transactions](../../../specs/data/persistence-transactions.md)
- [System Authority Spec](../../../specs/management/system-authority.md)
