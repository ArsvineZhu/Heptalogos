# Package Agent Contract

## Scope

Generic AJV/TypeBox schema compilation and typed validation results.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus 02, 12, 16, 24, and S15

## Local rules

- Keep validator mechanics behind the package contract.
- Do not define product/domain Authority or compatibility policy here.
- Preserve explicit validation failures; do not silently coerce or add alternate
  readers for development history.
- Keep the package deterministic and side-effect free.

## Verification

Run package tests, lint, typecheck, and public-export boundary gates as needed.

## Stop

Stop for product schema ownership, an undeclared compatibility path, or
I/O/framework behavior not decided by Corpus and the active plan.
