# Foundation M1 Final Corrective and Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** COMPLETED

**Goal:** Close Foundation M1 without expanding into M2 by correcting the remaining BootstrapState publication-durability gap, hardening BootstrapJournal, replacing per-push/PR CI with controlled manual CI, and establishing an enforceable Branch → Draft PR → Ready → Independent Review → Manual Final CI → Squash Merge closure flow.

**Architecture:** M1 product scope remains unchanged. `write-file-atomic` continues to own generic temp-write / file-fsync / atomic-rename mechanics; Heptalogos adds only the missing containing-directory publication durability required by the Architecture Corpus. GitHub Actions becomes an explicitly manual cross-platform verification projection: ordinary development never triggers CI automatically, Agents may dispatch it only for bounded reasons, and merge authorization requires a passing independent review followed by a green manual CI run against the exact reviewed commit SHA.

**Tech Stack:** Node.js 24.19.0, pnpm 11.22.0, Nx 23.1.1, TypeScript 7.0.2 primary compiler, TypeScript 6.0.2 compiler-API compatibility lane, Vitest 4.1.11, TypeBox + Ajv, `write-file-atomic` 8.x, GitHub Pull Requests, GitHub Actions.

**Authority / Required Reading:**

- `AGENTS.md`
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/25-TypeScript与仓库工具链.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/references/dependency-routing.json`
- `docs/plans/completed/foundation/m1-development-spine.md`
- PR `#1` — `Foundation M1 development spine`

**Review baseline when this plan was authored (2026-08-21):**

- Base: `master` at `6e4c6c81f83c0cefb3f5b9f7abc4d5f3a0cdddfc`
- Branch: `dev/m1-development-spine`
- Reviewed HEAD: `7a42ac4faba3456e1ad7849a5d1aafcab8971a09`
- PR: `#1`, Draft
- Previous corrective findings for Nx no-op targets, repository Skill exclusions, workspace discovery, runtime UUID/digest validation, and raw JSON/Ajv diagnostic exposure are already closed and must not be reopened unless regression evidence appears.

---

## Global Constraints

- This is the **final M1 corrective**. Do not implement `PathProfile`, bootstrap ownership, PostgreSQL, DBOS, Host lease/fencing, RuntimeReconciler, Management, Messaging, AI, Subject, or any other M2+ subsystem.
- `Architecture_Corpus/` remains normative current-state architecture Authority.
- No new external dependency is expected or authorized by this plan.
- Library-first remains mandatory. Do not reimplement `write-file-atomic`; wrap it narrowly to satisfy the product durability contract it does not provide by itself.
- Verification status is exactly `PASS | FAIL | NOT_RUN | BLOCKED`.
- Missing mechanics are not `NOT_RUN`. If source inspection proves a required property is absent, the property is `FAIL` until corrected.
- Real power-loss qualification remains separate from code/mechanics review. Unit/integration tests must not claim real power-loss durability.
- `scripts/` remains executable entrypoints only. Do not turn it back into a utility library.
- Ordinary branch pushes, Draft PR synchronization, PR Ready transitions, and pushes to `master` **must not automatically trigger GitHub Actions**.
- Agents may manually dispatch CI only for:
  1. final pre-merge verification after independent review has passed;
  2. a specific cross-platform regression that cannot be verified on the current host;
  3. an explicit user request.
- Manual CI is not an every-commit debugging loop. Local tests and `pnpm verify` are the normal development loop.
- Local `pnpm verify` remains mandatory and locally reproducible. CI adds cross-platform evidence; it does not replace local gates.
- PR `Ready for review` means only “implementation is ready for independent review”. It is **not merge authorization**.
- The implementing Agent's self-review does not satisfy the independent-review gate.
- Independent review may be performed by the user, another independent reviewer, or ChatGPT acting as an independent code reviewer.
- Final CI must run **after** that review and on the **exact reviewed commit SHA**.
- Any repository commit after a passing independent review invalidates that review for merge authorization.
- Any repository commit after final CI invalidates the final CI and the prior review; return to independent review, then rerun final CI.
- Earlier CI runs remain useful evidence but never authorize a later HEAD.
- `master` changes go through PRs. Direct push is allowed only when the user explicitly authorizes a one-off emergency/history-repair exception.
- M1 may be squash-merged only; merge-commit and rebase-merge paths must be disabled at repository settings level if permissions permit.

---

## Target Closure State

The final state machine is:

```text
DEVELOPING_ON_BRANCH
        |
        | local tests / local pnpm verify
        v
DRAFT_PR
        |
        | implementation complete
        v
READY_FOR_REVIEW
        |
        | independent reviewer inspects exact HEAD
        | verdict = PASS
        v
REVIEWED_HEAD
        |
        | manual workflow_dispatch(target_sha = reviewed HEAD)
        | ubuntu + macOS + Windows all PASS
        v
MERGE_AUTHORIZED_HEAD
        |
        | confirm PR head still equals reviewed/verified SHA
        v
SQUASH_MERGE
        |
        v
MASTER + DELETE_BRANCH
```

Invalidation rule:

```text
REVIEWED_HEAD or MERGE_AUTHORIZED_HEAD
        |
        | any new commit
        v
READY_FOR_REVIEW
```

Do not “reuse” a review or CI run from an older SHA.

---

## File Map

### Create

- `docs/plans/active/foundation/m1-final-corrective-and-closure.md`
  - This exact plan while implementation is active.
- `docs/engineering/playbooks/repository/milestone-pr-closure.md`
  - Persistent Branch → Draft PR → Review → Manual CI → Squash Merge operating procedure.
- `packages/bootstrap-state/src/atomic-file.ts`
  - Narrow adapter adding supported-platform containing-directory sync after `write-file-atomic`.
- `packages/bootstrap-state/src/atomic-file.test.ts`
  - Adapter tests and bypass regression.

### Modify

- `.github/workflows/verify.yml`
  - Remove automatic triggers; become manual `workflow_dispatch` only; verify an explicit target SHA.
- `AGENTS.md`
  - Replace “verify matrix on every push” with controlled manual-CI and review-before-CI merge policy.
- `.agents/heptalogos/package-manifest.json`
  - Refresh `AGENTS.md` size/hash after final AGENTS edit.
- `scripts/verify/repository.mjs`
  - Mechanically reject automatic CI triggers and mutable Action tags.
- `docs/engineering/PLAYBOOK.md`
  - Index the new PR closure playbook.
