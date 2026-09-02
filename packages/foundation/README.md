# Foundation package group

## Role

Shared, low-level semantic vocabulary and provider-backed validation/time primitives used by higher Foundation owners. This directory is a container, not an npm package.

## Members

| Package                                                              | Owns                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [@heptalogos/foundation-contracts](./foundation-contracts/README.md) | Branded identities, canonical JSON/digests, lifecycle roots, and canonical Problems. |
| [@heptalogos/schema-runtime](./schema-runtime/README.md)             | TypeBox/Ajv schema compilation and validation mechanics.                             |
| [@heptalogos/time-service](./time-service/README.md)                 | Instant, monotonic duration, timezone, and clock-provider contracts.                 |

## Authority and handoffs

Foundation packages provide value contracts upward; they do not own Host, persistence, runtime, or product policy. `schema-runtime` owns schema mechanics, while domain packages own schema meaning. Bootstrap, data, runtime, and execution groups consume these contracts through canonical package exports.
