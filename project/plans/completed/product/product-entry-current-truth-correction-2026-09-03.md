# Product Entry Current-Truth Correction

```yaml
state: COMPLETED
date: 2026-09-03
authority: user-designated Product Entry Current-Truth Correction
scope: bounded current-tree correction before one-real-provider enablement
```

## Current context

The current `master` checkout is the implementation authority for this work.
Foundation is closed, the headless Product Host and initial Management surface
exist, and the current Management Spec defines a one-Administrator
SystemAction plan/execute path. Cedar remains an adopted future policy
mechanics route; a generic durable ApprovalService and generic
ManagementOperation are not current Product prerequisites. The current
Roadmap and current Authority documents must express that truth without
reopening Foundation or creating a new stage.

`@heptalogos/execution-lineage` is the sole semantic/type/schema owner for
`LineageContextRef`. The existing Management wire shape is the same contract,
not a transport-specific semantic variant; Management will import the
canonical type and schema directly. OpenAPI and the generated client remain
derived projections. No compatibility alias, adapter layer, durable-shape
change, or second contract is authorized.

## Authorized changes

1. Rewrite the Roadmap's current Management hard edge and broader-management
   sequencing so current SystemAction plan/execute and the owning Service are
   sufficient for the current slice. Policy, Approval, and durable operation
   semantics remain conditional on a real current consumer/requirement; the
   adopted Cedar future role remains documented.
2. Export the existing canonical Lineage type/schema from
   `execution-lineage`, make `management` consume them directly, remove its
   duplicate type/schema, update package references and tests, and regenerate
   the Product Host OpenAPI/client projections through the existing generator.
3. Remove the unnecessary `as unknown as Promise<...>` conversions from
   `management-client/src/client.ts` by using Hey API's generated
   `RequestResult` inference and exact literal options. If the generated API
   has a real typing limitation, record the concrete limitation and keep any
   workaround local to that call site.
4. Replace development-stage identities in current Specs, conceptual
   Architecture, indexes, Roadmap, and current qualification projection with
   capability/product meaning. Historical Plan and Qualification filenames and
   historical chronology remain untouched.
5. Update the root README's current identity to Foundation closed, headless
   Product Host/initial Management present, Product/Subject development next,
   persistent AI Subject in real IM as the research object, and Coding-Agent
   Harness as engineering support.
6. Inspect Management root exports for clearly internal persistence rows and
   remove only a row export with no current legitimate external consumer and a
   direct reduction in public semantic surface. Do not perform a general API
   audit.

## Affected owners and proof

- Normative Management meaning: `specs/management/system-authority.md`.
- Canonical Lineage meaning and schema: `packages/execution/execution-lineage`
  and `specs/execution/execution-lineage.md`.
- Management package contract/service: `packages/system/management`.
- OpenAPI/client projection: `packages/application/product-host` and
  `packages/application/management-client`.
- Current sequence and work authorization projections:
  `project/roadmap/`, `project/qualification/results/`, `README.md`,
  `specs/INDEX.md`, and affected `docs/architecture/` pages.

Run only claim-matched local checks:

```text
pnpm nx run execution-lineage:test --skip-nx-cache
pnpm nx run management:test --skip-nx-cache
pnpm nx run management-client:test --skip-nx-cache
pnpm nx run product-host:test --skip-nx-cache
pnpm nx run repository:check:product-artifacts --skip-nx-cache
pnpm check:knowledge
pnpm check:repo
pnpm verify
```

These checks prove repository/type/schema/package behavior only. Release-form,
source-less, cross-platform, live-provider, OpenClaw, and other deferred
qualification claims remain `NOT_RUN` and are not run by this Plan.

## Closure record

```yaml
execution_lineage_focused_tests: PASS
management_focused_tests: PASS
management_client_focused_tests: PASS
product_host_focused_tests: PASS
affected_typechecks: PASS
openapi_and_generated_client_drift: PASS
repository_check_repo: PASS
repository_verify: PASS
plan_gap: NONE
next_eligible_product_work: one-real-provider enablement
```

The Product Host integration target ran its existing local scenarios during
`pnpm verify`; this correction did not run or upgrade any release-form,
source-less, cross-platform, live-provider, or OpenClaw qualification claim.
Those deferred boundaries remain `NOT_RUN`. No provider implementation was
started.

## Non-goals and stop condition

This Plan did not authorize P1R, release qualification, cross-platform
qualification, Independent Review, Cedar/Approval/ManagementOperation/
ConfigurationService/SecretService/NetworkAccess/AIRuntime/Subject/Messaging
implementation, OpenClaw integration, GUI, lifecycle/package/recovery work,
new governance/validator/gate/Skill, or unrelated cleanup.

The canonical owner is singular, current consumers and projections are
synchronized, generated drift and affected checks are green, current
documentation no longer presents development stages as semantic identity, and
this Plan is now completed. The explicit next eligible product work is:

```text
one-real-provider enablement
```

Do not begin that provider work as part of this Plan. STOP.