- `packages/bootstrap-state/src/store.ts`
  - Route durable state writes through `atomic-file.ts`.
- `packages/bootstrap-state/src/journal.ts`
  - Route writes through the adapter; validate canonical persisted Instant; serialize same-BootId read-modify-write.
- `packages/bootstrap-state/src/journal.test.ts`
  - Add invalid Instant and concurrent checkpoint regression tests.
- `docs/plans/completed/foundation/m1-development-spine.md`
  - Repair stale unchecked commit steps and correct durability/CI evidence wording.
- PR `#1` body
  - Update externally after repository work is complete; this does not change HEAD.

### Repository setting change

- Disable rebase merge.
- Keep merge commits disabled.
- Keep squash merge enabled.
- Keep auto-merge disabled.
- Do not create a branch rule that makes GitHub Actions the sole required verification Authority.

---

## Preflight: Freeze the Corrective Baseline

- [x] **Step 1: Read Authority before editing**

Read every file in the **Authority / Required Reading** list above.

Do not infer current behavior from this plan when repository state disagrees; inspect the current branch.

- [x] **Step 2: Confirm branch and working tree**

```bash
git branch --show-current
git status --short
git rev-parse HEAD
git merge-base master HEAD
```

Expected:

```text
branch = dev/m1-development-spine
working tree = clean
```

If the current HEAD differs from `7a42ac4faba3456e1ad7849a5d1aafcab8971a09`, inspect:

```bash
git log --oneline 7a42ac4faba3456e1ad7849a5d1aafcab8971a09..HEAD
git diff --stat 7a42ac4faba3456e1ad7849a5d1aafcab8971a09..HEAD
```

If those additional changes are unrelated to this corrective or already-reviewed M1 work, stop with `BLOCKED` instead of silently absorbing unrelated scope.

- [x] **Step 3: Materialize this plan**

Save this file verbatim at:

```text
docs/plans/active/foundation/m1-final-corrective-and-closure.md
```

Update `docs/plans/README.md` so it lists this plan as `ACTIVE`.

- [x] **Step 4: Reproduce the existing baseline locally**

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Expected: `PASS`.

A baseline failure that predates corrective edits must be understood before mixing new changes into it.

- [x] **Step 5: Commit only the plan materialization**

```bash
git add -- docs/plans/active/foundation/m1-final-corrective-and-closure.md docs/plans/README.md
git commit -m "docs: add Foundation M1 final corrective plan"
```

---

## Task 1: Replace Automatic CI with Controlled Manual Verification

**Files:**

- Modify: `.github/workflows/verify.yml`
- Modify: `AGENTS.md`
- Modify: `.agents/heptalogos/package-manifest.json`
- Modify: `scripts/verify/repository.mjs`
- Create: `docs/engineering/playbooks/repository/milestone-pr-closure.md`
- Modify: `docs/engineering/PLAYBOOK.md`

**Produces:**

- `verify.yml` can be triggered only by `workflow_dispatch`.
- The workflow verifies a caller-supplied full commit SHA.
- Repository verification fails if automatic triggers or mutable Action tags are reintroduced.
- The branch/PR closure sequence becomes persistent Agent guidance.

### Required final workflow

Replace `.github/workflows/verify.yml` with this shape:

```yaml
name: verify-manual

on:
  workflow_dispatch:
    inputs:
      target_sha:
        description: Full commit SHA to verify
        required: true
        type: string
      reason:
        description: Why this CI run is justified
        required: true
        type: choice
        options:
          - final-pre-merge
          - cross-platform-regression
          - explicit-user-request

permissions:
  contents: read

concurrency:
  group: manual-verify-${{ inputs.target_sha }}
  cancel-in-progress: false

jobs:
  verify:
    name: verify (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          ref: ${{ inputs.target_sha }}
          persist-credentials: false

      - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86

      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
        with:
          node-version-file: .node-version
          cache: pnpm

      - name: Verify checked-out SHA
        env:
          EXPECTED_SHA: ${{ inputs.target_sha }}
        run: >-
          node --input-type=module -e
          "import { execFileSync } from 'node:child_process';
          const actual=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
          if(actual!==process.env.EXPECTED_SHA){
            console.error('expected '+process.env.EXPECTED_SHA+' but checked out '+actual);
            process.exit(1);
          }
          console.log('PASS target SHA '+actual);"

      - run: pnpm install --frozen-lockfile
      - run: pnpm verify
```

The three Action SHAs above are the immutable revisions already exercised successfully by the previous green matrix. Do not replace them with `@v7`, `@v6`, or another mutable tag during this task.

### Repository verification rule

Extend `scripts/verify/repository.mjs` after the required repository-file checks:

```js
const verifyWorkflowPath = join(root, ".github", "workflows", "verify.yml");

if (!existsSync(verifyWorkflowPath)) {
  fail("manual verify workflow missing: .github/workflows/verify.yml");
} else {
  const workflow = readFileSync(verifyWorkflowPath, "utf8");

  if (!/^\s{2}workflow_dispatch:\s*$/mu.test(workflow)) {
    fail("verify workflow must expose workflow_dispatch");
  }

  const forbiddenTriggers = [
    "push",
    "pull_request",
    "pull_request_target",
    "schedule",
    "repository_dispatch",
    "merge_group",
    "workflow_call",
  ];

  for (const trigger of forbiddenTriggers) {
    const pattern = new RegExp(`^\\s{2}${trigger}:`, "mu");
    if (pattern.test(workflow)) {
      fail(`verify workflow must not auto-trigger via ${trigger}`);
    }
  }

  for (const input of ["target_sha:", "reason:"]) {
    if (!workflow.includes(input)) {
      fail(`verify workflow missing manual input: ${input}`);
    }
  }

  const usesLines = [...workflow.matchAll(/^\s*-\s+uses:\s+([^@\s]+)@([^\s]+)\s*$/gmu)];
  for (const [, action, ref] of usesLines) {
    if (!/^[0-9a-f]{40}$/u.test(ref)) {
      fail(`GitHub Action must be pinned to a full commit SHA: ${action}@${ref}`);
    }
  }
}
```

This gate intentionally enforces **manual-only** CI for this repository. If future policy changes, change the Authority and this gate together.

- [x] **Step 1: Make the repository gate fail against the current workflow**

Add the `verify.yml` assertions above to `scripts/verify/repository.mjs`.

Run:

```bash
pnpm check:repository
```

Expected: `FAIL`, because the existing workflow contains `push:` and `pull_request:` and uses mutable major tags.

