# Pre-production stabilization closure

This playbook governs a short, bounded PRE_PRODUCTION stabilization pass. It
does not make ordinary GitHub Actions a closure dependency.

## Scope and completion

- Use one bounded Plan and one short-lived implementation candidate.
- Complete planned repository mutations before external review.
- Defer new subsystem, next-Horizon capability, and generic hardening work.
- Close when the Plan, acceptance criteria, required local qualification,
  repository gates, and admitted blockers are complete.
- Reopen only for new current evidence, a failing current executable path, an
  accepted current-Horizon failure case, a current consumer or invariant, or an
  explicit active-Plan requirement.

The default after a green bounded stabilization is STOP. Recovery-of-recovery,
imagined edge cases, and failures inside newly added recovery do not reopen it
by themselves.

## Procedure

1. Confirm the current baseline and approved Plan.
2. Execute the Plan with claim-matched focused tests, static checks, and
   qualification. TDD may be useful for a deterministic contract but is not a
   universal workflow law.
3. Complete provenance, compatibility, archaeology, ownership, dependency, and
   current-evidence sweeps.
4. Record only PASS, FAIL, NOT_RUN, or BLOCKED for executed checks.
5. Mark the candidate Ready and obtain the authorized external Independent
   Review verdict.
6. On REQUEST_CHANGES, return to Draft, make bounded corrections, rerun
   affected checks, and obtain a new external verdict.
7. On external PASS, complete any explicitly required local or provider
   qualification and repository gates. Ordinary GitHub Actions are disabled
   and are not a closure gate for this repository work.
8. Merge only while the candidate remains current, reviewed, open, and
   conflict-free. Any mutation after review invalidates the verdict and
   requires a new bounded review cycle.

## Evidence boundary

A mock or one-platform result proves only that boundary. Live provider,
process-restart, cross-platform, and source-less claims require their
corresponding executed proof. If an independent Coding-Agent runner is
unavailable, behavior evaluation is NOT_RUN rather than structural PASS.

## Closure conditions

approved Plan complete

- local/current qualification complete
- mandatory repository sweeps complete
- repository gates PASS
- external Independent Review PASS when the governing workflow requires it
- no candidate mutation after the verdict
- merge conditions satisfied
