# Package Agent Contract

## Scope

Bootstrap-visible durable state, journals, codecs, and file-backed stores.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S01, S03, and S17

## Local rules

- Keep envelopes and journal records versioned where their contracts require it.
- Preserve atomic, bounded file mutation and explicit parse failures.
- Do not add normal database, Host lease, or Runtime lifecycle ownership here.
- Use `foundation-contracts` primitives instead of duplicate IDs or digests.

## Verification

Run `pnpm nx run bootstrap-state:test`, its lint target, and the repository gates
that match any durable-shape change.

## Stop

Stop for a missing owner, a new compatibility obligation, an unbounded recovery
path, or a durable shape not decided by Corpus and the active plan.
