# PRE_PRODUCTION Evolution

This policy defines current shape, compatibility, cleanup, and completion rules
for the actively developed research system. It is not a milestone-closure
workflow or a release checklist.

## Current posture

```text
DevelopmentMode = RAPID_EVOLUTION
CompatibilityEpoch = PRE_PRODUCTION
```

Development history does not create compatibility obligations. The sole
machine-readable compatibility Authority is
[compatibility-obligations.json](compatibility-obligations.json). A versioned
current payload is not thereby historically compatible.

When no declared obligation exists, rewrite, reset, reject, or delete obsolete
current shapes. Do not add legacy readers, upcasters, aliases, shims, bridge
migrations, fallback formats, or dual writers/readers.

An approved low-cost future-facing semantic seam is not an obsolete shape merely
because its first consumer has not arrived. Expensive durable state, workers,
recovery protocols, schedulers, provider implementations, lifecycle machinery,
and generic frameworks need a current reason and an owner.

## Current truth and history

Current source, tests, fixtures, scripts, configuration, workflows, Skills,
AGENTS, and current documentation describe what the repository is now. They
must not use development milestone, PR, session, or corrective-cycle identity
as current semantics.

Git, completed or superseded Plans, and historical qualification/evidence
records preserve chronology. Do not add repository-history tombstones merely to
remember that a deleted artifact once existed. A product-domain tombstone is
different: it remains when the owning product contract requires one.

Current facts have one owner:

```text
product intent                 docs/product/**
architecture concepts          docs/architecture/**
current implementation Specs   specs/**
standing engineering policy    project/governance/**
dependency/provider decisions  project/dependencies/**
current development order      project/roadmap/**
active authorization            project/plans/active/**
executed evidence              project/qualification/**
```

## Focused cleanup

A stabilization or cleanup activity may be explicitly authorized by an active
Plan when it addresses an identified current maintenance burden. It is a
bounded activity, not a universal stage required before every horizon can
close. The Plan supplies its scope, owner, failure boundary, and proof.

Do not infer a closure verdict, review result, merge state, platform result,
provider result, or shipping claim from unrelated checks or historical records.
Evidence labels remain `PASS`, `FAIL`, `NOT_RUN`, and `BLOCKED`, and each
claim stays within the boundary that actually ran.

## Completion and reopen

When the authorized change and its acceptance conditions are complete, the
required executable/evidence proof is green, and no observed authorized blocker
remains, stop. A completed change does not authorize another hardening pass.

Reopen only for new current evidence, an accepted current-Horizon failure case,
a current consumer or invariant, or an explicit active-Plan requirement.
Imagined edge cases, generic future-proofing, and recovery-of-recovery do not
reopen work by default.
