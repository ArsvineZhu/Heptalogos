# `proper-lockfile` stale reclaim and bootstrap ownership

## Symptom and risk

`proper-lockfile@4.1.2` treats an old lock directory as reclaimable. Its stale path removes the directory and then retries acquisition. If two processes observe the same stale directory concurrently, one process can remove a directory that the other process has already recreated; both processes can then believe they own the lock.

## Upstream evidence

- The `v4.1.2` source uses atomic `mkdir` for normal acquisition, but `rmdir` followed by reacquisition for stale locks: <https://raw.githubusercontent.com/moxystudio/node-proper-lockfile/v4.1.2/lib/lockfile.js>.
- Upstream issue [#121](https://github.com/moxystudio/node-proper-lockfile/issues/121) remains open and describes the concurrent stale-reclaimer race.

## Heptalogos consequence

Automatic stale takeover is not a qualified pre-PostgreSQL Authority fence. The normal Host Authority remains the PostgreSQL advisory lease plus `HostOwnershipFence` and `HostOwnershipToken`; this lock only covers the bounded pre-PostgreSQL window.

## Supported M2 rule

The `bootstrap-runtime` adapter passes an effectively non-expiring stale duration, an explicit heartbeat interval, `retries: 0`, and a fixed lock directory. M2 does not expose a stale timeout or automatically reclaim an abandoned lock. An abandoned lock is `bootstrap.ownership.already_held` and requires a later bounded Recovery design.

## Regression evidence

`packages/bootstrap-runtime/src/bootstrap-ownership.test.ts` covers single-process state transitions, real cross-process exclusivity, compromised-lock fail-safe behavior, and an ownerless old lock that remains unreclaimed.

## Reopen trigger

Reopen this decision only with a proven upstream route or a bounded recovery algorithm that closes the stale-reclaimer race and has matching cross-platform evidence. Do not add a second lock provider or a manual lock-directory deletion shortcut.
