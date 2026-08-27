---
name: heptalogos-extensions
description: Use when changing Heptalogos Extension packages, PackageGeneration lifecycle, MicroSystems, Contributions, Service/Capability providers, package trust/provenance, activation/disable/upgrade/rollback/purge, execution domains, or public Extension SDK contracts.
---

# Heptalogos Extensions

## Authority route

Documentation root: `../../../docs/`
Route index: `../../heptalogos/corpus-routes.json`

Read first:

- [MicroSystem and Extension architecture](../../../docs/architecture/extensions.md)
- [Foundation service catalog](../../../docs/architecture/foundation-services.md)
- [S06 Extension / package / trust / execution domain](../../../docs/architecture/contracts/extension-package-trust-execution-domain.md)
- [S13 Service / Capability / readiness catalog](../../../docs/architecture/contracts/foundation-service-capability-readiness-catalog.md)
- [S15 Cross-cutting contracts](../../../docs/architecture/contracts/foundation-cross-cutting-contracts.md)

## Procedure

1. Name the semantic role independently from origin/package/execution domain. `Package != MicroSystem != Contribution`; `Service != Capability`.
2. Define required/provided Services, Capabilities, Contributions, configuration, permissions, readiness, resources, and lifecycle ownership.
3. Keep public contracts Heptalogos-owned. Do not leak runtime-container, Fastify, DBOS, Kysely/pg, Cedar, telemetry, or package-filesystem implementation objects.
4. Bind providers deterministically through policy/scope/compatibility/health/preference rules; registration order must not become authority.
5. Assign every activated resource to PackageGeneration/MicroSystem ownership and make stop/retire revoke the complete resource set.
6. For generation replacement, stop new invocations, drain/cancel in-flight InvocationLeases, fence stale durable work, retire logically, then purge physically only when safe.
7. Distinguish integrity/provenance from isolation. Trusted in-process code is trusted at process/OS level; Node Permission Model or `node:vm` is not a malicious-code sandbox.
8. For external/MCP execution, do not claim filesystem/network confinement unless an actual isolation boundary provides it.

Use `heptalogos-dependencies` for package/runtime mechanics selection, `heptalogos-config-data` for persistent extension state, and `heptalogos-interaction` for AI/MCP semantics.

## Completion

An Extension change must have explicit generation identity, ownership, contract/version semantics, deterministic provider behavior, bounded authority, lifecycle cleanup, and claim-matched qualification.