Do not modify the workflow before observing this RED result.

- [x] **Step 2: Replace `verify.yml` with the manual workflow**

Apply the exact workflow structure above.

Run:

```bash
pnpm check:repository
```

Expected: `PASS`.

Do **not** manually dispatch the workflow here. This task is configuration validation, not a reason to spend a cross-platform CI run.

- [x] **Step 3: Rewrite the branch/integration policy in `AGENTS.md`**

Replace the current workflow text that says a Draft PR opens so the matrix runs on every push.

The new policy must state, in technical English, all of the following:

```text
Milestone development:
branch -> Draft PR -> Ready for Review -> independent review -> manual final CI -> squash merge.

Ordinary pushes do not trigger CI.

Agents may dispatch CI only for:
- final pre-merge verification after independent review PASS;
- a specific cross-platform regression not provable on the current host;
- explicit user request.

PR Ready is not merge authorization.

The implementing Agent's self-review is insufficient.

Final CI must verify the exact independently reviewed SHA.

Any new commit invalidates prior review and final-CI authorization.

master changes through PRs; a direct push requires explicit one-off user authorization.

Local pnpm verify remains mandatory; CI is auxiliary cross-platform evidence.
```

Do not put the long operational procedure into `AGENTS.md`; that belongs in the playbook created next.

- [x] **Step 4: Add the persistent PR closure playbook**

Create:

```text
docs/engineering/playbooks/repository/milestone-pr-closure.md
```

Its procedure must be:

```text
1. create dev/<milestone> from current master;
2. open Draft PR early, but do not auto-run CI;
3. use local tests/pnpm verify during development;
4. manually use CI during Draft only for a concrete cross-platform regression or explicit user request;
5. when implementation is complete and local gates are green, mark PR Ready;
6. stop: obtain independent review on exact HEAD;
7. if review requests changes, commit them, rerun local gates, and obtain a new independent review;
8. after review PASS, manually dispatch final CI with target_sha=<reviewed HEAD>;
9. require ubuntu-latest, macos-latest, windows-latest all PASS;
10. verify PR head still equals reviewed/CI SHA;
11. squash merge;
12. delete branch.
```

Include the invalidation rule prominently:

```text
commit after review -> review stale
commit after final CI -> review + final CI stale
```

Include the manual dispatch examples:

```bash
SHA="$(git rev-parse HEAD)"
gh workflow run verify.yml \
  --ref master \
  -f target_sha="$SHA" \
  -f reason=final-pre-merge
```

For a bounded cross-platform regression during Draft:

```bash
gh workflow run verify.yml \
  --ref master \
  -f target_sha="<FULL_SHA>" \
  -f reason=cross-platform-regression
```

Do not prescribe CI for ordinary commits.

Update `docs/engineering/PLAYBOOK.md` with one index row pointing to this file.

- [x] **Step 5: Synchronize Agent manifest after the final `AGENTS.md` edit**

First run:

```bash
node .agents/heptalogos/validate-skill-resources.mjs
```

Expected: `FAIL` only because `AGENTS.md` size/hash changed.

Update only the relevant `AGENTS.md` size/hash entry in:

```text
.agents/heptalogos/package-manifest.json
```

Use actual bytes/hash:

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const b=readFileSync('AGENTS.md');
console.log(JSON.stringify({
  size:b.byteLength,
  sha256:createHash('sha256').update(b).digest('hex')
},null,2));
"
```

Then rerun:

```bash
node .agents/heptalogos/validate-skill-resources.mjs
pnpm check:repository
pnpm format:check
```

Expected: all `PASS`.

- [x] **Step 6: Commit CI/workflow governance**

```bash
git add -- \
  .github/workflows/verify.yml \
  AGENTS.md \
  .agents/heptalogos/package-manifest.json \
  scripts/verify/repository.mjs \
  docs/engineering/PLAYBOOK.md \
  docs/engineering/playbooks/repository/milestone-pr-closure.md

git commit -m "chore: make milestone CI manual and review-gated"
```

---

## Task 2: Add the Missing Crash-Safe Publication Adapter

**Problem to solve:** `write-file-atomic@8` flushes the temporary file and renames it, but does not sync the containing directory after rename. `S15` requires containing-directory flush where supported. Therefore the current M1 implementation has a known mechanics gap; it is not merely “unqualified”.

**Files:**

- Create: `packages/bootstrap-state/src/atomic-file.ts`
- Create: `packages/bootstrap-state/src/atomic-file.test.ts`
- Modify: `packages/bootstrap-state/src/store.ts`
- Modify: `packages/bootstrap-state/src/journal.ts`

**Interface produced:**

```ts
export async function writeAtomicPublishedFile(
  filename: string,
  data: string,
): Promise<void>;
```

This helper stays internal to `bootstrap-state`; do not export it from the package public `index.ts` in M1.

### Required implementation

Create `packages/bootstrap-state/src/atomic-file.ts`:

```ts
import { createRequire } from "node:module";
import { open } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

const writeFileAtomic = require("write-file-atomic") as (
  filename: string,
  data: string,
  options?: { readonly encoding?: BufferEncoding },
) => Promise<void>;

