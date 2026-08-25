# Package Agent Contract

## Scope

Private PostgreSQL process, cluster-layout, profile, readiness, and maintenance
mechanics under an owning Bootstrap/Host authority.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S01, S03, S11, and S17

## Local rules

- Keep process control behind the exported controller contracts.
- Use the adopted subprocess dependency route and bounded timeouts.
- Do not decide Bootstrap ownership, Host fencing, or normal persistence here.
- Preserve qualified identity/profile checks and explicit failure dispositions.

## Verification

Run unit and real-PostgreSQL integration targets plus recovery-process tests
when their behavior is affected.

## Stop

Stop if a caller needs direct process control, a new provider, an unbounded
operation, or an ownership decision absent from Corpus and the active plan.
