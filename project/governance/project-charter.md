# Heptalogos Project Charter

**Intended repository owner:** `project/governance/project-charter.md`
**Audience:** Coding Agents, reviewers, architecture sessions, maintainers
**Purpose:** concise standing project posture and architecture-navigation contract
**Not:** a milestone plan, implementation history, package inventory, or detailed Spec.

This file is intentionally short enough to be mandatory reading. Detailed rules remain in their canonical owners.

---

## 1. Project thesis

Heptalogos is a research and prototype system for an AI **Subject** that persists across real instant-messaging events. The research target is continuity of identity, state, memory, relationships, behavior, commitments, timing, silence, and controlled autonomy across messages, processes, models, providers, and platforms.

The system is not a generic agent framework and is not a prompt-persona wrapper.

Foundation exists only to make the Subject and real IM execution trustworthy enough to research and operate. Generic infrastructure completeness is not a project goal.

## 2. Core product invariants

1. **Subject != Model.** Replacing a model/provider/prompt/runtime does not create a new Subject.
2. **State > Prompt.** Long-lived product state belongs to typed semantic owners; prompts are projections.
3. **Proposal != Authority.** Model output, retrieval, tools, extensions, and assistants propose; explicit commit paths mutate canonical truth.
4. **Subject Authority != System Authority.** Cognitive/social control and infrastructure administration are separate authority domains.
5. **Canonical truth precedes async work.** Durable obligation follows canonical fact, not the reverse.
6. **External effects may be uncertain.** `uncertain` is a first-class truthful outcome.
7. **Signal is a hint.** Wakeups never replace durable/canonical state.
8. **Execution is attributable.** Important decisions, effects, state changes, and recovery actions retain lineage/evidence appropriate to their semantics.
9. **Generation is fenced.** Retired/stale generation code cannot receive new current-generation work or commit as current.
10. **Presentation is projection.** Web, CLI, IM adapters, and operator surfaces do not own product truth.

## 3. Engineering ownership model

Heptalogos owns product semantics and authority. Mature dependencies own generic mechanics where they are suitable.

For each non-trivial mechanism identify:

```text
semantic owner
mechanics provider
adapter boundary
consumer
failure owner
```

Do not let a framework object, provider status, queue record, database handle, or test fake become product Authority by convenience.

## 4. Library-first

Before implementing generic mechanics, inspect in order:

```text
existing semantic owner
→ existing repository primitive/adapter
→ adopted dependency route
→ Standard / Node / OS facility
→ mature library/framework
→ thin adapter/composition
→ custom mechanic only with concrete insufficiency evidence
```

This applies to state machines, queues, durable workflows, schema validation, process control, database access, filesystem operations, protocol transport, retry/timeouts, observability, crypto, CLI, package acquisition, and repository tooling.

An `ADOPTED` dependency route is an implementation directive. Do not silently create a parallel provider.

## 5. PRE_PRODUCTION posture

Current mode is active research/development, not production maintenance.

Default permissions:

```text
rewrite internal APIs
rewrite current durable V1 in place
move packages
change package boundaries
rebuild development databases/fixtures
remove development-stage behavior
reject unsupported old shapes
keep low-cost future-facing semantic seams
fail loudly on unsupported rare failures
restart/reset/operator recovery when adequate
```

Development history creates no compatibility obligation. A compatibility obligation exists only when declared by the current machine-readable authority.

Do not preserve old names, old paths, old state shapes, old tests, or previous branch behavior merely because they once existed.

## 6. Future-aware without speculative machinery

A future-facing **semantic seam** may exist before its consumer when it maps to an approved product direction and is cheap to maintain.

This does not authorize future machinery.

Cheap future-facing structures may include:

```text
Service/Capability boundary
typed provider seam
configuration namespace
generation identity
extension contribution point
network/secret/config semantic slot
```

Expensive future machinery requires current evidence:

```text
new durable state
new background worker
new recovery protocol
new compatibility path
new scheduler
new provider implementation
new lifecycle state machine
new generic framework
```

Do not apply `no current consumer -> delete` as a universal rule. Do apply `no current reason for permanent machinery -> do not build it`.

## 7. Failure and recovery posture

Truthful failure is preferable to fictitious restoration.

Current reliability priority:

```text
canonical truth
→ authority fencing
→ first-order crash/restart recovery
→ common operational failure handling
→ explicit recovery state
→ fail-stop when proof is insufficient
```

A recovery path must be smaller than the system it recovers. Recovery-of-recovery is not automatically authorized.

After an authority point of no return, do not construct heroic rollback solely to make the process look graceful. Fenced, terminal, `RECOVERY_REQUIRED`, restart, reset, or operator action are valid outcomes when canonical truth remains inspectable.

## 8. Testing posture

Tests prove owned contracts; they do not create architecture.

A test inconvenience does not authorize:

```text
public DI
factory proliferation
mock-specific product states
rollback semantics
recovery branches
permanent fault hooks
alternative repositories/providers
```

Prefer the strongest affordable proof for the claim:

```text
pure semantic test
→ package integration
→ real provider/database boundary
→ process restart/crash qualification
→ shipping artifact/platform qualification when claimed
```

Test count is not a quality target. Delete tests whose behavior is deliberately deleted. Split tests by contract/scenario when a file mixes unrelated concerns.

## 9. Package and code architecture

Packages express semantic ownership or independently replaceable mechanics, not file-size preferences.

Repository layout should make subsystem role visible. The preferred workspace shape is:

```text
packages/<group>/<package>/
```

Group directories are containers and documentation scopes, not packages. Grouping follows dependency/co-change/ownership clustering, not aesthetic taxonomy.

Within a package, organize source by responsibility only when the package has multiple stable subareas. Do not create one-file folders or decorative layers.

Cross-package product/integration compositions do not belong inside an unrelated package merely because that package bootstraps the fixture.

## 10. Maintenance-burden objective

Optimize total maintenance burden, not any single metric.

Consider:

```text
custom LOC
state-space size
public API area
test LOC
fixture complexity
debug paths
cross-platform burden
provider upgrade burden
knowledge duplication
recovery branches
configuration burden
```

A refactor is successful when semantic capability is preserved and the permanent system becomes easier to reason about and change.

## 11. Knowledge authority

Use one canonical owner per fact:

```text
product intent                 docs/product/**
architecture concepts          docs/architecture/**
current normative contracts    specs/**
standing engineering rules    project/governance/**
provider/dependency decisions  project/dependencies/**
current development order      project/roadmap/**
active work authorization      project/plans/active/**
executed qualification         project/qualification/**
Agent persistent routing       AGENTS.md
package ownership              package/group README + packages/INDEX.md
procedural methods             .agents/skills/**
```

Historical plans and Git preserve history. Current docs must describe current truth, not narrate obsolete stages.

## 12. Coding-Agent operating rule

Before substantive edits:

1. Read this charter.
2. Read root and scoped `AGENTS.md`.
3. Read the current active Plan.
4. Read affected package/group README and applicable Specs.
5. Read current dependency routes for any generic mechanic being changed.
6. Verify the repository state rather than relying on a handoff SHA.

During execution:

```text
preserve semantic owner
use adopted mechanics
keep changes within the active Plan
update current consumers directly
remove obsolete paths rather than bridge them
keep failure claims within tested evidence
```

Stop the affected branch as `PLAN_GAP` only when execution requires a new semantic owner, new durable distinction, new provider role, new compatibility obligation, or broader failure model not decided by the active Plan.

When acceptance evidence is green, STOP. Do not start a second cleanup or hardening pass.