export async function writeAtomicPublishedFile(
  filename: string,
  data: string,
): Promise<void> {
  const target = resolve(filename);

  await writeFileAtomic(target, data, { encoding: "utf8" });

  if (process.platform !== "win32") {
    const directory = await open(dirname(target), "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  }
}
```

Semantics:

```text
write-file-atomic:
  temp write
  -> temp file fsync
  -> atomic rename

Heptalogos adapter:
  -> containing directory open
  -> directory fsync on supported POSIX platforms
  -> close
```

If directory open/sync fails on a platform where this path is attempted, the operation rejects. Do not swallow the error or claim durability.

On Windows, the normal atomic replacement operation resolves successfully;
containing-directory sync is not attempted. This runtime API does not expose
qualification state. Windows sudden-power-loss durability remains an L3
`NOT_RUN` claim.

- [x] **Step 1: Write adapter tests before implementation**

Create `packages/bootstrap-state/src/atomic-file.test.ts`.

Required tests:

```ts
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeAtomicPublishedFile } from "./atomic-file.js";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("writeAtomicPublishedFile", () => {
  it("atomically publishes the requested bytes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "heptalogos-atomic-file-"));
    directories.push(directory);
    const file = join(directory, "state.json");

    await writeAtomicPublishedFile(file, '{"revision":1}');
    await expect(readFile(file, "utf8")).resolves.toBe('{"revision":1}');
  });

  it("does not expose platform qualification state", async () => {
    const directory = await mkdtemp(join(tmpdir(), "heptalogos-atomic-file-"));
    directories.push(directory);
    const file = join(directory, "state.json");

    await expect(writeAtomicPublishedFile(file, "{}")).resolves.toBeUndefined();
  });

  it.runIf(process.platform !== "win32")(
    "publishes through the containing-directory sync path on POSIX hosts",
    async () => {
      const directory = await mkdtemp(join(tmpdir(), "heptalogos-atomic-file-"));
      directories.push(directory);
      const file = join(directory, "state.json");

      await expect(writeAtomicPublishedFile(file, "{}")).resolves.toBeUndefined();
    },
  );
});
```

Add a source-boundary regression in the same file or another focused test:

```ts
it("keeps store and journal behind the crash-safe adapter", async () => {
  const [store, journal] = await Promise.all([
    readFile(new URL("./store.ts", import.meta.url), "utf8"),
    readFile(new URL("./journal.ts", import.meta.url), "utf8"),
  ]);

  expect(store).not.toContain('require("write-file-atomic")');
  expect(journal).not.toContain('require("write-file-atomic")');
  expect(store).toContain('from "./atomic-file.js"');
  expect(journal).toContain('from "./atomic-file.js"');
});
```

Import `readFile` once; do not duplicate it.

- [x] **Step 2: Run RED**

```bash
pnpm exec vitest run --root packages/bootstrap-state src/atomic-file.test.ts
```

Expected: `FAIL` because `./atomic-file.js` does not exist.

- [x] **Step 3: Implement `atomic-file.ts` exactly at the narrow boundary**

Use the implementation above.

Do not add retry loops, lock files, `PathProfile`, directory-handle security hardening, or platform abstraction in this task.

- [x] **Step 4: Route `BootstrapStateStore` through the adapter**

In `packages/bootstrap-state/src/store.ts`:

Remove the local `createRequire` / `write-file-atomic` binding.

Add:

```ts
import { writeAtomicPublishedFile } from "./atomic-file.js";
```

Replace:

```ts
await writeFileAtomic(this.previousPath, stateText(current.value), {
  encoding: "utf8",
});
```

with:

```ts
await writeAtomicPublishedFile(this.previousPath, stateText(current.value));
```

Replace the current-state write the same way.

Do not change revision/recovery semantics.

- [x] **Step 5: Route `BootstrapJournal` through the adapter**

In `packages/bootstrap-state/src/journal.ts`:

Remove its local `createRequire` / `write-file-atomic` binding.

Add:

```ts
import { writeAtomicPublishedFile } from "./atomic-file.js";
```

Replace the per-BootId snapshot write with:

```ts
await writeAtomicPublishedFile(this.fileFor(bootId), journalText(entries));
```

- [x] **Step 6: Run GREEN and package gates**

```bash
pnpm exec vitest run --root packages/bootstrap-state src/atomic-file.test.ts
pnpm exec nx run bootstrap-state:test
pnpm exec nx run bootstrap-state:typecheck
pnpm exec nx run bootstrap-state:build
pnpm check:boundaries
```

Expected: all `PASS`.

On POSIX, the adapter executes the containing-directory sync path; the
POSIX-gated test supplies this evidence in final cross-platform CI.

On Windows, normal atomic publication resolves successfully. The runtime API
does not return a qualification marker; sudden-power-loss durability remains
`NOT_RUN`.

- [x] **Step 7: Commit publication durability mechanics**

```bash
git add -- packages/bootstrap-state
git commit -m "fix: complete bootstrap atomic publication mechanics"
```

---

## Task 3: Harden BootstrapJournal Persisted Time and Same-Boot Concurrency

**Problems to solve:**

1. `BootstrapJournalCheckpointV1.at` currently accepts any non-empty string, although persisted absolute time is an `Instant`.
2. `checkpoint()` currently performs read → append → write without serializing the whole same-BootId read-modify-write cycle. Two in-process concurrent checkpoints can lose one update.

**Scope boundary:** M1 only prevents same-process lost update. Multi-process exclusivity remains owned by M2 bootstrap ownership and must not be invented here.

**Files:**

- Modify: `packages/bootstrap-state/src/journal.ts`
- Modify: `packages/bootstrap-state/src/journal.test.ts`

### Canonical M1 Instant representation

For BootstrapJournal v1, persist canonical UTC JavaScript ISO strings:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
```

Example:

```text
2026-08-21T06:25:30.606Z
```

Validation must satisfy both:

- exact canonical shape;
- `new Date(Date.parse(value)).toISOString() === value`.

Add to `journal.ts`:

```ts
const CANONICAL_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function isCanonicalInstant(value: string): boolean {
  if (!CANONICAL_INSTANT_PATTERN.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}
```

After Ajv structural validation, reject an entry when:

```ts
!isCanonicalInstant(entry.at);
```

Use the existing stable problem:

```text
bootstrap.journal.invalid_entry
```

Do not expose `Date.parse` diagnostics.

### Same-Boot checkpoint serialization

Add:

```ts
private readonly checkpointTails = new Map<string, Promise<void>>();
```

Implement a helper:

```ts
private async serializeCheckpoint(
  bootId: BootId,
  operation: () => Promise<void>,
): Promise<void> {
  const previous = this.checkpointTails.get(bootId) ?? Promise.resolve();

  const current = previous.then(operation, operation);
  const barrier = current.then(
    () => undefined,
    () => undefined,
  );

  this.checkpointTails.set(bootId, barrier);

  try {
    await current;
  } finally {
    if (this.checkpointTails.get(bootId) === barrier) {
      this.checkpointTails.delete(bootId);
    }
  }
}
```

Then make `checkpoint()`:

```ts
async checkpoint(entry: BootstrapJournalCheckpointV1): Promise<void> {
  const bootId = requireBootId(entry.bootId);

  await this.serializeCheckpoint(bootId, async () => {
    const existing = await this.readEntries(bootId);
    const entries = [...existing, entry];
    this.assertValidEntries(entries);
    await mkdir(this.journalDirectory, { recursive: true });
    await writeAtomicPublishedFile(this.fileFor(bootId), journalText(entries));
  });
}
```

Different BootIds remain independent because the map key is the validated UUIDv7 string.

- [x] **Step 1: Add failing invalid-Instant tests**

