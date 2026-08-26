# Package Agent Contract

## Scope

Reusable repository mechanics used by verification scripts, including process
execution and current-tree hygiene helpers/tests.

## Read first

- `README.md`
- repository `AGENTS.md`
- `scripts/verify/` entrypoints that consume this package

## Local rules

- Keep helpers generic, thin, deterministic, and repository-owned.
- Do not put product or Foundation runtime semantics here.
- Preserve explicit gate states and actionable findings.
- Do not add checksum catalogs or broad path allowlists to make a gate pass.

## Verification

Run `pnpm nx run repo-kit:test`, `pnpm nx run repo-kit:lint`, and the repository
verification scripts affected by a helper change.

## Stop

Stop for a new product subsystem, a hidden mutation Authority, an unbounded
process helper, or a gate exception not resolved by the active plan.
