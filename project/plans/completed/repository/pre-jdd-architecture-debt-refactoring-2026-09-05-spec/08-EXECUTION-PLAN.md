# 08 — Fine-Grained Continuous Execution Plan

This is one continuous sequence. Checkpoints are for local reasoning and
commits, not human approval.

## S0 — Install authorization and reconcile current truth

### S0.1 Baseline

Assert current HEAD is based on:

```text
aee3c1059942e3b701c89513a5ef1df8eb1e2009
```

If the user has advanced the branch before execution, compare the intervening
diff. Continue when it does not materially supersede this Plan; otherwise
report PLAN_GAP only for conflicting semantics.

### S0.2 Install one active Plan

Place this bundle in the repository as one active Plan, using the repository's
current Plan organization. Do not create multiple active sub-Plans.

Recommended path:

```text
project/plans/active/pre-jdd-architecture-debt-refactoring/
```

with `11-ACTIVE-PLAN.md` as the single authorization entry and the remaining
files as required context.

If current Plan organization uses a different direct path by execution time,
follow the current repository convention without introducing a new Plan
framework.

### S0.3 Reconcile Plan index

Update `project/plans/INDEX.md`:

- completed P0–P4 Product Reality Convergence remains historical/completed;
- remove wording that calls the completed temporary pack the current continuous
  authorization;
- point Current Authorization to this Plan only.

Do not rewrite completed Plans.

### S0.4 Roadmap truth

Update only stale current facts caused by P4 completion/refactor:

- Windows source-less Product reality is now PASS based on the existing
  qualification record;
- other OS/source-less/service boundaries remain exactly truthful;
- do not rewrite roadmap architecture sections that this Plan does not change.

Proceed directly to S1.

---

## S1 — Portable packaging rewrite

### S1.1 Capture current behavior

Run the existing packaging path once only if needed to reproduce a specific
mechanic. Do not regenerate many acceptance candidates.

Record:

- source workspace before-state;
- command;
- target closure;
- why modern deploy replacement is required.

### S1.2 Modern deploy spike

Using pinned pnpm 11.24.0, build ProductHost and run modern deploy with
command-scoped `inject-workspace-packages=true`.

Use one OS TEMP target.

Check dependency resolution outside the source workspace.

### S1.3 Select the already-authorized path

- if direct modern deploy works, make it the sole implementation;
- if concrete direct behavior is insufficient, implement the disposable staging
  workspace route and make that the sole implementation.

Do not keep two runtime-selectable deployment modes.

### S1.4 Rewrite assembler

Delete legacy deployment/repair code. Retain:

- argument validation;
- private runtime validation/copy;
- Product root layout;
- launcher;
- manifest;
- license inventory;
- containment checks.

### S1.5 License inventory

Use `pnpm licenses list --prod --json` where applicable and make license
collection depend on the deployed closure, not source workspace internals.

### S1.6 Focused assembly proof

Run one package assembly and prove:

- source workspace unchanged;
- deployed Host executes with source workspace unavailable;
- no link escapes stage root;
- exact private runtime pins match.

Do not run full Product acceptance yet.

---

## S2 — Subject OpenClaw runtime refactor

### S2.1 Add ProductHost Execa dependency

Use catalog pin already owned by workspace.

### S2.2 Split projection

Move:

- config parsing;
- AI route snapshot;
- SecretRef projection;
- generated OpenClaw JSON;
- runtime fingerprint;
- runtime path derivation

to the projection module.

Apply cognition-config removal of `profile`.

### S2.3 Split Gateway/process adapter

Move:

- installed OpenClaw entry resolution;
- Execa child;
- readiness handshake;
- GatewayClient;
- tool catalog;
- run/event correlation;
- abort/wait;
- child close

to the Gateway module.

### S2.4 Replace direct child process

Remove `node:child_process` path and custom SIGTERM/wait/SIGKILL loop where
Execa owns the mechanic.

Use bounded Execa termination and descendant cleanup appropriate to pinned
Execa/platform behavior.

### S2.5 Fix embedding preset

- remove `--allow-unconfigured`;
- add `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`;
- retain the other three embedding env controls.

### S2.6 Fix secret transport

- Gateway token → `OPENCLAW_GATEWAY_TOKEN` env, no argv/plaintext config;
- model token → OpenClaw env SecretRef + child-only env;
- sanitize descriptor/error paths.

### S2.7 Delete recovery loop

Remove retry limit/timer/backoff state.

On unexpected exit, invalidate current live runtime and report truthful state.

### S2.8 Explicit replacement proof

Prove an explicit reconcile/Subject lifecycle action starts one new runtime
generation after a failed child.

### S2.9 Preserve proposal transport

Run focused public-Gateway proposal tests for both terminal tool paths.

Proceed directly to S3.

---

## S3 — Management SystemAction refactor

### S3.1 Split static contracts only where useful

Move SystemAction contract/catalog definitions out of the monolithic contracts
file if needed; preserve package-root exports.

### S3.2 Define internal action context/types

Create the small handler contract and common context.

### S3.3 Implement configuration family

Move normalization/preconditions/owners/impact/execute/verify for:

- revision.create;
- activate.

### S3.4 Implement secret family

