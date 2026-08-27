# @heptalogos/repo-kit

## Purpose

`@heptalogos/repo-kit` contains reusable, repository-owned mechanics for
verification scripts and their tests. It keeps process execution, current-tree
hygiene scanning, and related test fixtures out of individual gate entrypoints
while leaving policy decisions visible in the repository scripts and Corpus.
This is development tooling, not a Heptalogos product or Foundation runtime
dependency.

## Owns

- Thin process-runner mechanics used by repository commands.
- Current-tree hygiene scanning and finding normalization.
- Version Authority readers for the package-manager baseline and workspace catalog.
- Repo-kit tests for process, boundary, Corpus, and hygiene behavior.
- Small reusable helpers that have a concrete repeated repository need.

## Does not own

- Product semantics, runtime lifecycle, or data/authority contracts.
- Architecture decisions or compatibility obligations.
- A checksum catalog, file manifest, or generic gate bypass.
- Direct mutation of product state or developer databases.

## Public surface

The package exports the reusable mechanics from `src/index.mjs`, including the
current-tree scanner and process helper modules. Verification entrypoints under
`scripts/verify` call these helpers and remain responsible for command-line
exit status and claim-specific policy. Tests live under `test/` and exercise the
public helper behavior with temporary fixtures.

## Dependencies and boundaries

The package uses the adopted `execa` route and Node standard-library mechanics.
It may inspect repository files and run bounded repository commands, but it must
not become a second production execution layer. Gate findings must remain
actionable and must not silently ignore symlinks, provenance, or compatibility
residue.

## Verification

Run `pnpm nx run repo-kit:test`, `pnpm nx run repo-kit:lint`, and the repository
checks affected by a helper change. `pnpm check:hygiene` is the permanent
consumer of the hygiene scanner.

## Architecture references

Read the repository `AGENTS.md`, Corpus 00, 16, 20, 24, and 26, plus the
repository verification and current-tree hygiene playbooks before changing
gate mechanics or their finding codes.
