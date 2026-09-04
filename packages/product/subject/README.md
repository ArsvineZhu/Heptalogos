# @heptalogos/subject

## Purpose

`subject` owns the persistent logical Subject authority and the bounded L4
conversation communication path: ConversationMailbox, Reaction acquisition,
the cognition proposal, deterministic Review, CommunicationCommit, Expression,
and expression-driven local reply materialization.

The durable record stores desired Subject state only. Current status is a
Subject-owned projection over that intent and current runtime/dependency facts;
there is no second durable `actualState` authority.

## Current scope

The package registers one generation-pinned `work.subject-reaction` handler.
The current path accepts an optional `NO_COMMUNICATION` or `COMMUNICATE`
proposal; the latter is reviewed into one CommunicationCommit before
Expression and the outbound MessageFact. `CommunicationCommit` owns the
accepted communication semantics, while Expression only realizes its bounded
human-facing text. This package does not define the total Subject behavior
space or a generic ActionPlan/Decision framework.

Persona, Memory, external IM, tools, proactive behavior, and advanced
observation/recovery machinery are outside this package's current plan.

## Knowledge references

- [Subject Base Spec](../../../specs/subject/subject-base.md)
- [Reaction and Communication Spec](../../../specs/subject/reaction-behavior.md)
- [Subject Communication Spine Plan](../../../project/plans/completed/product/p1-subject-communication-spine-correction-2026-09-04.md)
