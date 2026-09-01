# Host Ownership Contract

## Scope

This Spec defines single-Host ownership and database mutation fencing for the
normal PostgreSQL runtime.

## Ownership

`host-ownership` owns the dedicated advisory lease, HostOwnershipFence, and
HostOwnershipToken. `persistence` applies the fence to normal canonical
mutations.

## Invariants

- `HOST-001` A normal Host MUST hold a dedicated PostgreSQL advisory lease and
  a current database HostOwnershipToken. Neither mechanism alone is sufficient.
- `HOST-002` Every normal canonical mutating transaction MUST hold the shared
  HostOwnershipFence for its transaction lifetime and MUST verify the local
  token before commit.
- `HOST-003` A new Host MUST publish its token under an exclusive fence that
  serializes already-entered mutations before the new token becomes current.
- `HOST-004` Lease loss, fence failure, or token mismatch MUST fence the old
  Host and stop new normal mutation admission. The old Host MUST return
  through Bootstrap Closure rather than reacquiring in place. Any independently
  owned effect contract must apply this fence at its own admission boundary.
- `HOST-005` HostOwnershipToken is a fencing identity, not an authentication
  credential.

## Failure Semantics

Stale transactions fail closed. A mutation that entered the shared fence before
ownership transfer MAY finish in the old-owner order; a new-owner token cannot
be published ahead of it.

## References

- [`authority-and-core-concepts.md`](../../docs/architecture/authority-and-core-concepts.md)
- [`execution-model.md`](../../docs/architecture/execution-model.md)
- [`host-ownership`](../../packages/bootstrap/host-ownership/README.md)
- [`persistence-transactions`](../data/persistence-transactions.md)
