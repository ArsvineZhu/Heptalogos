# Foundation M1 Development Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** COMPLETED

**Goal:** Establish the first real Foundation development spine: organized repository work documents and scripts, a reusable cross-platform repository process/tooling substrate, and the first two Foundation packages for canonical contracts plus crash-recoverable bootstrap state.

**Architecture:** Keep repository engineering mechanics separate from product/Foundation code. `tools/repo-kit` owns reusable repository-only mechanics; `scripts/` contains thin executable entrypoints; `docs/` contains time-scoped plans and cumulative engineering knowledge; `packages/foundation-contracts` owns small stable cross-boundary primitives; `packages/bootstrap-state` owns only pre-PostgreSQL bootstrap state/journal mechanics. Do not create Kernel, PostgreSQL, runtime supervision, Management, Messaging, AI, Subject, or speculative package boundaries in M1.

**Tech Stack:** Node.js 24.19.0, pnpm 11.22.0 strict Catalog, Nx 23.1.1 + `@nx/js/typescript`, TypeScript 7.0.2 canonical compiler, TypeScript 6.0.2 compiler-API lane, ESLint 10.8.1 + typescript-eslint 8.67.0, Vitest 4.1.11, Prettier 3.9.6, Execa, canonicalize, uuid, TypeBox 1.x, Ajv 8, write-file-atomic 8.x.

**Spec / Authority:**
- `AGENTS.md`
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/24-依赖使用与实现路由.md`
- `Architecture_Corpus/25-TypeScript与仓库工具链.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/references/dependency-routing.json`
- `Architecture_Corpus/23-存储拓扑-生命周期根与DataOwner.md` only for lifecycle-root boundaries; M1 does not implement `PathProfile`.

## Global Constraints

- Repository Genesis is complete. Do not reopen or extend Genesis governance.
- `Architecture_Corpus/` remains normative current-state architecture authority and stays outside `docs/`.
- Active plans live under `docs/plans/active/`; completed plans live under `docs/plans/completed/`.
- `scripts/` contains executable entrypoints only; reusable repository mechanics live under `tools/`.
- `docs/engineering/GOTCHAS.md` and `docs/engineering/PLAYBOOK.md` are indexes; detailed entries live in subdirectories and are created only after a real need exists.
- Product/Foundation source uses TypeScript 7 and the current ESNext/NodeNext baseline. Repository bootstrap tooling may use native Node ESM `.mjs` when it must run before product compilation.
- Library-first remains mandatory. Use adopted dependencies for generic mechanics instead of reimplementing them.
- Query registry/upstream evidence before exact-pinning every newly materialized dependency. Never infer exact versions from memory or this plan.
- Preserve `minimumReleaseAge: 1440`. Do not add a release-age exception merely to obtain a newer ordinary JavaScript package; choose an eligible compatible release unless a concrete native/build closure requires an exception and the exception is documented.
- No external package may be added unless its current package identity is authorized by `Architecture_Corpus/references/dependency-routing.json` or it is an explicit repository-tooling package.
- No framework/library implementation type may leak into stable Foundation public contracts.
- Validation of canonical/bootstrap data must be non-mutating: no coercion, default insertion, or silent unknown-field removal.
- Verification truth is exactly `PASS | FAIL | BLOCKED | NOT_RUN`.
- Do not claim Windows-specific subprocess behavior `PASS` unless the relevant test actually runs on Windows.
- Do not claim platform power-loss/crash-durability qualification from unit tests; that remains outside M1.
- Use TDD for behavior-bearing code. Each task below ends in a reviewable commit.

## Explicitly Out of Scope

Do not add or implement PostgreSQL, `pg`, Kysely, DBOS, Cordis, Graphlib, proper-lockfile/bootstrap ownership, `PathProfile` OS mapping, Host lease/fencing, RuntimeReconciler, ServiceRegistry, CapabilityRegistry, Management, Extension runtime, Messaging, AI SDK, MCP, Subject, Backup/Restore, source-less packaging, or cross-platform product qualification.

---

## Target Repository Shape After M1

```text
repo/
├─ AGENTS.md
├─ Architecture_Corpus/
├─ .agents/
├─ docs/
│  ├─ README.md
│  ├─ plans/
│  │  ├─ README.md
│  │  ├─ active/                 # contains only currently active plans; may be empty after M1 closure
│  │  └─ completed/
│  │     ├─ repository/
│  │     │  └─ repository-genesis.md
│  │     └─ foundation/
│  │        └─ m1-development-spine.md
│  └─ engineering/
│     ├─ README.md
│     ├─ GOTCHAS.md
│     ├─ PLAYBOOK.md
│     ├─ gotchas/
│     │  └─ process/
│     │     └─ windows-command-shims.md
│     └─ playbooks/
│        └─ process/
│           └─ subprocess-execution.md
├─ tools/
│  └─ repo-kit/
│     ├─ package.json
│     ├─ project.json
│     ├─ README.md
│     ├─ src/
│     │  ├─ index.mjs
│     │  ├─ process.mjs
│     │  ├─ workspace.mjs
│     │  └─ dependency-authority.mjs
│     └─ test/
│        ├─ process.test.mjs
│        └─ fixtures/
│           └─ echo-argv.mjs
├─ scripts/
│  ├─ README.md
│  ├─ verify/
│  │  ├─ repository.mjs
│  │  ├─ corpus-integrity.mjs
│  │  ├─ dependencies.mjs
│  │  ├─ boundaries.mjs
│  │  └─ toolchain.mjs
│  └─ phases/
│     └─ repository-genesis.mjs
├─ packages/
│  ├─ foundation-contracts/
│  │  ├─ package.json
│  │  ├─ project.json
│  │  ├─ tsconfig.json
│  │  ├─ tsconfig.build.json
│  │  └─ src/
│  │     ├─ canonical-json.ts
│  │     ├─ canonical-json.test.ts
│  │     ├─ digest.ts
│  │     ├─ digest.test.ts
│  │     ├─ identity.ts
│  │     ├─ identity.test.ts
│  │     ├─ problem.ts
│  │     ├─ problem.test.ts
│  │     └─ index.ts
│  └─ bootstrap-state/
│     ├─ package.json
│     ├─ project.json
│     ├─ tsconfig.json
│     ├─ tsconfig.build.json
│     └─ src/
│        ├─ model.ts
│        ├─ codec.ts
│        ├─ codec.test.ts
│        ├─ store.ts
│        ├─ store.test.ts
│        ├─ journal.ts
│        ├─ journal.test.ts
│        └─ index.ts
└─ ...existing root toolchain files...
```

The shape above is the M1 implementation boundary, not a prediction of the final Heptalogos package topology.

---

## Preflight: Establish the Execution Baseline

- [x] Read root `AGENTS.md` first.
- [x] Read the applicable Heptalogos skills before editing: `heptalogos-architecture`, `heptalogos-dependencies`, `heptalogos-verification`, `heptalogos-runtime-durability`, and `heptalogos-config-data`.
- [x] Read every Authority file listed in the plan header.
- [x] Confirm the working tree is clean:

```bash
git status --short
```

Expected: no output.

- [x] Confirm the current branch/HEAD and record it in the plan execution record:

```bash
git branch --show-current
git rev-parse HEAD
```

- [x] Run the existing permanent baseline before any M1 change:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Expected: both `PASS`. If either fails, stop M1 and repair the existing baseline first; do not mix a pre-existing failure into M1.

- [x] Run the already-closed Genesis acceptance one final time before topology changes:

```bash
pnpm verify:genesis
```

Expected: `PASS`. Record this as historical closure evidence. M1 will retire this active command because its topology assertions are intentionally invalid once real Foundation packages exist.

---

### Task 1: Establish `docs/` plan and engineering-knowledge organization

**Files:**
- Create: `docs/README.md`
- Create: `docs/plans/README.md`
- Create: `docs/plans/active/foundation/m1-development-spine.md` by saving this exact plan into the repository
- Move: `REPOSITORY_GENESIS_PLAN.md` → `docs/plans/completed/repository/repository-genesis.md`
- Create: `docs/engineering/README.md`
- Create: `docs/engineering/GOTCHAS.md`
- Create: `docs/engineering/PLAYBOOK.md`
- Modify: `AGENTS.md`
- Modify: `package.json` to retire active Genesis-only commands after the final preflight PASS
- Modify: `docs/plans/completed/repository/repository-genesis.md` to record that final PASS and command retirement
- Modify: `.agents/heptalogos/package-manifest.json` only as required to synchronize the changed root `AGENTS.md` metadata

**Interfaces:**
- Consumes: existing root plan-routing rules in `AGENTS.md`.
- Produces: one unambiguous active-plan location and two cumulative engineering-knowledge indexes.

- [x] **Step 1: Create documentation navigation**

`docs/README.md` must contain these links and meanings:

```markdown
# Documentation

