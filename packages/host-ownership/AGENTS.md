# Package Agent Contract

## Scope

Host lease, ownership fence, token publication/revocation, and lease-bound
PostgreSQL connection mechanics.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S01, S03, S15, and S17

## Local rules

- Keep one Host ownership Authority and one database fence contract.
- Require ownership context for canonical mutation connections.
- Keep raw `pg` and lease mechanics inside this adapter.
- Do not add Bootstrap orchestration or Runtime lifecycle semantics.

## Verification

Run unit and real-PostgreSQL integration tests, then relevant boundary and
typecheck gates.

## Stop

Stop for a second ownership path, a bypass around the fence, or a lifecycle
decision not resolved by Corpus and the active plan.
