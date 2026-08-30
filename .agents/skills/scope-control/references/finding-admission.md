# Finding Admission Procedure

This reference gives the full reasoning method for deciding whether an
incidental finding belongs in an approved implementation task.

## 1. Anchor the decision

Restate the task as a bounded sentence:

```text
Change <owned behavior> for <current consumer> so that <acceptance condition>
under <accepted failure model>.
```

If the sentence cannot name an owner, consumer, acceptance condition, or
failure model, read the active plan and canonical Spec before classifying the
finding. A plan gap is not permission to invent the missing semantic choice.

## 2. Separate evidence types

Classify the finding's evidence:

| Evidence                                                         | Meaning for admission                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Reproduced current failure on the normal path                    | Strong current defect evidence.                                                |
| Current test failing against an existing invariant               | Current evidence; inspect whether the test is normative or exploratory.        |
| Current consumer blocked by the contract                         | Current consumer evidence.                                                     |
| A failure-injection test written for this task                   | Evidence of a possible scenario; it does not define product support alone.     |
| Static code concern without a failing path or accepted invariant | Review finding requiring scope classification, not automatic implementation.   |
| Future product or provider idea                                  | Future-consumer evidence only; defer unless the plan admits it.                |
| Hypothetical race, timeout, or damage scenario                   | Theoretical until a current requirement or accepted model makes it admissible. |

Do not silently strengthen a claim while moving from one row to another.

## 3. Determine the failure class

Use the project's current classification, translated into behavior:

- `F0`: normal boot, meaningful work, and stop must work before later work is
  valuable.
- `F1`: common invalid input/configuration, occupied ports, provider timeout,
  expected dependency absence, and normal restart.
- `F2`: process crash/restart, transient network loss, and durable recovery only
  when the current Horizon requires it.
- `F3`: rare timing windows such as commit/ack ambiguity, narrow races, partial
  teardown timing, or lease loss at an exact transition.
- `F4`: power loss, disk/storage corruption, hardware/kernel faults, or
  multi-fault recovery.

The class is not a priority label by itself. It is useful only when tied to a
current consumer, invariant, or accepted product requirement.

## 4. Inspect deferred behavior

Ask what happens if the finding is not implemented now. Accept deferral when
the owner can preserve canonical truth through a bounded error, fence,
fail-stop, operator outcome, or existing later reconciliation. Do not call a
system safe merely because a test is absent; inspect the actual Authority and
state transition.

Deferral is not acceptable when the current path would silently report a false
commit, lose canonical durable truth, admit stale ownership, bypass an
explicit invariant, or strand a current consumer without a bounded outcome.

## 5. Compare semantic cost

Name the cost before admitting a fix:

- new product/durable state or transition;
- new recovery or fallback layer;
- new dependency or generic mechanic;
- Authority or package-boundary movement;
- expanded test matrix or new failure model;
- changed qualification claim;
- current documentation and migration work.

The cost does not veto a necessary current fix, but it makes hidden scope
expansion visible. If the cost crosses an unresolved semantic boundary, use
`PLAN_GAP` instead of choosing the convenient interpretation.

## 6. Apply the outcome

```text
current defect + authorized owner/consumer + bounded acceptance condition
    → IMPLEMENT

non-current or unaccepted failure + truthful bounded deferral
    → RECORD/DEFER

material current possibility + unresolved owner/state/provider/failure decision
    → PLAN_GAP
```

A different semantic owner is not, by itself, an unresolved decision. A
non-blocking finding in a clear adjacent owner is `RECORD/DEFER`; use
`PLAN_GAP` only when the approved task cannot complete without crossing an
unresolved boundary.

After recording the outcome, return to the approved task. A deferred finding
may be useful evidence for a future plan, but it is not an implicit backlog
that the current Agent must implement.

## 7. Reopen gate

After acceptance is green, ask only whether new evidence changes the current
decision. An imagined edge case, generic future-proofing, a failure inside a
new recovery mechanism, or a desire for a more elegant matrix does not reopen
the change. Current evidence, an accepted failure class, a current consumer or
invariant, or an explicit active-plan requirement does.
