# Package Agent Contract

## Scope

Injectable monotonic, wall-clock, timezone, and deterministic fake-time
mechanics.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S02, S03, S10, and S16

## Local rules

- Keep monotonic elapsed time distinct from human-local wall time.
- Use the fake service for deterministic tests rather than global clock mocks.
- Do not add scheduling, retry, persistence, or lifecycle ownership.
- Preserve the adopted shared identity/value contracts.

## Verification

Run package tests, lint, typecheck, and affected consumer tests for time semantic
changes.

## Stop

Stop for a scheduler, global mutable clock, policy decision, or time contract
not resolved by Corpus and the active plan.
