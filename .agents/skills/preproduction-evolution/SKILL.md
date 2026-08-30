---
name: preproduction-evolution
description: Use when replacing a current internal PRE_PRODUCTION contract, schema, durable shape, or API.
---

# PRE_PRODUCTION Evolution

## Trigger

Load this Skill when a current internal shape must be replaced or its callers
must move to a new canonical contract.

## Required inputs

- `CompatibilityEpoch` and declared obligations;
- current canonical shape and all current callers/tests;
- development baseline and project-owned state;
- obsolete implementation and references.

## Procedure

1. Confirm `CompatibilityEpoch = PRE_PRODUCTION` and inspect
   [`compatibility-obligations.json`](../../../docs/governance/compatibility-obligations.json).
2. Define one current canonical shape and its version fields.
3. Update current callers, tests, fixtures, docs, and validation inputs.
4. Rewrite or squash the development baseline where durable state changed.
5. Reset or recreate project-owned development/test state when required.
6. Delete obsolete readers, writers, migrations, aliases, and parsers.

## Stop / escalation

Use `PLAN_GAP` when a real retained state or external consumer creates an
undeclared compatibility obligation, or when the plan does not decide the
canonical replacement. Do not preserve development history through a shim.

## Output

Report the obligation checked, canonical V1, updated consumers/tests, baseline
action, removed obsolete paths, and verification status.
