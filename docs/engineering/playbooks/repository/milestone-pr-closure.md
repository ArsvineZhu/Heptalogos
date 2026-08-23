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
   `base_sha=<reviewed base>` and `target_sha=<reviewed HEAD>`.
9. Require `ubuntu-latest`, `macos-latest`, and `windows-latest` all PASS.
10. Immediately before merge, re-read the live base, branch head, and PR
    metadata against the exact reviewed pair:

    ```bash
    git fetch --no-tags origin master
    test "$(git rev-parse origin/master)" = "$REVIEWED_BASE_SHA"
    test "$(git rev-parse HEAD)" = "$REVIEWED_HEAD_SHA"
    test "$(gh pr view "$PR_NUMBER" --json baseRefOid --jq .baseRefOid)" = "$REVIEWED_BASE_SHA"
    test "$(gh pr view "$PR_NUMBER" --json headRefOid --jq .headRefOid)" = "$REVIEWED_HEAD_SHA"
    ```

    Any mismatch means review invalid, final CI invalid, and merge forbidden.

11. Squash merge with the expected reviewed head SHA.
12. Delete the branch only after merge succeeds.
13. After squash merge, keep the behavior candidate immutable. If repository
    truth needs updating, open a separate docs/evidence-only PR that changes no
    production code, tests, or behavior contract; cites externally observed
    review/CI/merge evidence; runs repository/corpus/document gates; and
    records closure only when the tuple actually occurred. Do not rerun or
    rewrite the merged behavior candidate in that PR.

## Invalidation rule

```text
commit after review -> review stale
base-branch move after review -> review stale
commit after final CI -> review + final CI stale
base-branch move after final CI -> review + final CI stale
```

Never reuse a review or CI run from an older SHA. A new commit requires local
verification, a new independent review, and a new final CI run before merge
authorization can be restored.

## Manual CI dispatch

For final pre-merge verification after independent review PASS:

```bash
BASE_SHA="$(git rev-parse origin/master)"
HEAD_SHA="$(git rev-parse HEAD)"
gh workflow run verify.yml \
  --ref master \
  -f base_sha="$BASE_SHA" \
  -f target_sha="$HEAD_SHA" \
  -f reason=final-pre-merge
```

For a bounded cross-platform regression during Draft:

```bash
gh workflow run verify.yml \
  --ref master \
  -f base_sha="<BASE_SHA>" \
  -f target_sha="<FULL_SHA>" \
  -f reason=cross-platform-regression
```

Do not prescribe or dispatch CI for ordinary commits. Final CI must run only
after independent review PASS and must target the exact reviewed SHA.
