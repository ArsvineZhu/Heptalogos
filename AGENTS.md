# AGENTS.md

Repository-wide operating constraints for Codex and other coding agents working on Heptalogos.
Keep this file small. Detailed architecture knowledge lives in `Architecture_Corpus/`; task procedures live in `.agents/skills/`.

## 1. Authority and repository layout

Expected root layout:

```text
repo/
├─ Architecture_Corpus/    # normative current-state architecture
├─ .agents/                # agent skills and routing metadata
├─ AGENTS.md               # always-on operating constraints
└─ docs/                    # active plans and engineering knowledge
```

Authority order for implementation work:

1. `Architecture_Corpus/00-项目宪法与工程宪法.md`
2. applicable Architecture Corpus specs / machine-readable authorities
3. approved implementation plan under `docs/plans/active/`
4. current code as implementation reality

The implementation plan sequences work; it does not override the Architecture Corpus. Existing code, folders, package boundaries, tests, or historical behavior are not architecture authority.
Active implementation plans live under `docs/plans/active/`.
Completed implementation records live under `docs/plans/completed/`.
Before implementation, read the plan explicitly named by the task.
Before creating or materially revising a Foundation Implementation Plan, consult
`docs/roadmap/development-roadmap.md` for capability-horizon, dependency-order,
risk-retirement, and qualification guidance. The roadmap is planning guidance
only; it does not override the Architecture Corpus or an explicitly approved
plan.
If multiple active plans could govern the task and none is designated, surface the ambiguity rather than guessing by filename or recency.
For repository tooling, subprocess, package-manager, filesystem, or platform-development mechanics, consult `docs/engineering/GOTCHAS.md` and `docs/engineering/PLAYBOOK.md` when applicable.

If code, plan, and Corpus disagree, surface the conflict. Do not silently preserve or locally invent a new architecture.

The corpus-local `Architecture_Corpus/AGENTS.md` projection was intentionally removed because it duplicated this root policy. Do not infer or restore it; root `AGENTS.md` plus the applicable Heptalogos skills are the normal operating path.

## 2. Non-negotiable invariants

```text
Subject != Model | Agent Loop | Conversation | Host | Operator Assistant
State > Prompt
Proposal != Authority
Subject Authority != System Authority
Desired State != Actual State
Workflow State != Product State
WorkQueue Priority != Attention
Signal != Durable Fact
Telemetry != Evidence
Derived Index != Canonical Truth
External Request Sent != External Effect Known
Presentation != Authority
```

A persistent Subject must survive changes in model, provider, prompt, runtime, transport, and component generation.

## 3. Foundation scope

Foundation is `foundation-complete, feature-minimal`.

Do not pull advanced cognition into Foundation unless the approved task explicitly scopes it. Persona, Memory, Relationship, Attention, advanced Observation, Living State, Appraisal, Epistemic State, Commitments, proactive behavior, Reflection, Diary, Dream, long-term goals, and identity fusion enter through contracts and may legitimately be `UNAVAILABLE`.

Heptalogos owns product semantics and authority. Mature standards, OS facilities, libraries, and frameworks should own generic mechanics when they reduce total maintenance burden. An adopted dependency route is an implementation directive, not a suggestion.

Behavior-affecting literals must be classified before hardcoding. Framework/runtime implementation objects must not leak through stable architecture, domain, or public Extension contracts.

## 4. Skill routing

For non-trivial work, read every applicable Heptalogos skill **before implementation**. Multiple skills may apply.

| Work touches | Required skill |
|---|---|
| architecture boundaries, cross-domain design, unclear ownership, Corpus conflicts | `heptalogos-architecture` |
| boot, recovery, runtime reconciliation, durable execution, WorkQueue, persistence transaction, EffectFence, shutdown | `heptalogos-runtime-durability` |
| configuration, secrets, storage workspaces, DataOwner, backup/restore, portability, purge | `heptalogos-config-data` |
| Extension packages, generations, MicroSystems, Contributions, Service/Capability providers, trust/execution domains | `heptalogos-extensions` |
| Subject, messaging, Subject Chat, Reactor, context/prompt, AI runtime, model/tool capability, MCP | `heptalogos-interaction` |
| System Authority, Policy, Approval, SystemAction, Management API, CLI/Web management, Operator Assistant | `heptalogos-management` |
| dependencies, versions, toolchain, package manager/catalog, build/lint/typecheck mechanics | `heptalogos-dependencies` |
| verification strategy, qualification, crash/recovery evidence, live protocol/platform/release claims | `heptalogos-verification` |

If ownership remains unclear after reading the most likely skill, use `heptalogos-architecture` rather than guessing.

## 5. Implementation discipline

Before a consequential change:

- identify state and authority owners;
- confirm the change is inside Foundation scope;
- separate product semantics from generic mechanics;
- consult adopted dependency routing before implementing generic infrastructure;
- classify behavior-affecting literals;
- define failure, restart, recovery, pressure, and external-effect uncertainty where relevant;
- preserve explicit contract versions across durable/cross-generation boundaries;
- explicit contract versions do not imply undeclared PRE_PRODUCTION backward compatibility; preserve historical readers only for a declared retained-state or external-consumer obligation;
- define required Evidence / Execution Lineage and the verification level needed for the claim.

Do not create parallel authority paths for CLI, Web, Operator Assistant, extensions, or background workers. Do not use arbitrary shell/SQL/filesystem mutation as a shortcut around owning services.

Any process-memory background work must have an owner and cancellable/drainable lifecycle. Any obligation that must survive restart must use a Foundation-owned durable primitive.

## 6. Branch and integration workflow

Milestone work follows a branch → Draft PR → squash-merge flow:

```text
branch -> Draft PR -> Ready for Review -> independent review -> manual final CI -> squash merge
```

Ordinary pushes do not trigger CI. Agents may dispatch CI only for:

- final pre-merge verification after independent review PASS;
- a specific cross-platform regression not provable on the current host;
- explicit user request.

PR Ready is not merge authorization. The implementing Agent's self-review is insufficient. Final review authorization binds to the complete `(base_sha, head_sha)` candidate, not head alone. Final CI must verify that same independently reviewed pair. A new branch commit invalidates review and final CI; a base-branch change also invalidates both. If base changes, rebase/update the branch, rerun local gates, obtain a new independent review, and rerun final CI.

master changes go through PRs; a direct push requires explicit one-off user authorization. The detailed operating procedure is in `docs/engineering/playbooks/repository/milestone-pr-closure.md`.

All implementation verification gates must remain locally runnable and reproducible. GitHub Actions is not the sole verification substrate.

Milestone closure additionally requires the manual cross-platform CI projection defined in §6.

## 7. Completion truth

Verification status is exactly:

```text
PASS | FAIL | NOT_RUN | BLOCKED
```

Never report `PASS` for a gate that was not actually run. Mocks do not prove live protocol compatibility; one OS does not prove another; a development tree does not prove a source-less artifact.

Permanent gates must remain locally runnable and reproducible; milestone closure additionally requires the manually dispatched cross-platform final CI projection after independent review on the exact reviewed HEAD SHA.

Before claiming completion, ensure the applicable skill's completion checks and the claim-matched verification have been satisfied.
