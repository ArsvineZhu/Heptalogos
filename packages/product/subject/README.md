# @heptalogos/subject

## Purpose

`subject` owns the persistent logical Subject authority and the bounded L4
reaction path: ConversationMailbox, Reaction acquisition, BehaviorIntent,
deterministic Review, immutable DecisionCommit, CommunicationCommit, and
expression-driven local reply materialization.

The durable record stores desired Subject state only. Current status is a
Subject-owned projection over that intent and current runtime/dependency facts;
there is no second durable `actualState` authority.

## Current scope

The package registers one generation-pinned `work.subject-reaction` handler.
The handler re-reads canonical MessageFact state, invokes the configured
`subject.primary` and `subject.expression` AIRuntime bindings, fences commits
against current Subject and AIRuntime generations, and resumes from existing
Decision/Communication/outbound facts without making a second primary decision.

Persona, Memory, external IM, tools, proactive behavior, and advanced
observation/recovery machinery are outside this package's current plan.

## Knowledge references

- [Subject Base Spec](../../../specs/subject/subject-base.md)
- [Reaction Behavior Spec](../../../specs/subject/reaction-behavior.md)
- [Persistent Subject L4 Plan](../../../project/plans/completed/product/persistent-subject-l4-vertical-slice-2026-09-04.md)
