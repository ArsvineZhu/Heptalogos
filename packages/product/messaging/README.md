# @heptalogos/messaging

## Purpose

`messaging` owns the current built-in Subject Chat protocol and its canonical
conversation and `MessageFact` records. It keeps accepted inbound facts,
mailbox obligations supplied by Subject, and local outbound materialization on
the existing Host-fenced Persistence boundary.

## Current scope

- one logical platform: `heptalogos-subject-chat`;
- one Administrator account, one Subject account, and one direct conversation;
- text-only inbound, ordered canonical message facts, idempotent client message
  acceptance, opaque sequence cursors, and exactly-once local outbound facts.

Authentication remains owned by Management. Subject supplies the narrow
transaction-aware accepted-inbound callback; Messaging does not import Subject
or create a generic event system.

## Verification

Run the package unit tests, typecheck, and the Product Host local full-stack
qualification for real PostgreSQL, WorkQueue, DBOS, and HTTP evidence.

## Knowledge references

- [Messaging and Subject Chat Spec](../../../specs/messaging/messaging-subject-chat.md)
- [Persistent Subject L4 Plan](../../../project/plans/completed/product/persistent-subject-l4-vertical-slice-2026-09-04.md)