- Architecture authority: [`../Architecture_Corpus/`](../Architecture_Corpus/)
- Active implementation plans: [`plans/active/`](plans/active/)
- Completed implementation records: [`plans/completed/`](plans/completed/)
- Engineering knowledge: [`engineering/`](engineering/)

`Architecture_Corpus/` is normative current-state architecture. `docs/` contains time-scoped implementation plans and cumulative engineering knowledge; it does not replace Architecture Corpus authority.
```

`docs/plans/README.md` must define exactly these plan states:

```text
ACTIVE
COMPLETED
SUPERSEDED
ABANDONED
```

It must state that filename recency is not plan authority and that a task should name its governing active plan.

- [x] **Step 2: Create the engineering indexes**

`docs/engineering/README.md` must define:

```text
GOTCHA   = a reproduced/understood failure mode, root cause, repository rule, and regression evidence.
PLAYBOOK = the supported procedure for a repeated engineering operation.
```

`docs/engineering/GOTCHAS.md` and `docs/engineering/PLAYBOOK.md` are indexes only. Start them with an empty table header; do not pre-create speculative categories beyond the process entries added in Task 3.

- [x] **Step 3: Move the completed Genesis plan**

Use Git-aware movement:

```bash
node --input-type=module -e "import { mkdirSync } from 'node:fs'; for (const p of ['docs/plans/active/foundation','docs/plans/completed/repository','docs/plans/completed/foundation','docs/engineering/gotchas','docs/engineering/playbooks']) mkdirSync(p,{recursive:true})"
git mv REPOSITORY_GENESIS_PLAN.md docs/plans/completed/repository/repository-genesis.md
```

Save this received plan verbatim at:

```text
docs/plans/active/foundation/m1-development-spine.md
```

The preflight `pnpm verify:genesis` result is the final live Genesis-topology acceptance. Record that result in `docs/plans/completed/repository/repository-genesis.md`, then remove the active `check:genesis` and `verify:genesis` scripts from root `package.json`. Keep `GENESIS_EVIDENCE.json` and the phase script for historical evidence; do not keep a command that is expected to fail once M1 changes repository topology.

- [x] **Step 4: Update root Agent plan routing**

Replace the root-plan assumption in `AGENTS.md` with this policy:

```text
Active implementation plans live under docs/plans/active/.
Completed implementation records live under docs/plans/completed/.
Before implementation, read the plan explicitly named by the task.
If multiple active plans could govern the task and none is designated, surface the ambiguity rather than guessing by filename or recency.
For repository tooling, subprocess, package-manager, filesystem, or platform-development mechanics, consult docs/engineering/GOTCHAS.md and docs/engineering/PLAYBOOK.md when applicable.
```

Do not enlarge `AGENTS.md` with detailed Gotcha/Playbook contents.

- [x] **Step 5: Synchronize the Agent package manifest**

Run the existing validator first and confirm it fails because root `AGENTS.md` metadata changed:

```bash
node .agents/heptalogos/validate-skill-resources.mjs
```

Expected: `FAIL` on the stale `AGENTS.md` size/hash entry.

Update only the affected entry in `.agents/heptalogos/package-manifest.json` using the actual UTF-8 byte size and SHA-256 of the new root `AGENTS.md`. Do not weaken the validator.

Then rerun:

```bash
node .agents/heptalogos/validate-skill-resources.mjs
```

Expected: `PASS`.

- [x] **Step 6: Verify links and plan location**

```bash
node --input-type=module -e "import { existsSync } from 'node:fs'; const ok=existsSync('docs/plans/active/foundation/m1-development-spine.md')&&existsSync('docs/plans/completed/repository/repository-genesis.md')&&!existsSync('REPOSITORY_GENESIS_PLAN.md'); if(!ok) process.exit(1)"
pnpm format:check
```

- [x] **Step 7: Commit**

```bash
git add AGENTS.md package.json .agents/heptalogos/package-manifest.json docs

