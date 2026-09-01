# Bootstrap package group

## Role

Installation, bootstrap-state, private PostgreSQL, and Host authority form the process-ownership cluster. This directory is a container, not an npm package.

## Members

| Package                                                        | Owns                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [@heptalogos/bootstrap-state](./bootstrap-state/README.md)     | Versioned BootstrapState, journal values, codecs, and atomic stores.                |
| [@heptalogos/bootstrap-runtime](./bootstrap-runtime/README.md) | Bootstrap orchestration, Host admission, handoff, and bounded recovery composition. |
| [@heptalogos/private-postgres](./private-postgres/README.md)   | Private PostgreSQL process, identity, readiness, and shutdown mechanics.            |
| [@heptalogos/host-ownership](./host-ownership/README.md)       | Advisory lease, Host token, fence, and stale-owner rejection.                       |

## Authority and handoffs

BootstrapRuntime owns bootstrap meaning and hands normal authority to HostOwnership. PrivatePostgres supplies process mechanics; BootstrapState supplies crash-safe state. Data packages consume Host fencing for canonical mutation, and execution/runtime packages are composed by repository-level integration rather than owned by BootstrapRuntime production code.
