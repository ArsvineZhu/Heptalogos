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

## Extracted runtime library closure

An extracted PostgreSQL runtime can contain `postgres`, `initdb`, `pg_ctl`,
`pg_controldata`, and `pg_isready` while still failing before startup because
the dynamic loader cannot resolve the matching `libpq.so.5`. PostgreSQL
executables being present does not mean the extracted runtime is self-contained.

For the Ubuntu 26.04 PostgreSQL 18.6 qualification, the matching `libpq5`
shared-library runtime was extracted into the ignored qualification scratch
area and exposed through `LD_LIBRARY_PATH`. That was sufficient for this live
Ubuntu qualification. It does not establish source-less shipping artifact
closure; source-less qualification must prove the complete transitive native
runtime closure supplied by the artifact.

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
These mechanics do not by themselves establish macOS real PostgreSQL,
source-less artifact, service-account ACL, or installed service/headless
qualification; those remain separate qualification properties.
