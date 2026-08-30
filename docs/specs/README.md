# Normative Specifications

## Purpose

`docs/specs/**` contains concise, current implementation contracts for
developers and Coding Agents. A Spec states the behavior that current code,
tests, and future implementations must share.

## Scope and admission

A Spec is admitted when at least one of these is true:

- it governs behavior already implemented;
- the current product Horizon requires implementations to conform to it; or
- a current durable or cross-boundary contract needs an exact normative
  definition.

Future design remains in Architecture or the Roadmap. A Spec does not authorize
implementation; an approved active plan does.

## Normative language

The uppercase terms `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` use
the normative meanings from RFC 2119 and RFC 8174 when, and only when, they
appear in uppercase in a requirement.

Explanatory prose is not automatically normative.

## Requirement IDs

Important requirements that need cross-artifact traceability use stable semantic
IDs in the form `<PREFIX>-NNN`, such as `WI-001` or `HOST-004`.

Prefixes identify the contract, not a Horizon, date, PR, session, or phase.
IDs remain stable while the requirement remains current. Do not number every
explanatory sentence. Plans and qualification records may reference IDs when
that improves traceability. Removed PRE_PRODUCTION requirements do not need
compatibility aliases or tombstone Specs.

Current requirement IDs and Spec prefixes are unique across `docs/specs/**`.

## Recommended structure

Use only headings that apply:

```text
# <Semantic Contract>

## Scope
## Ownership
## Invariants
## State Model
## Operations
## Lifecycle
## Failure Semantics
## Verification Claims
## References
```

Keep the document narrowly consumable. Do not place design history, provider
selection, qualification results, roadmap sequencing, PR/session history, or
implementation chronology in a Spec.

## Relationship to other authorities

Architecture explains conceptual design and rationale. Specs state exact
current contracts. Plans authorize changes. Code and tests implement and check
the contracts. Qualification records report observed evidence. Governance and
dependency documents constrain the relevant choices.

One fact has one canonical owner. Link to another owner instead of copying
normative prose into a derived view.
