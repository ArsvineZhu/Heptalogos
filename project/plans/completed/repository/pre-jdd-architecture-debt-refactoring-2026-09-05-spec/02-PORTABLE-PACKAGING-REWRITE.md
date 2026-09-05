# 02 — Portable Packaging Rewrite

## 1. Required outcome

A Product package operation must be:

```text
source workspace
  └─ read/build input only

pnpm-native dependency closure
  ↓
assembly staging
  ↓
portable Product root
```

It must never be:

```text
mutate source workspace
→ deploy
→ repair source workspace
```

## 2. Keep the Product root semantics

Retain the current logical portable profile:

```text
Heptalogos/
├─ bin/
├─ program/bootstrap/<generation>/
├─ program/product/<generation>/
├─ runtime/node/
├─ runtime/postgresql/
├─ runtime/openclaw/
├─ config/
├─ data/
├─ secret/
├─ logs/
├─ cache/
├─ run/
├─ backup/
├─ licenses/
└─ manifest.json
```

Physical co-location in the portable profile does not merge logical ownership.

Retain private Node, PostgreSQL, and OpenClaw. Do not introduce runtime
`pnpm install`, npm install, registry fetch, or developer PATH dependency.

## 3. Replace dependency deployment

### 3.1 Primary route

Use exact repository-pinned `pnpm@11.24.0` modern deployment with command-scoped
workspace injection.

The implementation may normalize CLI argument order, but semantically it is:

```bash
pnpm \
  --filter @heptalogos/product-host \
  --config.inject-workspace-packages=true \
  --prod \
  deploy <product-host-stage>
```

Keep `--ignore-scripts` if the pinned CLI accepts it for this path and the
current closure remains valid.

### 3.2 Prove the primary route before deleting the old path

Run one narrow probe against the built current package and inspect:

- exit status;
- `node_modules` closure exists;
- workspace dependencies are materialized inside target;
- every runtime symlink resolves inside target;
- `node <target>/dist/bin.js --help` or an equivalent non-destructive entrypoint
  resolves its dependency closure without the source workspace;
- source workspace does not require reinstall/repair afterward.

This probe is development evidence, not a permanent gate.

### 3.3 If direct modern deploy fails

Use the pre-authorized disposable staging workspace described in Decision D05.

Do not keep both direct and fallback as runtime-selectable product modes.

Implementation rule:

- if direct modern deploy is proven on the repository shape, ship only it;
- use disposable staging only if exact evidence proves direct modern deploy
  insufficient;
- if staging becomes necessary, make it the one official assembly path and
  delete direct/legacy alternatives.

No permanent “try A, silently fall back to B” packaging behavior.

## 4. Delete obsolete assembler machinery

On the accepted path, remove:

- workspace-manifest preservation/restoration;
- local `workspace:` rewriting;
- post-deploy source `pnpm install`;
- hoisted-layout assumptions;
- self-link deletion added only to repair legacy deploy;
- deletion of `.modules.yaml` / `.pnpm/lock.yaml` only to disguise a pnpm
  deployment;
- source-tree node_modules traversal for artifact closure.

The target may legitimately contain pnpm's localized virtual store if all links
and runtime resolution remain inside the target.

## 5. License and dependency inventory

Use package-manager-supported metadata where it reduces layout coupling:

```bash
pnpm licenses list --prod --json
```

The final Product still needs actual license text inventory where currently
required.

Allowed approach:

1. use `pnpm licenses list --prod --json` for dependency/license metadata;
2. collect license text only from the **deployed target closure**;
3. canonical-path deduplicate files;
4. do not inspect the source workspace dependency graph to infer the Product
   closure.

Do not build a custom dependency graph resolver.

## 6. Assembly integrity checks

The assembler must reject:

- missing private Node/PostgreSQL/OpenClaw roots;
- version mismatch against current Product pins;
- source links escaping the candidate root;
- missing ProductHost entrypoint;
- missing required manifests/licenses;
- a candidate that needs global Node/PostgreSQL/OpenClaw/pnpm/npm at runtime.

Artifact verification may inspect symlink targets, manifests, exact runtime
versions, and launcher behavior.

## 7. Formal recurring qualification target

Add a manual target to `integration/product-host/project.json`:

```text
product-host-integration:qualify-portable
```

It is NOT part of the default ProductHost `test` target or ordinary
`pnpm verify`.

Add root command:

```json
"qualify:portable": "node scripts/verify/run-nx.mjs run product-host-integration:qualify-portable"
```

The target may run a dedicated Vitest qualification file so it can reuse the
existing real ProductHost and deterministic local provider fixtures.

Suggested file:

```text
integration/product-host/qualification/portable-product.qualification.test.ts
```

Do not turn this into a generic qualification framework.

## 8. Qualification scenario

The manual target must:

1. build current Product packages;
2. assemble one Product root;
3. copy/move the acceptance candidate to a fresh OS TEMP directory outside the
   repository;
4. run with PATH stripped of developer Node/PostgreSQL/OpenClaw/pnpm/npm;
5. launch through the stable Product launcher;
6. claim first administrator and login;
7. configure the deterministic local model gateway through normal Management
   SystemActions;
8. bind primary and Expression models;
9. start Subject;
10. prove one `NO_COMMUNICATION` terminal Reaction with no CommunicationCommit;
11. prove one `COMMUNICATE` path with one CommunicationCommit, Expression, and
    one outbound MessageFact;
12. stop through a normal console/product shutdown path;
13. prove Product-owned Node/OpenClaw/PostgreSQL children are gone;
14. restart the same candidate position;
15. prove InstallationId and SubjectId continuity and new BootId;
16. prove a post-restart Subject interaction;
17. clean the qualification TEMP root after evidence capture.

Keep exactly truthful platform scope. This Plan requires Windows x64 because
that is the currently proven source-less platform. Other operating systems
remain NOT_RUN unless actually executed.

## 9. Source-workspace invariance proof

Before packaging, capture the relevant source-workspace state. After packaging,
prove:

- no tracked source file changed as a side effect;
- package manifests were not temporarily rewritten;
- no repair `pnpm install` was needed;
- the current development dependency graph still works with a focused command.

A dirty working tree is allowed during development; compare before/after state
rather than requiring an artificially clean checkout.

## 10. Acceptance

Packaging is complete only when the previous real Product claims still hold
with the new closure and the legacy deployment/repair code is gone.
