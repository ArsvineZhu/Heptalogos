# Package Agent Contract

## Scope

Host-fenced normal PostgreSQL pool, transaction, execution-context, and
repository service mechanics.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S03, S15, S16, and S17

## Local rules

- Require the owning Host fence for canonical mutation transactions.
- Keep schema ownership in `canonical-schema` and lease ownership in
  `host-ownership`.
- Preserve read/mutation context distinctions and bounded pool lifecycle.
- Do not bypass the service with direct production SQL mutation.

## Verification

Run unit and real-PostgreSQL integration targets plus typecheck and boundary
gates for cross-package changes.

## Stop

Stop for a fence bypass, a new persistence Authority, unbounded pool work, or a
transaction contract not resolved by Corpus and the active plan.
