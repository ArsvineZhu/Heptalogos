# Package Agent Contract

## Scope

Bootstrap ownership, recovery, private PostgreSQL handoff, and managed Host
lifecycle orchestration.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S01, S03, S13, S15, and S17

## Local rules

- Production source must not import Runtime Kernel, Runtime Substrate, or Cordis.
- Use the existing Bootstrap, Host ownership, and private PostgreSQL authorities.
- Reacquire Bootstrap authority before post-Host PostgreSQL cleanup.
- Keep shutdown/quiescence bounded and prevent a closed Host from resuming.
- Integration tests may compose Runtime packages only at their test boundary.

## Verification

Run unit, real-PostgreSQL integration, recovery-process, dependency, and
boundary targets affected by the change.

## Stop

Stop for a production boundary bypass, direct control from a closed Host, a
second owner, or missing lifecycle semantics in Corpus and the active plan.
