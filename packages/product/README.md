# Product packages

This group contains current Product semantic owners that compose on top of
Foundation mechanics:

- [`@heptalogos/messaging`](./messaging/README.md) owns the built-in
  Administrator to Subject Chat conversation and canonical MessageFact path.
- [`@heptalogos/subject`](./subject/README.md) owns persistent Subject
  authority and the bounded L4 Reaction to DecisionCommit to local reply path.

Messaging remains independent of Subject implementation. ProductHost supplies
the narrow composition callback needed for an accepted inbound fact and joins
both owners to the existing RuntimeKernel, WorkQueue, DBOS, and Fastify
surfaces.
