# H1-S0 Governance & Truth Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the H-stage stabilization workflow, PRE_PRODUCTION compatibility policy, correct H1 project truth, and base+head-bound review/CI mechanics before changing Foundation runtime behavior.

**Architecture:** S0 is primarily governance and repository-truth alignment. It incorporates the approved H1-S rules into the Architecture Corpus and root agent workflow, corrects premature H1 closure records without rewriting Git history, and makes final authorization identify the full `(base_sha, head_sha)` candidate. No Foundation production behavior is changed in S0.

**Tech Stack:** Markdown/JSON Architecture Corpus, Node/pnpm repository verifiers, Git/GitHub Draft PR flow, GitHub Actions manual workflow.

**Spec:** `docs/engineering/specs/h1-stabilization-foundation-authority-reset.md`

## Global Constraints

- Baseline is `master@257ad6fe73924bcd1c9a00cad6a15938d6e6a2da`; if `master` moved before execution, stop with `BLOCKED`, inspect the delta, and rebase the plan before changing files.
- Branch is exactly `dev/h1-stabilization`; one Draft PR is used through S0/S1/S2.
- Current state is `M5B=CLOSED`, `H1_FUNCTIONAL=COMPLETE`, `H1_STABILIZATION=ACTIVE`, `H1=OPEN`, `H2=NOT_ELIGIBLE`.
- `CompatibilityEpoch=PRE_PRODUCTION`; repository history alone never creates a compatibility obligation.
- Do not restore `Architecture_Corpus/AGENTS.md`.
- Ordinary commits do not dispatch CI.
- The Architecture Corpus remains self-contained current-state authority; historical Git commits are not rewritten.
- All Corpus content changes require `manifest.json` and `SHA256SUMS.txt` regeneration and `pnpm check:corpus` PASS.

---

### Task 1: Establish the stabilization workspace, spec, control record, and Draft PR

**Files:**
- Create: `docs/engineering/specs/h1-stabilization-foundation-authority-reset.md`
- Create: `docs/plans/active/foundation/h1s-control-record.md`
- Create: `docs/plans/active/foundation/h1s-s0-governance-truth-reset.md`
- Create: `docs/plans/active/foundation/h1s-s1-foundation-authority-stabilization.md`
- Create: `docs/plans/active/foundation/h1s-s2-clean-state-qualification-closure.md`
- Modify: `docs/plans/README.md`
- Delete: `docs/plans/active/.gitkeep` once the directory contains real plans

**Interfaces:**
- Consumes: exact baseline SHA and this plan package.
- Produces: the repository-visible H1-S execution contract and the sole governing-plan pointer.

- [ ] **Step 1: Verify the baseline and clean worktree**

```bash
git fetch origin master
test "$(git rev-parse origin/master)" = "257ad6fe73924bcd1c9a00cad6a15938d6e6a2da"
git status --short
```

Expected: SHA comparison succeeds and `git status --short` is empty. Otherwise report `BLOCKED` and do not create the branch.

- [ ] **Step 2: Create an isolated worktree/branch**

Use the repository's worktree skill/process, then equivalent Git operations must produce:

```bash
git worktree add ../heptalogos-h1-stabilization \
  -b dev/h1-stabilization \
  257ad6fe73924bcd1c9a00cad6a15938d6e6a2da
cd ../heptalogos-h1-stabilization
```

Expected: `git branch --show-current` prints `dev/h1-stabilization`.

- [ ] **Step 3: Install the approved spec/control/phase-plan files**

Copy the exact files from this approved plan package into the paths listed above. Do not rewrite their scope or compatibility decisions during execution.

- [ ] **Step 4: Rewrite `docs/plans/README.md` current truth**

Its Active section must list H1-S0/S1/S2 and explicitly state:

```text
Governing H1-S plan: h1s-s0-governance-truth-reset.md
S1/S2 are approved but execution-gated by h1s-control-record.md.
```

Remove the stale M5A ACTIVE entry. Completed must include M5A and M5B.

- [ ] **Step 5: Verify plan navigation has no stale M5A ACTIVE claim**

```bash
rg -n "M5A.*ACTIVE|active/foundation/m5a" docs/plans
```

Expected: no result outside historical quoted text in completed plans.

- [ ] **Step 6: Commit the control plane**

```bash
git add docs/engineering/specs docs/plans
git commit -m "docs: establish H1 stabilization control"
```

