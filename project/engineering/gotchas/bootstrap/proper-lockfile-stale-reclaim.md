# Bootstrap stale reclaim and bootstrap ownership

## Symptom and risk

`proper-lockfile@4.1.2` treats an old lock directory as reclaimable. Its stale path removes the directory and then retries acquisition. If two processes observe the same stale directory concurrently, one process can remove a directory that the other process has already recreated; both processes can then believe they own the lock.

## Upstream evidence

- The `v4.1.2` source uses atomic `mkdir` for normal acquisition, but `rmdir` followed by reacquisition for stale locks: <https://raw.githubusercontent.com/moxystudio/node-proper-lockfile/v4.1.2/lib/lockfile.js>.
- Upstream issue [#121](https://github.com/moxystudio/node-proper-lockfile/issues/121) remains open and describes the concurrent stale-reclaimer race.

## Historical provider failure

`proper-lockfile@4.1.2` is not a qualified pre-PostgreSQL Authority fence: the deterministic delayed-reclaimer probe reproduces issue #121. The normal Host Authority remains the PostgreSQL advisory lease plus `HostOwnershipFence` and `HostOwnershipToken`; the bootstrap lock only covers the bounded pre-PostgreSQL window.

The selected route is the `@bybrave/proper-lockfile2` 5.x package line; its
exact selection is owned by the pnpm Catalog. It claims a stale lock by
atomically renaming it to a unique path, verifies the claimed mtime, and
restores a changed lock rather than removing a winner's fresh lock. Its
required provider properties are recorded in `Q-BOOT-01`.

## Supported M2 rule

The normal `bootstrap-runtime` adapter passes an effectively non-expiring stale duration, an explicit heartbeat interval, `retries: 0`, and a fixed lock directory even with the selected provider. Normal boot does not reclaim an abandoned lock; recovery uses the same provider only after independent bounded abandonment proof. An observed normal lock is reported as `bootstrap.ownership.lock_present`.

## Regression evidence

`packages/bootstrap/bootstrap-runtime/test/unit/bootstrap-lock-provider.test.ts` covers the historical #121 failure, atomic delayed/double stale reclaim exclusion, active heartbeat protection, killed-owner reclaim notification, compromise fencing, and Unicode/space paths. `packages/bootstrap/bootstrap-runtime/test/unit/bootstrap-ownership.test.ts` covers the adapter's normal no-auto-reclaim and cross-process ownership behavior.

## Reopen trigger

Reopen this decision only with a proven blocker against `@bybrave/proper-lockfile2` or a bounded recovery algorithm that closes the stale-reclaimer race and has matching cross-platform evidence. Do not add a second lock provider or a manual lock-directory deletion shortcut.
