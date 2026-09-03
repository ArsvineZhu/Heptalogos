# Heptalogos Current-Tree Cleanup

**Status:** READY_FOR_EXECUTION  
**Repository:** `ArsvineZhu/Heptalogos`  
**Audited remote baseline:** `bcb5a2ba65ba929f39373da9781ddd3248936741`  
**Intended active location:** `project/plans/active/current-tree-cleanup/`

This bundle supersedes both previously supplied cleanup bundles in full:

```text
Heptalogos-Rapid-Evolution-Big-Cleanup-Spec
Heptalogos-Governance-Harness-Cleanup-v2
```

Neither superseded bundle is implementation authority.

## What this cleanup is

Heptalogos is an actively developed PRE_PRODUCTION research system. The repository has accumulated process artifacts, executor decision curricula, qualification/candidate ceremony, repository-history tombstones, development numbering, and tests that can outlive the reason they were created.

The cleanup is deliberately asymmetric:

```text
approved semantic capability
    preserve even before its first consumer when the Charter permits it

generic mechanics
    prefer mature providers and thin adapters

permanent process / gate / test / record
    require a current standing reason

development history
    belongs to Git and historical evidence, not current negative machinery
```

The target is the Charter's actual objective: **minimum total maintenance burden while preserving semantic capability and development velocity**.

## What this cleanup is not

It is not a product/runtime redesign. It does not authorize deletion of Capability, OperatingMode, RuntimeSubstrate lifecycle semantics, Host/Persistence Authority, WorkQueue, DBOS, Signal, Effect uncertainty, Management projections, or current product test seams merely because they have few consumers.

It is not a “delete as much as possible” exercise.

It is not a new governance framework. This bundle must not produce a linter, policy DSL, manifest, checklist database, tombstone registry, test registry, or new numbering scheme to enforce itself.

## Authority reading rule

Before editing, the executor must read and treat as actual constraints:

```text
project/governance/constitution.md
project/governance/project-charter.md
AGENTS.md
the affected current Specs
the relevant file in this bundle
```

The Charter is not background prose. If a local heuristic conflicts with it, the heuristic loses.

In particular:

- cheap approved future semantic seams may precede consumers;
- expensive future machinery needs current evidence;
- development history creates no compatibility obligation;
- tests prove contracts and do not create architecture;
- mature dependencies own generic mechanics where suitable;
- current Product/Architecture directions remain current even when the first Product slice does not instantiate them.

## Naming rule for this Plan itself

This bundle intentionally does not assign task numbers, phase numbers, qualification IDs, decision IDs, or test IDs.

Semantic names are enough.

Execution order is expressed only where one edit is a prerequisite for another.

## Bundle map

`rescue-paused-work.md` restores damage from the revoked plan without destroying unrelated local work.

`authority-and-cleanup-model.md` defines the semantics/machinery/history distinction the rest of the cleanup must obey.

`governance-and-plans.md` removes mandatory stabilization/review/candidate ceremony and aligns AGENTS/Charter/engineering guidance.

`coding-agent-skills.md` removes decision curricula and keeps only Skills with recurring executor value.

`repository-guards-and-tombstones.md` keeps useful deterministic guards while removing repository-history tombstones and duplicated policy.

`dependency-admission.md` keeps adopted architectural provider routes but removes qualification tax from ordinary libraries.

`qualification-evidence.md` removes the candidate-lifecycle ledger and numeric-ID default from current qualification.

`tests.md` governs test archaeology, ritual-Red removal, test tombstones, and proof ownership without setting a test-count target.

`current-tree-naming.md` removes development process numbering from current executable/test/control surfaces while preserving identifiers that genuinely need stable reference.

`execution.md` states prerequisites, final verification, PLAN_GAP boundaries, and STOP.
