# Independent Review Is External

## Symptom

An Agent searches GitHub reviews, approvals, requested reviewers, or review
comments and concludes that the Heptalogos Independent Review gate is missing.

## Cause

Heptalogos uses a GitHub Pull Request as the candidate transport, while
Independent Review is a separate governance action. GitHub's Pull Request
Review feature is not the Authority for this gate.

## Rule

Independent Review is an external governance verdict. It is not a GitHub Pull
Request review, approval, requested-reviewer state, review comment, status
check, or branch-protection signal. GitHub hosts the candidate and CI evidence;
it does not provide the Independent Review Authority.

The authorized independent reviewer supplies an explicit `PASS` or
`REQUEST_CHANGES` verdict out-of-band to the implementation Agent. That verdict
is authoritative for the current Ready candidate. The implementation Agent MUST
NOT query GitHub reviews, approvals, requested reviewers, or review comments to
determine Independent Review state. Absence of GitHub review objects has no
meaning for this gate.

GitHub may still be used to verify facts that belong to GitHub: whether the PR
is open and Ready, whether its candidate branch and base remain current, the
final CI conclusion, and the merge state. Those facts do not produce an
Independent Review verdict.

## Lifecycle

- Draft work is mutable.
- Ready identifies the candidate presented to the external reviewer.
- External `REQUEST_CHANGES` returns the PR to Draft for bounded correction.
- External `PASS` authorizes the next explicitly required local or provider
  qualification step named by the current closure Playbook.
- Any repository or base movement after the verdict makes the candidate stale;
  return to Draft and obtain a new external verdict after requalification.
