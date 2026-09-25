# 07 — ProductHost Composition and Verification Refactor

## 1. ProductHost composition policy

Keep `startProductHost()` as the visible composition root.

It may remain long when code is linear owner construction:

```text
Bootstrap
→ private PostgreSQL / Host ownership
→ Persistence
→ Execution/Lineage/Evidence
→ Configuration/Secret/Network/AIRuntime
→ Subject OpenClaw
→ Messaging/Subject
→ WorkQueue/DBOS
→ RuntimeKernel
→ Management
→ HTTP
```

Do not split this chain merely for line count.

## 2. Extract only independent policy/helpers

Authorized examples:

- Product-owned Configuration default materialization;
- ProductHost Management/runtime read projection;
- Subject OpenClaw projection/gateway mechanics (specified separately);
- shutdown/resource closure helper if it has a coherent lifecycle contract.

Do not create:

```text
ProductContainer
ServiceFactoryRegistry
DependencyInjectionModule
HostBuilder<T>
```

## 3. ProductHost integration test partition

Retain existing `integration/product-host/support/`.

Replace the single large test file with scenario-oriented files. Use this target
shape unless current test names make a slightly different split materially
clearer:

```text
integration/product-host/test/
  management-auth.integration.test.ts
  management-runtime.integration.test.ts
  management-ai-actions.integration.test.ts
  subject-chat.integration.test.ts
  subject-reentry.integration.test.ts
```

### management-auth

Own scenarios such as:

- first claim;
- replay rejection;
- login/session/logout;
- protected CLI/local credential behavior.

### management-runtime

Own:

- read models;
- stale endpoint replacement;
- Host credential/ACL fail-closed path;
- generated client discovery;
- HTTP Problem semantics / rate-limit projection.

### management-ai-actions

Own:

- ConfigurationRevision create/activate;
- GatewayProfile/ModelProfile/ModelBinding actions;
- restart/reconcile impact;
- actual consumer evidence.

### subject-chat

Own:

- Subject start/stop;
- normal inbound/outbound;
- NO_COMMUNICATION;
- Expression configuration consumption.

### subject-reentry

Own:

- stale prepared authority fence;
- stale proposal;
- child/runtime interruption;
- crash before primary proposal;
- crash after CommunicationCommit;
- outbound committed before WorkItem completion;
- restart identity/terminal convergence.

Do not require every scenario to create its own new fixture hierarchy. Reuse the
existing support modules.

## 4. Remove tests for deleted mechanics

Delete/replace assertions whose only purpose is:

- OpenClaw autonomous three-attempt recovery;
- exact source file structure;
- legacy packaging repair behavior;
- legacy Management optional-owner construction.

Keep semantic crash/re-entry proofs.

## 5. Narrow feedback loop

During implementation run only the affected scenario file or package test.

Examples:

```text
Management handler refactor
→ management unit + management-ai-actions integration

Subject owner refactor
→ Subject package tests + subject-chat / subject-reentry

OpenClaw adapter
→ subject-openclaw focused tests + subject-reentry

Packaging
→ package assembler focused probe
```

Run full `pnpm verify` once at the final integrated boundary unless a broad
change specifically needs an earlier whole-repo check.

## 6. Manual portable qualification

Add the separate manual target specified in `02-PORTABLE-PACKAGING-REWRITE.md`.

Do not hide it inside ordinary `test`.

The final target should make the old ad-hoc TEMP MJS orchestration unnecessary.

## 7. Verification output

Preserve the existing verification-output wrapper. Its noise reduction is an
intentional Agent-efficiency feature. Only correct it if it fails to preserve
exit/error semantics; do not remove it for purity.
