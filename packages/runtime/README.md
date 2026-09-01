# Runtime package group

## Role

In-process lifecycle mechanics and RuntimeKernel semantic reconciliation. This directory is a container, not an npm package.

## Members

| Package                                                        | Owns                                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [@heptalogos/runtime-substrate](./runtime-substrate/README.md) | Cordis-backed activation, scopes, disposal, and resource lifetime mechanics.                               |
| [@heptalogos/runtime-kernel](./runtime-kernel/README.md)       | MicroSystem, Service/Capability, Desired/Actual, readiness, reconciliation, and GenerationFence semantics. |

## Authority and handoffs

RuntimeSubstrate owns provider mechanics behind its contract; RuntimeKernel owns runtime semantic state and generation authority. Bootstrap supplies lifecycle ownership at composition boundaries, and WorkQueue consumes generation-bound handler leases without owning runtime lifecycle.
