# Coding-Agent Skills

Skills remain enabled. This cleanup removes Skills whose main function is teaching the executor how to make decisions that belong upstream.

## Delete decision/meta curricula

Delete these Skill directories:

```text
.agents/skills/authoring-skills/
.agents/skills/complexity-admission/
.agents/skills/scope-control/
.agents/skills/recovery-design/
.agents/skills/repository-check-design/
.agents/skills/test-design/
```

Do not recreate them under different names.

`authoring-skills` is removed because Skill authoring is infrequent meta-work and the repository already has structural Skill guidance/checking. Its ten-step authoring/evaluation procedure does not justify permanent auto-discovery cost.

`complexity-admission` and `scope-control` are removed because they make the Coding Agent perform architecture/project admission and generate records.

`recovery-design` is removed because failure/recovery semantics must already be decided by the Plan/Specs.

`repository-check-design` contains useful principles, but permanent gate design is not an executor Skill. Its standing-invariant/tombstone principle is moved into governance.

`test-design` is removed because basic test-level selection is generic model competence and proof strategy belongs to the active Plan. The genuinely Heptalogos-specific evidence boundary remains in `claim-verification`.

## Keep only recurring project-specific executor procedures

Retain and shrink:

```text
claim-verification
durable-state-change
knowledge-maintenance
lifecycle-change
mechanics-routing
preproduction-evolution
semantic-boundary-change
```

There is no minimum Skill count and no validator allow-list.

### claim-verification

Keep:

```text
claim must not exceed executed boundary
mock != live provider
one platform != cross-platform
source tree != source-less artifact
PASS / FAIL / NOT_RUN / BLOCKED
```

The active Plan supplies the claim. The Skill must not expand the qualification matrix.

### durable-state-change

Use only when the active Plan already authorizes a durable semantic change.

The procedure checks implementation facts such as:

```text
semantic owner
Host/transaction fence
versioned payload/shape
declared compatibility obligation
cross-process/restart representation
baseline/reset action
Plan-specified proof
```

Remove all complexity-admission questionnaires, “prove a current consumer” deletion logic, output forms, and automatic Skill chains.

If the semantic distinction or owner is not decided, return `PLAN_GAP`.

### lifecycle-change

Use only for an already-authorized lifecycle change.

Keep Heptalogos-specific implementation checks:

```text
Desired / Actual
Authority owner
generation fencing
in-flight work
resource disposal
point of no return
declared terminal behavior
```

Do not design the failure model/recovery inside the Skill.

### mechanics-routing

Keep because it directly counters dependency avoidance.

Procedure:

```text
use the semantic owner named by the Plan/Spec
use an existing adopted provider route when one exists
do not create parallel generic mechanics
use an ordinary mature dependency when the active Plan selects it
PLAN_GAP only when a material provider-role decision is actually missing
```

Remove provider bake-off/admission worksheets and mandatory records.

### preproduction-evolution

Keep direct current-shape rewrite behavior:

```text
read declared compatibility obligations
rewrite current callers/state/baseline
delete obsolete internal route
do not leave compatibility bridge
```

Explicitly state:

> “obsolete shape” does not mean an approved future-facing semantic seam with no current consumer.

Do not create tombstone checks after removal.

### semantic-boundary-change

Keep because the active Plan already owns the boundary decision.

Implement the new owner/API direction, update current consumers, remove the old current path, update affected Specs, and run specified proof.

No admission worksheet or chained Skills.

### knowledge-maintenance

Keep because Heptalogos has explicit knowledge owners and AI retrieval/navigation.

Use only when a current fact owner/navigation projection actually changes.

Update the canonical owner and only projections made stale. Do not turn every code edit into documentation synchronization.

## Skill AGENTS

Rewrite `.agents/skills/AGENTS.md` around one admission rule:

> A Coding Skill is a recurring project-specific executor procedure for an already-authorized job. It must provide non-obvious procedural value beyond normal model competence + Plan + code. It cannot own architecture, scope, provider selection, failure model, test strategy, or permanent gate design.

A mature library/tool/script should own deterministic mechanics when possible.

Do not recursively load another Skill merely because a Skill mentions it.

## Harness documents

Rewrite `project/engineering/agent-harness/design.md` to show:

```text
Human/Web Architect research and decisions
→ decision-complete active Plan
→ bounded Coding-Agent context
→ normal coding competence + applicable executor Skill
→ Plan-specified proof
→ STOP
```

Replace the current “Decision it supports” capability table with executor-job descriptions.

Replace `project/engineering/agent-harness/evaluation.md`'s large simulated scenario catalog with a short maintainer note asking whether a rule/Skill:

```text
addresses a real recurring Heptalogos failure
is project-specific
reduces rather than expands executor discretion
adds forms/process with no product value
duplicates a mature tool
can be deleted without losing capability
```

No fake behavioral PASS/NOT_RUN evaluation bureaucracy is maintained when no independent runner exists.

Keep `check:agents` structural only.
