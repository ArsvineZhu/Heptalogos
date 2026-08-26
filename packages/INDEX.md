# Package index

| Package                                                    | Semantic layer       | Responsibility                                                                       |
| ---------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| [`foundation-contracts`](./foundation-contracts/README.md) | shared contracts     | Shared IDs, Problems, digest, and semantic primitives                                |
| [`schema-runtime`](./schema-runtime/README.md)             | schema mechanics     | Generic runtime schema compilation and validation                                    |
| [`bootstrap-state`](./bootstrap-state/README.md)           | bootstrap/recovery   | Crash-safe bootstrap state and journals                                              |
| [`private-postgres`](./private-postgres/README.md)         | bootstrap/recovery   | Private PostgreSQL process and toolchain mechanics                                   |
| [`host-ownership`](./host-ownership/README.md)             | bootstrap/recovery   | Host lease, fence, and ownership token                                               |
| [`bootstrap-runtime`](./bootstrap-runtime/README.md)       | bootstrap/recovery   | Installation, recovery, Host handoff, and maintenance orchestration                  |
| [`canonical-schema`](./canonical-schema/README.md)         | canonical data       | Current PRE_PRODUCTION PostgreSQL schema baseline                                    |
| [`persistence`](./persistence/README.md)                   | canonical data       | Host-fenced normal PostgreSQL transactions and service                               |
| [`time-service`](./time-service/README.md)                 | execution foundation | Time abstraction and deterministic test time                                         |
| [`execution-lineage`](./execution-lineage/README.md)       | execution foundation | ExecutionContext and retained lineage                                                |
| [`evidence`](./evidence/README.md)                         | execution foundation | Retained Evidence contract and service                                               |
| [`signal`](./signal/README.md)                             | system services      | PostgreSQL LISTEN/NOTIFY wakeup hints and reconnect/rescan                           |
| [`work-queue`](./work-queue/README.md)                     | system services      | Canonical durable WorkItem contracts, reconciliation, and engine-neutral attempts    |
| [`runtime-substrate`](./runtime-substrate/README.md)       | runtime composition  | Cordis-backed activation and resource mechanics adapter                              |
| [`runtime-kernel`](./runtime-kernel/README.md)             | runtime composition  | Reconciliation, generations, Service/Capability lifecycle, readiness, and quiescence |
