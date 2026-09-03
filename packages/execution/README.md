# Execution package group

## Role

Lineage, evidence, wakeup hints, canonical durable work, DBOS dispatch, and external-effect uncertainty form the asynchronous execution chain. This directory is a container, not an npm package.

## Members

| Package                                                        | Owns                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [@heptalogos/execution-lineage](./execution-lineage/README.md) | Activity, ExecutionContext, causation, and restart handoff lineage.           |
| [@heptalogos/evidence](./evidence/README.md)                   | Retained evidence contracts and persistence-facing evidence values.           |
| [@heptalogos/signal](./signal/README.md)                       | PostgreSQL LISTEN/NOTIFY wakeup hints and reconnect/rescan behavior.          |
| [@heptalogos/work-queue](./work-queue/README.md)               | Canonical WorkItem state, CAS/revision fences, reconciliation, and fair scan. |
| [@heptalogos/durable-execution](./durable-execution/README.md) | DBOS workflow/queue adapter and durable attempt binding.                      |
| [@heptalogos/effect-operation](./effect-operation/README.md)   | Consequential external-effect state and uncertainty/reconciliation.           |

## Authority and handoffs

WorkQueue owns durable WorkItem truth; DurableExecution owns DBOS mechanics; Signal remains a hint; EffectOperation owns external-effect truth; Lineage and Evidence retain causal proof. Bootstrap and Runtime provide Host/generation authority, while repository-level `integration/foundation` composes the cross-group asynchronous execution spine.