git commit -m "docs: organize plans and engineering knowledge"
```

---

### Task 2: Reorganize repository scripts and create the repo-kit package boundary

**Files:**
- Create: `scripts/README.md`
- Move: `scripts/check-repository.mjs` → `scripts/verify/repository.mjs`
- Move: `scripts/check-corpus-integrity.mjs` → `scripts/verify/corpus-integrity.mjs`
- Move: `scripts/check-dependency-routes.mjs` → `scripts/verify/dependencies.mjs`
- Move: `scripts/check-boundaries.mjs` → `scripts/verify/boundaries.mjs`
- Move: `scripts/check-toolchain.mjs` → `scripts/verify/toolchain.mjs`
- Move: `scripts/check-clean-room.mjs` → `scripts/phases/repository-genesis.mjs`
- Move/refactor: `scripts/dependency-route-authority.mjs` → `tools/repo-kit/src/dependency-authority.mjs`
- Create: `tools/repo-kit/package.json`
- Create: `tools/repo-kit/project.json`
- Create: `tools/repo-kit/README.md`
- Create: `tools/repo-kit/src/index.mjs`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify import paths inside moved verification entrypoints

**Interfaces:**
- Produces: `@heptalogos/repo-kit` as a private repository-only package; `scripts/*` become entrypoints rather than reusable libraries.
- Produces: `dependency-authority.mjs` exporting the existing `authority`, `packageRoutes`, `repositoryToolingPackages`, `routes`, and `routeForDependency()` interface unchanged.

- [x] **Step 1: Add real workspace roots**

Change `pnpm-workspace.yaml` package discovery from root-only to:

```yaml
packages:
  - .
  - packages/*
  - tools/*
```

Do not create `apps/`, `extensions/`, or other future topology in M1.

- [x] **Step 2: Create `tools/repo-kit/package.json`**

```json
{
  "name": "@heptalogos/repo-kit",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.mjs"
  },
  "devDependencies": {
    "vitest": "catalog:"
  }
}
```

Create `tools/repo-kit/project.json`:

```json
{
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "name": "repo-kit",
  "projectType": "library",
  "targets": {
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "eslint tools/repo-kit"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run --root tools/repo-kit"
      }
    }
  }
}
```

- [x] **Step 3: Move the scripts with `git mv`**

```bash
node --input-type=module -e "import { mkdirSync } from 'node:fs'; for (const p of ['scripts/verify','scripts/phases','tools/repo-kit/src']) mkdirSync(p,{recursive:true})"
git mv scripts/check-repository.mjs scripts/verify/repository.mjs
git mv scripts/check-corpus-integrity.mjs scripts/verify/corpus-integrity.mjs
git mv scripts/check-dependency-routes.mjs scripts/verify/dependencies.mjs
git mv scripts/check-boundaries.mjs scripts/verify/boundaries.mjs
git mv scripts/check-toolchain.mjs scripts/verify/toolchain.mjs
git mv scripts/check-clean-room.mjs scripts/phases/repository-genesis.mjs
git mv scripts/dependency-route-authority.mjs tools/repo-kit/src/dependency-authority.mjs
```

Update imports in `scripts/verify/dependencies.mjs` and `scripts/verify/boundaries.mjs` to import from:

```js
../../tools/repo-kit/src/dependency-authority.mjs
```

Do not duplicate the dependency Authority loader under `scripts/`.

- [x] **Step 4: Create repo-kit exports and READMEs**

`tools/repo-kit/src/index.mjs` initially exports only what exists:

```js
export * from "./dependency-authority.mjs";
```

`scripts/README.md` must state:

```text
scripts/verify/ = permanent executable repository gates
scripts/phases/ = phase-specific/historical acceptance entrypoints
Reusable code must move to tools/repo-kit rather than accumulate under scripts/.
```

`tools/repo-kit/README.md` must state that this package is repository/development tooling, not a product/Foundation runtime dependency, and that new helpers are added only after a concrete repeated need exists.

- [x] **Step 5: Update root script paths without changing semantics yet**

Update `package.json` mappings to the new paths:

```text
check:corpus       -> node scripts/verify/corpus-integrity.mjs
check:repository   -> node scripts/verify/repository.mjs
check:dependencies -> node scripts/verify/dependencies.mjs
check:boundaries   -> node scripts/verify/boundaries.mjs
toolchain:check    -> node scripts/verify/toolchain.mjs
check:genesis      -> node scripts/phases/repository-genesis.mjs
```

Keep permanent `verify` behavior unchanged in this task. Genesis-only root commands were retired in Task 1 after their final successful preflight run; do not reintroduce them.

- [x] **Step 6: Install and verify the pure move**

```bash
pnpm install
pnpm install --frozen-lockfile
pnpm check:repository
pnpm check:corpus
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check
pnpm verify
```

Expected: all permanent gates `PASS`. This task is a structural move and must not change permanent gate meaning.

- [x] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml scripts tools/repo-kit

git commit -m "chore: structure repository scripts and tooling"
```

---

### Task 3: Add the cross-platform process runner and capture the first engineering knowledge

**Files:**
- Create: `tools/repo-kit/src/process.mjs`
- Create: `tools/repo-kit/src/workspace.mjs`
- Create: `tools/repo-kit/test/process.test.mjs`
- Create: `tools/repo-kit/test/fixtures/echo-argv.mjs`
- Modify: `tools/repo-kit/src/index.mjs`
- Modify: `tools/repo-kit/package.json`
- Modify: `scripts/verify/toolchain.mjs`
- Modify: `scripts/verify/dependencies.mjs`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Create: `docs/engineering/gotchas/process/windows-command-shims.md`
- Create: `docs/engineering/playbooks/process/subprocess-execution.md`
- Modify: `docs/engineering/GOTCHAS.md`
- Modify: `docs/engineering/PLAYBOOK.md`

**Interfaces:**
- Produces these repository-only logical shapes (implemented in `.mjs`; JSDoc is optional but field semantics are fixed):

```ts
interface RunProcessOptions {
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly reject?: boolean;
}

interface ProcessResult {
  readonly command: string;
  readonly args: readonly string[];
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly failed: boolean;
}

interface WorkspacePackage {
  readonly name: string;
  readonly version?: string;
  readonly path: string;
  readonly private: boolean;
}

runProcess(command: string, args?: readonly string[], options?: RunProcessOptions): Promise<ProcessResult>
runProcessChecked(command: string, args?: readonly string[], options?: RunProcessOptions): Promise<ProcessResult>
runPnpm(args: readonly string[], options?: RunProcessOptions): Promise<ProcessResult>
runNode(script: string, args?: readonly string[], options?: RunProcessOptions): Promise<ProcessResult>
discoverWorkspacePackages(options?: { cwd?: string }): Promise<readonly WorkspacePackage[]>
```

- `runProcess*` never accepts a combined shell command string and never enables a shell implicitly.

- [x] **Step 1: Refresh Execa registry/upstream evidence and exact-pin it**

Run:

```bash
pnpm view execa version dist-tags engines peerDependencies --json
pnpm view execa time --json
```

Confirm the selected package remains consistent with the adopted `process.execa` route and supports Node 24. Write the selected exact version into the root Catalog under `execa`. If the newest release is younger than the repository's 1440-minute release-age policy, select the newest compatible eligible release rather than adding an ordinary package exception.

Then add to `tools/repo-kit/package.json`:

```json
"dependencies": {
  "execa": "catalog:"
}
```

Run `pnpm install` and ensure the new lockfile is resolved from the Catalog.

- [x] **Step 2: Write the argument-preservation fixture**

Create `tools/repo-kit/test/fixtures/echo-argv.mjs`:

```js
process.stdout.write(JSON.stringify(process.argv.slice(2)));
```

- [x] **Step 3: Write failing process-runner tests**

Create `tools/repo-kit/test/process.test.mjs` with at least these tests:

```js
import { describe, expect, it } from "vitest";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runNode, runPnpm, runProcessChecked } from "../src/process.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "fixtures/echo-argv.mjs");
const repoRoot = resolve(here, "../../..");

describe("repository process runner", () => {
  it("preserves argv without shell parsing", async () => {
    const argv = ["space value", 'quote\"value', "amp&value", "paren(value)", "caret^value"];
    const result = await runNode(fixture, argv, { cwd: repoRoot });
    expect(JSON.parse(result.stdout)).toEqual(argv);
  });

  it("runs the repository pnpm shim without cmd.exe command-string construction", async () => {
    const result = await runPnpm(["--version"], { cwd: repoRoot });
    expect(result.stdout.trim()).toBe("11.22.0");
  });

  it("returns structured non-zero results when rejection is disabled", async () => {
    const result = await runProcessChecked(process.execPath, ["-e", "process.exit(7)"], {
      cwd: repoRoot,
      reject: false
    });
    expect(result.exitCode).toBe(7);
    expect(result.failed).toBe(true);
  });
});
```

Run:

```bash
pnpm exec vitest run --root tools/repo-kit
```

Expected: `FAIL` because `process.mjs` does not exist.

- [x] **Step 4: Implement the minimal process API**

Create `tools/repo-kit/src/process.mjs` with these result semantics:

```js
import { execa } from "execa";

export async function runProcess(command, args = [], options = {}) {
  const { reject = false, ...execaOptions } = options;
  const result = await execa(command, [...args], {
    ...execaOptions,
    reject: false,
    shell: false,
    stdout: "pipe",
    stderr: "pipe",
    windowsHide: true,
  });

  const normalized = {
    command,
    args: [...args],
    exitCode: result.exitCode ?? null,
    signal: result.signal ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    failed: result.failed,
  };

  if (reject && normalized.failed) {
    const error = new Error(
      `Process failed: ${command} (exit=${String(normalized.exitCode)}, signal=${String(normalized.signal)})`,
    );
    error.result = normalized;
    throw error;
  }

  return normalized;
}

export function runProcessChecked(command, args = [], options = {}) {
  return runProcess(command, args, { ...options, reject: options.reject ?? true });
}

export function runPnpm(args, options = {}) {
  return runProcessChecked("pnpm", args, options);
}

export function runNode(script, args = [], options = {}) {
  return runProcessChecked(process.execPath, [script, ...args], options);
}
```

If Execa's actual current result shape differs, adapt only the normalization layer while preserving the exported repo-kit interface and test expectations above. Do not reintroduce `cmd.exe`, `.join(" ")`, or `shell: true` as an ordinary fallback.

- [x] **Step 5: Re-run the repo-kit tests**

```bash
pnpm exec vitest run --root tools/repo-kit
```

Expected: `PASS` on the current platform. If the current platform is Windows, the `runPnpm()` test is the M1 Windows shim regression evidence. If not Windows, record the Windows-specific claim as `NOT_RUN` while retaining the platform-neutral argv test as `PASS`.

- [x] **Step 6: Migrate `scripts/verify/toolchain.mjs` to repo-kit**

Delete the current manual Windows branch that constructs:

```text
cmd.exe /d /s /c reconstructed-command-string
```

Convert the script to top-level async/`await` and use `runPnpm()` / `runProcessChecked()` for subprocesses. Preserve all existing toolchain assertions and exact version checks. `toolchain.mjs` must no longer import `spawnSync`.

Run:

```bash
pnpm toolchain:check
```

Expected: `PASS`.

- [x] **Step 7: Add workspace discovery based on pnpm's real workspace view**

Create `tools/repo-kit/src/workspace.mjs`:

```js
import { runPnpm } from "./process.mjs";

export async function discoverWorkspacePackages({ cwd = process.cwd() } = {}) {
  const result = await runPnpm(["list", "-r", "--depth", "-1", "--json"], { cwd });
  const entries = JSON.parse(result.stdout);
  if (!Array.isArray(entries)) {
    throw new Error("pnpm recursive package listing did not return an array");
  }
  return entries.map((entry) => ({
    name: entry.name,
    version: entry.version,
    path: entry.path,
    private: entry.private === true,
  }));
}
```

Export it from `tools/repo-kit/src/index.mjs`.

Refactor `scripts/verify/dependencies.mjs` to discover workspace package manifests from `discoverWorkspacePackages()` rather than hard-coded future source-root names. Keep the existing distinction:

```text
workspace package dependency -> workspace:
external direct dependency   -> catalog: + adopted Corpus package identity or explicit repository tooling
```

Apply the check to `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies` according to the current governance rule.

- [x] **Step 8: Record the actual engineering knowledge**

Create `docs/engineering/gotchas/process/windows-command-shims.md` with these sections and facts:

```markdown
# Windows command shims from Node subprocesses

## Scope
Node child process invocation of pnpm/npm-style command shims on Windows.

## Symptom
Direct ad-hoc spawn logic or manual `cmd.exe /c` strings can fail or corrupt arguments depending on shim resolution and shell quoting.

## Root cause
Windows command/shim resolution and shell parsing are not POSIX argv semantics. Reconstructing a command line with `args.join(" ")` loses the original argv boundary and introduces quoting/metacharacter bugs.

## Repository rule
Use `@heptalogos/repo-kit` process helpers. Pass command and argv separately. Ordinary repository subprocesses use `shell: false`. Shell execution must be an explicit, separately reviewed operation.

## Regression evidence
`tools/repo-kit/test/process.test.mjs` and `scripts/verify/toolchain.mjs`.
```

Create `docs/engineering/playbooks/process/subprocess-execution.md` describing the supported calls:

```text
runProcess
runProcessChecked
runPnpm
runNode
```

and explicitly prohibit hand-built `cmd.exe`, `.cmd` selection, and joined shell command strings for ordinary subprocesses.

Add one index row to each `GOTCHAS.md` / `PLAYBOOK.md`. Do not add unrelated entries.

- [x] **Step 9: Run the repository gates**

```bash
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check
pnpm exec nx run repo-kit:test
pnpm exec nx run repo-kit:lint
pnpm verify
```

Expected: all permanent gates `PASS`.

- [x] **Step 10: Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml tools/repo-kit scripts/verify docs/engineering

git commit -m "feat: add cross-platform repository process substrate"
```

---

### Task 4: Transition from Genesis smoke project to the real M1 workspace graph

**Files:**
- Create: `packages/foundation-contracts/package.json`
- Create: `packages/foundation-contracts/project.json`
- Create: `packages/foundation-contracts/tsconfig.json`
- Create: `packages/foundation-contracts/tsconfig.build.json`
- Create: `packages/foundation-contracts/src/index.ts`
- Create: `packages/bootstrap-state/package.json`
- Create: `packages/bootstrap-state/project.json`
- Create: `packages/bootstrap-state/tsconfig.json`
- Create: `packages/bootstrap-state/tsconfig.build.json`
- Create: `packages/bootstrap-state/src/index.ts`
- Modify: `tsconfig.json`
- Modify: `eslint.config.mjs`
- Modify: `package.json`
- Delete: `src/index.ts`, `src/index.test.ts`, `src/main.ts`, `src/project.json`, `src/tsconfig.json`, `src/tsconfig.build.json`
- Retain: `scripts/phases/repository-genesis.mjs` and `GENESIS_EVIDENCE.json` as historical evidence/tools. Active root Genesis commands were already retired in Task 1.

**Interfaces:**
- Produces two real private Foundation workspace packages: `@heptalogos/foundation-contracts` and `@heptalogos/bootstrap-state`.
- Produces repo-wide `lint`, `typecheck`, `test`, and `build` commands that operate over all applicable Nx projects.

- [x] **Step 1: Create the package manifests**

`packages/foundation-contracts/package.json`:

```json
{
  "name": "@heptalogos/foundation-contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "devDependencies": {
    "vitest": "catalog:"
  }
}
```

`packages/bootstrap-state/package.json`:

```json
{
  "name": "@heptalogos/bootstrap-state",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@heptalogos/foundation-contracts": "workspace:*"
  },
  "devDependencies": {
    "vitest": "catalog:"
  }
}
```

No other Foundation dependency enters until the task that has a real consumer for it.

- [x] **Step 2: Create Nx project definitions**

Use the same structure for both packages, changing names/paths. For `foundation-contracts`:

```json
{
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "name": "foundation-contracts",
  "projectType": "library",
  "sourceRoot": "packages/foundation-contracts/src",
  "targets": {
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "eslint packages/foundation-contracts"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run --root packages/foundation-contracts"
      }
    }
  }
}
```

For `bootstrap-state`, use project name `bootstrap-state` and its corresponding paths. Do not add speculative Nx architecture tags in M1.

- [x] **Step 3: Create package TypeScript configs**

For each package, create `tsconfig.json` (the block below is used in both package roots):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "composite": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts"]
}
```

Create `tsconfig.build.json` using the package's own output directory. For `foundation-contracts`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "rootDir": "src",
    "outDir": "../../dist/packages/foundation-contracts"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

For `bootstrap-state`, use `../../dist/packages/bootstrap-state`.

Root `tsconfig.json` becomes a solution config:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/foundation-contracts" },
    { "path": "./packages/bootstrap-state" }
  ]
}
```

If Nx's TypeScript sync requires a generated reference adjustment, use `nx sync`/the configured `@nx/js/typescript` mechanics; do not hand-maintain a parallel project graph that conflicts with Nx output.

- [x] **Step 4: Make ESLint multi-project aware**

Replace the single-root `parserOptions.project: ["./tsconfig.json"]` assumption with typescript-eslint project service:

```js
parserOptions: {
  projectService: true,
  tsconfigRootDir: import.meta.dirname,
}
```

Add an ESLint block for repository `.mjs` files using the normal JS parser semantics; do not force the TypeScript parser/project service onto `.mjs` repo-kit files.

Keep the existing `no-floating-promises` and `no-misused-promises` rules for TypeScript source.

- [x] **Step 5: Create minimal package entrypoints**

Create both `src/index.ts` files as empty modules:

```ts
export {};
```

This is temporary scaffolding inside the task and will gain real exports in Tasks 5-9; do not add placeholder domain APIs.

- [x] **Step 6: Replace root project-specific commands with repo-wide Nx commands**

Set root scripts to:

```json
{
  "lint": "nx run-many -t lint --all",
  "typecheck": "nx run-many -t typecheck --all",
  "test": "nx run-many -t test --all",
  "build": "nx run-many -t build --all"
}
```

Keep `tsc6` as the isolated compiler-API compatibility lane and set the root script to:

```json
"tsc6": "tsc6 --noEmit -p tsconfig.ts6.json"
```

Remove the obsolete Genesis-only `start` script. Do not reintroduce the already-retired `check:genesis` or `verify:genesis` scripts. Update permanent `verify` to omit the obsolete Genesis runtime smoke and to remain:

```text
check:agents
check:corpus
check:repository
check:dependencies
check:boundaries
toolchain:check
format:check
lint
typecheck
tsc6
test
build
```

Do not add an M1-specific permanent gate merely to mirror the phase name.

- [x] **Step 7: Retire the Genesis smoke source**

Delete the root `src/` Genesis smoke files listed above. Do not transplant them into a new package. Update `docs/plans/completed/repository/repository-genesis.md` with a short historical note that `verify:genesis` passed immediately before M1 topology materialization and was then retired because its root-only assertions are intentionally phase-specific.

- [x] **Step 8: Install and inspect the real graph**

```bash
pnpm install
pnpm install --frozen-lockfile
pnpm exec nx show projects
pnpm exec nx show project repo-kit
pnpm exec nx show project foundation-contracts
pnpm exec nx show project bootstrap-state
```

Expected projects include exactly the three M1 projects above plus any repository project that Nx legitimately infers from retained root configuration. There must be no new empty future product project.

- [x] **Step 9: Run repo-wide verification**

```bash
pnpm lint
pnpm typecheck
pnpm tsc6
pnpm test
pnpm build
pnpm verify
```

Expected: all `PASS`.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json eslint.config.mjs packages tools scripts docs/plans/completed/repository/repository-genesis.md

git commit -m "chore: establish Foundation M1 workspace graph"
```

---

### Task 5: Implement canonical JSON and domain-separated digest contracts

**Files:**
- Create: `packages/foundation-contracts/src/canonical-json.ts`
- Create: `packages/foundation-contracts/src/canonical-json.test.ts`
- Create: `packages/foundation-contracts/src/digest.ts`
- Create: `packages/foundation-contracts/src/digest.test.ts`
- Modify: `packages/foundation-contracts/src/index.ts`
- Modify: `packages/foundation-contracts/package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

```ts
export type CanonicalJsonValue = null | boolean | number | string | readonly CanonicalJsonValue[] | { readonly [key: string]: CanonicalJsonValue };
export function canonicalizeJson(value: CanonicalJsonValue): string;

export interface Sha256Digest {
  readonly algorithm: "sha256";
  readonly canonicalization: "RFC8785-JCS";
  readonly domain: string;
  readonly hex: string;
}
export function digestCanonicalJson(domain: string, payload: CanonicalJsonValue): Sha256Digest;
```

- [x] **Step 1: Refresh and exact-pin `canonicalize`**

```bash
pnpm view canonicalize@4 version engines peerDependencies --json
pnpm view canonicalize time --json
```

Choose the newest route-compatible release allowed by the 1440-minute policy and Node 24. Exact-pin it in the root Catalog. Add to `packages/foundation-contracts/package.json`:

```json
"dependencies": {
  "canonicalize": "catalog:"
}
```

Do not add a different canonicalization library.

- [x] **Step 2: Write canonicalization tests first**

```ts
import { describe, expect, it } from "vitest";
import { canonicalizeJson } from "./canonical-json.js";

describe("canonicalizeJson", () => {
  it("produces identical bytes for semantically identical object member ordering", () => {
    const a = canonicalizeJson({ z: 1, a: { y: true, x: "v" } });
    const b = canonicalizeJson({ a: { x: "v", y: true }, z: 1 });
    expect(a).toBe(b);
  });

  it("rejects values outside the supported canonical JSON domain", () => {
    expect(() => canonicalizeJson({ value: Number.NaN })).toThrow();
  });
});
```

Run:

```bash
pnpm exec vitest run --root packages/foundation-contracts src/canonical-json.test.ts
```

Expected: `FAIL` because the implementation does not exist.

- [x] **Step 3: Implement `canonicalizeJson`**

Wrap `canonicalize` behind the Heptalogos-owned function. Validate that the library returned a string and reject unsupported/non-finite numeric input rather than silently transforming it. No `canonicalize` library type may appear in the exported signature.

- [x] **Step 4: Write digest tests first**

```ts
import { describe, expect, it } from "vitest";
import { digestCanonicalJson } from "./digest.js";

describe("digestCanonicalJson", () => {
  it("is stable across object member ordering", () => {
    expect(digestCanonicalJson("test.domain/v1", { b: 2, a: 1 }).hex).toBe(
      digestCanonicalJson("test.domain/v1", { a: 1, b: 2 }).hex,
    );
  });

  it("separates identical payloads by digest domain", () => {
    const payload = { id: "same" } as const;
    expect(digestCanonicalJson("approval/v1", payload).hex).not.toBe(
      digestCanonicalJson("artifact/v1", payload).hex,
    );
  });

  it("returns lowercase SHA-256 hex", () => {
    expect(digestCanonicalJson("test.domain/v1", { a: 1 }).hex).toMatch(/^[0-9a-f]{64}$/u);
  });
});
```

Run and confirm `FAIL` before implementation.

- [x] **Step 5: Implement the domain-separated digest**

Hash canonical UTF-8 bytes for an explicit envelope equivalent to:

```ts
{
  domain,
  canonicalization: "RFC8785-JCS",
  hashAlgorithm: "sha256",
  payload,
}
```

Use `node:crypto` SHA-256. Do not hash the bare payload without the domain/canonicalization envelope.

- [x] **Step 6: Export and verify**

Export both modules from `src/index.ts`, then run:

```bash
pnpm exec nx run foundation-contracts:test
pnpm exec nx run foundation-contracts:typecheck
pnpm exec nx run foundation-contracts:build
pnpm check:dependencies
pnpm check:boundaries
```

Expected: all `PASS`.

- [ ] **Step 7: Commit**

```bash
git add packages/foundation-contracts pnpm-workspace.yaml pnpm-lock.yaml

git commit -m "feat: add canonical JSON and digest contracts"
```

---

### Task 6: Implement generated/content identity primitives and Structured Problem

**Files:**
- Create: `packages/foundation-contracts/src/identity.ts`
- Create: `packages/foundation-contracts/src/identity.test.ts`
- Create: `packages/foundation-contracts/src/problem.ts`
- Create: `packages/foundation-contracts/src/problem.test.ts`
- Modify: `packages/foundation-contracts/src/index.ts`
- Modify: `packages/foundation-contracts/package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

```ts
export type Branded<T, TBrand extends string> = T & { readonly __brand: TBrand };
export type UuidV7Id<TBrand extends string> = Branded<string, `uuidv7:${TBrand}`>;
export type ContentDigest<TBrand extends string> = Branded<string, `sha256:${TBrand}`>;
export function createUuidV7Id<TBrand extends string>(brand: TBrand): UuidV7Id<TBrand>;
export function asContentDigest<TBrand extends string>(brand: TBrand, digest: Sha256Digest): ContentDigest<TBrand>;

export type RetryClass = "never" | "immediate" | "backoff" | "after-change" | "manual";
export interface FieldError {
  readonly field: string;
  readonly problemCode: string;
  readonly detail?: string;
}
export interface Problem {
  readonly schemaVersion: 1;
  readonly problemCode: string;
  readonly category: string;
  readonly retryClass: RetryClass;
  readonly title: string;
  readonly detail?: string;
  readonly activityId?: string;
  readonly resourceRef?: string;
  readonly fieldErrors?: readonly FieldError[];
  readonly causeProblemRefs?: readonly string[];
  readonly metadata?: Readonly<Record<string, CanonicalJsonValue>>;
}
export class ProblemError extends Error {
  readonly problem: Problem;
  constructor(problem: Problem, options?: ErrorOptions);
}
```

- [x] **Step 1: Refresh and exact-pin `uuid`**

```bash
pnpm view uuid version dist-tags engines peerDependencies --json
pnpm view uuid time --json
```

Choose the newest maintained ESM release compatible with Node 24 and the repository release-age policy. Exact-pin it in the root Catalog and add `uuid: "catalog:"` to `foundation-contracts` dependencies.

- [x] **Step 2: Write identity tests first**

```ts
import { describe, expect, it } from "vitest";
import { validate as validateUuid, version as uuidVersion } from "uuid";
import { asContentDigest, createUuidV7Id } from "./identity.js";
import { digestCanonicalJson } from "./digest.js";

describe("identity primitives", () => {
  it("creates RFC 9562 UUIDv7 generated identities", () => {
    const id = createUuidV7Id("ActivityId");
    expect(validateUuid(id)).toBe(true);
    expect(uuidVersion(id)).toBe(7);
  });

  it("represents content generation as a digest rather than generating a UUID", () => {
    const digest = digestCanonicalJson("product-generation/v1", { manifest: "x" });
    const generation = asContentDigest("ProductGenerationId", digest);
    expect(generation).toBe(digest.hex);
    expect(validateUuid(generation)).toBe(false);
  });
});
```

Run and confirm `FAIL` before implementation.

- [x] **Step 3: Implement identity primitives**

Use `uuid`'s v7 implementation for generated IDs. `asContentDigest()` must return the already-proven digest hex and must never generate a new UUID. The `brand` arguments exist for type distinction; they are not authorization or secrecy mechanisms.

- [x] **Step 4: Write Problem tests first**

Cover at least:

```ts
import { describe, expect, it } from "vitest";
import { ProblemError } from "./problem.js";

describe("ProblemError", () => {
  it("preserves stable machine fields independently from Error.message", () => {
    const problem = {
      schemaVersion: 1,
      problemCode: "bootstrap.state.invalid",
      category: "integrity",
      retryClass: "manual",
      title: "Bootstrap state is invalid",
    } as const;

    const error = new ProblemError(problem);
    expect(error.problem).toEqual(problem);
    expect(error.name).toBe("ProblemError");
  });
});
```

- [x] **Step 5: Implement `Problem` / `ProblemError`**

`ProblemError` is an internal throwing convenience around the canonical `Problem`; the stable machine contract is `Problem`, not JavaScript exception text. Do not place stack traces, secrets, or arbitrary provider payloads into `Problem.metadata`.

- [x] **Step 6: Export and verify**

```bash
pnpm exec nx run foundation-contracts:test
pnpm exec nx run foundation-contracts:typecheck
pnpm exec nx run foundation-contracts:build
pnpm lint
```

Expected: all `PASS`.

- [ ] **Step 7: Commit**

```bash
git add packages/foundation-contracts pnpm-workspace.yaml pnpm-lock.yaml

git commit -m "feat: add Foundation identity and Problem primitives"
```

---

### Task 7: Define and validate the BootstrapState v1 contract

**Files:**
- Create: `packages/bootstrap-state/src/model.ts`
- Create: `packages/bootstrap-state/src/codec.ts`
- Create: `packages/bootstrap-state/src/codec.test.ts`
- Modify: `packages/bootstrap-state/src/index.ts`
- Modify: `packages/bootstrap-state/package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

```ts
export type BootstrapRuntimeGenerationId = ContentDigest<"BootstrapRuntimeGenerationId">;
export type ProductGenerationId = ContentDigest<"ProductGenerationId">;

export interface BootstrapStateBodyV1 {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly activeBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly previousBootstrapRuntimeGeneration?: BootstrapRuntimeGenerationId;
  readonly activeProductGeneration: ProductGenerationId;
  readonly lastKnownGoodProductGeneration?: ProductGenerationId;
  readonly lastCommittedOperationRef?: string;
  readonly lastCompletedStageRef?: string;
}

export interface BootstrapStateEnvelopeV1 {
  readonly state: BootstrapStateBodyV1;
  readonly digest: Sha256Digest;
}

export type BootstrapStateParseResult =
  | { readonly ok: true; readonly value: BootstrapStateEnvelopeV1 }
  | { readonly ok: false; readonly problem: Problem };

export const BOOTSTRAP_STATE_DIGEST_DOMAIN = "heptalogos.bootstrap-state/v1";
export function sealBootstrapState(state: BootstrapStateBodyV1): BootstrapStateEnvelopeV1;
export function parseBootstrapState(text: string): BootstrapStateParseResult;
```

- [x] **Step 1: Refresh and exact-pin TypeBox/Ajv**

```bash
pnpm view typebox@1 version engines peerDependencies --json
pnpm view typebox time --json
pnpm view ajv@8 version engines peerDependencies --json
pnpm view ajv time --json
```

Choose the newest route-compatible eligible releases, exact-pin both in the root Catalog, and add to `packages/bootstrap-state/package.json`:

```json
"dependencies": {
  "@heptalogos/foundation-contracts": "workspace:*",
  "ajv": "catalog:",
  "typebox": "catalog:"
}
```

- [x] **Step 2: Write failing codec tests**

Cover all of these cases:

```text
valid state seals and parses
state digest mismatch is rejected
unknown top-level/state fields are rejected
revision 0 / negative / non-integer is rejected
missing required generation refs are rejected
validation does not coerce a string revision into a number
```

Use a valid base fixture with `revision: 1` and deterministic digest-like generation IDs produced from `digestCanonicalJson()` + `asContentDigest()`.

- [x] **Step 3: Run the codec test and observe RED**

```bash
pnpm exec vitest run --root packages/bootstrap-state src/codec.test.ts
```

Expected: `FAIL` because model/codec implementation does not exist.

- [x] **Step 4: Implement the TypeBox schema and non-mutating Ajv validator**

Use the currently pinned TypeBox 1.x package API and Ajv 8. Configure validation so it does not coerce, insert defaults, or remove unknown fields. The schema must require:

```text
schemaVersion == 1
revision is integer >= 1
activeBootstrapRuntimeGeneration is a non-empty string
activeProductGeneration is a non-empty string
optional previous/LKG/operation/stage refs are strings when present
additional properties are rejected
```

The exported TypeScript interfaces remain Heptalogos-owned and must not expose TypeBox/Ajv implementation types.

- [x] **Step 5: Implement seal/parse integrity**

`sealBootstrapState()` computes the digest over the `state` body using `BOOTSTRAP_STATE_DIGEST_DOMAIN`.

`parseBootstrapState()` performs, in order:

```text
JSON parse
→ structural/non-mutating schema validation
→ digest metadata validation
→ recompute domain-separated digest from state
→ constant logical equality of expected/recorded hex
→ return parsed envelope or canonical Problem
```

Use stable Problem codes:

```text
bootstrap.state.invalid_json
bootstrap.state.invalid_schema
bootstrap.state.digest_mismatch
```

- [x] **Step 6: Verify**

```bash
pnpm exec nx run bootstrap-state:test
pnpm exec nx run bootstrap-state:typecheck
pnpm exec nx run bootstrap-state:build
pnpm check:dependencies
pnpm check:boundaries
```

Expected: all `PASS`.

- [ ] **Step 7: Commit**

```bash
git add packages/bootstrap-state pnpm-workspace.yaml pnpm-lock.yaml

git commit -m "feat: add versioned BootstrapState contract"
```

---

### Task 8: Implement atomic BootstrapStateStore with previous-valid recovery

**Files:**
- Create: `packages/bootstrap-state/src/store.ts`
- Create: `packages/bootstrap-state/src/store.test.ts`
- Modify: `packages/bootstrap-state/src/index.ts`
- Modify: `packages/bootstrap-state/package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

```ts
export type BootstrapStateLoadResult =
  | { readonly status: "EMPTY" }
  | { readonly status: "CURRENT"; readonly value: BootstrapStateEnvelopeV1 }
  | { readonly status: "RECOVERED_PREVIOUS"; readonly value: BootstrapStateEnvelopeV1; readonly problem: Problem }
  | { readonly status: "CORRUPT"; readonly problem: Problem };

export class BootstrapStateStore {
  constructor(directory: string);
  load(): Promise<BootstrapStateLoadResult>;
  commit(candidate: BootstrapStateBodyV1): Promise<BootstrapStateEnvelopeV1>;
}
```

Physical files for M1:

```text
directory/bootstrap-state.json
directory/bootstrap-state.previous.json
```

The constructor-supplied `directory` is the storage root; M1 does not implement `PathProfile` or platform default roots.

- [x] **Step 1: Refresh and exact-pin `write-file-atomic`**

```bash
pnpm view write-file-atomic@8 version engines peerDependencies --json
pnpm view write-file-atomic time --json
```

Choose the newest route-compatible eligible 8.x release, exact-pin it in the root Catalog, and add `write-file-atomic: "catalog:"` to `bootstrap-state` dependencies.

If the selected package lacks usable bundled TypeScript declarations, verify that fact from package metadata before taking action. Do not silently add an ungoverned companion package. A necessary type-only companion may be materialized only after its package identity is explicitly recorded under the same adopted role and Corpus inventory hashes are regenerated.

- [x] **Step 2: Write failing store tests**

Use real temporary directories. Required tests:

```text
empty directory -> EMPTY
commit revision 1 -> CURRENT revision 1
commit revision 2 -> current revision 2 and previous file preserves revision 1
candidate revision skips/repeats -> ProblemError with bootstrap.state.revision_conflict
corrupt current after two commits -> RECOVERED_PREVIOUS revision 1
corrupt current and previous -> CORRUPT
recovered previous can be followed by a valid next commit with revision previous + 1
```

The tests must corrupt bytes deliberately with `node:fs/promises.writeFile`; do not mock filesystem reads/writes for these behaviors.

- [x] **Step 3: Run RED**

```bash
pnpm exec vitest run --root packages/bootstrap-state src/store.test.ts
```

Expected: `FAIL` because `BootstrapStateStore` does not exist.

- [x] **Step 4: Implement `load()`**

Algorithm:

```text
if current absent and previous absent -> EMPTY
if current parses/validates -> CURRENT
if current invalid and previous valid -> RECOVERED_PREVIOUS + Problem(bootstrap.state.current_corrupt)
if current absent and previous valid -> RECOVERED_PREVIOUS + Problem(bootstrap.state.current_missing)
if neither candidate is valid -> CORRUPT + Problem(bootstrap.state.no_valid_revision)
```

Do not infer authority from file modification time.

- [x] **Step 5: Implement `commit()`**

Rules:

```text
EMPTY                   -> candidate.revision must equal 1
CURRENT(r)              -> candidate.revision must equal r + 1
RECOVERED_PREVIOUS(r)   -> candidate.revision must equal r + 1
CORRUPT                 -> reject normal commit; recovery must be explicit in a later Recovery milestone
```

Commit sequence:

```text
validate/seal candidate in memory
→ load currently authoritative valid revision
→ if a valid current/recovered revision exists, atomically write its exact canonical envelope to previous path
→ atomically write new sealed envelope to current path
→ reload current and verify the committed revision/digest
→ return committed envelope
```

Use `write-file-atomic` for the file-replacement mechanics. Do not claim this unit test proves Windows/macOS/Linux power-loss directory-flush semantics; that remains implementation qualification.

Use stable Problem code `bootstrap.state.revision_conflict` for revision mismatch.

- [x] **Step 6: Verify**

```bash
pnpm exec nx run bootstrap-state:test
pnpm exec nx run bootstrap-state:typecheck
pnpm exec nx run bootstrap-state:build
pnpm verify
```

Expected: all `PASS`.

- [ ] **Step 7: Commit**

```bash
git add packages/bootstrap-state pnpm-workspace.yaml pnpm-lock.yaml

git commit -m "feat: add recoverable BootstrapStateStore"
```

---

### Task 9: Implement per-BootId BootstrapJournal without creating a second Authority

**Files:**
- Create: `packages/bootstrap-state/src/journal.ts`
- Create: `packages/bootstrap-state/src/journal.test.ts`
- Modify: `packages/bootstrap-state/src/index.ts`

**Interfaces:**

```ts
export type BootId = UuidV7Id<"BootId">;
export type BootstrapActivityId = UuidV7Id<"ActivityId">;
export type BootstrapStageOutcome = "STARTED" | "SUCCEEDED" | "FAILED";

export interface BootstrapJournalCheckpointV1 {
  readonly schemaVersion: 1;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly attemptedBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly attemptedProductGeneration: ProductGenerationId;
  readonly stage: string;
  readonly at: string;
  readonly outcome: BootstrapStageOutcome;
  readonly problemCode?: string;
}

export class BootstrapJournal {
  constructor(directory: string);
  checkpoint(entry: BootstrapJournalCheckpointV1): Promise<void>;
  read(bootId: BootId): Promise<readonly BootstrapJournalCheckpointV1[]>;
}
```

Files are per boot:

```text
directory/bootstrap-journal/{BootId}.json
```

No shared `last.log`, no active/LKG decision, and no BootstrapState mutation API may exist in `BootstrapJournal`.

- [x] **Step 1: Write failing journal tests**

Required tests:

```text
Boot A and Boot B write different files
multiple checkpoints for one BootId preserve order
reading Boot A never returns Boot B checkpoints
journal checkpoint requires matching bootId in the selected journal file
journal code has no dependency on BootstrapStateStore mutation
```

Use explicit ISO-8601 UTC strings in test records; do not make tests depend on wall-clock time.

- [x] **Step 2: Run RED**

```bash
pnpm exec vitest run --root packages/bootstrap-state src/journal.test.ts
```

Expected: `FAIL` because `BootstrapJournal` does not exist.

- [x] **Step 3: Implement the journal**

Use `write-file-atomic` for each per-BootId snapshot update. Create the `bootstrap-journal/` directory lazily. Validate loaded JSON as an array of version-1 entries and fail with a canonical `ProblemError` on malformed existing journal bytes; do not silently truncate/correct them.

Stable Problem codes:

```text
bootstrap.journal.invalid_json
bootstrap.journal.invalid_entry
bootstrap.journal.boot_id_mismatch
```

`at` is a persisted `Instant` string supplied by the caller in M1; do not introduce `TimeService` yet.

- [x] **Step 4: Verify the authority separation**

Use a static source check in the test to ensure `journal.ts` does not import `./store.js` or expose `commit()`/`activate()` semantics. The point is not a permanent architecture heuristic; it is a focused M1 regression proving that this journal implementation cannot mutate BootstrapState authority.

- [x] **Step 5: Run package and repository verification**

```bash
pnpm exec nx run bootstrap-state:test
pnpm exec nx run bootstrap-state:typecheck
pnpm exec nx run bootstrap-state:build
pnpm verify
```

Expected: all `PASS`.

- [x] **Step 6: Commit**

```bash
git add packages/bootstrap-state

git commit -m "feat: add per-boot BootstrapJournal"
```

---

### Task 10: Close M1, verify the full workspace, and archive the plan

**Files:**
- Modify: `docs/plans/active/foundation/m1-development-spine.md`
- Move on successful completion: `docs/plans/active/foundation/m1-development-spine.md` → `docs/plans/completed/foundation/m1-development-spine.md`
- Modify: `docs/plans/README.md`
- Modify only if required by actual dependency materialization: `Architecture_Corpus/references/dependency-routing.json`, `Architecture_Corpus/manifest.json`, `Architecture_Corpus/SHA256SUMS.txt`

**Interfaces:**
- Produces: a completed M1 evidence record and a repository ready for M2 (`PathProfile` + bootstrap ownership) without implementing M2.

- [x] **Step 1: Verify there are no accidental out-of-scope dependencies**

Inspect:

```bash
pnpm list -r --depth -1
pnpm list -r --depth 0
```

The only new direct M1 packages beyond the Genesis toolchain should be the exact materializations required by the implemented code:

```text
repo-kit: execa
foundation-contracts: canonicalize, uuid
bootstrap-state: @heptalogos/foundation-contracts, typebox, ajv, write-file-atomic
```

plus `vitest` as package-local test tooling where declared. No PostgreSQL/DBOS/Cordis/Fastify/oclif/etc. may appear as a new direct dependency in M1.

- [x] **Step 2: Verify the Nx graph and all applicable targets**

```bash
pnpm exec nx show projects
pnpm exec nx graph --file=dist/m1-project-graph.html
pnpm lint
pnpm typecheck
pnpm tsc6
pnpm test
pnpm build
```

Expected: `PASS`. `bootstrap-state` must have an internal workspace edge to `foundation-contracts`; there must be no speculative future project.

The generated graph HTML is verification output, not an Authority document; do not commit it unless repository policy explicitly treats it as evidence.

- [x] **Step 3: Run every permanent gate**

```bash
node .agents/heptalogos/validate-skill-resources.mjs
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

Every command must be actually run. Record `PASS`, `FAIL`, `BLOCKED`, or `NOT_RUN` truthfully in the M1 plan execution record.

- [x] **Step 4: Run focused M1 behavioral evidence**

```bash
pnpm exec nx run repo-kit:test
pnpm exec nx run foundation-contracts:test
pnpm exec nx run bootstrap-state:test
```

Confirm the following observed properties in the plan record:

```text
argv preservation without shell parsing
pnpm shim invocation on current platform
same semantic JSON -> same canonical representation/digest
same payload + different digest domain -> different digest
UUIDv7 generated identity and digest-based content identity remain distinct
BootstrapState schema/digest validation is non-mutating
revision 1 -> revision 2 preserves previous valid state
corrupt latest -> previous valid revision recovered
both state files corrupt -> explicit CORRUPT
BootId journals remain isolated
```

If the current platform is not Windows, record the Windows-specific pnpm-shim claim as `NOT_RUN`, not `PASS`. Do not block M1 solely because Windows was not the current executor platform; the cross-platform runner remains implemented and the Windows regression can be rerun on Windows later.

- [x] **Step 5: Record explicitly unproven claims**

M1 completion record must preserve these as `NOT_RUN`:

```text
real filesystem power-loss durability on Windows/macOS/Linux
symlink/junction/reparse-point root hardening
bootstrap ownership/process exclusion
private PostgreSQL lifecycle
Host advisory lease and HostOwnershipFence
source-less/native product closure
service/headless qualification
```

Unit tests do not upgrade those claims.

- [x] **Step 6: Final plan self-check and status update**

Update the plan header to:

```text
Status: COMPLETED
```

Add an execution record containing:

```text
start HEAD
final HEAD before completion commit
exact new Catalog pins
current OS/platform
verification table
Windows subprocess status
remaining NOT_RUN/BLOCKED claims
```

Do not place historical execution details into `Architecture_Corpus/`.

### M1 execution record

| Item | Evidence |
| --- | --- |
| Start HEAD | `4470fee47af8d9d027788e37047141cb639600d9` (Genesis governance reset) |
| Final HEAD before completion commit | `0112b5c54f818d4e023ec324ce6e1d12c293aa8d` |
| Runtime/toolchain | Node `24.19.0`, pnpm `11.22.0`, TypeScript 7 `7.0.2`, Ubuntu `26.04` / Linux `x86_64` |
| Exact new Catalog pins | `execa 10.0.1`; `canonicalize 4.0.0`; `uuid 14.0.2`; `ajv 8.20.0`; `typebox 1.3.16`; `write-file-atomic 8.0.0` |
| New direct dependency identities | repo-kit: `execa`; foundation-contracts: `canonicalize`, `uuid`; bootstrap-state: workspace `@heptalogos/foundation-contracts`, `ajv`, `typebox`, `write-file-atomic` |
| Out-of-scope direct dependencies | PASS — no PostgreSQL, DBOS, Cordis, proper-lockfile, Fastify, oclif, AI, MCP, or speculative M2 package was materialized |
| Nx graph | PASS — `foundation-contracts`, `bootstrap-state`, `repo-kit`, `repository`; static edge `bootstrap-state → foundation-contracts`; no future product project |

#### Permanent verification

| Gate | Status |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| `node .agents/heptalogos/validate-skill-resources.mjs` | PASS |
| `pnpm check:corpus` | PASS |
| `pnpm check:repository` | PASS |
| `pnpm check:dependencies` | PASS |
| `pnpm check:boundaries` | PASS |
| `pnpm toolchain:check` | PASS |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm tsc6` | PASS |
| `pnpm test` | PASS |
| `pnpm build` | PASS |
| `pnpm verify` | PASS |

#### Focused M1 behavioral evidence

| Claim | Status | Evidence |
| --- | --- | --- |
| argv preservation without shell parsing | PASS | repo-kit process tests |
| pnpm shim invocation on current platform | PASS | repo-kit process tests on Linux |
| equivalent JSON has equivalent canonical bytes/digest | PASS | foundation-contracts tests |
| digest domain separation | PASS | foundation-contracts tests |
| UUIDv7 generated identity and digest content identity remain distinct | PASS | foundation-contracts tests |
| BootstrapState validation is non-mutating | PASS | codec tests with unknown fields/string revision |
| revision 1 → revision 2 preserves previous valid state | PASS | store tests |
| corrupt latest → previous valid revision recovered | PASS | store tests |
| both state files corrupt → explicit `CORRUPT` | PASS | store tests |
| BootId journals remain isolated | PASS | journal tests |
| Windows-specific pnpm shim behavior | NOT_RUN | current executor is Linux |

#### Claims intentionally not proven in M1

| Claim | Status |
| --- | --- |
| real filesystem power-loss durability on Windows/macOS/Linux | NOT_RUN |
| symlink/junction/reparse-point root hardening | NOT_RUN |
| bootstrap ownership/process exclusion | NOT_RUN |
| private PostgreSQL lifecycle | NOT_RUN |
| Host advisory lease and HostOwnershipFence | NOT_RUN |
| source-less/native product closure | NOT_RUN |
| service/headless qualification | NOT_RUN |

- [x] **Step 7: Move the plan to completed**

```bash
git mv docs/plans/active/foundation/m1-development-spine.md docs/plans/completed/foundation/m1-development-spine.md
```

Update `docs/plans/README.md` indexes so there is no active M1 entry after completion.

- [x] **Step 8: Final clean-tree verification**

```bash
pnpm verify
git diff --check
git status --short
```

Before committing, `git status --short` should contain only the expected M1 completion-record/index changes.

- [x] **Step 9: Commit M1 closure**

```bash
git add docs/plans

git commit -m "docs: close Foundation M1 development spine"
```

- [x] **Step 10: Stop**

Do not begin M2 in this execution. Report:

```text
M1 status
commits created
exact dependency pins added
Nx project graph summary
permanent verification results
platform-specific NOT_RUN/BLOCKED items
recommended next milestone: M2 PathProfile + bootstrap ownership
```

### Post-closure corrective record

The first closure record was audited before M2. The corrective scope remained
limited to verification integrity and runtime contract hardening; no M2
subsystem or future Foundation topology was introduced.

- The two generic repository Skills that had been added by the documentation
  organization change were copied to the user-level Codex Skill directory at
  `/home/arsvine/.codex/skills/` and removed from the repository. The local M1
  history was rewritten from the documentation commit so those repository Skill
  paths and the validator exclusion never occur in the current branch history.
- The Heptalogos validator again inventories every repository Skill directory;
  the Authority remains the original eight Heptalogos Skills.
- `repository:lint` now runs `eslint scripts`; the root project has no no-op
  lint/typecheck/test/build targets. Foundation packages export `dist` output,
  have real Nx-inferred `build` and `typecheck` targets, and use `tsc --build`
  with dependency-aware project references.
- Repository verification scripts consume `@heptalogos/repo-kit` through the
  actual workspace package dependency rather than reaching through a long
  source-relative path.
- Boundary workspace identity now comes from `repo-kit`'s pnpm workspace
  discovery rather than recursive manifest scanning.
- Persistent BootstrapState generation references are runtime-validated as
  lowercase SHA-256 content digests. BootId and ActivityId journal fields are
  validated as RFC 9562 UUIDv7 values, including before a journal filename is
  derived. Parser and schema failures expose stable bounded Problem details,
  not JSON/Ajv diagnostic text.

The corrective verification was rerun after `nx reset` and removal of all
package `dist`/`tsbuildinfo` output. `pnpm verify` passed; an independent clean
`pnpm build` ran both Foundation package builds and produced each package's
`dist/index.js` and `dist/index.d.ts`. Windows-specific subprocess behavior,
filesystem power-loss durability, and other platform/product claims listed
above remain `NOT_RUN`.

### Windows verification addendum (2026-08-21)

M1 was developed and verified on Ubuntu/Linux; this addendum records the
deferred Windows verification, executed on a native Windows 11 host. It covers
only claims that M1 actually built. No M2 subsystem was started.

| Item | Evidence |
| --- | --- |
| Host platform | Windows 11 / win32 |
| Runtime/toolchain | Node `24.19.0`, pnpm `11.22.0`, TypeScript 7 `7.0.2` (matches M1 pins) |
| Repository state | clean tree at `06061aacace63cdae9495eee1f02928ffab02b54` |
| `pnpm install --frozen-lockfile` | PASS |
| Full `pnpm verify` chain | PASS (agents, corpus, repository, dependencies, boundaries, toolchain, format, lint, typecheck, tsc6, test, build) |

#### Claim status changes

| Claim | Previous | Now | Evidence |
| --- | --- | --- | --- |
| Windows-specific pnpm shim behavior (`runPnpm()` resolves the `.cmd` shim via PATHEXT without shell construction) | NOT_RUN | PASS | `tools/repo-kit/test/process.test.mjs` executed on win32 |
| argv preservation without shell parsing (Windows host) | PASS (Linux only) | PASS | same suite rerun on win32 |

#### New Windows/platform coverage added

| Coverage | Scope | Evidence |
| --- | --- | --- |
| Environment variable and cwd propagation through `runProcess*` | cross-platform (previously untested) | `tools/repo-kit/test/process.test.mjs` |
| BootstrapState/Journal commit+load round-trip under a Unicode directory path | cross-platform | `packages/bootstrap-state/src/platform-behavior.test.ts` |
| Repeated atomic replacement of existing current/previous files across sequential commits r1→r5 (`write-file-atomic` rename-over-existing) | cross-platform | same file |
| Case-insensitive filename variant resolves to the same state authority | win32-gated (`it.runIf`) | same file |
| Store/Journal operation through a junctioned storage root with bytes landing in the target directory | win32-gated (`it.runIf`) | same file |

Test totals on Windows: foundation-contracts 10, bootstrap-state 27, repo-kit 5
— all PASS.

#### Claims that remain NOT_RUN

| Claim | Status | Reason |
| --- | --- | --- |
| Real filesystem power-loss durability on Windows/macOS/Linux | NOT_RUN | Requires real crash/power-loss qualification; unit tests must not claim it |
| True symlink/junction/reparse-point root hardening | NOT_RUN | Belongs to M2 PathProfile/bootstrap ownership; the junction traversal test proves operability, not hardening |
| POSIX shell argument behavior (`posix_quoting`) | NOT_RUN | Not runnable on this Windows host |
| POSIX symlink escape / macOS-Linux path behavior | NOT_RUN | Not runnable on this Windows host |

### POSIX coverage and CI projection addendum (2026-08-21, same day)

To make the deferred POSIX claims executable rather than permanently
host-bound, two follow-up changes were made. Neither flips any claim to `PASS`
by itself; both only make the evidence obtainable.

**POSIX-gated repository tests added**
(`packages/bootstrap-state/src/platform-behavior.test.ts`):

| Coverage | Gate | Status |
| --- | --- | --- |
| Store/Journal operation through a POSIX-symlinked storage root with bytes landing in the target directory | `it.runIf(process.platform !== "win32")` | NOT_RUN (no Linux/macOS execution yet) |
| State authority stays distinct from different-case decoy filenames on case-sensitive filesystems | `it.runIf(process.platform === "linux")` | NOT_RUN (no Linux execution yet) |

On the Windows host these run as explicit skips: 27 passed / 2 skipped.

**GitHub Actions verify workflow created**
(`.github/workflows/verify.yml`): a three-platform matrix
(ubuntu-latest / macos-latest / windows-latest) running
`pnpm install --frozen-lockfile` and the full `pnpm verify` chain. Per
Architecture Corpus §16.2 this workflow is an automation projection of the
locally runnable gates and is not their sole Authority; every gate remains
executable in-repo without CI. Action versions were refreshed from upstream
release feeds at authoring time rather than recalled from memory:

| Action | Pinned major | Verified latest release at authoring |
| --- | --- | --- |
| `actions/checkout` | v7 | v7.0.1 (2026-07-20) |
| `pnpm/action-setup` | v6 | v6.0.10 (2026-08-03); reads the exact pnpm version from `package.json#packageManager` |
| `actions/setup-node` | v7 | v7.0.0 (2026-07-14); reads Node from `.node-version`, caches the pnpm store |

The successor `pnpm/setup@v2` action was evaluated and deliberately not
adopted: it provisions Node through `pnpm runtime` and auto-runs installs,
which would move runtime provisioning away from the repository's exact-pin
authorities (`.node-version`, `engines`, lockfile). The classic
action-setup/setup-node pair keeps each version single-sourced from a
repository file.

First green runs of the matrix will constitute the execution evidence for the
POSIX items above; until then they remain truthfully `NOT_RUN`.

---

## Stop / Escalation Conditions

Stop and surface the conflict instead of improvising if any of the following occurs:

1. A required dependency's current package identity contradicts `dependency-routing.json` or its adopted route.
2. Current upstream engine/peer constraints make the adopted route unusable on the frozen Node/toolchain baseline.
3. A necessary change would add PostgreSQL, DBOS, Cordis, proper-lockfile, or another explicitly out-of-scope M2+ dependency.
4. A test reveals that the BootstrapState contract in S01/S15 is internally contradictory rather than merely under-specified at implementation-detail level.
5. Correct implementation would require weakening `skipLibCheck=false`, strict Catalog, dependency-route governance, non-mutating validation, or canonical digest domain separation.
6. Correct implementation would require destructive Git history changes or importing old repository source/tests.

Ordinary file organization, exact compatible patch selection, test fixture design, naming within the interfaces frozen by this plan, and non-authoritative documentation wording are not escalation conditions.

---

## M1 Acceptance Summary

M1 is complete only when all of the following are true:

- Plans are under `docs/plans/`; root no longer carries implementation-plan files.
- `GOTCHAS.md` and `PLAYBOOK.md` are indexes backed by organized detailed entries.
- `scripts/` is layered into permanent verification and phase-specific entrypoints; reusable mechanics have moved to `tools/repo-kit`.
- `check-toolchain` no longer hand-builds Windows `cmd.exe` command strings.
- `repo-kit` preserves argv structurally and can invoke the repository pnpm shim through Execa.
- Root verification covers all real Nx workspace projects rather than the retired Genesis smoke project.
- `foundation-contracts` provides canonical JSON, domain-separated SHA-256 digest, generated UUIDv7 identity, content-digest identity, and canonical `Problem` primitives.
- `bootstrap-state` validates and seals BootstrapState v1 without mutating inputs.
- BootstrapState revision writes preserve a previous valid revision and recover from corrupted latest state.
- BootstrapJournal is per-BootId and cannot act as BootstrapState authority.
- `pnpm verify` passes after all M1 code exists.
- Platform/product claims not actually exercised remain `NOT_RUN`.
- No M2+ subsystem has been started.
