# Architecture

This directory is the current logical Architecture Corpus for Heptalogos. It
owns stable product boundaries, Foundation responsibilities, subsystem
contracts, and architecture reading paths. The physical location under
`docs/` is a repository topology choice; the Architecture Corpus remains a
logical Authority concept.

## Reading order

1. [Authority and core concepts](authority-and-core-concepts.md)
2. [System architecture](system-architecture.md)
3. [Execution model](execution-model.md)
4. [Extensions](extensions.md)
5. [Foundation services](foundation-services.md)
6. [Subject](subject.md)
7. [Messaging](messaging.md)
8. [AI runtime](ai-runtime.md)
9. [Management authority](management-authority.md)
10. [Data, evidence, and persistence](data-evidence-persistence.md)
11. [Backup, portability, update, and recovery](backup-portability-update-recovery.md)
12. [Platform and distribution](platform-distribution.md)
13. [Research subsystem integration](research-subsystem-integration.md)
14. [Management presentation](management-presentation.md)
15. [Configuration](configuration.md)
16. [Execution lineage](execution-lineage.md)
17. [Storage lifecycle](storage-lifecycle.md)

## Detailed contracts

The [contract index](contracts/) is the detailed Foundation contract surface.
Contract pages describe semantic ownership, invariants, lifecycle, and
failure/recovery behavior; they do not replace the higher-level architecture
pages.

- [Startup, recovery, and runtime supervision](contracts/startup-recovery-runtime-supervision.md)
- [Async work queue, durable execution, and time](contracts/async-work-queue-durable-time.md)
- [Persistence, transactions, and EffectFence](contracts/persistence-transactions-effect-fence.md)
- [Configuration, secrets, and management surface](contracts/configuration-secret-management-surface.md)
- [Policy, approval, management, and operator](contracts/policy-approval-management-operator.md)
- [Extension package trust and execution domain](contracts/extension-package-trust-execution-domain.md)
- [Messaging, Subject Chat, and drivers](contracts/messaging-subject-chat-drivers.md)
- [AI capability and MCP](contracts/ai-capability-mcp.md)
- [Reactor, context, prompt, and research integration](contracts/reactor-context-prompt-research-integration.md)
- [Evidence, replay, observability, and content](contracts/evidence-replay-observability-content.md)
- [Backup, update, distribution, and platform](contracts/backup-update-distribution-platform.md)
- [Verification, research, and evaluation](contracts/verification-research-evaluation.md)
- [Foundation service, capability, and readiness catalog](contracts/foundation-service-capability-readiness-catalog.md)
- [Canonical end-to-end flows](contracts/canonical-end-to-end-flows.md)
- [Foundation cross-cutting contracts](contracts/foundation-cross-cutting-contracts.md)
- [Execution lineage and observability](contracts/execution-lineage-observability.md)
- [Storage workspace and data lifecycle](contracts/storage-workspace-data-lifecycle.md)

## Boundaries

Foundation provides stable typed contracts and Authority boundaries. Mature
libraries and frameworks provide generic mechanics behind narrow adapters.
Advanced cognition, presentation technology, and future platform-specific
implementations remain outside Foundation scope unless an explicit current
owner exists.

Architecture pages are current-state documents. Qualification evidence belongs
under [`../qualification/`](../qualification/), dependency decisions under
[`../dependencies/`](../dependencies/), and implementation chronology under
[`../plans/`](../plans/).
