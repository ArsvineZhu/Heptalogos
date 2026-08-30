---
name: claim-verification
description: Use when recording or communicating an evidence claim about a provider, database, process restart, live protocol, native platform, cross-platform behavior, or source-less artifact.
---

# Claim Verification

## Claim first

Write the exact claim before selecting a test. Name the product behavior,
environment, provider/artifact, failure boundary, and current versus historical
scope. Select the weakest evidence level that actually proves that claim; do
not expand product scope merely to turn `NOT_RUN` into `PASS`.

## Evidence ladder

| Level                           | Proves                                                          | Does not prove                                                   |
| ------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Static/type contract            | Shape, import, and compile-time relationship                    | Runtime behavior or persistence                                  |
| Unit/property behavior          | Local deterministic invariant and edge vectors                  | Component composition, provider, process, or platform behavior   |
| Component integration           | Named owners compose in one process                             | Restart, external protocol, another OS, or source-less packaging |
| Real PostgreSQL                 | The exercised database transaction/constraint/listener behavior | Another database/provider, OS, crash boundary, or artifact       |
| Real provider/runtime           | The named provider behavior at the tested interface             | All providers, versions, OSs, or untested failure paths          |
| Real process kill/restart       | The named restart/recovery scenario in that environment         | Power loss, another platform, or broader durability              |
| Live external protocol/provider | The exercised live endpoint/protocol interaction                | Offline mocks, another endpoint, or cross-platform claims        |
| Native OS                       | The named behavior on the exercised operating system            | Other operating systems or shipping artifacts                    |
| Cross-platform matrix           | The listed platforms/scenarios                                  | Any unlisted platform, version, or failure class                 |
| Source-less/shipping artifact   | The tested artifact without source checkout assumptions         | Source-tree behavior or a different packaging mode               |
| Destructive backup/restore      | The exact backup/restore/update operation and recovery boundary | General durability, power loss, or untested backup formats       |

## Common false upgrades

- A mock PostgreSQL client is not real PostgreSQL.
- A unit test around a restart callback is not process kill/restart evidence.
- A Windows run is not macOS/Linux evidence, and a two-platform run is not all
  platforms.
- A source checkout run is not a source-less packaged artifact.
- A stored expected output is not replay verification unless the required
  deterministic stages actually rerun and match.
- A historical qualification record is not current-candidate evidence.

## Procedure

1. State the claim and acceptance boundary.
2. Identify required environment, provider, artifact, and scenario.
3. Find an existing scenario that exercises that exact boundary.
4. Run it without broadening the matrix for theoretical completeness.
5. Record actual environment, scope, and exact `PASS`, `FAIL`, `NOT_RUN`, or
   `BLOCKED` state.
6. Keep weaker evidence useful at its own level while refusing to upgrade it.

If the active plan requires a proof boundary it does not define, report
`PLAN_GAP`. If the boundary is merely deferred by current Horizon, record
`NOT_RUN` with the reason.

## Output

```text
Claim:
Acceptance boundary:
Required evidence level:
Scenario/provider/artifact:
Actual environment:
What the result proves:
What remains unproved:
Result: PASS | FAIL | NOT_RUN | BLOCKED
```

Read the [verification system](../../../project/qualification/verification-system.md)
and [Evidence Spec](../../../specs/execution/evidence.md).
