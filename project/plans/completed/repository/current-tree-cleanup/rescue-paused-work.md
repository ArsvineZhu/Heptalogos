# Rescue the Paused Work

The Coding Agent was paused while executing a revoked cleanup. Preserve the worktree first; do not continue either superseded bundle.

## Establish the local reality

Run:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -20
git diff --stat
git diff --name-status
```

Identify changes attributable to the revoked cleanup separately from work that existed before it.

The audited remote baseline is:

```text
bcb5a2ba65ba929f39373da9781ddd3248936741
```

Use that baseline as a source for restoring wrongly changed content, not as permission to discard local work.

Do **not** run `git reset --hard`.

## Restore semantic/product changes caused only by the revoked cleanup

If the revoked cleanup modified these product/runtime surfaces because it instructed semantic deletion, restore their pre-cleanup content before proceeding:

```text
packages/runtime/runtime-substrate/**
packages/runtime/runtime-kernel/**
packages/system/management/**
packages/application/product-host/**
packages/application/management-client/**
packages/application/cli/**
packages/data/persistence/**
packages/execution/**
integration/**
```

Specifically restore any revoked deletion/change of:

```text
CapabilityRegistry and Capability contracts
OperatingMode
RuntimeSubstrate track/disposal/settlement/failure semantics
RuntimeGraph / CapabilityGraph
Management capability or operating-mode projections
product-package internal test seams
product integration scenarios
```

Do not “improve” these surfaces during rescue.

## Restore useful tooling removed only by the revoked cleanup

Restore if necessary:

```text
.jscpd.json
jscpd dependency/catalog/lock entries
check:duplicates
Knip / check:unused
check:boundaries
check:package-layout
check:agents
toolchain:check
TS6 compatibility lane
TypeDoc checks
```

This final cleanup keeps them unless another file in this bundle explicitly changes their orchestration.

## Reconcile governance/tooling edits instead of blindly reverting them

Changes under these areas may overlap with the final cleanup:

```text
AGENTS.md
.agents/**
project/governance/**
project/engineering/**
project/plans/**
project/qualification/**
project/dependencies/**
scripts/verify/**
tools/repo-kit/**
.github/workflows/**
project.json
package.json
pnpm-workspace.yaml
```

Keep only changes authorized by this bundle. Restore other revoked-plan changes.

No rollback manifest, incident ledger, tombstone detector, or permanent “revoked spec” check is created.
