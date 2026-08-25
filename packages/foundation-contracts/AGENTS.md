# Package Agent Contract

## Scope

Shared branded identities, canonical JSON/digest mechanics, Problems, lifecycle
roots, and data-governance value contracts.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus 00, 03, 12, 19, 22, and 23

## Local rules

- Keep this package framework-, database-, process-, and network-free.
- Preserve semantic distinctions in branded IDs and error/retry contracts.
- Use adopted canonicalization/UUID dependencies.
- Do not move higher-level Authority or policy into shared primitives.

## Verification

Run package unit/property tests, lint, TS7 typecheck, and the TS6 lane when
public primitives change.

## Stop

Stop for I/O, a higher-level dependency, a collapsed identity/lifecycle meaning,
or a shared contract decision absent from Corpus and the active plan.
