# AGENTS.md

Repository-wide execution contract for Heptalogos. This is a persistent
bootloader, not an architecture summary, roadmap, or knowledge encyclopedia.

## Authority and scope

- Execute the explicitly named active plan. Do not select a different plan by
  filename, recency, or convenience.
- Apply the current Architecture Corpus first, the active plan second, and
  current code/tests as implementation reality third.
- The Corpus owns semantics; the plan owns the authorized change sequence.
  Existing code or history does not acquire Authority by existence.
- A missing non-trivial decision, Corpus/plan conflict, or unauthorized
  boundary change is `PLAN_GAP`; stop and report the smallest concrete blocker.

## Present tree and evolution

- Current source, tests, fixtures, tooling, configuration, and instructions
  describe present truth. Keep development provenance in history and historical
  records, not in current executable identities.
- `CompatibilityEpoch = PRE_PRODUCTION`. Only
  `docs/governance/compatibility-obligations.json` declares compatibility
  obligations. For an undeclared current contract change, rewrite the
  canonical shape, update callers/tests, rewrite the development baseline,
  reset project-owned state, and delete obsolete paths.
- Do not add legacy readers, aliases, shims, dual formats, or fallback parsers
  for project development history.
- Keep semantic ownership and mutation Authority singular. New dependencies,
  subsystems, or architecture boundaries require explicit plan authorization.

## Engineering guardrails

- Identify the current Horizon and accepted failure class before resilience,
  security, or lifecycle expansion. F3/F4 work is `DEFER` unless authorized.
- Load the applicable procedural Skill for scope control, generic mechanics,
  lifecycle, durable state, PRE_PRODUCTION evolution, evidence, or
  documentation maintenance. Follow its route and stop conditions.
- Reuse the owning primitive or adopted provider for generic mechanics; do not
  create duplicate infrastructure or bypass an owning service.
- Do not create recovery-of-recovery, fallback chains, or product states solely
  for failure-injection tests. Fail-stop is valid when it preserves truth.
- A completed fix does not authorize another hardening pass. Reopen only for
  current evidence, an accepted failure case, a current consumer/invariant, or
  an explicit active-plan requirement.

## Evidence and closure

- Verification states are exactly `PASS | FAIL | NOT_RUN | BLOCKED`. Match every
  claim to the evidence that actually ran; mocks do not prove live protocols,
  one OS does not prove cross-platform behavior, and a development tree does
  not prove a source-less artifact.
- Run focused checks while editing and all permanent gates required by the
  active plan before claiming completion. Keep `pnpm verify` runnable.
- Do not dispatch ordinary CI. Follow the repository closure playbook for any
  external review and final candidate handling.

For work under `docs/**` or `packages/**`, follow the corresponding scope
contract and read the target README/INDEX before editing.
