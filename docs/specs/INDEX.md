# Spec index

| Prefix    | Spec                                                                         | Purpose                                                             |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ID`      | [Identity and generation](./core/identity-generation.md)                     | Stable names, generated identities, and content generations         |
| `READY`   | [Service, capability, and readiness](./core/service-capability-readiness.md) | Service/capability ownership, binding, and readiness semantics      |
| `VER`     | [Contract versioning](./core/contract-versioning.md)                         | Versioned durable and cross-boundary contract rules                 |
| `BOOT`    | [Bootstrap closure](./runtime/bootstrap-closure.md)                          | Bootstrap ownership, state, handoff, and bounded recovery           |
| `HOST`    | [Host ownership](./runtime/host-ownership.md)                                | Lease, database fence, and mutation ownership                       |
| `RT`      | [Runtime supervision](./runtime/runtime-supervision.md)                      | Runtime reconciliation, lifecycle, and generation fencing           |
| `MAINT`   | [Maintenance handoff](./runtime/maintenance-handoff.md)                      | Bounded maintenance entry, point of no return, and recovery handoff |
| `WI`      | [Work Item](./execution/work-item.md)                                        | Canonical durable processing obligations                            |
| `DEX`     | [Durable dispatch](./execution/durable-dispatch.md)                          | Static DBOS dispatch and attempt fencing                            |
| `WH`      | [Work handler](./execution/work-handler.md)                                  | Generation-bound handler invocation contract                        |
| `SIG`     | [Signal](./execution/signal.md)                                              | Best-effort wakeup and canonical rescan                             |
| `TIME`    | [Time](./execution/time.md)                                                  | Instant, elapsed, local-time, and clock-change semantics            |
| `LIN`     | [Execution lineage](./execution/execution-lineage.md)                        | Semantic Activity and causal lineage                                |
| `EVID`    | [Evidence](./execution/evidence.md)                                          | Durable product evidence and replay boundary                        |
| `PERSIST` | [Persistence transactions](./data/persistence-transactions.md)               | Host-fenced canonical mutation and transaction rules                |
| `SCHEMA`  | [Canonical schema](./data/canonical-schema.md)                               | Current schema ownership and validation boundary                    |
