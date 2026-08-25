# @heptalogos/bootstrap-runtime

## Purpose

`bootstrap-runtime` is the installation and recovery orchestration boundary that
exists before and around the normal product Runtime. It prepares Bootstrap
state, starts and maintains private PostgreSQL through the authorized
controller, and coordinates forward and reverse Host handoff. Its managed Host
contracts let higher-level integration compose Bootstrap, Host ownership, and
Runtime lifecycle without giving Bootstrap product Runtime semantics.

## Owns

- Bootstrap ownership and prelude orchestration.
- Private PostgreSQL startup and authorized maintenance handoff.
- Bootstrap recovery inspection and command execution.
- Managed Host lifecycle, quiescence, and handoff contracts.
- Bootstrap key-provider and installation-owner projections.

## Does not own

- Runtime Kernel or Cordis mechanics in production source.
- Normal persistence/schema mutation authority.
- A second Host lease or private PostgreSQL controller.
- Later-stage durable work, external effects, or product cognition.

## Public surface

The entry point exports Bootstrap locator/path and ownership types, recovery
inspection/commands, Bootstrap Prelude preparation, private PostgreSQL handoff
types, key-provider contracts, and managed Host lifecycle contracts. Production
callers use these interfaces; tests may compose Runtime packages at the
integration boundary.

## Dependencies and boundaries

Runtime production source must not import `@heptalogos/runtime-kernel`,
`@heptalogos/runtime-substrate`, or `cordis`. Those packages are development
composition dependencies for integration tests only. Bootstrap owns authorized
handoff and must not control PostgreSQL from a closed Host; cleanup after Host
terminal shutdown reacquires Bootstrap authority first.

## Verification

Run `pnpm nx run bootstrap-runtime:test`, the real PostgreSQL integration target,
recovery-process targets, and the boundary/dependency gates. Lifecycle changes
also require claim-matched Host and Runtime qualification.

## Architecture references

Read Corpus S01, S03, S13, S15, S17, and the Bootstrap/Runtime qualification
records before changing ownership, shutdown, recovery, or handoff behavior.