Add to `journal.test.ts`:

```ts
it("rejects a persisted at value that is not a canonical Instant", async () => {
  const journal = new BootstrapJournal(await makeDirectory());
  const bootId = createUuidV7Id("BootId");

  await expect(
    journal.checkpoint({
      ...makeEntry(bootId, "anchor"),
      at: "banana",
    }),
  ).rejects.toMatchObject({
    problem: { problemCode: "bootstrap.journal.invalid_entry" },
  });
});
```

Also test a shape-valid but impossible/normalized date:

```ts
it("rejects an impossible canonical-looking Instant", async () => {
  const journal = new BootstrapJournal(await makeDirectory());
  const bootId = createUuidV7Id("BootId");

  await expect(
    journal.checkpoint({
      ...makeEntry(bootId, "anchor"),
      at: "2026-02-30T00:00:00.000Z",
    }),
  ).rejects.toMatchObject({
    problem: { problemCode: "bootstrap.journal.invalid_entry" },
  });
});
```

- [x] **Step 2: Add a failing concurrent checkpoint regression**

Add:

```ts
it("does not lose concurrent checkpoints for one BootId", async () => {
  const journal = new BootstrapJournal(await makeDirectory());
  const bootId = createUuidV7Id("BootId");
  const stages = Array.from({ length: 20 }, (_, index) => `stage-${index}`);

  await Promise.all(
    stages.map((stage) => journal.checkpoint(makeEntry(bootId, stage))),
  );

  const entries = await journal.read(bootId);

  expect(entries).toHaveLength(stages.length);
  expect(new Set(entries.map((entry) => entry.stage))).toEqual(new Set(stages));
});
```

This test need not require a deterministic ordering between independently-started concurrent callers. It requires only that every acknowledged checkpoint survives.

- [x] **Step 3: Run RED**

```bash
pnpm exec vitest run --root packages/bootstrap-state src/journal.test.ts
```

Expected:

- invalid Instant tests `FAIL` against current code;
- the concurrency regression should expose the lost-update risk. If timing happens not to reproduce on one run, the implementation change is still required because the read-modify-write critical section is structurally unsynchronized; do not delete the regression.

- [x] **Step 4: Implement canonical Instant validation**

Add `CANONICAL_INSTANT_PATTERN` and `isCanonicalInstant()`.

Ensure both:

- loaded persisted entries;
- newly submitted checkpoints

pass the same structural + semantic validation.

Do not mutate/normalize invalid caller input.

- [x] **Step 5: Implement per-BootId serialization**

Add `checkpointTails` and `serializeCheckpoint()` exactly at the journal class boundary.

Do not introduce a generic lock package.

Do not claim inter-process exclusion.

- [x] **Step 6: Run package verification**

```bash
pnpm exec nx run bootstrap-state:test
pnpm exec nx run bootstrap-state:typecheck
pnpm exec nx run bootstrap-state:build
pnpm lint
```

Expected: all `PASS`.

- [x] **Step 7: Commit Journal hardening**

```bash
git add -- packages/bootstrap-state/src/journal.ts packages/bootstrap-state/src/journal.test.ts
git commit -m "fix: harden BootstrapJournal boundaries"
```

---

## Task 4: Repair M1 Completion Evidence

**Files:**

- Modify: `docs/plans/completed/foundation/m1-development-spine.md`

**Goal:** Make the completed M1 execution record match repository reality without rewriting history.

- [x] **Step 1: Find stale unchecked commit steps**

Run:

```bash
rg -n '\- \[ \] \*\*Step .*Commit' docs/plans/completed/foundation/m1-development-spine.md
```

The review found stale unchecked commit steps for multiple tasks even though those commits exist.

For every result:

1. locate the corresponding commit in branch history;
2. only if the commit exists, change `[ ]` to `[x]`;
3. if a supposed commit does not exist, do not fabricate completion—record the mismatch.

Evidence command:

```bash
git log --oneline master..HEAD
```

Expected after repair:

```bash
rg -n '\- \[ \] \*\*Step .*Commit' docs/plans/completed/foundation/m1-development-spine.md
```

returns no stale completed commit step.

- [x] **Step 2: Correct durability evidence wording**

The M1 record must distinguish:

```text
normal atomic replacement mechanics
POSIX containing-directory publication sync mechanics
real power-loss qualification
Windows publication durability qualification
```

After Task 2, record:

```text
write-file-atomic temp-write/file-fsync/rename mechanics
    PASS by implementation/tests

Heptalogos containing-directory fsync after rename on supported POSIX path
    NOT_RUN on the current win32 executor; the POSIX-gated test is reserved
    for final cross-platform CI

real filesystem power-loss durability
    NOT_RUN

Windows normal atomic publication
    PASS by win32 tests; containing-directory sync is N/A

real Windows sudden-power-loss durability
    NOT_RUN
```

Do not claim that the new adapter test proves physical power-loss survival.

Also record the original review finding factually:

```text
The previous direct write-file-atomic usage was insufficient for the S15
containing-directory publication contract; this corrective added the missing
adapter semantics rather than treating the gap as merely untested.
```

- [x] **Step 3: Correct CI policy history without deleting useful evidence**

Keep the earlier automatic three-platform runs as **historical execution evidence**.

Add current-state wording:

```text
The automatic PR/push matrix was used during M1 investigation to obtain
cross-platform evidence. It is no longer the repository's normal development
trigger policy. The permanent workflow is manual-only workflow_dispatch;
ordinary development uses local gates. Final pre-merge CI is manually
dispatched only after independent review and must target the exact reviewed SHA.
```

Do not rewrite old run IDs or previously observed PASS results.

- [x] **Step 4: Re-run documentation formatting**

```bash
pnpm format:check
```

If the modified Markdown fails:

```bash
pnpm exec prettier --write docs/plans/completed/foundation/m1-development-spine.md
pnpm format:check
```

Expected: `PASS`.

- [x] **Step 5: Commit evidence repair**

```bash
git add -- docs/plans/completed/foundation/m1-development-spine.md
git commit -m "docs: correct Foundation M1 closure evidence"
```

---

## Task 5: Lock Repository Merge Mechanics to Squash-Only

**Repository settings; no product code.**

Current intended settings:

```text
allow_merge_commit = false
allow_rebase_merge = false
allow_squash_merge = true
allow_auto_merge = false
```

- [x] **Step 1: Read current settings**

