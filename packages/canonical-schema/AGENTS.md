# Package Agent Contract

## Scope

Current canonical PostgreSQL schema and initialization/baseline mechanics.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S03, S12, S15, and S17

## Local rules

- Keep one current schema Authority.
- Use Host ownership context supplied by the owning composition.
- In PRE_PRODUCTION rewrite/reset the baseline; do not preserve developer
  chronology with compatibility migrations or readers.
- Do not add connection-pool or Bootstrap maintenance policy here.

## Verification

Run package tests, typecheck, and the relevant clean real-PostgreSQL schema
initialization scenarios.

## Stop

Stop for a second schema Authority, an undeclared compatibility obligation, or a
baseline/lifecycle decision absent from Corpus and the active plan.
