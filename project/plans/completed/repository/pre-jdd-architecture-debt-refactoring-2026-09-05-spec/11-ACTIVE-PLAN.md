# Active Plan — Pre-JDD Architecture Debt Refactoring

```yaml
status: ACTIVE
date: 2026-09-05
baselineBranch: feature/gateway-first-airuntime-external-integration-2026-09-03
baselineCommit: aee3c1059942e3b701c89513a5ef1df8eb1e2009
executionMode: CONTINUOUS
intermediateApprovalGates: NONE
```

## Authorization

Refactor the observed pre-JDD implementation debt exposed by the first real
portable Product assembly while preserving current Heptalogos Product semantics.

This Plan explicitly authorizes:

- direct rewrite of portable packaging mechanics;
- pnpm-native modern deployment and, only if proven necessary, one disposable
  staging-workspace implementation;
- replacement of Subject OpenClaw direct child-process mechanics with Execa;
- removal of unsupported OpenClaw autonomous retry/backoff machinery;
- OpenClaw embedding config/secret correction;
- internal Management SystemAction handler/catalog abstraction;
- removal of legacy test-created Management optional dependencies;
- Subject internal owner/persistence/executor refactor;
- Messaging repository/cursor extraction;
- AIRuntime repository/routing/invocation refactor;
- bounded ProductHost helper extraction;
- ProductHost integration scenario split;
- one recurring manual portable qualification target;
- direct deletion of the old pre-production implementation shapes.

## Required Context

Read in this order:

1. repository `AGENTS.md`;
2. `project/governance/project-charter.md`;
3. this file;
4. bundle `00-ARCHITECTURAL-DECISION-LEDGER.md`;
5. bundle Specs 02–07 for the area being changed;
6. affected current Architecture/Spec/package README;
7. current source/tests.

JDD is supplied by the executor environment and is not duplicated here.

## Non-negotiable semantic boundary

The current Subject conversation slice remains:

```text
MessageFact
→ ConversationMailbox
→ Reaction
→ ConversationReactionProposal
   ├─ NO_COMMUNICATION
   └─ COMMUNICATE
        → Review
        → CommunicationCommit
        → Expression
        → outbound MessageFact
```

No generic world ActionPlan, Memory, Persona, Attention, external IM Driver, or
System Assistant implementation enters this Plan.

## Execution

Execute `08-EXECUTION-PLAN.md` S0 through S7 continuously.

Do not pause for human review between sections.

## PLAN_GAP conditions

Stop only for a material unresolved:

- Product semantic decision;
- Authority/ownership boundary;
- failure model;
- adopted-provider insufficiency after the authorized fallback;
- hard external condition blocking required final qualification.

Ordinary implementation failures remain in scope.

## Acceptance

All mandatory items in `09-ACCEPTANCE-AND-STOP.md` must be proven.

Final required executable evidence:

```text
focused affected tests                    PASS
pnpm verify                               PASS
Windows source-less portable qualification PASS
```

Claims outside the actually executed platform/provider boundary remain NOT_RUN.

## Completion

After acceptance:

1. record new qualification evidence without rewriting historical evidence;
2. update current docs/index/roadmap only where truth changed;
3. mark/archive this Plan using current repository convention;
4. leave no second active cleanup Plan;
5. STOP.
