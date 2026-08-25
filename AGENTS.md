# AGENTS.md

Repository-wide execution contract for coding agents working on Heptalogos.
This file is intentionally small. It is not an architecture summary, roadmap,
or Skill router.

## 1. Working authority

For an implementation task, follow this order:

1. the current Architecture Corpus;
2. the explicitly approved active implementation plan;
3. current code/tests as implementation reality.

The Corpus owns semantics. The plan owns the authorized change sequence and
all task-specific decisions. Existing code and historical behavior do not gain
Authority merely because they already exist.

Execute the plan that the task explicitly names. Do not select another plan by
filename, recency, or convenience.

A plan must be decision-complete for non-trivial work. You may choose local
code organization only when alternatives are semantically equivalent. You may
not choose or reinterpret Authority, package boundaries, dependency roles,
compatibility policy, durable shapes, stable identities, lifecycle semantics,
stage scope, or verification claims. If a required non-trivial decision is not
resolved by Corpus + plan, stop and report `PLAN_GAP`; do not improvise.

If Corpus and plan conflict, stop and report the conflict.

## 2. Current tree is not development history

Current source, tests, test-support, fixtures, scripts, tooling, configuration,
workflow definitions, and current agent instructions must describe what the
system is now, not the milestone/PR/session that created them.

Do not leave development provenance such as milestone IDs, phase IDs,
corrective-cycle names, PR IDs, temporary migration names, or “new/old”
development labels in long-lived executable identities. Use semantic role names.

Git history, completed plans, and historical qualification records preserve
provenance. Do not keep one-time phase evidence or phase scripts in the current
tree solely as an archive.

## 3. PRE_PRODUCTION evolution

`CompatibilityEpoch = PRE_PRODUCTION`.
Current compatibility obligations are declared only in
`Architecture_Corpus/references/compatibility-obligations.json`.

No declaration means no obligation.

Project-owned development history — previous commits, branches, milestones,
local fixtures, developer databases, and previous local builds — does not
justify backward compatibility.

When a current contract/schema changes during PRE_PRODUCTION:

1. rewrite the current canonical shape;
2. update current callers/tests;
3. rewrite/squash the development migration baseline when applicable;
4. reset/recreate project-owned development state;
5. delete obsolete implementation.

Do not add legacy readers, compatibility shims, upcasters/downcasters, bridge
migrations, aliases, dual readers/writers, deprecated internal APIs, or fallback
parsers for project development history. Do not preserve such code merely
because it already exists.

Version fields remain required where architecture requires versioned contracts;
versioning does not itself create a backward-compatibility obligation.

## 4. Implementation constraints

Stay inside the approved plan. Do not opportunistically add capabilities,
packages, dependencies, compatibility paths, or architecture abstractions.

Use the existing semantic owner and mutation Authority. Do not create a second
Authority path or bypass owning services with direct SQL/filesystem/shell
mutation.

For generic mechanics, follow the adopted dependency route. Do not silently
replace an adopted library/framework with custom infrastructure. Keep framework
objects behind Heptalogos-owned contracts.

Any process-memory background work must have an owner and bounded
cancel/drain/dispose behavior. Anything that must survive restart requires the
Foundation-owned durable primitive specified by the Corpus/plan.

Behavior-affecting literals must follow the repository configuration policy;
do not hide product policy in incidental constants.

## 5. Verification and candidate integrity

Verification state is exactly:

`PASS | FAIL | NOT_RUN | BLOCKED`

Never report PASS for a command/scenario that did not run. Match evidence to the
claim: mocks do not prove live protocols; one OS does not prove another; a
development tree does not prove a source-less artifact.

Run the plan's focused tests while editing and all required permanent gates
before claiming completion. `pnpm verify` must remain locally runnable.

Do not dispatch ordinary CI. Follow the repository closure playbook for live
PR lifecycle, Independent Review, manual final CI, and squash merge.

PR candidate integrity is governed by PR lifecycle, not commit hashes in
documents.

Draft = mutable.
Ready = review candidate.

Independent Review evaluates the current live Ready PR. Any repository mutation
after Review PASS makes that review stale; return the PR to Draft before
continuing. Final manual CI runs only after Review PASS. Any PR-branch mutation
after final CI makes review and CI stale.

Do not copy commit SHAs into plans, qualification records, PR bodies, or Agent
instructions. Git/GitHub/CI may use revision identity internally.

When working under a workspace package, read its nearest AGENTS.md and README.md.
The local AGENTS.md refines this repository contract for that package; it does
not replace Corpus Authority.

## 6. Stop conditions

Stop instead of inventing a workaround when execution would require:

- changing Corpus semantics or resolving a Corpus conflict;
- making a non-trivial decision absent from the approved plan;
- adding/replacing a dependency or creating a new subsystem/package;
- declaring a new compatibility obligation or preserving an undeclared one;
- changing stage boundaries or pulling later-stage semantics forward;
- bypassing an owning Authority to make a test pass;
- claiming required evidence that cannot actually be produced.

Report the smallest concrete blocker and the evidence that exposed it.
