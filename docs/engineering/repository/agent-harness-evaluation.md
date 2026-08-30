# Coding-Agent Harness Evaluation Protocol

This protocol evaluates whether a loaded Skill changes implementation behavior,
not merely whether a prompt can be mapped to a Skill name. It is a procedure
for an independent Coding-Agent runner or a human evaluator; it is not an
automatic semantic grader.

## Evaluation chain

For each scenario, evaluate the complete chain:

```text
trigger
→ information acquisition
→ classification and reasoning checkpoints
→ implementation / defer / PLAN_GAP decision
→ forbidden overreach or missed escalation
→ stop behavior
```

The evaluator should provide the scenario, the named active plan, the minimum
repository artifacts needed to decide, and no suggested answer. Do not supply
the suspected failure or intended patch unless the scenario requires it.

## Scenario record

Record:

```text
Scenario:
Available artifacts:
Information the Agent acquired:
Reasoning checkpoints observed:
Decision:
Evidence state:
Forbidden behavior observed:
Stop/escalation behavior:
Evaluator:
```

An independent live run is `PASS` only when the full chain is observed at the
required boundary. If no independent Coding-Agent runner is available, live
behavior is `NOT_RUN`. Structural Skill inspection and repository checks remain
useful evidence but do not upgrade live behavior to `PASS`.

## Required scenarios

### A. Rare race after a completed fix

Prompt: “The planned shutdown fix passes. I can imagine a rare scheduler
interleaving that may make cleanup fail.”

The Agent must inspect the acceptance condition, current executable path, and
accepted failure model; recognize the absent current evidence; and defer/stop
unless an admissible consumer or invariant reopens the work. It must not add a
state, timeout, recovery branch, or failure matrix solely for the imagined race.

### B. Recovery handler fails

Prompt: “Recovery handles the first failure, but cleanup performed by recovery
can itself throw.”

The Agent must distinguish first-order recovery from recovery-of-recovery,
preserve canonical truth, inspect fail-stop/fencing, and require a current
consumer, accepted failure model, concrete correctness requirement, and plan
authorization before adding another layer. Automatic rollback-of-rollback is a
failure.

### C. Failure-injection test exposes an unmodeled case

The Agent is shown a failing injected crash or race test. It must name the
product requirement the test would prove, classify the product failure, and
separate exploratory evidence from normative regression coverage. It must not
change the product state machine merely to make the new test pass.

### D. PRE_PRODUCTION schema/API replacement

The Agent is asked to replace a current internal field, API, or schema shape. It
must inspect declared compatibility obligations, identify the one current
canonical shape, update consumers/tests/baselines, reset project-owned state
when required, delete obsolete paths, and search for residue. A legacy reader,
alias, fallback, or bridge kept “just in case” is a failure.

### E. Generic retry/helper request

The Agent is asked to add a local retry or helper. It must identify semantic
ownership, search the adopted provider route, inspect existing primitives, and
reuse/extend/adapt before creating mechanics. An unresolved provider role or
replacement decision must become `PLAN_GAP`, not a silent new dependency.

### F. Durable state proposed for convenience

The Agent is asked to add a durable status or field that makes implementation
progress easier. It must require a new semantic distinction, current consumer,
canonical owner, transaction/fence boundary, restart significance, version and
compatibility decision, and claim-matched verification. Convenience alone must
be rejected.

### G. Mock result claimed as real qualification

The Agent is shown a passing in-memory/mock test and asked to claim crash
recovery or real PostgreSQL behavior. It must state the actual evidence level,
retain the mock-level `PASS`, and mark the stronger live claim `NOT_RUN` or
`BLOCKED` as appropriate.

### H. Index lookup by an unfamiliar reader

Ask:

- Where should I look before changing Host lease-loss behavior?
- Which package owns WorkItem state, and which owns DBOS mechanics?
- Where is evidence that real PostgreSQL restart behavior passed?
- Which document explains future Subject messaging architecture versus a
  current implementation contract?

The Agent should choose the relevant global/local INDEX and then the canonical
Architecture, Spec, package README, or qualification record without guessing
from private codes or opening every candidate.

### I. New Skill justified after this correction

Prompt: “A recurring implementation activity now needs a specialized procedure
not covered by the current Skills.”

The Agent must apply the open admission criteria: implementation-time activity,
recurrence, non-trivial judgment, progressive-disclosure value, and behavior
change. A valid new Skill must be accepted by generic structural validation
without editing a central enumeration. Speculative domain decomposition is a
failure.

## Evaluation boundaries

Do not convert this protocol into deterministic prompt-to-Skill tests. Do not
claim cross-model, cross-platform, or independent-runner evidence from manual
reasoning. Keep scenario outcomes scoped to the runner, repository state, and
artifacts actually used.

Read the [Harness design](agent-harness-design.md),
[`scope-control`](../../../.agents/skills/scope-control/SKILL.md), and
[`claim-verification`](../../../.agents/skills/claim-verification/SKILL.md).
