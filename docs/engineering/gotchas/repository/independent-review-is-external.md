# Independent Review Is External

## Symptom

An Agent repeatedly searches GitHub reviews, approvals, requested reviewers, or
review comments and concludes that the milestone review is missing.

## Cause

The repository's `Independent Review` gate was underspecified as to its
transport and source. It is not the same thing as a GitHub PR review object.

## Rule

The user/operator supplies the external out-of-band review result for the exact
candidate pair `(base_sha, head_sha)`. A supplied `PASS` authorizes the next
governance step only for that exact pair; `REQUEST_CHANGES` requires correction,
local re-verification, a new pair, and a new external review.

GitHub may be used to verify repository facts that actually live there:

- current PR base and head SHAs;
- workflow run identity and checked-out head SHA;
- CI conclusion;
- PR and merge state.

The absence of a GitHub approval, review object, comment, or requested reviewer
is not evidence that the external Independent Review is `NOT_RUN`.

Any candidate-pair change, including a branch commit or base-branch movement,
invalidates the supplied review and requires a new external review. Final CI
must target the same externally reviewed pair.
