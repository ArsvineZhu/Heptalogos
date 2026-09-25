# 09 — Acceptance and STOP

## 1. Acceptance philosophy

Success is reduced maintenance pressure with preserved Product semantics, not
minimum LOC.

A refactor may add files or some LOC where it reduces synchronization,
provider-upgrade burden, context load, or duplicated mechanics.

No acceptance item uses an arbitrary file-length threshold.

## 2. Mandatory semantic preservation

All must PASS:

- SubjectId continuity across Product restart;
- Subject desired-state authority revision fencing;
- canonical MessageFact before asynchronous Subject obligation;
- `NO_COMMUNICATION` terminal with no CommunicationCommit;
- `COMMUNICATE` accepted through deterministic Review;
- exactly one CommunicationCommit for accepted communication;
- Expression remains independent from primary cognition;
- outbound MessageFact linked to CommunicationCommit;
- stale authority/mailbox proposal rejected;
- CommunicationCommit re-entry does not re-run primary cognition;
- outbound-before-WorkItem-completion converges without duplicate outbound;
- SystemAction plan/execute precondition semantics remain current;
- Host ownership/Persistence/WorkQueue/Foundation semantics remain green.

## 3. Packaging acceptance

Required:

- pinned pnpm modern deployment route;
- no `--legacy`;
- no hoisted-node-linker workaround;
- no source workspace manifest rewrite;
- no source workspace repair install;
- no custom workspace-protocol dependency resolver;
- Product dependency closure contained in candidate;
- Product runs outside repository;
- private Node/PostgreSQL/OpenClaw are used;
- no global Node/PostgreSQL/OpenClaw/pnpm/npm runtime dependency;
- manifest/license inventory present;
- source workspace unchanged by packaging;
- normal shutdown cleans Product-owned children;
- same-position restart preserves InstallationId and SubjectId;
- Windows x64 source-less scenario PASS.

Other OS/platform/service claims remain NOT_RUN unless actually run.

## 4. OpenClaw acceptance

Required:

- ProductHost uses Execa for Subject OpenClaw process mechanics;
- no direct Subject OpenClaw `node:child_process`;
- normal local config, no `--allow-unconfigured`;
- all four embedding env controls present;
- Gateway token absent from argv and generated config;
- provider credential absent as plaintext generated config;
- provider credential uses supported SecretRef/env projection;
- no autonomous retry/backoff loop;
- unexpected child exit produces truthful non-ready state;
- explicit lifecycle/reconcile can create replacement;
- public Gateway handshake/tool/run/wait path remains PASS;
- no OpenClaw private state is treated as canonical Product state;
- committed communication survives primary child failure.

## 5. Management acceptance

Required:

- runtime action-specific behavior is co-located by action family;
- static action catalog and runtime handlers have exact current ID coverage;
- no duplicate handler ownership;
- Management facade no longer contains multiple synchronized action-specific
  lifecycle switches;
- production Product owners are required, not optional for legacy tests;
- normal HTTP/client/CLI Management action flow remains PASS.

No dynamic plugin action framework is added.

## 6. Subject/Messaging acceptance

Required:

- Subject SQL/row codecs live behind internal repository owner;
- Subject facade no longer owns full persistence+cognition+communication code;
- Reaction and Communication/Expression responsibilities are separated;
- Messaging SQL/row codecs extracted;
- Messaging cursor mechanics extracted;
- no generic repository framework;
- current public package semantics unchanged;
- cognition config no longer exposes fixed `profile`;
- OpenClaw patch version no longer literal TypeScript semantic identity.

## 7. AIRuntime acceptance

Required:

- persistence/routing/invocation are separate internal reasons-to-change;
- AI SDK provider objects stay inside invocation adapter;
- public AIRuntime contracts do not leak AI SDK objects;
- profile/binding CRUD and routing remain current;
- readiness/admissibility remain current;
- Chat and Responses current protocols remain green;
- no new retry framework/provider registry.

## 8. Verification acceptance

Required:

- ProductHost integration scenarios independently runnable;
- no production hook/DI introduced only for tests;
- manual portable qualification is a formal target;
- ad-hoc TEMP MJS scripts are not required for the normal qualification;
- final `pnpm verify` PASS;
- final Windows portable qualification PASS.

## 9. Explicitly forbidden end states

Reject completion if the implementation leaves any of:

```text
old + new packaging path
legacy + modern Management action runtime
old Subject monolith retained behind forwarding wrappers
new generic process framework plus Execa adapters
automatic OpenClaw retry loop merely renamed
source workspace repair after packaging
compatibility upcaster for pre-production cognition config
LOC/max-lines/JDD permanent gate
test-only production optional dependencies
```

PRE_PRODUCTION means replace the old shape.

## 10. STOP boundary

When all mandatory acceptance items are proven and current docs/qualification
truth is synchronized:

```text
PLAN COMPLETE
→ STOP
```

Do not automatically continue into:

- further repository-wide “cleanup”;
- another abstraction pass;
- new Product features;
- new dependency qualification unrelated to an observed blocker.

Future work starts from a new Rolling Wave decision.
