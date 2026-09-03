# Tests

This cleanup treats tests as maintained code, not as sacred residue.

## Information-gain rule

Do not create or run a failing test merely to prove that new code which has not been written yet is absent.

A pre-implementation failing test is justified when it answers a real question:

```text
reproduce an observed defect
characterize existing behavior before a refactor
resolve an uncertain contract
probe an external/runtime/provider property
```

“Feature X has not been implemented, therefore the X test is red” provides no information.

TDD remains available as a technique when it is actually useful. It is not a repository ritual.

## A new feature does not automatically require a permanent test

Permanent tests should protect something that can plausibly regress and matters independently of the current implementation shape.

Strong reasons to keep a test include:

```text
stable semantic invariant
Authority/fencing rule
serialization/schema contract
meaningful prior defect
non-obvious deterministic algorithm
provider/database behavior
concurrency/lifecycle behavior
process crash/restart behavior
security or policy boundary
generated/projection consistency that is not already guaranteed elsewhere
```

Examples such as SchemaRuntime refusing mutation/coercion/default/removal are meaningful contract tests.

## Delete test residue with no independent contract

Delete a test when its only continuing purpose is one of these:

```text
prove a deleted historical artifact/path stays deleted
prove removed candidate/review/stabilization ceremony
memorialize a one-time migration assertion that no longer expresses a standing invariant
prove not-yet-implemented code was once absent
repeat a private implementation detail with no independent semantic contract
exercise a removed Skill/check/policy
duplicate another test at the same or stronger proof boundary without a distinct regression risk
verify generic language/library behavior already owned by the provider while Heptalogos adds no semantic rule
```

Delete its fixture/helper if no retained test uses it.

Do not replace a deleted test with a tombstone test asserting that the test/helper itself remains absent.

## Product semantics are protected from casual test deletion

Do not delete a product/runtime test merely because:

```text
it is old
it has no numeric requirement ID
it has many assertions
the feature has few current consumers
it uses an internal test seam
there is also an integration test
```

For semantic/Authority/lifecycle/provider/process tests, identify the claim first.

If the claim remains current and no other retained proof owns it, keep the test.

If the executor cannot determine whether a product test protects current semantics or only implementation shape, leave it and report the candidate for a later subsystem audit. Do not guess.

## Test-only seams are not guilty by name

Do not blanket-delete:

```text
*ForTests
reset*ForTests
ClientFactory
test hooks
```

Some audited helpers are internal, not package-root public APIs.

A production-source seam is cleanup material only when it materially distorts the production architecture or exists solely to support tests with no worthwhile contract.

That decision is outside this governance cleanup unless the seam belongs to tooling/checks explicitly removed here.

## Remove development numbering from retained tests

Retained test descriptions/fixture identifiers should say what they prove, not encode development chronology.

Change names such as:

```text
Q1 ...
Q7 ...
H2A3 ...
P4 ...
S6 ...
```

to semantic descriptions when they occur in current executable/test surfaces.

Do not create a mapping table from old number to new name. Git/history already contains the old identity.

Existing Spec requirement IDs are not affected when the test genuinely references a stable current normative requirement.

## Repository-tool tests have concrete deletions

When `current-tree-hygiene` is simplified, delete tests for:

```text
GENESIS_EVIDENCE.json
scripts/phases
blanket symlink rejection
legacy/obsolete word rejection
qualification-ID exemption
empty-obligations-forever assumption
```

Retain tests for the generic current provenance rule and compatibility-register structure.

When candidate/review workflow checks are deleted, delete their validator/workflow tests.

When qualification-status is deleted, delete repo-kit tests whose only purpose is requiring that ledger/path.

## Repository-wide test archaeology

After the explicit governance/tooling deletions, inspect the remaining current test tree using the current code and Git history.

Do not produce a permanent test inventory.

Use local history only as evidence for why a test exists:

```bash
git log --follow -- <test-file>
git blame <test-file>
```

Prioritize inspection where one or more of these signals exist:

```text
test file introduced solely alongside a one-off correction/stabilization cycle
large mock/fake layer with no real semantic boundary
test description mirrors private method/call order
same claim repeated at unit + integration + process levels
test-specific production branch/factory/hook
numbered scenario names inherited from qualification/stage work
huge matrix generated from hypothetical failure enumeration
```

Delete only when the no-independent-contract criterion above is satisfied.

Do not set a target number of tests or a target percentage deletion.

Do not write a test-archaeology report into the repository. The final executor response may briefly list ambiguous high-cost product-test candidates left for later review.
