# Sources Used for the Architectural Decisions

This file records the evidence basis used to make the Plan decision-complete.
It is not a new repository Authority.

## Repository baseline

Branch:

```text
feature/gateway-first-airuntime-external-integration-2026-09-03
```

Baseline:

```text
aee3c1059942e3b701c89513a5ef1df8eb1e2009
```

Key current files inspected:

```text
JDD.md  (executor File Library; higher-level methodology)
AGENTS.md
project/governance/project-charter.md
project/governance/constitution.md
project/governance/engineering-principles.md
project/dependencies/dependency-routing.json
project/plans/README.md
project/plans/INDEX.md
project/roadmap/development-roadmap.md

packages/product/subject/src/contracts.ts
packages/product/subject/src/service.ts
packages/product/messaging/src/service.ts
packages/system/management/src/contracts.ts
packages/system/management/src/service.ts
packages/system/ai-runtime/src/service.ts
packages/application/product-host/src/host.ts
packages/application/product-host/src/subject-openclaw.ts
packages/application/product-host/src/subject-openclaw-plugin.ts
packages/runtime/runtime-kernel/src/supervisor.ts
packages/bootstrap/private-postgres/src/controller.ts
packages/bootstrap/private-postgres/src/process-adapter.ts
packages/execution/durable-execution/src/provider/process.ts
packages/execution/work-queue/src/*
integration/product-host/test/product-host.integration.test.ts
integration/product-host/project.json
scripts/package/assemble-portable-product.mjs
pnpm-workspace.yaml
package.json

project/qualification/results/Q-SUBJECT-OPENCLAW-LOCAL-01.md
project/qualification/results/Q-SUBJECT-PORTABLE-WINDOWS-01.md
```

## pnpm

Official documentation:

- https://pnpm.io/cli/deploy
- https://pnpm.io/workspaces
- https://pnpm.io/settings
- https://pnpm.io/cli/licenses

Relevant current facts:

- `deploy` is intended to create an isolated portable target containing workspace
  and external dependencies;
- current modern deploy expects `inject-workspace-packages=true`;
- `--legacy` explicitly forces legacy behavior and disables the dedicated deploy
  lockfile behavior;
- workspace settings can be supplied from the command line;
- `injectWorkspacePackages` changes workspace dependencies from normal symlinking
  toward injected/hard-linked mechanics, which is why this Plan chooses a
  command-scoped deployment setting rather than globally changing developer
  install semantics;
- `pnpm licenses list --prod --json` is a supported metadata surface.

## OpenClaw

Official documentation:

- https://docs.openclaw.ai/gateway/embedding
- https://docs.openclaw.ai/gateway/secrets
- https://docs.openclaw.ai/cli/onboard

Relevant current facts:

- embedding host supervises installed `openclaw` executable;
- public Gateway WebSocket is the control plane;
- private OpenClaw state files are not an embedding API;
- useful embedding environment:
  `OPENCLAW_DISABLE_BONJOUR=1`,
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`,
  `OPENCLAW_NO_RESPAWN=1`,
  `OPENCLAW_SKIP_CHANNELS=1`;
- `--allow-unconfigured` only bypasses the local-mode guard and should be omitted
  when the host provisions normal local config;
- SecretRef can keep supported credential plaintext out of config;
- environment SecretRef shape is
  `{ source: "env", provider: "default", id: "..." }`;
- `OPENCLAW_GATEWAY_TOKEN` is a supported gateway auth input.

## Execa

Official/upstream documentation:

- https://github.com/sindresorhus/execa
- https://github.com/sindresorhus/execa/blob/main/docs/errors.md
- https://github.com/sindresorhus/execa/blob/main/docs/bash.md

Repository pin:

```text
execa 10.0.1
```

Relevant current capabilities include shell-free process execution, timeout,
cancellation/termination, bounded output/error semantics, cleanup, and current
descendant-termination mechanics. Existing Heptalogos PrivatePostgres and
DurableExecution adapters already use Execa.

## Methodology

JDD evidence used in this Plan:

- complexity needs justification, not ideological minimization;
- mature generic mechanics should be reused;
- existing code has no preservation privilege;
- PRE_PRODUCTION does not create compatibility obligation;
- tests must not create production architecture;
- slow/noisy/redundant verification is itself a current engineering problem when
  it repeatedly raises maintenance cost;
- once authorized work and proof are complete, STOP.
