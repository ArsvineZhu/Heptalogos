# Execution

There are no numbered phases or task IDs in this Plan.

The following are prerequisite relationships only.

## Rescue precedes all cleanup

Complete `rescue-paused-work.md` first so the invalid semantic deletions from the revoked Plan are gone while unrelated local work remains intact.

## Authority text precedes dependent tooling

Apply `governance-and-plans.md` before rewriting Skills, tests, qualification, or validators. The repository must first encode the correct Charter interpretation:

```text
approved semantic seam may precede consumer
history does not create Authority
ritual Red has no value
ordinary dependency is not guilty by default
```

## Skills, qualification, dependency admission, and repository guards may then be reconciled

They are independent enough to edit in coherent groups.

Do not run full repository verification after every file. Use focused syntax/unit checks as needed while editing.

## Test archaeology follows removal of obsolete governance/tooling

First delete tests that directly belong to removed checks, candidate workflow, qualification ledger, tombstones, and Skills.

Then inspect remaining tests for TDD/implementation residue. This prevents spending time classifying tests for machinery that is already being removed.

## Current docs are updated only when made stale

Update current owner/projection documents affected by the final state.

Do not perform a repository-wide prose rewrite.

Do not rewrite historical Plans/evidence to erase history.

## Verification for this cleanup

Because this cleanup changes the control plane itself, run the scoped checks it modifies:

```bash
pnpm install --frozen-lockfile

pnpm check:agents
pnpm check:knowledge
pnpm check:repository
pnpm check:package-layout
pnpm check:hygiene
pnpm check:dependencies
pnpm check:boundaries
pnpm check:duplicates
pnpm check:unused
pnpm toolchain:check
```

Run the final ordinary code-health entrypoint after its graph is updated:

```bash
pnpm verify
```

If `docs:api:check` or the TS6 lane remains part of `check:repo`, run `pnpm check:repo` once as the final repository/control-plane audit. Do not require those scoped lanes separately again.

Do not require:

```text
Independent Review
candidate freeze/revalidation
PR candidate ceremony
cross-platform GitHub Actions execution
source-less/provider qualification unrelated to this cleanup
a second hardening pass
```

The manual three-OS workflow only needs to remain syntactically/currently valid; it does not need to be dispatched for this cleanup.

## Completion conditions

The cleanup is complete when:

- product/runtime semantics wrongly targeted by the revoked Plan are restored;
- Charter/AGENTS explicitly reject `no consumer -> delete` as a universal rule and reject ritual Red testing;
- cheap approved future semantic seams remain intact;
- mandatory Hn-S/candidate-freeze/Independent-Review ceremony is no longer standing current governance;
- active Plans use semantic names and decision completeness without mandatory bureaucracy;
- the six decision/meta Skills named in `coding-agent-skills.md` are deleted;
- retained Skills are executor procedures and do not own upstream decisions;
- `jscpd`, Knip, TypeScript, lint, boundary checks and other useful guardrails remain;
- current-tree hygiene no longer contains exact historical artifact tombstones or crude compatibility-word policing;
- no current validator/test remembers `GENESIS_EVIDENCE.json` or `scripts/phases` merely to keep them absent;
- the compatibility register can represent a real declared obligation instead of requiring the set to stay empty forever;
- PR-candidate choreography is removed from manual CI/repository validation;
- ordinary `pnpm verify` is code-health oriented, while `check:repo` is explicit comprehensive control-plane auditing;
- ordinary mature dependencies can be added through the catalog without new RoleDecision/qualification bureaucracy;
- adopted architectural provider routes remain authoritative;
- `qualification-status.json` is gone and no replacement candidate-lifecycle ledger exists;
- new qualification guidance is property-based and semantic-name-first;
- retained current tests have semantic names rather than development scenario numbers where touched;
- exact tombstone/process tests are deleted;
- clear ritual-TDD/implementation-only residue found during archaeology is removed;
- ambiguous product-semantic tests are preserved rather than guessed away;
- no new policy framework, registry, matrix, numbered taxonomy, tombstone guard, or meta-test is created;
- final verification passes.

Then STOP.

## PLAN_GAP boundary

Stop only the affected branch if execution requires a new product semantic decision, a new durable semantic distinction, a new provider role, a real undeclared external compatibility obligation, or a broader failure model not decided here.

Also stop if the local paused work cannot be safely separated from pre-existing user changes.

Do not raise `PLAN_GAP` because:

```text
an old process looked safer
a deleted Skill contained generally good advice
a historical Q/C/H/T identifier still exists in history
an ordinary dependency lacks a qualification ID
a deleted tombstone gate once prevented a specific old path
a test was previously counted in a qualification matrix
fewer permanent tests/checks feel less rigorous
```

Do not create follow-up cleanup work after acceptance. Report only genuine unresolved product-code candidates in the final response and stop.