Move the same concerns for:

- set;
- replace;
- revoke.

### S3.5 Implement AIRuntime family

Move:

- gateway-profile.set;
- model-profile.set;
- model-binding.set.

### S3.6 Implement Subject family

Move:

- subject.start;
- subject.stop.

Ensure current Subject-runtime reconcile behavior is explicit in this family or
the common facade, not hidden in a second action switch.

### S3.7 Build finite catalog

Map every current ProductSystemActionId exactly once.

### S3.8 Simplify Management facade

Remove action-specific switches from planning/execution lifecycle helpers.

The facade keeps:

- authentication/reauthentication;
- generic plan digest;
- precondition compare;
- handler lookup;
- Evidence/result envelope.

### S3.9 Remove legacy optional owner seams

Make current production owners required. Update unit fixtures.

### S3.10 Focused Management tests

Run unit catalog coverage and Management action integration scenarios.

Proceed directly to S4.

---

## S4 — Subject + Messaging refactor

### S4.1 Subject repository extraction

Move row types/codecs/SQL and pure persistence helpers.

### S4.2 Subject authority extraction

Move ensure/get/status/start/stop and prepared-inbound authority fencing.

### S4.3 Reaction executor extraction

Move Reaction acquisition/context/cognition/review/commit.

### S4.4 Communication executor extraction

Move CommunicationCommit recovery/Expression/outbound convergence.

### S4.5 Thin Subject facade

Compose the internal owners and preserve the current service surface/work
handler.

### S4.6 Provenance type correction

Make OpenClaw version runtime evidence string; no generic provider system.

### S4.7 Messaging repository extraction

Move SQL/row persistence mechanics.

### S4.8 Messaging cursor extraction

Move cursor codec/bounds.

### S4.9 Focused Subject/Messaging proof

Run package tests and Subject Chat normal/re-entry scenario files.

Proceed directly to S5.

---

## S5 — AIRuntime refactor

### S5.1 Repository extraction

Move profile/binding persistence.

### S5.2 Routing extraction

Move route resolution/readiness/NetworkAccess/Secret and commit-admissibility
logic.

### S5.3 Invocation extraction

Move AI SDK Chat/Responses provider construction and generation mechanics.

### S5.4 Thin facade

Compose current public AIRuntime service.

### S5.5 Focused AI proof

Run:

- Gateway/Profile/Binding tests;
- Chat/Responses protocol tests;
- readiness;
- structured output/failure mapping;
- Management AI action integration.

Proceed directly to S6.

---

## S6 — ProductHost composition and test refactor

### S6.1 Re-read host after owner refactors

Delete adapter glue that has become unnecessary.

### S6.2 Limited helper extraction

Extract only independent Product-private policy that still makes host
composition hard to reason about.

Do not create a container/framework.

### S6.3 Split ProductHost integration tests

Create scenario files defined in Spec 07 using existing support.

### S6.4 Delete obsolete mechanics tests

Delete tests for:

- legacy packaging repair;
- autonomous OpenClaw retry loop;
- Management legacy optional-owner path.

### S6.5 Add manual portable qualification target

Add Nx target and root script.

### S6.6 Narrow scenario runs

Run each affected scenario independently and repair actual regressions.

Proceed directly to S7.

---

## S7 — Integrated proof and current-truth closure

### S7.1 Static/current-tree audit

Search affected production code for obsolete patterns:

```text
pnpm deploy --legacy
node-linker=hoisted
preserveWorkspaceManifests
rewriteWorkspaceProtocols
subject OpenClaw direct node:child_process
SUBJECT_OPENCLAW_RESTART_LIMIT
recoveryAttempts / recoveryTimer for Subject OpenClaw
--allow-unconfigured
profile: "subject" inside managed cognition config
openclawVersion: "2026.9.1" literal type
legacy auth-only Management fixture seam
```

Expected result: no current production implementation dependence on these
deleted shapes.

Do not add this grep as a permanent repository gate.

### S7.2 Full repository verification

Run once:

```bash
pnpm verify
```

Use the existing output wrapper.

### S7.3 Real Windows portable qualification

Run:

```bash
pnpm qualify:portable
```

or the exact new target wrapper.

The real candidate must satisfy Spec 02.

### S7.4 Qualification record

Create/update the appropriate current qualification result with:

- exact commit;
- exact pnpm/Node/PostgreSQL/OpenClaw axes;
- exact candidate location;
- PASS/FAIL/NOT_RUN truth;
- source-workspace invariance result;
- normal/quiet communication result;
- shutdown;
- restart continuity.

Do not rewrite historical P4 evidence to pretend the new implementation existed
earlier.

### S7.5 Documentation current truth

Update only affected current owners:

- Product packaging/distribution docs;
- Subject/OpenClaw architecture if implementation mechanics wording changed;
- package READMEs;
- Management/AIRuntime/Subject/Messaging package docs;
- Roadmap qualification truth;
- Plan index.

Do not add development-history prose to canonical Architecture.

### S7.6 Complete Plan and STOP

Move/archive this Plan according to current repository convention, update index
to no active Plan, and STOP.

Do not begin Milky, Observation Window, Memory, or another cleanup pass.
