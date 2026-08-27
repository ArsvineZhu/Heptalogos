# @heptalogos/evidence

## Purpose

`evidence` defines and stores retained Evidence records for Foundation
operations. It separates a typed Evidence draft from the persisted record and
provides the service that writes and reads those records through the normal
persistence boundary. Evidence makes qualification and operational claims
traceable without becoming a generic logging or telemetry replacement.

## Owns

- Evidence draft and record contracts.
- Evidence service construction and persistence integration.
- Retained Evidence semantics required by current Foundation flows.

## Does not own

- ExecutionContext or Activity identity and lineage propagation.
- Generic logging, metrics, traces, or telemetry transport.
- Arbitrary application persistence or product policy.
- Qualification closure decisions that belong to current evidence projections.

## Public surface

The package exports `EvidenceDraft`, `EvidenceRecord`, `EvidenceService`, and
`createEvidenceService`. The service uses the caller's persistence and time
contracts; callers should not write Evidence tables directly.

## Dependencies and boundaries

It depends on `foundation-contracts`, `persistence`, `time-service`, and Kysely.
Persistence remains the database mutation owner while this package owns the
Evidence semantic contract. Execution lineage can correlate a record, but it
does not become a second Evidence store or identity Authority.

## Change constraints

Use the persistence service and keep Evidence distinct from telemetry, Activity
lineage, and logs. Preserve sensitivity and retention semantics from shared
contracts. Match qualification claims to observed evidence and environment.

## Verification

Run `pnpm nx run evidence:test`, lint, typecheck, and the persistence-backed
Evidence scenarios. For evidence projection changes, run Corpus and
qualification-navigation checks and keep PASS/FAIL/NOT_RUN/BLOCKED claims
matched to actual runs.

## Architecture references

- [`S10 — Evidence、Replay、Observability 与 Content`](../../docs/architecture/contracts/evidence-replay-observability-content.md)
- [`S12 — 验证、研究与评估`](../../docs/architecture/contracts/verification-research-evaluation.md)
- [`S16 — Execution Lineage Observability`](../../docs/architecture/contracts/execution-lineage-observability.md)
- [`S03 — 持久化、事务与 EffectFence`](../../docs/architecture/contracts/persistence-transactions-effect-fence.md)
