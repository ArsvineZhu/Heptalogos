# H-stage Stabilization Closure

This playbook governs the short, bounded stabilization pass required before an
Hn functional milestone can close. It is the operational companion to the
approved Hn-S plan and the repository-wide branch/PR policy.

## Scope and invariants

- Use a short-lived `dev/h<n>-stabilization` branch and one Draft PR.
- Default to one bounded stabilization plan. Use a control record and serial
  phase plans only when ordered independent phases are genuinely required.
- When a control record exists, execute only the plan named by its
  `governingPlan`; do not run a later phase early.
- Complete every repository mutation before Independent Review begins.
- Treat `Hn-S` as short and bounded; defer new subsystem, architecture
  expansion, and next-milestone capability work.
- `ReviewCandidate` is the complete exact pair `(base_sha, head_sha)`, not head
  SHA alone.

## Procedure

1. Confirm the exact baseline and clean worktree, then create or verify the
   stabilization branch.
2. Install the approved plan, establish the activation record, and open one
   Draft PR without ordinary CI.
3. Execute the governing plan task-by-task. Use TDD for behavior changes,
   focused tests, static gates, and claim-matched qualification.
4. At each transition, move completed plans to `docs/plans/completed/`, update
   navigation and evidence, and open only the next phase gate.
5. Before candidate freeze, complete the mandatory sweeps below. A finding
   cannot be waived by a generic allowlist, baseline, suppression comment, or
   executor preference. An unresolved semantic choice is `PLAN_GAP` and stops
   execution.
6. Mark every implementation and evidence mutation complete before freeze. Run
   the final local gates and record deferred product boundaries as `NOT_RUN` or
   `BLOCKED`, never as inferred `PASS`.
7. Freeze `ReviewCandidate = (base_sha, head_sha)` and request Independent
   Review of the full Hn-S diff on that exact pair. Implementing-agent
   self-review is not sufficient.
8. After Independent Review `PASS`, manually run final CI with the same
   `base_sha` and `target_sha`; dispatch `verify.yml` from the reviewed head
   branch/tag, never from `master`. Require Ubuntu, macOS and Windows jobs to
   pass, verify `headSha`, and record the run ID. Use
   `milestone-pr-closure.md` for provenance checks.
9. Immediately before squash merge, verify that the reviewed base and branch
   head still equal the exact pair and re-read PR metadata:

   ```text
   origin/master == REVIEWED_BASE_SHA
   PR base SHA == REVIEWED_BASE_SHA
   branch HEAD == REVIEWED_HEAD_SHA
   PR head SHA == REVIEWED_HEAD_SHA
   ```

   Any move or mismatch invalidates review and CI; update the candidate, rerun
   local gates, obtain new Independent Review, and rerun final CI.

10. Squash merge the single PR through the normal repository action, then delete
    the stabilization branch.
11. After merge, keep the behavior candidate immutable. Perform truth
    reconciliation only through a separate docs/evidence-only PR that changes
    no production code, tests, or behavior contract; cites external
    review/CI/merge evidence; runs repository/corpus/document gates; and
    changes Hn from OPEN to CLOSED only when the closure tuple actually
    occurred.

## Mandatory pre-freeze sweeps

These six steps are required before the final ReviewCandidate is frozen:

1. **Development-Provenance Residue Sweep** — current executable/canonical
   identities are semantic and contain no milestone/PR/session chronology.
2. **Undeclared-Compatibility Residue Sweep** — every compatibility-like path
   maps to a declared obligation; with an empty PRE_PRODUCTION register,
   project-history compatibility is removed/rejected.
3. **Closed-Phase / Dead Current-Tree Artifact Sweep** — one-time evidence,
   phase scripts, and ownerless archaeology are removed, not archived in the
   current tree.
4. **Hn cross-milestone architecture seam audit** — ownership, lifecycle,
   generation, dependency direction, and framework leakage remain within the
   approved Corpus/plan boundaries.
5. **Current-candidate claim-matched qualification** — current evidence names
   the candidate and environment; Historical Evidence remains separate.
6. **`pnpm check:hygiene` PASS** — the permanent zero-residue gate runs as part
   of `pnpm verify` and has no generic waiver mechanism.

The executor may not classify a new semantic ambiguity by preference. Stop as
`PLAN_GAP` and report the path, current behavior, references, and smallest
required decision.

## Final closure tuple

Hn closes only at the squash-merge event after all of these are externally
verified:

```text
implementation plans complete
+ local qualification complete
+ mandatory Hn-S sweeps complete
+ Independent Review PASS on exact (base_sha, head_sha)
+ manual final CI PASS on Ubuntu/macOS/Windows for the same pair
+ base_sha and head_sha unchanged immediately before merge
+ squash merge succeeds
```
