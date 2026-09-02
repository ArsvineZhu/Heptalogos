# Bootstrap Closure Contract

## Scope

This Spec defines the stable bootstrap and bounded recovery boundary that makes
normal Host execution possible before replaceable ProductGeneration code is
trusted.

## Ownership

Bootstrap/Recovery owns installation location, bootstrap metadata, bootstrap
ownership, private PostgreSQL bring-up, maintenance handoff, and bounded
recovery. `bootstrap-state` owns the typed state and journal primitives.

## Invariants

- `BOOT-001` Bootstrap Closure MUST remain outside the replaceable
  ProductGeneration dependency boundary and MUST be able to select a verified
  current or LKG generation.
- `BOOT-002` The ownership sequence MUST be bootstrap lock → private PostgreSQL
  → Host lease/fence/token → canonical initialization. Normal mutation and
  DBOS coordination MUST NOT begin before Host ownership is established.
- `BOOT-003` BootstrapState MUST be versioned canonical data with a monotonic
  revision, digest, active/LKG references, and required continuity identity.
- `BOOT-004` BootstrapJournal is a bounded per-BootId recovery projection. It
  MUST NOT become normal business truth or a second database.
- `BOOT-005` Normal Runtime exposure MUST wait for validated bootstrap state,
  current Host ownership, and continuity materialization.
- `BOOT-006` Recovery operations MUST be fixed, bounded, local, and
  AI-independent. They MUST NOT expose arbitrary shell or SQL authority.
- `BOOT-007` Unsupported PRE_PRODUCTION bootstrap shapes require clean-state
  reset or explicit bounded recovery; they are not compatibility inputs.

## Lifecycle

```text
InstallationAnchor
→ Bootstrap Closure
→ bootstrap ownership
→ private PostgreSQL
→ Host ownership handoff
→ canonical initialization
→ Host launch
```

## Failure Semantics

Corrupt, torn, unknown, or mismatched bootstrap metadata fails closed with a
structured recovery outcome. Bootstrap does not silently reinitialize an
unknown database or choose an arbitrary side of an epoch mismatch.

## References

- [`execution-model.md`](../../docs/architecture/execution-model.md)
- [`platform-distribution.md`](../../docs/architecture/platform-distribution.md)
- [`bootstrap-runtime`](../../packages/bootstrap/bootstrap-runtime/README.md)
- [`bootstrap-state`](../../packages/bootstrap/bootstrap-state/README.md)
