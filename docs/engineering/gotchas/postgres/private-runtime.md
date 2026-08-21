# Extracted private PostgreSQL runtimes need an explicit socket profile

## Trap

An extracted or unprivileged PostgreSQL 18 runtime can fail during `pg_ctl
start` even when `listen_addresses = '127.0.0.1'` and the persisted TCP port are
correct. PostgreSQL may still try to create its default Unix socket under
`/var/run/postgresql`, which may not exist or be writable outside a distro
service installation.

## Correct handling

The Heptalogos-owned private-cluster profile sets:

```text
unix_socket_directories = ''
```

The private lifecycle proves readiness through `pg_isready` on loopback TCP and
does not create or depend on an ambient system PostgreSQL socket directory. Do
not “fix” this qualification failure by creating a global service directory or
by switching to system/service discovery.

## Windows `pg_ctl` pipe inheritance

On the EDB PostgreSQL 18.6 Windows runtime, a `pg_ctl start` or `restart`
invocation can leave the server descendant holding inherited stdout/stderr
handles when the caller captures those streams. The process-control promise can
then remain open while the server is running, even though the server is ready.

Use ignored stdio for detached start/restart control and retain bounded output
capture for commands whose diagnostics are needed, such as stop and status
probes. This is a process-adapter concern; readiness still comes from the
explicit loopback `pg_isready` check.

## Related version-probe detail

Distro PostgreSQL tools may report an exact version with one parenthesized
package suffix, such as `18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)`. The toolchain
validator accepts that qualified form while still requiring every tool to agree
on exact version `18.6`.

## Evidence and scope

The Unix-socket behavior was reproduced with the extracted Ubuntu 18.6
qualification runtime. The Windows `pg_ctl` behavior was reproduced with the
explicit EDB 18.6 Windows x64 runtime. Both are covered by
`packages/private-postgres/src/controller.integration.test.ts` and
`packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts`.
This does not qualify corrected-candidate Linux/macOS parity, source-less
shipping, or service-account/installer ACLs; those remain separate
qualification properties.
