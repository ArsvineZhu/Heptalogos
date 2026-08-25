# Package Agent Contract

## Scope

Cordis-backed activation scopes, resource disposal, background-task tracking,
and substrate failure mechanics.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S01, S06, S13, and S15

## Local rules

- Keep Cordis objects behind the substrate contracts.
- Every process-memory task needs an owner and bounded cancel/drain/dispose.
- Do not implement Desired/Actual, provider selection, readiness, or Host
  ownership here.
- Use the adopted Cordis dependency route.

## Verification

Run package tests and focused Runtime Kernel lifecycle tests when scope behavior
changes.

## Stop

Stop for framework leakage, unowned background work, durable-work semantics, or
a lifecycle decision absent from Corpus and the active plan.
