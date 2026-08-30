---
name: claim-verification
description: Use when making a non-trivial evidence claim about real PostgreSQL or providers, crash/restart, native OS behavior, live protocols, source-less artifacts, or cross-platform support.
---

# Claim Verification

## Trigger

Load this Skill before recording or communicating a claim whose proof boundary
is stronger than a pure unit or contract test.

## Required inputs

- exact claim and acceptance boundary;
- required environment and artifact/provider;
- existing scenario and evidence record;
- candidate/current versus historical scope.

## Procedure

1. State the claim precisely.
2. Select the weakest test that actually proves it: unit/property, real
   PostgreSQL, real process kill/restart, live protocol, native platform, or
   exact source-less artifact.
3. Identify the boundary actually exercised and record its environment.
4. Run the existing relevant scenario; do not create a broader matrix for
   completeness.
5. Record exactly `PASS`, `FAIL`, `NOT_RUN`, or `BLOCKED`, keeping historical
   evidence separate from current evidence.

## Stop / escalation

Mocks do not prove live behavior. One OS does not prove another. A source tree
does not prove a source-less artifact. Use `PLAN_GAP` if required evidence is
authorized but the plan does not define its proof boundary.

## Output

Return claim, executed scenario, actual boundary/environment, result state, and
remaining unrun scope. Never infer PASS from documentation or an analogous test.

Read the [verification system](../../../docs/qualification/verification-system.md)
and [Evidence Spec](../../../docs/specs/execution/evidence.md).
