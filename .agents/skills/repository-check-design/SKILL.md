---
name: repository-check-design
description: Use when designing or changing repository validators, check gates, topology checks, closed-set checks, generated consistency checks, migration assertions, or hygiene enforcement.
---

# Repository Check Design

Use this Skill before making a repository check permanent. First name the
claim, owner, current consumer, and proof boundary.

## Classify the check

Classify the proposal as one of:

- STANDING_INVARIANT: a property that must always hold, such as every current
  Skill directory having a valid SKILL.md.
- SEMANTIC_CLOSED_SET: a deliberately finite semantic domain, such as the
  allowed verification states.
- DISCOVERABLE_CURRENT_SET: evolving members such as current packages, Specs,
  Skills, or top-level responsibility roots.
- DERIVED_PROJECTION: a narrow source/projection consistency relationship.
- MIGRATION_ASSERTION: a one-time transition condition.
- HEURISTIC_HYGIENE: useful qualitative guidance that should not become a
  universal false-precision gate.

## Design rules

Permanent enforcement is appropriate for standing invariants and legitimate
semantic closed sets. Discover current members through repository discovery;
never encode a snapshot allow-list merely to make future evolution require a
validator edit. Validate a derived projection only at the structural level
actually required; human navigation prose need not equal generated prose.

Migration assertions leave permanent tooling only when they independently
express a current standing invariant. Deleted historical identities are not
tombstones. Heuristic size, prose, count, and taxonomy preferences are review
signals, not automatic failures.

For topology, require designed entrypoints and navigation coverage for current
maintained roots while ignoring generic transient/build/cache roots. For
knowledge planes, validate current links, entrypoints, Spec indexing and
requirement IDs, and canonical machine Authority paths.

## Test and output

Test the validator with a minimal positive fixture and boundary pairs:
discoverable additions, legitimate closed-set violations, stale projections,
deleted migration artifacts, and broken current links. A fixture proves the
validator behavior only; it does not prove a live provider or product claim.

Record:

Check claim:
Classification:
Canonical owner:
Current set or closed-set reason:
Permanent invariant:
False-positive risk:
Migration end state:
Focused verification:

If the check would become a meta-framework, registry, DSL, fixed inventory, or
historical tombstone without repeated current need, choose DIRECT_LOCAL or
DEFER and return to the original task.
