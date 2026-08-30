---
name: documentation-maintenance
description: Use when implementation or governance work changes a standing fact, canonical document home, documentation topology, or current navigation.
---

# Documentation Maintenance

## Trigger

Load this Skill when a current fact, link, document class, README, INDEX, or
AGENTS responsibility changes.

## Required inputs

- audience and fact classification;
- canonical owner and affected projections;
- current versus historical scope;
- local navigation and validation entrypoints.

## Procedure

1. Classify the fact as architecture, spec, dependency, qualification,
   engineering procedure, future design, history, or duplicate-derived.
2. Update one canonical owner using the [documentation system](../../../docs/engineering/repository/documentation-system.md).
3. Update affected projections and links; update the relevant INDEX when
   navigation changes.
4. Keep README explanatory, INDEX navigational, and AGENTS persistent policy.
5. Preserve current-versus-history separation and exact evidence states.
6. Run `pnpm check:documentation` and any focused repository check.

## Stop / escalation

Use `PLAN_GAP` for contradictory current Authorities, missing semantic owner, or
an attempted compatibility stub for development history. Do not duplicate a
normative contract in a projection.

## Output

Report classification, canonical owner, projections/links updated, historical
treatment, and validation result.
