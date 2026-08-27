# Current-Tree Hygiene

This playbook operationalizes Corpus 26 for the current canonical/executable
repository. It keeps development chronology in Git and completed evidence while
ensuring that the checkout describes the system as it is now.

## Purpose

Use this playbook during every Hn-S stabilization and whenever a current
contract changes during `CompatibilityEpoch = PRE_PRODUCTION`.

```text
current executable identity = semantic role
development history = Git / completed plans / historical qualification
no declared compatibility obligation = rewrite/reset/reject/delete
```

## Surface classification

The hygiene gate scans current source, tests, fixtures, scripts, tooling,
configuration, workflow definitions, manifests, permanent verification, Skills,
and current agent instructions. It does not scan `docs/**`,
`docs/**`, lockfiles, dependencies, build output, coverage, temporary caches, or
generated artifacts excluded by the gate.

Historical documents may retain exact milestone/PR/session identifiers because
chronology is their purpose. They must not be copied back into executable
identity or used as current compatibility Authority.

## Sweep A: stage/provenance residue

Scan current file paths and contents for milestone, phase, PR, corrective-cycle,
session, and temporary-migration identity. Use boundary-aware patterns so
ordinary semantic words are not false positives. Rename resource names, test
labels, passwords, database names, temporary paths, and long-lived filenames to
current semantic roles. Do not retain aliases, duplicate files, symlinks, or
re-exports under the old identity.

## Sweep B: compatibility-history residue

Search implementation and test surfaces for legacy/obsolete/deprecated readers,
fallback parsers, upcasters, downcasters, bridge migrations, aliases, dual
readers/writers, and previous development-shape branches. Inspect behavior, not
just keywords. Keep current contract-version matching, strict unsupported-input
rejection, and the adopted compiler compatibility lane when they are current
semantics rather than historical product compatibility.

The sole current obligation owner is
`docs/governance/compatibility-obligations.json`. With an empty
PRE_PRODUCTION obligation list, project-history compatibility behavior must be
removed or rejected.

## Sweep C: dead phase/current-tree artifacts

For every one-time evidence file, phase script, generated acceptance artifact,
or current-tree archive, prove a current owner, current purpose, current
consumer, and semantic identity. If any is absent, delete it from the current
tree. Do not move it to `archive`, `.history`, `legacy`, or another current
directory; Git and completed plans preserve the history.

## Decision matrix

| Finding                                                                                            | Action                                                             |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Stage/PR/session token only affects name/path/test label                                           | Rename to semantic role; update all references; no alias           |
| Negative test describes an old dev shape but still proves current required-field/schema strictness | Reframe to current invariant; remove historical wording/data names |
| Negative test only duplicates generic unsupported-version/unknown-field coverage                   | Delete it                                                          |
| Reader/parser/writer/fallback actually accepts a previous dev shape                                | Delete old branch and update canonical tests; no shim              |
| Previous dev DB requires migration                                                                 | Rewrite/squash current baseline and rebuild dev/test DB            |
| One-time phase artifact has no current consumer                                                    | Delete; keep history in Git/completed plan                         |
| Artifact appears to have a current consumer but purpose is unclear                                 | `PLAN_GAP`; do not delete or preserve by guess                     |
| Evidence suggests a real external consumer/retained production state                               | `PLAN_GAP` + architecture review; do not invent an obligation      |

## Migration baseline rule

PRE_PRODUCTION development migrations are rewriteable. Keep one current
canonical baseline unless a current architecture-owned reason requires more
mechanics. Do not append migrations to preserve developer database chronology.
Reset/recreate project-owned development state after a canonical shape rewrite.

## Machine gate behavior

`pnpm check:hygiene` scans the declared current surfaces, rejects provenance and
high-signal historical compatibility residue, fails on closed phase artifacts,
and validates the empty PRE_PRODUCTION compatibility register. It has no generic
allowlist, baseline, inline suppression, or history-ignore mechanism. The three
gate implementation files are the only exact self-exemptions.

The gate is one permanent repository check and is wired into `pnpm verify` after
`check:repository`. A symlink or junction in a scanned canonical/executable
surface is reported as `symbolic-link-residue`; the scanner does not follow it
and provides no symlink allowlist. A skipped or blocked gate is not `PASS`.

## Hn-S zero-residue checklist

- [ ] `pnpm check:hygiene` passes on the final candidate.
- [ ] development provenance residue is zero in current executable surfaces.
- [ ] undeclared project-history compatibility residue is zero.
- [ ] closed-phase/current-tree archaeology residue is zero.
- [ ] the compatibility register is `PRE_PRODUCTION` with `obligations: []`.
- [ ] exactly one current canonical Foundation migration baseline remains.
- [ ] current evidence names the actual candidate and environment.
- [ ] Historical Evidence and Current Evidence remain distinct.

## Examples from Heptalogos

Use names such as `host-maintenance`, `private-postgres`,
`runtime-kernel-managed-host`, `execution-foundation`, and
`bootstrap-recovery`. These describe current operational roles; they do not
encode the milestone that introduced them.
