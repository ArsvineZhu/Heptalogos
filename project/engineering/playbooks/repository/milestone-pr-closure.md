# Milestone closure

This playbook governs the bounded Branch → Draft → external Review → Merge
sequence. It is the operational companion to the repository AGENTS contract.

## Procedure

1. Start from the current base and install the explicitly approved Plan.
2. Make the bounded implementation changes and run the local tests and gates
   required by that Plan.
3. Complete claim-matched qualification, provenance/hygiene sweeps, and
   current-link checks before marking the candidate Ready.
4. The authorized external Independent Reviewer supplies an out-of-band PASS
   or REQUEST_CHANGES verdict. GitHub Pull Request reviews, approvals,
   requested reviewers, comments, and status checks are not this verdict.
5. On REQUEST_CHANGES, return to Draft, make only bounded corrections, rerun
   affected evidence and gates, and request a new external verdict.
6. On external PASS, verify the candidate has not changed and that local
   repository gates and any explicitly required qualification remain current.
   Ordinary GitHub Actions are disabled and are not a closure requirement.
7. Merge only while the candidate is open, Ready, current, and conflict-free.
   Any branch or base movement after review invalidates the verdict; return to
   Draft, requalify, and obtain a new verdict.
8. Reconcile current truth through the canonical knowledge and qualification
   owners without changing a reviewed behavior candidate.

## Completion and reopen

Close when the approved change, acceptance criteria, executable proof, and
required evidence are complete with no admitted blocker. Reopen only for new
current evidence, a failing current executable path, an accepted current
failure case, a current consumer or invariant, or an explicit Plan requirement.
Theoretical completeness, generic future-proofing, and recovery-of-recovery do
not reopen a completed change.

## Evidence boundary

Use PASS, FAIL, NOT_RUN, or BLOCKED only for evidence that actually ran. A
cross-platform or live-provider claim requires the corresponding executed
environment; no workflow dispatch or GitHub object is inferred as proof.
