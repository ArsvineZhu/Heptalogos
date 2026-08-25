# Package Agent Contract

## Scope

Execution context, causal lineage references, runtime providers, and Bootstrap
handoff projections.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus 22, S03, S10, and S16

## Local rules

- Keep Activity/ExecutionContext identity distinct from Evidence and telemetry.
- Use the persistence service for durable mutations.
- Preserve causal propagation and current Host/generation fences.
- Do not add scheduler, durable-work, or Runtime reconciliation semantics.

## Verification

Run package tests and real persistence-backed lineage scenarios when durability
or atomicity is affected.

## Stop

Stop for a second lineage Authority, a framework type leaking through a public
contract, or a causal/durable decision absent from Corpus and the active plan.
