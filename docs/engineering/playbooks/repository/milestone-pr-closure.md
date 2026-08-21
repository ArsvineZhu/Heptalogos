# Milestone PR Closure

This playbook governs the Branch → Draft PR → Review → Manual CI → Squash
Merge closure sequence for milestone work. It is the operational companion to
the repository-wide policy in `AGENTS.md`.

## Procedure

1. Create `dev/<milestone>` from the current `master`.
2. Open a Draft PR early, but do not auto-run CI.
3. Use local tests and `pnpm verify` during development.
4. Manually use CI during Draft only for a concrete cross-platform regression
   or an explicit user request.
5. When implementation is complete and local gates are green, mark the PR
   Ready.
6. Stop and obtain independent review on the exact HEAD.
7. If review requests changes, commit them, rerun local gates, and obtain a
   new independent review.
8. After review PASS, manually dispatch final CI with
   `target_sha=<reviewed HEAD>`.
9. Require `ubuntu-latest`, `macos-latest`, and `windows-latest` all PASS.
10. Verify that the PR head still equals the reviewed/CI SHA.
11. Squash merge.
12. Delete the branch.

## Invalidation rule

```text
commit after review -> review stale
commit after final CI -> review + final CI stale
```

Never reuse a review or CI run from an older SHA. A new commit requires local
verification, a new independent review, and a new final CI run before merge
authorization can be restored.

## Manual CI dispatch

For final pre-merge verification after independent review PASS:

```bash
SHA="$(git rev-parse HEAD)"
gh workflow run verify.yml \
  --ref master \
  -f target_sha="$SHA" \
  -f reason=final-pre-merge
```

For a bounded cross-platform regression during Draft:

```bash
gh workflow run verify.yml \
  --ref master \
  -f target_sha="<FULL_SHA>" \
  -f reason=cross-platform-regression
```

Do not prescribe or dispatch CI for ordinary commits. Final CI must run only
after independent review PASS and must target the exact reviewed SHA.