```bash
gh api repos/ArsvineZhu/Heptalogos \
  --jq '{
    allow_merge_commit,
    allow_rebase_merge,
    allow_squash_merge,
    allow_auto_merge
  }'
```

- [x] **Step 2: Disable rebase merge and preserve squash-only policy**

If authenticated permissions allow repository settings mutation:

```bash
gh api --method PATCH repos/ArsvineZhu/Heptalogos \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F allow_squash_merge=true \
  -F allow_auto_merge=false
```

If the Agent does not have permission, report this step as `BLOCKED` and give the user the exact setting values above. Do not weaken the repository policy in code to compensate.

- [x] **Step 3: Verify settings**

Repeat Step 1.

Expected:

```json
{
  "allow_merge_commit": false,
  "allow_rebase_merge": false,
  "allow_squash_merge": true,
  "allow_auto_merge": false
}
```

- [x] **Step 4: Do not enable native required-CI checks**

This project intentionally keeps local gates authoritative and CI manually triggered. Do not create a GitHub required-status rule that makes an automatically-triggered Actions check necessary for every commit.

The merge authorization procedure is governed by `AGENTS.md` + the milestone PR closure playbook + independent review + exact-SHA manual CI.

---

## Task 6: Fresh-Like Local Verification and Corrective Plan Closure

**Goal:** Produce the exact commit that will be handed to independent review. No repository file may change after this step unless the review cycle is restarted.

- [x] **Step 1: Reset Nx and remove generated build state**

```bash
pnpm exec nx reset

node --input-type=module -e "
import { rmSync } from 'node:fs';
for (const p of [
  'dist',
  'packages/foundation-contracts/dist',
  'packages/bootstrap-state/dist',
]) {
  rmSync(p,{recursive:true,force:true});
}
"
```

Also remove any stray `*.tsbuildinfo` outside ignored `dist` if present:

```bash
node --input-type=module -e "
import { readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
function walk(dir){
  for(const name of readdirSync(dir)){
    if(['.git','node_modules','.nx'].includes(name)) continue;
    const p=join(dir,name);
    const s=statSync(p);
    if(s.isDirectory()) walk(p);
    else if(name.endsWith('.tsbuildinfo')) rmSync(p,{force:true});
  }
}
walk('.');
"
```

- [x] **Step 2: Reinstall from the frozen lockfile**

```bash
pnpm install --frozen-lockfile
```

Expected: `PASS`.

- [x] **Step 3: Run every permanent local gate**

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check

pnpm format:check
pnpm lint
pnpm typecheck
pnpm tsc6
pnpm test
pnpm build
pnpm verify
```

Every command must actually execute.

Expected: all `PASS`.

- [x] **Step 4: Inspect real Nx targets**

```bash
pnpm exec nx show project foundation-contracts
pnpm exec nx show project bootstrap-state
pnpm exec nx show project repository
```

Required observations:

```text
foundation-contracts: real inferred build + typecheck
bootstrap-state: real inferred build + typecheck
repository: real lint target for scripts; no noop lint/typecheck/test/build
```

- [x] **Step 5: Check built output exists**

```bash
node --input-type=module -e "
import { existsSync } from 'node:fs';
const required=[
  'packages/foundation-contracts/dist/index.js',
  'packages/foundation-contracts/dist/index.d.ts',
  'packages/bootstrap-state/dist/index.js',
  'packages/bootstrap-state/dist/index.d.ts',
];
for(const p of required){
  if(!existsSync(p)){
    console.error('missing '+p);
    process.exitCode=1;
  } else {
    console.log('PASS '+p);
  }
}
"
```

Expected: four `PASS` lines.

- [x] **Step 6: Run focused corrective evidence**

```bash
pnpm exec vitest run --root packages/bootstrap-state src/atomic-file.test.ts
pnpm exec vitest run --root packages/bootstrap-state src/journal.test.ts
pnpm exec nx run repo-kit:test
```

Expected: `PASS`.

Do not dispatch GitHub Actions here merely because local verification passed.

- [x] **Step 7: Verify workflow is manual-only**

```bash
pnpm check:repository
```

Then inspect:

```bash
rg -n 'push:|pull_request:|pull_request_target:|schedule:|repository_dispatch:|merge_group:|workflow_call:' .github/workflows/verify.yml
```

Expected: no automatic trigger lines.

Confirm:

```bash
rg -n 'workflow_dispatch:|target_sha:|reason:' .github/workflows/verify.yml
```

Expected: all required manual workflow fields found.

- [x] **Step 8: Verify the working tree**

```bash
git status --short
```

Expected: only intended plan-record changes, if any.

No generated `dist`, test output, or cache file may be staged.

- [x] **Step 9: Finalize this corrective plan's repository record**

Before creating the review candidate commit:

- check off all implementation steps actually completed;
- add a concise execution record with command outcomes;
- do **not** record independent review or final CI as PASS yet.

Move:

```text
docs/plans/active/foundation/m1-final-corrective-and-closure.md
```

to:

```text
docs/plans/completed/foundation/m1-final-corrective-and-closure.md
```

Update `docs/plans/README.md` from `ACTIVE` to `COMPLETED`.

Interpretation:

```text
COMPLETED = corrective implementation and local verification are complete.
PR merge authorization remains an external closure gate recorded by PR/review/CI metadata.
```

This avoids adding a documentation commit after review/final CI and thereby invalidating the exact-SHA gate.

- [x] **Step 10: Commit the final review candidate**

```bash
git add -- \
  docs/plans/README.md \
  docs/plans/completed/foundation/m1-final-corrective-and-closure.md

