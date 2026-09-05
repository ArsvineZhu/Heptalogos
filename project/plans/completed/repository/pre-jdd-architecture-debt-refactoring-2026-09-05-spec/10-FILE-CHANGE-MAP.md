# 10 — Expected File Change Map

This is an execution map, not a requirement to preserve exact filenames when a
nearby current structure makes an equivalent placement clearly better.

## 1. Repository / plan truth

Expected:

```text
project/plans/INDEX.md
project/roadmap/development-roadmap.md
project/plans/active/pre-jdd-architecture-debt-refactoring/*
```

On completion, move/archive under current completed-plan convention.

## 2. Packaging

Primary files:

```text
scripts/package/assemble-portable-product.mjs
package.json
integration/product-host/project.json
integration/product-host/qualification/portable-product.qualification.test.ts
```

Potential support:

```text
integration/product-host/support/*
```

Delete obsolete private functions from assembler rather than moving them to
“legacy” helpers.

## 3. ProductHost / OpenClaw

Current:

```text
packages/application/product-host/src/subject-openclaw.ts
packages/application/product-host/src/subject-openclaw-plugin.ts
packages/application/product-host/src/host.ts
packages/application/product-host/package.json
```

Target additions:

```text
packages/application/product-host/src/subject-openclaw-projection.ts
packages/application/product-host/src/subject-openclaw-gateway.ts
```

`subject-openclaw.ts` remains as the narrow facade.

`host.ts` is only locally extracted where independent policy remains after
owner refactors.

## 4. Management

Current:

```text
packages/system/management/src/contracts.ts
packages/system/management/src/service.ts
packages/system/management/test/unit/management.test.ts
```

Expected additions:

```text
packages/system/management/src/system-actions/types.ts
packages/system/management/src/system-actions/catalog.ts
packages/system/management/src/system-actions/configuration.ts
packages/system/management/src/system-actions/secret.ts
packages/system/management/src/system-actions/ai-runtime.ts
packages/system/management/src/system-actions/subject.ts
```

Optional contract split if it materially improves local reasoning:

```text
packages/system/management/src/contracts/*
```

Do not create an exported compatibility `contracts.ts` forwarding layer if the
package root can directly re-export current modules. Internal relative imports
should migrate to current paths.

## 5. Subject

Current:

```text
packages/product/subject/src/contracts.ts
packages/product/subject/src/service.ts
```

Expected:

```text
packages/product/subject/src/repository.ts
packages/product/subject/src/authority.ts
packages/product/subject/src/reaction-executor.ts
packages/product/subject/src/communication-executor.ts
packages/product/subject/src/service.ts
```

Update package tests and README as needed.

## 6. Messaging

Current:

```text
packages/product/messaging/src/service.ts
```

Expected:

```text
packages/product/messaging/src/repository.ts
packages/product/messaging/src/cursor.ts
packages/product/messaging/src/service.ts
```

## 7. AIRuntime

Current:

```text
packages/system/ai-runtime/src/service.ts
```

Expected:

```text
packages/system/ai-runtime/src/repository.ts
packages/system/ai-runtime/src/routing.ts
packages/system/ai-runtime/src/invocation.ts
packages/system/ai-runtime/src/service.ts
```

## 8. ProductHost integration tests

Current:

```text
integration/product-host/test/product-host.integration.test.ts
```

Target:

```text
integration/product-host/test/management-auth.integration.test.ts
integration/product-host/test/management-runtime.integration.test.ts
integration/product-host/test/management-ai-actions.integration.test.ts
integration/product-host/test/subject-chat.integration.test.ts
integration/product-host/test/subject-reentry.integration.test.ts
```

Delete the old monolithic file after scenario migration. Do not keep it as an
aggregating importer.

## 9. Explicit KEEP packages

Do not restructure these merely for consistency:

```text
packages/runtime/runtime-kernel/
packages/execution/work-queue/
packages/bootstrap/private-postgres/
packages/data/persistence/
packages/system/configuration/
```

Normal import/test edits caused by changed contracts are allowed; architecture
churn is not.

## 10. Likely documentation owners

Update only if current implementation truth changes:

```text
docs/architecture/subject.md
docs/architecture/platform-distribution.md
docs/product/external-integrations.md
specs/subject/reaction-behavior.md
packages/application/product-host/README.md
packages/product/subject/README.md
packages/product/messaging/README.md
packages/system/management/README.md
packages/system/ai-runtime/README.md
```

Do not add “this was refactored from…” history to canonical docs.
