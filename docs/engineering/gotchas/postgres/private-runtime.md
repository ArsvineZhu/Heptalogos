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

## Related version-probe detail

Distro PostgreSQL tools may report an exact version with one parenthesized
package suffix, such as `18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)`. The toolchain
validator accepts that qualified form while still requiring every tool to agree
on exact version `18.6`.

## Evidence and scope

The behavior was reproduced with the extracted Ubuntu 18.6 qualification
runtime and is covered by
`packages/private-postgres/src/controller.integration.test.ts` and
`packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts`.
This does not qualify Windows/macOS behavior, source-less shipping, or service
account/installer ACLs; those remain separate qualification properties.
