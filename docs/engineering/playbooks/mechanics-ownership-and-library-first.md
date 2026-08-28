# Mechanics Ownership and Library-First

## When to use this playbook

Use this playbook before adding or expanding generic mechanics in product,
repository-tooling, script, or executable Agent code. It applies to schema and
parsing, filesystem discovery, process execution, concurrency, retry/backoff,
graphs, state machines, lifecycle/disposal, serialization, queues, protocol
clients, and observability context propagation.

This playbook does not move Heptalogos semantic Authority into a framework.
The semantic owner remains responsible for product meaning and invariants.

## Five-minute mechanics preflight

1. Name the semantic owner and the mechanic needed.
2. Search the target package, workspace exports, `packages/INDEX.md`, and the
   target README for an existing primitive.
3. Read `docs/dependencies/dependency-routing.json` and
   `docs/dependencies/implementation-routing.md`.
4. Check the adopted Standard/Node/OS or library route and its adapter owner.
5. Decide `reuse`, `extend owner`, `adopt library`, `thin glue`, or `custom`.
6. Record explicit evidence before writing custom high-risk mechanics.

The required order is:

```text
existing Heptalogos owner
→ adopted dependency route
→ Standard / Node / OS facility
→ mature library behind a narrow adapter
→ composition of mature primitives
→ custom implementation with explicit evidence
```

## How to search owners

Search by semantic role and mechanic, not only by the helper name. Use `rg` for
the package and workspace, inspect exports and README ownership, then trace the
callers. In an indexed repository, use CodeGraph before text search when
understanding symbols or call paths.

Classify the result as:

```text
semantic owner     product meaning and Authority
mechanics provider generic implementation facility
adapter owner     Heptalogos boundary and policy mapping
consumer          caller that must not bypass the route
```

## How to decide extend-owner vs new library vs custom

Extend the existing owner when it already owns the mechanic and only lacks a
reusable operation. Prefer an adopted library when the role is already routed
or when it materially deletes concurrency, lifecycle, parsing, graph, process,
or recovery burden. Keep thin glue custom when it is only semantic mapping
around a standard primitive.

For a genuinely new generic role, compare the Standard/Node/OS facility and at
least one maintained mature library when the mechanic is more than trivial
adapter glue. Consider maintenance, tests, failure surface, platform closure,
upgrade risk, and authority leakage. A custom choice needs explicit rationale
in the governing plan or current change notes.

## How to handle duplicate implementation found during unrelated work

Stop adding the duplicate. Identify the owner, verify semantic equivalence, and
either move the consumer to the owner or record why the mechanics are locally
different. If the owner lacks the required operation, extend the owner and test
it there. Do not create `utils`, `common`, or `shared` packages solely to erase
textual duplication.

## How to record a justified custom mechanic

Record:

- semantic owner and adapter owner;
- existing internal owner and adopted route checked;
- Standard/Node/OS facility considered;
- mature library considered when applicable;
- exact semantic difference or hard blocker;
- why the custom surface is smaller and safer;
- owner, tests, cancellation/disposal, and future deletion boundary.

High-risk custom mechanics include locking, process supervision,
lifecycle/disposal, concurrency, retry/backoff, graph/DAG, schema parsing,
filesystem atomicity, crypto, protocol parsing, database pooling/transactions,
durable queues, watchers, and package acquisition.

## How to remove a replaced mechanic in PRE_PRODUCTION

Delete the replaced implementation, update current callers and tests, remove
obsolete exports and direct dependency declarations, and reset/recreate
project-owned development state when a durable shape changed. Do not add a
legacy reader, alias, deprecated wrapper, bridge, fallback parser, or dual
reader/writer unless `docs/governance/compatibility-obligations.json` declares
the obligation.

## Examples from SchemaRuntime / repo-kit / XState / Cordis

- Schema validation: `schema-runtime` owns Ajv/TypeBox configuration and
  compilation. Bootstrap packages consume its root and `./typebox` surfaces.
- Repository tooling: `repo-kit` composes Execa, `yaml`, and `tinyglobby` with
  repository policy. Nx owns project discovery, task graph, and scheduling.
- Complex local FSMs: XState owns transition mechanics behind the owning
  package; Heptalogos owns the state meaning and public contract.
- Trusted in-process lifecycle: Cordis owns Fiber/context/effect disposal
  mechanics behind `runtime-substrate`; Runtime Kernel owns reconciliation,
  generations, readiness, and quiescence semantics.

## Verification checklist

- [ ] Owner and route are recorded before implementation.
- [ ] Public contracts contain Heptalogos types, not framework objects.
- [ ] Existing owner tests cover any extension.
- [ ] Replaced mechanics and obsolete exports/dependencies are deleted.
- [ ] Custom high-risk mechanics have explicit rationale and bounded cleanup.
- [ ] Focused owner/consumer tests run.
- [ ] `pnpm check:duplicates` and `pnpm check:unused` run when applicable.
- [ ] Affected lint, typecheck, repository gates, and `pnpm verify` run before
      candidate closure.
