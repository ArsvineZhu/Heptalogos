# Complexity admission casebook

These examples test boundaries; they do not authorize work by themselves.

## Direct local behavior versus framework

Current task: one package needs a deterministic transformation and no second
consumer or variability exists.

Decision: keep direct local code. A reusable framework is not admitted by
possible future reuse.

## Existing route versus custom generic mechanic

Current task: an admitted consumer needs retry or process behavior and the
project has an adopted provider route.

Decision: inspect and use the adopted route behind the current owner. A custom
mechanic needs concrete insufficiency evidence and bounded maintenance impact.

## Test seam versus architecture

Current task: a test is hard to write without a new interface or factory, but
the product has no corresponding boundary.

Decision: use an existing seam, a focused integration test, or an exploratory
probe. Testability alone does not create a permanent interface.

## Recovery versus recovery-of-recovery

Current task: first-order recovery has a fallible cleanup branch.

Decision: preserve canonical truth through the existing bounded fence,
fail-stop, or operator outcome. A second recovery layer needs a separate
current failure model and authorization.

## Validator versus current inventory

Current task: a gate should protect a semantic invariant over current packages,
Skills, Specs, or responsibility roots.

Decision: discover the current set and validate its structure. Do not freeze
today's members into an allow-list or retain deleted names as tombstones.