git commit -m "docs: close Foundation M1 corrective implementation"
```

If other intended source/docs changes remain unstaged, inspect them individually and stage only known corrective paths. Never use `git add -A` or `git add .`.

- [x] **Step 11: Re-run the final local gate after the closure commit**

Because Step 10 changed HEAD:

```bash
pnpm verify
git status --short
```

Expected:

```text
pnpm verify = PASS
working tree = clean
```

Capture:

```bash
git rev-parse HEAD
```

Call this:

```text
REVIEW_CANDIDATE_SHA
```

No repository changes are allowed after this point without restarting the review cycle.

---

### Corrective execution record

`COMPLETED` means the corrective implementation and local verification are
complete. Independent review, final cross-platform CI, and squash merge remain
external closure gates and are intentionally not recorded as PASS here.

| Item                                              | Evidence                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Start HEAD                                        | `7a42ac4faba3456e1ad7849a5d1aafcab8971a09`                                                                                      |
| Corrective HEAD before this plan's closure commit | `b18ef98` (`docs: bound POSIX durability evidence`)                                                                             |
| Runtime                                           | Node `24.19.0`, pnpm `11.22.0`, Windows `win32 x64`                                                                             |
| Manual workflow bootstrap                         | PR #2 squash-merged to `master` as `e74f5331a069b5a33427e1f6396e74f40ed1a92f`; only `.github/workflows/verify.yml`              |
| Baseline install and verify                       | `pnpm install --frozen-lockfile` PASS; `pnpm verify` PASS                                                                       |
| Manual workflow/repository gate                   | `pnpm check:repository` PASS; no automatic trigger lines; `target_sha` and `reason` present; all Actions pinned to full SHAs    |
| Agent manifest and formatting                     | `check:agents` PASS; `pnpm format:check` PASS                                                                                   |
| Publication adapter evidence                      | atomic-file tests: 3 PASS / 1 POSIX-gated skip on win32; Windows normal atomic publication resolves without qualification state |
| Journal evidence                                  | journal tests: 11 PASS; same-BootId concurrent checkpoints retained; invalid/non-canonical Instants rejected                    |
| Fresh-like permanent gates                        | every listed `check:*`, toolchain, format, lint, typecheck, tsc6, test, build, and verify command PASS after Nx/dist reset      |
| Real Nx targets                                   | foundation-contracts and bootstrap-state have inferred build/typecheck; repository exposes only the real scripts lint target    |
| Built output                                      | four required package `dist/index.js` / `dist/index.d.ts` paths PASS                                                            |
| Merge settings                                    | `allow_merge_commit=false`, `allow_rebase_merge=false`, `allow_squash_merge=true`, `allow_auto_merge=false`                     |
| POSIX containing-directory sync runtime evidence  | `NOT_RUN` on current win32 executor; POSIX-gated test requires a POSIX runner                                                   |
| Windows normal atomic publication                 | `PASS` by win32 test; containing-directory sync is `N/A` and sudden-power-loss durability is `NOT_RUN`                          |
| Real filesystem power-loss qualification          | `NOT_RUN`                                                                                                                       |
| Independent review                                | `NOT_RUN` — required external gate                                                                                              |
| Manual final CI (Ubuntu/macOS/Windows)            | `NOT_RUN` — must follow independent review on exact SHA                                                                         |
| Squash merge and branch deletion                  | `NOT_RUN`                                                                                                                       |
| M2 PathProfile/bootstrap ownership                | `NOT_RUN`; no M2 subsystem started                                                                                              |

---

## Task 7: Update PR #1 and Mark Ready — But Do Not Merge or Run Final CI Yet

**External PR metadata only; does not change commit SHA.**

- [ ] **Step 1: Compute current PR facts**

```bash
git rev-list --count master..HEAD
git diff --stat master...HEAD
git rev-parse HEAD
```

Use current values; do not preserve stale “11 commits” wording.

- [ ] **Step 2: Update PR #1 body**

The body must state:

```markdown
## Foundation M1

Branch: `dev/m1-development-spine`

M1 implementation and final corrective work are complete on the current branch.
The PR remains subject to the repository closure gate:

1. local `pnpm verify` PASS;
2. independent review of the exact current HEAD;
3. only after review PASS, manually dispatch three-platform final CI for that exact SHA;
4. if HEAD changes, review and final CI are invalidated;
5. squash merge only after all three conditions are satisfied.

GitHub Actions is manual-only. Ordinary pushes do not trigger CI.

### Current scope

- repository plans / engineering knowledge organization
- repo-kit subprocess substrate
- foundation-contracts
- bootstrap-state + per-BootId journal
- BootstrapState crash-safe publication adapter
- M1 cross-platform regression tests
- verification-integrity corrective

No M2 subsystem is included.
```

Append the actual commit count and current `REVIEW_CANDIDATE_SHA`.

Do not claim independent review or final CI PASS yet.

- [ ] **Step 3: Mark the PR Ready**

```bash
gh pr ready 1
```

Expected: PR becomes Ready for Review.

- [ ] **Step 4: STOP**

Do not merge.

Do not trigger `reason=final-pre-merge`.

Hand the exact `REVIEW_CANDIDATE_SHA` to an independent reviewer.

---

## Merge Gate A: Independent Review

This gate cannot be self-approved by the implementing Agent.

The reviewer must inspect the exact `REVIEW_CANDIDATE_SHA`.

Minimum review scope:

```text
master...REVIEW_CANDIDATE_SHA full diff
remaining M1 scope discipline
atomic-file adapter vs S15 contract
BootstrapStateStore use of adapter
BootstrapJournal canonical Instant validation
BootstrapJournal same-BootId serialization
manual-only verify.yml
repository verification enforcement
AGENTS + playbook workflow consistency
completed M1 evidence consistency
no M2 materialization
```

Suggested reviewer commands:

```bash
git diff --stat master...<REVIEW_CANDIDATE_SHA>
git diff master...<REVIEW_CANDIDATE_SHA>
pnpm verify
```

Review verdict is exactly:

```text
PASS
FAIL
BLOCKED
```

### If review = FAIL

- fix findings on `dev/m1-development-spine`;
- run the applicable focused tests;
- rerun Task 6 local verification;
- obtain a **new** `REVIEW_CANDIDATE_SHA`;
- obtain a **new independent review**.

Do not reuse the old review.

### If review = PASS

Record externally in PR/review discussion:

```text
Independent review: PASS
Reviewed SHA: <FULL_SHA>
Reviewer: <human | independent ChatGPT | other independent reviewer>
Blocking findings: none
```

Only now may final CI be manually triggered.

---

## Merge Gate B: Manual Final Cross-Platform CI

**Precondition:** independent review `PASS` on the exact current HEAD.

- [ ] **Step 1: Reconfirm PR HEAD has not changed**

```bash
REVIEWED_SHA="<FULL_SHA_FROM_PASSING_REVIEW>"
CURRENT_SHA="$(git rev-parse HEAD)"

test "$CURRENT_SHA" = "$REVIEWED_SHA"
```

Also query PR:

```bash
gh pr view 1 --json headRefOid,isDraft,mergeStateStatus
```

Required:

- `headRefOid == REVIEWED_SHA`
- `isDraft == false`

If not, stop. Review is stale.

- [ ] **Step 2: Trigger final CI exactly once for this reviewed SHA**

```bash
gh workflow run verify.yml \
  --ref master \
  -f target_sha="$REVIEWED_SHA" \
  -f reason=final-pre-merge
