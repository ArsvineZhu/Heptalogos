# @heptalogos/subject

## Purpose

`subject` owns the persistent logical Subject authority and the bounded L4
conversation communication path: ConversationMailbox, Reaction acquisition,
the cognition proposal, deterministic Review, CommunicationCommit, Expression,
and expression-driven local reply materialization.

The current primary cognition proposal is supplied through the narrow
Product-composed `SubjectCognitionRuntime` port. Product Host implements that
port with one isolated OpenClaw `2026.9.1` public Gateway/client runtime and
two proposal-only typed tools. The adapter's process/profile/provider state is
not Subject canonical state; this package still owns the Subject semantics,
Review, and CommunicationCommit Authority. Expression remains on AIRuntime.

The durable record stores desired Subject state only. Current status is a
Subject-owned projection over that intent and current runtime/dependency facts;
there is no second durable `actualState` authority.

The independent Expression step consumes the active Subject-scoped
`subject.expression.v1` configuration revision. Its first materialized Product
default is `maxOutputTokens: 256`; the value is managed through the canonical
Configuration and Management path rather than a duplicate Expression literal.

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
