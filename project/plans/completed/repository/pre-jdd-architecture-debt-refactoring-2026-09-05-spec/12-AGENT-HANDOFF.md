# 12 — Coding Agent Handoff

Use this when handing the bundle to the Coding Agent:

> Execute the single active **Pre-JDD Architecture Debt Refactoring** Plan against
> the current branch, using `aee3c1059942e3b701c89513a5ef1df8eb1e2009` as the
> architect-audited baseline.
>
> Read repository `AGENTS.md`, Project Charter, `11-ACTIVE-PLAN.md`, then the
> bundle specs for each affected area. JDD is already supplied at a higher
> executor level; do not copy it into repository governance.
>
> Execute S0→S7 continuously. S1–S6 are checkpoints, not approval gates. Do not
> stop after each refactor for review.
>
> Preserve current Subject/Communication Authority semantics. This is an
> implementation-architecture refactor, not a Product feature expansion.
>
> PRE_PRODUCTION applies: replace/delete old shapes directly. Do not keep legacy
> packaging, optional Management test paths, forwarding wrappers, compatibility
> readers, dual implementations, or deprecated aliases.
>
> Use mature adopted mechanics. In particular:
>
> - modern pnpm deploy for Product closure;
> - Execa for Subject OpenClaw child-process mechanics;
> - OpenClaw public Gateway/Plugin/SecretRef surfaces;
> - existing AI SDK route for model invocation.
>
> Do not create a ProcessSupervisor framework, generic Repository framework,
> Provider registry, DI container, JDD gate, LOC gate, or permanent debt audit.
>
> During iteration run the narrowest affected test/scenario. At the integrated
> boundary run `pnpm verify` once and then the formal Windows portable
> qualification target.
>
> Stop early only for a true PLAN_GAP as defined by the active Plan.
