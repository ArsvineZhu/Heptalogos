# Recovery-Design Casebook

These cases teach bounded recovery decisions. They are examples, not a list of
required product capabilities.

## Bounded shutdown cleanup failure

Admission is closed and in-flight work has been observed, but one disposer
throws. If the owner can fence new work and report a non-active terminal outcome,
preserve that truth and stop. Do not add a rollback of the disposer merely to
make shutdown appear successful.

## Restart after process loss

A process ends while a durable obligation is `RUNNING`. The canonical WorkItem
and its dispatch identity remain authoritative. Reuse the existing startup scan,
reconciliation, and dispatch contract. Do not create a second process-local
queue or a new recovery state unless the current WorkItem contract cannot
express a real product distinction.

## Retryable provider failure

A provider times out during a current operation whose contract admits bounded
retry. Confirm that retry identity, attempt fencing, budget, and terminal
classification already belong to the owner. Extend that route or report a plan
gap; do not add a generic local retry helper around the provider.

## Recovery function fails

A recovery callback cannot close a resource. Separate the callback failure from
the original failure, preserve the canonical outcome, and use the existing
fence/fail-stop or operator path. A third state or retry loop requires its own
current consumer and accepted model.

## Rollback after the point of no return

Maintenance has revoked old authority or torn down a provider. A later step
fails. Do not report the old Host as restored without proof and do not perform a
heroic rollback to an unproven Authority. Continue through the owning bounded
recovery/reacquisition outcome.

## Terminal commit and crash

A process dies after canonical terminal commit but before an engine checkpoint.
The proof claim must say which layer was exercised. If the current durable-execution scenario
already covers the claim, record that exact evidence. If a different boundary is
not accepted, keep it `NOT_RUN` rather than broadening the recovery design.

## Future self-healing

A design proposes automatically repairing every provider or storage failure.
Ask which current consumer, invariant, threat model, and accepted failure class
requires it. Without those, record future design pressure and stop.