```

This use is explicitly authorized by repository policy.

- [ ] **Step 3: Locate the dispatched run**

```bash
gh run list \
  --workflow verify.yml \
  --branch dev/m1-development-spine \
  --event workflow_dispatch \
  --limit 5
```

Identify the run corresponding to this dispatch.

- [ ] **Step 4: Require completion and success**

```bash
gh run watch <RUN_ID> --exit-status
gh run view <RUN_ID> --json databaseId,event,headSha,conclusion,url
```

Then inspect jobs:

```bash
gh run view <RUN_ID>
```

Required:

```text
event = workflow_dispatch
ubuntu-latest = success
macos-latest = success
windows-latest = success
```

The workflow's `Verify checked-out SHA` step must show:

```text
PASS target SHA <REVIEWED_SHA>
```

Do not infer exact checkout solely from the workflow run's branch metadata; the explicit target-SHA assertion is the evidence.

### CI failure handling

If any platform fails:

```text
conclusion = FAIL
merge authorization = revoked
```

Classify:

```text
code/test failure
repository configuration failure
transient GitHub runner/infrastructure failure
```

- A code/config correction creates a new commit → independent review becomes stale → return to Merge Gate A before rerunning final CI.
- A clearly external transient failure may justify a manual rerun on the **same reviewed SHA**; record why. Do not change repository code solely to make the runner green.

---

## Merge Gate C: Exact-SHA Squash Merge

**All conditions must simultaneously hold:**

```text
PR Ready
independent review PASS
reviewed SHA == current PR head
manual final CI PASS on that SHA
ubuntu + macOS + Windows PASS
working tree clean
squash merge enabled
rebase/merge-commit disabled
```

- [ ] **Step 1: Final exact-SHA check**

```bash
gh pr view 1 --json headRefOid,isDraft,mergeStateStatus
git rev-parse HEAD
```

Both SHAs must equal the reviewed/final-CI SHA.

If they differ, do not merge.

- [ ] **Step 2: Squash merge only**

```bash
gh pr merge 1 \
  --squash \
  --delete-branch
```

Do not use:

- `--merge`
- `--rebase`
- auto-merge

- [ ] **Step 3: Verify repository state after merge**

```bash
git fetch origin
git switch master
git pull --ff-only

git log --oneline -5
```

Expected:

- one new squash commit on `master` representing the M1 milestone;
- no partial M1 commit train on `master`;
- remote `dev/m1-development-spine` deleted.

- [ ] **Step 4: Report final closure truth**

Final report must distinguish:

```text
M1 implementation                 PASS
local permanent gates             PASS
independent review                PASS
manual final CI / Ubuntu          PASS
manual final CI / macOS           PASS
manual final CI / Windows         PASS
squash merge                      PASS
real power-loss qualification     NOT_RUN
M2 PathProfile/bootstrap ownership NOT_RUN
```

Do not upgrade real power-loss qualification from `NOT_RUN`.

---

## Acceptance Criteria

M1 is eligible for squash merge only when all of the following are true:

- [x] `.github/workflows/verify.yml` has `workflow_dispatch` only; no push/PR/schedule/merge-group/repository-dispatch/workflow-call trigger.
- [x] Actions are pinned to full immutable commit SHAs.
- [x] `permissions: contents: read` is explicit.
- [x] workflow requires `target_sha` and verifies the checked-out SHA exactly.
- [x] `scripts/verify/repository.mjs` mechanically rejects automatic CI triggers and mutable Action refs.
- [x] `AGENTS.md` states ordinary pushes do not trigger CI and defines the review → manual-final-CI merge gate.
- [x] PR closure playbook exists and is indexed.
- [x] rebase merge is disabled; merge commits remain disabled; squash merge remains enabled.
- [x] direct push to `master` is no longer a routine governance path.
- [x] `BootstrapStateStore` and `BootstrapJournal` do not directly call `write-file-atomic`; both use the crash-safe adapter.
- [x] POSIX adapter performs containing-directory `sync()` after atomic rename.
- [x] Windows adapter does not overclaim containing-directory durability.
- [x] real power-loss qualification remains `NOT_RUN`.
- [x] BootstrapJournal rejects non-canonical/invalid persisted Instant values.
- [x] concurrent same-BootId checkpoints do not lose acknowledged entries.
- [x] no claim of multi-process journal exclusion is introduced.
- [x] stale unchecked commit steps in the completed M1 record are repaired using actual Git history.
- [x] automatic CI runs remain documented as historical evidence, not current trigger policy.
- [x] fresh-like local `pnpm verify` passes from cleared build/Nx output.
- [x] real package `dist/index.js` and `dist/index.d.ts` are produced.
- [ ] PR is marked Ready only after local implementation completion.
- [ ] an independent reviewer passes the exact merge-candidate SHA.
- [ ] final CI is manually dispatched only after that review.
- [ ] final CI passes on Ubuntu, macOS, and Windows for the exact reviewed SHA.
- [ ] no commit exists after the passing review/final CI.
- [ ] PR is squash-merged and branch deleted.
- [x] no M2 subsystem was started.

---

## Explicit Non-Goals

Do not use this corrective to implement:

```text
PathProfile
proper-lockfile/bootstrap ownership
PostgreSQL
Host lease/fencing
DBOS
RuntimeReconciler
MicroSystemSupervisor
Management
Messaging
AI
Subject
Backup/Restore
source-less packaging
real power-loss test harness
full symlink/junction security hardening
```

Those remain M2+ or later qualification work.

---

## Agent Stop Conditions

Stop and report rather than improvising when:

1. fixing publication durability appears to require replacing `write-file-atomic` or adding a new external dependency;
2. POSIX directory `sync()` fails on a supported test host and the cause is not a trivial implementation bug;
3. a Windows-specific durability claim would require pretending unsupported directory-flush semantics are proven;
4. the current branch contains unrelated changes beyond the M1 corrective scope;
5. a review finding requires M2 architecture to resolve;
6. GitHub repository settings cannot be changed because permissions are unavailable;
7. the final CI target SHA differs from the independently reviewed SHA;
8. a commit lands after independent review or final CI;
9. any merge method other than squash is the only available path.

The correct response to 6 is `BLOCKED` for the repository-setting step, with exact manual settings provided to the user. The correct response to 7/8 is to restart the review → final-CI gate, not to merge anyway.
