# Dependency Admission

Library-First is retained and strengthened. Dependency bureaucracy is narrowed to where it carries architecture value.

## Architectural provider roles remain Authority

Keep:

```text
project/dependencies/dependency-routing.json
project/qualification/dependency-status.json
```

for actual architectural provider/mechanics decisions.

An `ADOPTED` route remains an implementation directive.

Do not delete a route because its package is not yet installed or its Product consumer arrives later.

Do not silently replace:

```text
Cordis
DBOS
Kysely
Fastify
XState local-state-machine route
AI SDK
Cedar
other adopted architecture providers
```

with custom local mechanics.

## Ordinary libraries do not need an architecture citizenship process

A mature ordinary library/tool selected by an active Plan needs normal package mechanics:

```text
direct dependency uses pnpm catalog
catalog owns direct version
lockfile owns resolved closure
normal license/API/platform fit considered by the Architect as appropriate
```

It does not automatically need:

```text
RoleDecision
ImplementationQualification
qualification ID
dependency-status entry
Corpus package identity
probe
matrix
```

Do not create a new machine-readable registry for “ordinary dependency”.

## Dependency validator

Update `scripts/verify/dependencies.mjs`.

Keep:

```text
Node builtins are not npm deps
workspace deps use workspace:
external direct deps use catalog:
catalog entry exists
single lock/package-manager authority
workspace package-manager policy
adopted routed providers obey their route
no silent duplicate provider for a singular architecture role
version-authority consistency
```

Remove the rule that every external package must have a Corpus/package-route identity or belong to a special repository-tooling exception.

Remove qualification-status/RoleDecision checks whose only effect is to make ordinary package addition illegal.

`repositoryToolingPackages` may remain only if another real toolchain check needs it; it is not the universal escape hatch for non-routed dependencies.

## Dependency status document

Do not purge existing adopted future role decisions. They are Architecture knowledge.

Review `implementationQualification` semantics in current docs so `REQUIRED` means a concrete provider/product property genuinely still requires qualification, not “every adopted library must eventually pass a ceremony.”

Ordinary graph/TOML/helper libraries may remain in the role file if they already encode a useful adopted route; future ordinary dependencies do not need new rows merely by existing.

## Engineering guidance

State plainly:

> Dependency count is not a quality metric.

> Avoiding a suitable mature dependency by owning generic mechanics transfers maintenance burden into Heptalogos.

> Qualification resolves a concrete uncertainty or proves a claimed provider/platform/artifact boundary; it is not an entrance exam for an npm package.
