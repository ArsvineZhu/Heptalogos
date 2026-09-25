# Heptalogos Pre-JDD Architecture Debt Refactoring

**Artifact type:** architect-owned, decision-complete execution specification
**Baseline branch:** `feature/gateway-first-airuntime-external-integration-2026-09-03`
**Baseline commit:** `aee3c1059942e3b701c89513a5ef1df8eb1e2009`
**Date:** 2026-09-05
**Execution model:** one continuous active Plan; no intermediate human approval gates

## 1. Why this work exists

The P2–P4 Product Reality Convergence proved a real Windows source-less Product,
but the execution cost exposed accumulated pre-JDD implementation debt:

- packaging required repeated temporary product layouts and ad-hoc probes;
- the portable assembler mutates and later repairs the development workspace;
- Subject OpenClaw integration combines provider projection, secrets, process
  supervision, Gateway protocol, run-event correlation, recovery, and diagnostics
  in one large adapter;
- several semantic owners still use a pre-JDD “single `service.ts` + SQL helpers +
  orchestration closures” shape;
- Management SystemAction behavior is distributed across multiple synchronized
  switches;
- ProductHost integration verification has become a single broad, slow scenario
  file;
- some production seams remain optional only for legacy test fixtures.

This is not cosmetic cleanup and does not introduce a permanent code-health
program. It is a bounded retrospective refactor justified by observed Product
assembly and maintenance pressure.

## 2. Governing order

Execution must apply these authorities in order:

1. the executor's JDD system prompt;
2. repository `AGENTS.md`;
3. `project/governance/project-charter.md`;
4. this active Plan bundle;
5. affected current Architecture / Specs / package README files;
6. current code and focused executable evidence.

JDD is not copied into the repository by this Plan.

## 3. Continuous execution rule

The files in this bundle are one authorization. Their sections are implementation
checkpoints, not approval gates.

Proceed continuously:

```text
S0 Current-truth convergence
→ S1 Portable packaging rewrite
→ S2 Subject OpenClaw runtime refactor
→ S3 Management SystemAction architecture
→ S4 Subject + Messaging owner refactor
→ S5 AIRuntime refactor
→ S6 ProductHost composition + verification refactor
→ S7 integrated verification + portable qualification
→ STOP
```

Do not stop after S1–S6 merely to request review.

Stop only for:

1. a material product semantic / Authority / ownership / failure-model decision
   not decided by this bundle;
2. concrete evidence that the required public API of an adopted provider cannot
   satisfy the specified behavior and the authorized fallback is also
   insufficient;
3. a hard external artifact/platform/credential condition that prevents the
   explicitly required final qualification.

Ordinary test failures, TypeScript errors, package-layout fallout, implementation
bugs, and local refactoring decisions inside the specified boundaries are
in-scope work, not PLAN_GAP.

## 4. Files

- `00-ARCHITECTURAL-DECISION-LEDGER.md` — frozen decisions and KEEP/REFACTOR/REWRITE verdicts.
- `01-DEBT-EVIDENCE-AND-SCOPE.md` — why each target is included or excluded.
- `02-PORTABLE-PACKAGING-REWRITE.md` — pnpm-native Product closure and recurring qualification.
- `03-SUBJECT-OPENCLAW-RUNTIME-REFACTOR.md` — provider/process/secret/lifecycle boundary.
- `04-MANAGEMENT-SYSTEM-ACTION-ARCHITECTURE.md` — remove multi-switch change amplification.
- `05-SUBJECT-MESSAGING-REFACTOR.md` — internal semantic owner and persistence separation.
- `06-AI-RUNTIME-REFACTOR.md` — route authority vs AI SDK invocation mechanics.
- `07-PRODUCT-HOST-VERIFICATION-REFACTOR.md` — composition and scenario-focused verification.
- `08-EXECUTION-PLAN.md` — fine-grained ordered execution.
- `09-ACCEPTANCE-AND-STOP.md` — final claims and STOP boundary.
- `10-FILE-CHANGE-MAP.md` — expected file-level movement.
- `11-ACTIVE-PLAN.md` — repository-facing single active Plan.
- `12-AGENT-HANDOFF.md` — short handoff text for the Coding Agent.
- `SOURCES.md` — evidence and upstream references used by the architect.

## 5. Non-goals

This Plan does not implement:

- Observation Window / Global Attention;
- Persona, Memory, Relationship, Living State, Reflection, Diary, Dream;
- external Milky/OneBot Driver;
- System Assistant / Machine Operations OpenClaw;
- installer, service manager, updater, signing, notarization;
- macOS source-less qualification;
- a generic ProcessSupervisor, Repository framework, Provider registry, DI
  container, JDD checker, LOC gate, complexity dashboard, or refactoring policy
  framework.

Those remain separate future decisions.

## 6. Baseline Product semantics that must survive unchanged

```text
MessageFact
→ ConversationMailbox
→ Reaction
→ Subject cognition proposal
   ├─ NO_COMMUNICATION
   └─ COMMUNICATE(semantic content)
        → deterministic Review
        → CommunicationCommit
        → independent Expression
        → outbound MessageFact
```

Subject Authority remains Heptalogos-owned. OpenClaw remains replaceable cognition
mechanics. Messaging owns canonical MessageFact. System Management remains a
separate Authority path.
