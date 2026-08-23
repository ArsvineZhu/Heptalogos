# H-stage Stabilization Closure

This playbook governs the short, bounded stabilization pass required before an
Hn functional milestone can close. It is the operational companion to the
approved Hn-S control record and the repository-wide branch/PR policy.

## Scope and invariants

- Use a short-lived `dev/h<n>-stabilization` branch and one Draft PR.
- Execute only the phase plan named by the control record's `governingPlan`.
- Promote phase plans through the control record; do not run a later phase early.
- Complete all repository mutations before independent review begins.
- Treat `Hn-S` as short and bounded; defer new subsystem, architecture expansion,
  and next-milestone capability work.

## Procedure

1. Confirm the exact baseline and clean worktree, then create or verify the
   stabilization branch.
2. Install the approved spec and phase plans, establish the control record,
   and open one Draft PR without ordinary CI.
3. Execute the governing phase plan. Use local tests, static gates and
   claim-matched qualification; ordinary phase commits do not dispatch CI.
4. At each transition, move the completed plan to `docs/plans/completed/`,
   update the control record and navigation, and open only the next phase gate.
5. Mark every implementation and evidence mutation complete before candidate
   freeze. Run the final local gate and record deferred product boundaries as
   `NOT_RUN` or `BLOCKED` rather than inferring `PASS`.
6. Freeze `ReviewCandidate = (base_sha, head_sha)` and request independent
   review of the full Hn-S diff on that exact pair. The implementing agent's
   self-review is not sufficient.
7. After review PASS, manually run final CI with the same `base_sha` and
   `target_sha`; require Ubuntu, macOS and Windows jobs to pass.
8. Immediately before squash merge, verify that the reviewed base and branch
   head still equal the exact pair. A move of either invalidates review and CI;
   rebase/update, rerun local gates, obtain new independent review and rerun
   final CI when this occurs.
9. Squash merge the single PR through the normal repository action, then delete
   the stabilization branch.
10. Perform post-merge reconciliation read-only. Verify PR merge state, exact
    review and CI candidate identity, ordering of gates before merge, absence of
    later candidate commits, and branch deletion. Do not add a repository
    commit merely to record review, CI or merge outcomes.

## Final closure tuple

Hn closes only at the squash-merge event after all of these are externally
verified:

```text
implementation plans complete
+ local qualification complete
+ independent review PASS on exact (base_sha, head_sha)
+ manual final CI PASS on Ubuntu/macOS/Windows for the same pair
+ base_sha and head_sha unchanged immediately before merge
+ squash merge succeeds
```
