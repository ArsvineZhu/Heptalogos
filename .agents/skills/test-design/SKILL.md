---
name: test-design
description: Use when adding or expanding regression, failure-injection, crash, lifecycle, concurrency, provider-integration, or large test-matrix coverage.
---

# Test Design

## Purpose

Tests verify a contract; they do not become Architecture Authority. Use this
Skill to choose evidence that proves a named current requirement without
manufacturing product states for the test's convenience.

## Preflight

Before adding a non-trivial test, answer in the test description or change
record:

1. What requirement, invariant, or observed defect does the test prove?
2. What failure model does that requirement accept?
3. Which test level is the weakest one that proves the claim?
4. Does the test require a new product state, recovery branch, or provider only
   to make the assertion possible?
5. Is the scenario normative regression coverage or exploratory discovery?
6. What exact environment and evidence state will be recorded?

If the test reveals an unexpected scenario, classify the product failure before
changing production code. Use [`scope-control`](../scope-control/SKILL.md) and
keep the exploratory result separate from normative coverage.

## Select the test level

| Test level               | Proves                                                     | Does not prove                                                  |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Pure unit/property       | Local contract, invariant, or deterministic transformation | Integration, provider, process, or platform behavior            |
| Component integration    | Several current owners compose correctly in one process    | Crash/restart or an external protocol unless actually exercised |
| Real PostgreSQL/provider | Behavior at that live dependency boundary                  | Other providers, platforms, or source-less packaging            |
| Process kill/restart     | The named restart/recovery boundary in that environment    | Power loss, another OS, or an untested recovery layer           |
| Native/platform test     | The exercised OS/runtime boundary                          | Cross-platform behavior                                         |
| Cross-platform matrix    | The listed platforms and scenarios                         | Unlisted platform, artifact, or failure class                   |

Prefer one strong regression test over a combinatorial matrix that expands the
modeled failure surface without a corresponding product requirement.

Verification strategy follows the claim and current uncertainty or risk. TDD
is one useful implementation technique for some deterministic contracts; it is
not a repository-wide workflow law and does not create architecture Authority.

## Failure-injection doctrine

A failure-injection scenario shows that a path can be exercised; it does not
alone show that the current product must support it. Keep an exploratory test
when it is useful for discovery, but do not add production state or recovery
solely to turn its failure into a green test. If a current invariant genuinely
requires the case, state that invariant and admit the implementation through
the plan.

Tests should target stable semantic contracts, not temporary implementation
permutations. A test that only observes a private provider object or incidental
call order is a maintenance burden unless that detail is itself the owned
contract.

## Execution and evidence

Run the selected test and record the actual boundary. A mock-level `PASS`
remains valuable, but it cannot be reported as live protocol, real provider,
crash/restart, native OS, cross-platform, or source-less evidence. Use
[`claim-verification`](../claim-verification/SKILL.md) for the claim/evidence
record and exact `PASS | FAIL | NOT_RUN | BLOCKED` state.

An unexpected failure is a new finding, not automatic permission to widen the
state machine. Return to scope admission after recording the result.

## Output

For non-trivial coverage, record:

```text
Requirement/invariant:
Failure model:
Test level and why sufficient:
Normative or exploratory:
Environment:
Result:
Production change authorized by:
```
