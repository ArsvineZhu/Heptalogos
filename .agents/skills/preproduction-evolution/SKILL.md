---
name: preproduction-evolution
description: Use when replacing a current internal PRE_PRODUCTION contract, schema, durable shape, API, package path, parser, fixture, or executable identifier.
---

# PRE_PRODUCTION Evolution

## Why this procedure exists

Coding Agents tend to preserve a project's own recent development shape as if
it were an external compatibility obligation. In PRE_PRODUCTION that creates
aliases, dual readers, stale names, and two competing current truths. This
Skill performs a deliberate replacement of the current internal shape.

## Ordered workflow

1. Read `CompatibilityEpoch` and inspect the declared obligations in
   [`compatibility-obligations.json`](../../../docs/governance/compatibility-obligations.json).
2. Identify the one current canonical shape, its version fields, owner, and
   current executable identifiers.
3. Find every current caller, reader, writer, test, fixture, baseline, doc,
   index, and validation input.
4. Update current callers and tests to the canonical shape.
5. Rewrite or squash the development database/schema baseline when durable
   state changed.
6. Reset or recreate project-owned development/test state when the new shape
   requires it.
7. Delete obsolete readers, writers, migrations, aliases, fallback parsers,
   package paths, tests, documentation routes, and migration-only checks.
8. Search the maintained current tree for obsolete identity or route residue.
9. Run the current verification and record only the evidence it exercised.

## Compatibility decision

An obligation is real only when the compatibility register declares it or an
external/current consumer is explicitly governed by a current contract. A
previous commit, branch, developer database, local fixture, or prior build is
not an obligation. A version field may remain required by the current contract;
versioning alone does not require a legacy reader.

If an actual retained consumer conflicts with the PRE_PRODUCTION replacement,
stop with `PLAN_GAP` until the plan and Authority decide the obligation. Do not
silently invent a bridge.

## Shape replacement checks

| Change                          | Replace all of these together                                                |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Internal API/field rename       | public/current callers, tests, docs, and identifiers                         |
| Schema or durable-state change  | canonical schema, baseline, fixtures, project-owned DB, readers/writers      |
| Package move/rename             | imports, package metadata, indexes, docs, and old path                       |
| Parser contract change          | canonical codec, validation inputs, fixtures, and obsolete parser behavior   |
| Lifecycle/durable status change | owner Spec, transitions, persistence, recovery tests, and stale status names |

The replacement is incomplete while two internal routes can both represent
current truth.

## Output

```text
Compatibility epoch and declared obligations:
Current canonical shape/version:
Current consumers/readers/writers:
Owner and mutation Authority:
Baseline/state reset action:
Callers/tests/fixtures/docs updated:
Obsolete paths deleted:
Residue search:
Verification claim and state:
```

Read [`durable-state-change`](../durable-state-change/SKILL.md) for restart-
visible state and [`documentation-maintenance`](../documentation-maintenance/SKILL.md)
for current documentation routes.
