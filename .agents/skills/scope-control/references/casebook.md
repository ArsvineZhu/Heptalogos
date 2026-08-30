# Scope-Control Casebook

These examples generalize recurring implementation decisions. They are not
historical work identifiers and do not authorize changes by themselves.

## A. Rare race after a green shutdown fix

The normal shutdown test passes. A review notices a scheduler interleaving that
could delay cleanup if two uncommon callbacks arrive together.

Inspect the acceptance condition, current production path, and accepted failure
class. If no current consumer or invariant requires this timing boundary,
record the concern as a rare timing finding and defer it. Do not add a state,
timer, retry, or recovery loop solely because the interleaving is imaginable.

## B. Recovery cleanup throws

The first-order recovery closes a resource, but the close operation can itself
throw. Preserve the canonical truth and inspect the existing fail-stop/fence
outcome. A fallible recovery handler is not an automatic requirement for a
second durable state or a rollback of the rollback. Route to
`recovery-design` if a current plan actually admits recovery semantics.

## C. Exploratory failure-injection test

A newly written test kills a process at a boundary the current product does not
claim to recover. Treat the failure as evidence about a possible scenario. Name
the product requirement it would prove; if none exists, keep it exploratory or
defer it. Do not alter the product state machine merely to make the test
assertable.

## D. Normal-input defect found adjacent to a documentation change

A parser accepts an ordinary input that violates an existing current contract.
If the parser and contract are in the approved owner and the acceptance
condition covers validation, admit the narrow correction and its regression
test. If another clear owner is unrelated to the documentation task, record and
defer the finding. If the current acceptance requires a new owner, durable
state, or broader policy, stop at the boundary and report `PLAN_GAP`.

## E. Future consumer requests a Foundation state

A future Subject or provider design would be easier with another state. No
current consumer reads it and no current invariant distinguishes the fact.
Record the design pressure in the future-design owner and defer. A detailed
Architecture page is not implementation authorization.

## F. Current consumer cannot use the contract

A current executable path needs a payload or operation the Foundation contract
does not provide. Confirm the consumer, owner, boundary, and active plan. Make
the smallest authorized change if those are resolved; otherwise report
`PLAN_GAP` rather than adding an unowned alias or bypass.

## G. Green acceptance with an elegant theoretical improvement

The required path is green and evidence matches the acceptance condition. A
reviewer proposes a more uniform timeout budget “while we are here.” Unless an
accepted current failure model or explicit plan requirement admits it, close
the change and stop.

## H. Different-owner boundary pair

Case A:

A normal bug exists in an adjacent package. The current task does not depend on
it, the owner and canonical truth are clear, and deferral preserves a bounded
truthful outcome.

```text
RECORD/DEFER
```

Case B:

The current task cannot satisfy acceptance without changing that adjacent
owner, but the Plan does not decide the ownership, API, or semantic boundary.

```text
PLAN_GAP
```