- [ ] **Step 7: Push and open the single Draft PR**

```bash
git push -u origin dev/h1-stabilization
gh pr create \
  --draft \
  --base master \
  --head dev/h1-stabilization \
  --title "H1-S Foundation stabilization and compatibility reset" \
  --body "H1-S short stabilization pass. S0 governance/truth reset -> S1 bounded Authority/canonical-state stabilization -> S2 qualification/closure. H2 work is forbidden."
```

Expected: one Draft PR targeting `master`. Do not dispatch CI.

---

### Task 2: Incorporate stabilization and PRE_PRODUCTION compatibility into the Architecture Corpus

**Files:**
- Create: `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`
- Modify: `Architecture_Corpus/00-项目宪法与工程宪法.md`
- Modify: `Architecture_Corpus/16-验证与资格认定体系.md`
- Modify: `Architecture_Corpus/19-术语表.md`
- Modify: `Architecture_Corpus/20-架构审查清单.md`
- Modify: `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- Modify: `Architecture_Corpus/README.md`
- Modify: `Architecture_Corpus/INDEX.md`
- Modify: `Architecture_Corpus/manifest.json`
- Modify: `Architecture_Corpus/SHA256SUMS.txt`

**Interfaces:**
- Consumes: H1-S spec §§2–4, 15–16.
- Produces: current-state architecture rules that later S1 code must satisfy.

- [ ] **Step 1: Add the H-stage stabilization closure contract**

`26-开发阶段闭包-稳定化与兼容性治理.md` must define, in Chinese with high-density technical terminology:

```text
Hn functional completion != Hn closure
Hn-S is mandatory before Hn CLOSED
Hn-S is short/bounded, not a second development stage
A/B/C scope budget and Stop Rule
one branch / one PR / phased plans / final external closure tuple
H2 cannot start until H1-S squash merge closes H1
```

Include the current H1 state and the derived post-merge closure rule; do not claim the future review/CI/merge already passed.

- [ ] **Step 2: Clarify constitution compatibility semantics**

In `00-项目宪法与工程宪法.md`, preserve explicit versioning but add the invariant:

```text
VERSIONED != HISTORICALLY COMPATIBLE.
COMPATIBILITY REQUIRES A DECLARED OBLIGATION.
```

Define `CompatibilityEpoch = PRE_PRODUCTION` for the current project and state that merged commits/internal dev state/regenerable fixtures do not create compatibility obligations by themselves.

- [ ] **Step 3: Make S15 compatibility rules obligation-conditional**

In `specs/S15-Foundation横切合同.md` keep `DURABLE PAYLOADS ARE VERSIONED` and `PROTOCOL REVISION IS DATA`, but replace unconditional old-writer/upcast requirements with:

```text
If a declared compatibility obligation exists:
  reader declares supported historical versions and migration/upcast/reject rules.
If no compatibility obligation exists in PRE_PRODUCTION:
  the best current contract may be canonicalized as V1;
  obsolete development readers/migrations are deleted;
  obsolete shapes are rejected.
```

Do not weaken future production compatibility requirements.

- [ ] **Step 4: Separate stage closure evidence from product qualification**

In `16-验证与资格认定体系.md` define:

```text
repository verification != live integration qualification
stage closure != product qualification closure
historical evidence != current property ledger
final review/CI/merge evidence is external candidate-governance evidence
```

State that H1 may close with product boundaries such as source-less packaging, hardware power-loss, service-account ACL and platform-specific real-PG cases still honestly `NOT_RUN`, provided H1 does not claim those properties as proven.

- [ ] **Step 5: Extend architecture review and glossary**

Add to `20-架构审查清单.md`:

```text
What real retained state/external consumer creates compatibility obligation?
Does a previous revision remain evidence only, or can it incorrectly regain Authority?
Does recovery depend only on required lifecycle roots?
Can normal boot bypass an incomplete durable obligation?
Is a process-generation reclaim decision based on positive proof or ambiguity?
Has stage stabilization occurred before Hn closure?
```

Add `CompatibilityEpoch`, `Stage Stabilization (Hn-S)`, `Current Evidence`, and `Historical Evidence` to `19-术语表.md`.

- [ ] **Step 6: Update Corpus navigation**

Add document 26 to `README.md` and `INDEX.md`; do not add a corpus-local AGENTS file.

- [ ] **Step 7: Scan for conflicting unconditional compatibility language**

```bash
rg -n "supported old|old writer|旧版本|旧 writer|migration|upcast|兼容|H1.*CLOSED|h1:\s*CLOSED" Architecture_Corpus
```

Review every result. Outside qualification/history material, no statement may require preserving historical PRE_PRODUCTION formats merely because they once existed.

- [ ] **Step 8: Regenerate Corpus manifest and checksums deterministically**

Run this from repository root after all Corpus edits:

```bash
node --input-type=module <<'NODE'
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve('Architecture_Corpus');
const manifestPath = join(root, 'manifest.json');
const sumsPath = join(root, 'SHA256SUMS.txt');
const hash = async (p) => createHash('sha256').update(await readFile(p)).digest('hex');
async function collect(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await collect(p));
    else if (e.isFile()) out.push(relative(root, p).replaceAll('\\', '/'));
  }
  return out;
}
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const paths = (await collect(root))
  .filter((p) => p !== 'manifest.json' && p !== 'SHA256SUMS.txt')
  .sort();
