# Post-H2 Current Authority Hygiene

Status: `COMPLETED`

## Purpose

Repair current-truth, provenance, and terminology drift exposed after the H2
closure and Ubuntu residual qualification lanes. This is a maintenance-only
plan. It does not reopen H2, advance H3 implementation, or alter runtime,
schema, dependency, packaging, or qualification semantics.

## Locked current state

```yaml
H2: CLOSED
H3: ELIGIBLE
H3_implementation: HOLD
milestone_authority: Roadmap + Architecture_Corpus/qualification/results/qualification-status.json
```

`Q-BOOT-01.md` is a qualification record, not a competing milestone-state
ledger. Its historical candidate snapshots remain evidence, while its current
section reports only current qualification properties.

The same current/history rule applies to the directly affected
`Q-PRIVATE-POSTGRES-01.md` qualification projection and to the completed H1
stabilization specification, which is currently mislabeled as an active
approved implementation spec.

## Locked decisions

1. Reclassify the stale top section of `Q-BOOT-01.md` as a historical H1-S
   candidate snapshot. Preserve its historical statuses and candidate identity;
   do not rewrite them as current facts.
2. Keep current milestone truth only in the living Roadmap and the machine-
   readable qualification ledger. Do not add an H3 plan or implementation.
3. The ledger's `runMetadata` value has no current consumer or semantic owner;
   remove the dangling field rather than create `run-metadata/latest.json`.
   Refresh `recordedAt` after the current evidence edits so it records this
   ledger revision.
4. Rename only current qualification projection keys that carry development
   history identity. Historical records retain their original names and
   values. The current unsupported-shape properties use neutral semantic names;
   no legacy reader, compatibility path, or package test rewrite is permitted.
5. Rewrite current GOTCHA wording around qualification boundaries and record the
   extracted PostgreSQL shared-library closure trap. The qualification setup
   is not evidence of source-less artifact closure.
6. Reclassify the completed H1 stabilization specification as historical
   implementation guidance and keep its old milestone facts and property
   labels as historical context. Remove its current-facing status/prose; do not
   alter implementation or compatibility behavior.

## Authorized paths

```text
docs/roadmap/development-roadmap.md
Architecture_Corpus/qualification/results/Q-BOOT-01.md
Architecture_Corpus/qualification/results/Q-PRIVATE-POSTGRES-01.md
Architecture_Corpus/qualification/results/qualification-status.json
docs/engineering/gotchas/postgres/private-runtime.md
docs/engineering/specs/h1-stabilization-foundation-authority-reset.md
docs/plans/active/post-h2-current-authority-hygiene.md
docs/plans/completed/post-h2-current-authority-hygiene.md
docs/plans/README.md
```

No package, tool, script, workflow, dependency, canonical schema, runtime, H3,
compatibility, or unrelated historical qualification file may be changed.
The two newly authorized files are direct current documentation projections
identified by the targeted audit; their historical facts must remain intact.

## Required edits

- Make the Roadmap date/baseline and current product-qualification prose agree
  with the already-merged Ubuntu evidence while preserving `H2: CLOSED` and
  `H3: ELIGIBLE`.
- Separate the historical and current portions of `Q-BOOT-01.md`; current
  evidence must show Linux/Ubuntu real PostgreSQL recovery as `PASS` and retain
  remaining unrun boundaries as `NOT_RUN`.
- Separate the historical and current portions of `Q-PRIVATE-POSTGRES-01.md`;
  its current projection must show Linux/Ubuntu and Windows real PostgreSQL as
  `PASS` and retain macOS/source-less/service/ACL/power-loss boundaries as
  `NOT_RUN`.
- Remove the dangling ledger provenance reference, neutralize current
  development-history property names, and refresh ledger freshness metadata.
- Remove `corrected-candidate` from the current GOTCHA and document that
  PostgreSQL executables can require the matching `libpq` runtime closure.
- Mark the completed H1 stabilization specification as historical and ensure
  its status/prose no longer presents development-history names as current
  identifiers.
- Update `docs/plans/README.md` while this plan is active, then move this plan to
  `docs/plans/completed/` after all acceptance gates pass.

## Acceptance

```text
Q-BOOT current/historical ambiguity           0
Roadmap stale Ubuntu wording                  0
Roadmap stale baseline                        0
qualification-status dangling current ref     0
qualification-status freshness metadata       coherent
current GOTCHA candidate-history terminology  0
current negative-test provenance naming       0
```

Targeted hits for `Current H1-S candidate`, `corrected-candidate`,
`legacy_preproduction`, `later Ubuntu qualification`,
`run-metadata/latest.json`, `H1: OPEN`, and `H2: NOT_ELIGIBLE` must be
classified as current or historical. Historical evidence may retain its facts;
current surfaces must be corrected and no ambiguous hit may remain.

Run all required local gates:

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:hygiene
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check
pnpm format:check
pnpm verify
```

This plan is documentation/evidence-only. It does not require H2 Independent
Review, final three-platform CI, or any H3 qualification.

## Execution record

```yaml
currentTruthEdits: PASS
targetedAudit: PASS
requiredGates: PASS
planClosure: PASS
```
