# Data package group

## Role

Canonical schema definition and Host-fenced PostgreSQL mutation mechanics. This directory is a container, not an npm package.

## Members

| Package                                                      | Owns                                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [@heptalogos/canonical-schema](./canonical-schema/README.md) | Current canonical schema meaning and initialization inputs.                |
| [@heptalogos/persistence](./persistence/README.md)           | PostgreSQL/Kysely repository and transaction boundaries with Host fencing. |

## Authority and handoffs

CanonicalSchema owns schema meaning; Persistence owns transaction mechanics and applies HostOwnership fencing. Bootstrap and execution owners use Persistence through semantic repository boundaries, while RuntimeKernel consumes only its allowed runtime-facing adapters.