const files = [];
for (const p of paths) {
  const s = await stat(join(root, p));
  files.push({ path: p, size: s.size, sha256: await hash(join(root, p)) });
}
manifest.designDate = '2026-08-23';
manifest.contentFileCount = files.length;
manifest.files = files;
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const sumPaths = [...paths, 'manifest.json'];
const sums = [];
for (const p of sumPaths) sums.push(`${await hash(join(root, p))}  ${p}`);
await writeFile(sumsPath, sums.join('\n') + '\n');
NODE
```

- [ ] **Step 9: Verify Corpus integrity**

```bash
pnpm check:corpus
```

Expected: `PASS corpus ...`.

- [ ] **Step 10: Commit Corpus governance**

```bash
git add Architecture_Corpus
git commit -m "docs: define H-stage stabilization governance"
```

---

### Task 3: Bind independent review/final CI to the complete candidate pair

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/engineering/playbooks/repository/milestone-pr-closure.md`
- Create: `docs/engineering/playbooks/repository/h-stage-stabilization-closure.md`
- Modify: `docs/engineering/PLAYBOOK.md`
- Modify: `docs/engineering/README.md`
- Modify: `.github/workflows/verify.yml`

**Interfaces:**
- Consumes: `ReviewCandidate = (base_sha, head_sha)` from the spec.
- Produces: exact invalidation/CI procedure used by S2.

- [ ] **Step 1: Update the root Agent invariant**

`AGENTS.md` §6 must state:

```text
Final review authorization binds to (base_sha, head_sha), not head alone.
A new branch commit invalidates review and final CI.
A base-branch change also invalidates review and final CI.
If base changes, rebase/update the branch, rerun local gates, obtain a new independent review, rerun final CI.
```

Also clarify in §5 that explicit contract versions do not imply undeclared PRE_PRODUCTION backward compatibility.

- [ ] **Step 2: Add the dedicated H-stage stabilization closure playbook**

`h-stage-stabilization-closure.md` must define:

```text
short-lived dev/h<n>-stabilization branch
single Draft PR
phase-plan promotion via control record
no CI for ordinary phase commits
complete all repository changes before final review
mark plans implementation-complete before candidate freeze
review exact base+head
manual final CI exact base+head
verify base/head unchanged immediately before squash merge
non-mutating post-merge reconciliation
```

`milestone-pr-closure.md` remains the generic milestone procedure and links to the stabilization playbook for Hn-S.

- [ ] **Step 3: Add `base_sha` to manual final CI input**

Modify `.github/workflows/verify.yml` so `workflow_dispatch.inputs` includes:

```yaml
base_sha:
  description: Full reviewed base-branch commit SHA
  required: true
  type: string
```

Change checkout to include full history:

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
  with:
    ref: ${{ inputs.target_sha }}
    fetch-depth: 0
    persist-credentials: false
```

Replace the SHA-only verification with a cross-platform Node step equivalent to:

```js
import { execFileSync } from "node:child_process";
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (head !== process.env.TARGET_SHA) process.exit(1);
execFileSync("git", ["cat-file", "-e", `${process.env.BASE_SHA}^{commit}`]);
const mergeBase = execFileSync(
  "git",
  ["merge-base", process.env.BASE_SHA, process.env.TARGET_SHA],
  { encoding: "utf8" },
).trim();
if (mergeBase !== process.env.BASE_SHA) process.exit(1);
console.log(`PASS review candidate base=${process.env.BASE_SHA} head=${head}`);
```

with `BASE_SHA` and `TARGET_SHA` supplied from workflow inputs.

- [ ] **Step 4: Update manual dispatch examples**

Final CI command becomes:

```bash
BASE_SHA="$(git rev-parse origin/master)"
HEAD_SHA="$(git rev-parse HEAD)"
gh workflow run verify.yml \
  --ref master \
  -f base_sha="$BASE_SHA" \
  -f target_sha="$HEAD_SHA" \
  -f reason=final-pre-merge
