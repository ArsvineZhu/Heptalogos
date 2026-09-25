# @heptalogos/product-host

## Purpose

product-host is the first real headless Product Host executable. It composes
the existing Bootstrap, private PostgreSQL, Host Ownership, Persistence,
RuntimeKernel, Management, Messaging, and Subject services, then exposes the
canonical Management and Subject Chat contracts over one loopback HTTP
listener.

## Owns

- Build-time ProductGeneration and BootstrapRuntimeGeneration materialization;
  runtime imports the checked identities without repository scanning.
- Consumption of Bootstrap's `RuntimeLocations` contract for configuration,
  durable state, cache, and ephemeral run roots; Product runtime code does not
  infer installed resources from the repository or invocation cwd.
- The single Bootstrap-to-Host composition and terminal shutdown order.
- Management HTTP admission, discovery, claim/session routes, OpenAPI
  artifact, endpoint descriptor, and live first-claim publication/rotation.
- Installation-scoped `management.http.admission.v1` materialization and its
  bounded body-size and claim/login rate-limit consumer in the Fastify app.
- Product composition of the persistent Subject and Messaging owners with the
  existing DBOS, WorkQueue, Signal, AIRuntime, and lifecycle boundaries.
- Product-supervised Subject OpenClaw runtime process, isolated profile/state/
  workspace/configuration roots, public Gateway protocol/client lifecycle, and
  the bounded proposal-tool projection. Its projection, Gateway/Execa process
  adapter, and lifecycle facade are separate internal owners. OpenClaw remains
  replaceable mechanics; Subject and Review retain canonical authority.
- Subject Chat HTTP admission/read routes and their generated client artifact.
- A safe public handle limited to Product identity, loopback origin, abort
  signal, and terminal close.

## Does not own

- Bootstrap, PostgreSQL, Host fence, Persistence, or Runtime semantics.
- Bootstrap, PostgreSQL, Host fence, Persistence, Runtime, Subject, Messaging,
  gateway/model, and DBOS/WorkQueue semantic meaning.
- GUI/Presentation, the independent Machine Operations OpenClaw runtime, and
  future Product behavior.

## Verification

Check build identities and the ProductHost-owned OpenAPI artifact, then qualify
the built `heptalogos-host` process with the Product Host scenarios. The process
must run from a repository-external working directory, but that evidence is not
source-less release-form qualification.

The dedicated portable-product qualification is run with
`pnpm qualify:portable`. It is separate from the default test/verification
surface and currently proves only the Windows x64 boundary.

## Portable Product root (Windows x64)

The current portable profile is assembled by the repository-owned
`scripts/package/assemble-portable-product.mjs` command. The assembly carries
the private Node and PostgreSQL runtimes, the dependency-closed Product Host
and CLI application artifacts, the exact Subject OpenClaw packages, and the
license/manifest inventory. Nx builds and prunes those artifacts, and the
assembler reconciles each artifact lockfile and uses pnpm's hoisted production
linker inside the artifact before replacing the application payload in the
Product root. This keeps package resolution self-contained when the payload is
copied outside the workspace; it is not a runtime install. The assembler does
not copy or rebuild the source workspace. Development assembly is incremental: unchanged
application and private-runtime subtrees remain in place, while clean
qualification still starts from a fresh target outside the repository.

After copying the assembled root to its final location, use the stable
entrypoint from that location. The first `start` creates the bootstrap locator,
allocates a loopback PostgreSQL port, and materializes the existing lifecycle
roots. Later starts at the same location reuse the locator, InstallationId,
InstanceId, canonical data, and persisted port.

```text
bin\heptalogos.cmd start                 # foreground Product Host
bin\heptalogos.cmd status --json         # separate terminal
bin\heptalogos.cmd readiness --json
bin\heptalogos.cmd admin claim --password-stdin --json
bin\heptalogos.cmd auth login --password-stdin --json
bin\heptalogos.cmd action catalog --json
```

Claim and login passwords are entered through stdin or the protected prompt;
they are not command-line arguments. Stop the foreground Host with the real
console Ctrl+C. The separate Machine Operations OpenClaw runtime is not part
of this portable profile.

## Knowledge references

- [`Bootstrap closure Spec`](../../../specs/runtime/bootstrap-closure.md)
- [`Management Contract Spec`](../../../specs/management/system-authority.md)
- [`Management and Presentation Architecture`](../../../docs/architecture/management-presentation.md)
