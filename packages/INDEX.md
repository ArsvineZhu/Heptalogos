# Package index

<!-- prettier-ignore -->
| Package | Semantic tags | Responsibility |
| --- | --- | --- |
| [@heptalogos/bootstrap-runtime](./bootstrap-runtime/README.md) | kind:product, area:bootstrap | bootstrap-runtime is the installation and recovery orchestration boundary that exists before and around the normal product Runtime. |
| [@heptalogos/bootstrap-state](./bootstrap-state/README.md) | kind:product, area:bootstrap | bootstrap-state stores the small, crash-safe state that must remain available before normal product PostgreSQL ownership is established a... |
| [@heptalogos/canonical-schema](./canonical-schema/README.md) | kind:product, area:data | canonical-schema materializes the current canonical PostgreSQL schema used by the Foundation persistence layer. |
| [@heptalogos/durable-execution](./durable-execution/README.md) | kind:product, area:execution | durable-execution is the bounded DBOS adapter boundary for Heptalogos durable execution. |
| [@heptalogos/evidence](./evidence/README.md) | kind:product, area:execution | evidence defines and stores retained Evidence records for Foundation operations. |
| [@heptalogos/execution-lineage](./execution-lineage/README.md) | kind:product, area:execution | execution-lineage carries the causal context that connects a Foundation operation to its originating Activity, Host handoff, and retained... |
| [@heptalogos/foundation-contracts](./foundation-contracts/README.md) | kind:product, area:shared | foundation-contracts is the low-level shared vocabulary for Foundation packages. |
| [@heptalogos/host-ownership](./host-ownership/README.md) | kind:product, area:bootstrap | host-ownership is the canonical authority for the Host ownership fence used by normal PostgreSQL runtime work. |
| [@heptalogos/persistence](./persistence/README.md) | kind:product, area:data | persistence is the normal Host-fenced PostgreSQL service used by Foundation components. |
| [@heptalogos/private-postgres](./private-postgres/README.md) | kind:product, area:bootstrap | private-postgres supplies the mechanics for an installation-owned PostgreSQL cluster used by Bootstrap and Host setup. |
| [@heptalogos/runtime-kernel](./runtime-kernel/README.md) | kind:product, area:runtime | runtime-kernel owns the Heptalogos Runtime semantics that compose MicroSystems, Services, Capabilities, generations, readiness, and lifec... |
| [@heptalogos/runtime-substrate](./runtime-substrate/README.md) | kind:product, area:runtime | runtime-substrate is the narrow adapter around Cordis that supplies generic activation-resource mechanics to the Heptalogos Runtime. |
| [@heptalogos/schema-runtime](./schema-runtime/README.md) | kind:product, area:shared | schema-runtime provides generic runtime schema compilation and validation mechanics used by Foundation contracts. |
| [@heptalogos/signal](./signal/README.md) | kind:product, area:service | signal provides the fixed PostgreSQL LISTEN/NOTIFY wakeup hint used to reduce latency between canonical commits and WorkQueue reconciliat... |
| [@heptalogos/time-service](./time-service/README.md) | kind:product, area:execution | time-service provides the time contract used by Foundation components that need monotonic elapsed measurements, wall-clock instants, time... |
| [@heptalogos/work-queue](./work-queue/README.md) | kind:product, area:work-queue | work-queue owns the canonical durable WorkItem contract and the reconciliation boundary that projects committed work into an execution en... |