```

A targeted Draft cross-platform regression also supplies the base from which the tested head was derived.

- [ ] **Step 5: Verify repository policy and formatting**

```bash
pnpm check:repository
pnpm format:check
```

Expected: PASS. Do not dispatch the workflow.

- [ ] **Step 6: Hold these workflow changes for the S0 transition checkpoint**

Do not create a separate commit here. The workflow rule and the corrected H1 truth are one governance checkpoint; continue directly to Task 4 with the worktree dirty only with the reviewed Task 3 changes.

---

### Task 4: Correct premature H1 closure truth and promote S1

**Files:**
- Modify: `docs/roadmap/development-roadmap.md`
- Modify: `docs/plans/completed/foundation/m5b-bounded-bootstrap-recovery-h1-closure.md`
- Modify: `Architecture_Corpus/qualification/results/Q-BOOT-01.md`
- Modify: `Architecture_Corpus/qualification/results/Q-PRIVATE-POSTGRES-01.md`
- Modify: `Architecture_Corpus/manifest.json`
- Modify: `Architecture_Corpus/SHA256SUMS.txt`
- Modify: `docs/plans/active/foundation/h1s-control-record.md`
- Move: `docs/plans/active/foundation/h1s-s0-governance-truth-reset.md` -> `docs/plans/completed/foundation/h1s-s0-governance-truth-reset.md`
- Modify: `docs/plans/README.md`

**Interfaces:**
- Consumes: current state tuple from the spec.
- Produces: S1 as sole executable governing plan.

- [ ] **Step 1: Correct roadmap current state**

The current-state section must report:

```yaml
M5B: CLOSED
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: ACTIVE
H1: OPEN
H2: NOT_ELIGIBLE
```

Replace unconditional text saying H1 is closed with the H1-S closure condition. Preserve legitimate historical milestone descriptions as history.

- [ ] **Step 2: Correct the completed M5B plan without rewriting history**

Keep its filename/title. Add a prominent correction near the top:

```text
M5B is CLOSED and H1 functional work is complete.
The former “H1 closure” conclusion was superseded by the H1-S stabilization decision.
H1 remains OPEN until H1-S closes.
```

Do not rename the historical plan solely to erase its original intent.

- [ ] **Step 3: Correct current qualification stage labels only**

In `Q-BOOT-01.md` and `Q-PRIVATE-POSTGRES-01.md`, correct current H1 state to OPEN/stabilizing. Do **not** yet delete legacy compatibility evidence; S1 has not changed behavior yet. Mark those properties as currently implemented but scheduled for canonical reset, not as production compatibility obligations.

- [ ] **Step 4: Search for stale current-state closure claims**

```bash
rg -n "H1[^\n]{0,40}CLOSED|h1:\s*CLOSED|H2[^\n]{0,40}ELIGIBLE" \
  AGENTS.md Architecture_Corpus docs
```

Expected after edits: remaining matches are clearly historical quotations/records or the conditional future closure rule, never an unconditional current-state claim.

- [ ] **Step 5: Regenerate Corpus manifest/checksums and run full local gate**

Reuse the deterministic regeneration command from Task 2, then:

```bash
pnpm check:corpus
pnpm verify
```

Expected: all PASS.

- [ ] **Step 6: Promote S1 in the control record**

Set:

```yaml
governingPlan: h1s-s1-foundation-authority-stabilization.md
S0.planState: COMPLETED
S0.executionGate: CLOSED
S1.executionGate: OPEN
```

Move S0 to completed, update `docs/plans/README.md`, and ensure S2 remains blocked.

- [ ] **Step 7: Commit the S0 transition**

```bash
git add AGENTS.md .github/workflows/verify.yml docs/engineering Architecture_Corpus docs/plans docs/roadmap
git commit -m "docs: align H1 stabilization workflow truth"
git push
```

Expected: Draft PR remains Draft. No CI run. S1 is now the only executable governing plan.
