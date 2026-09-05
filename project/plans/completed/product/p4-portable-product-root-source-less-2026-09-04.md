# P4 — Portable Product Root / Source-less Product Reality — Completion Record

## Authorization and result

```yaml
plan: tmp/heptalogos-next-spec-pack-2026-09-04/P4-portable-product-root-source-less.md
baseline: 43821da4caaa8b0f77c2712494bd636c7306d0c2
executionDate: 2026-09-05
state: COMPLETED
result: PASS
bundleResult: PRODUCT_REALITY_CONVERGENCE_COMPLETED
```

P4 is the normal completion boundary for the continuous Product Reality
Convergence execution pack. The exact user-shaped portable Product root, not
the monorepo layout, was copied outside the repository and completed the
current Product scenario. No later stage, correction Plan, or approval gate is
created by this record.

## Implementation shape

The repository-owned assembler is:

```text
pnpm build
node scripts/package/assemble-portable-product.mjs \
  --target .\tmp\p4-portable-stage-20260905-final-10 \
  --node-root .\tmp\p4-node-extract-20260904\node-v24.20.0-win-x64 \
  --postgres-root .\tmp\pg\extracted\pgsql
```

JavaScript dependency closure is produced by pnpm's deploy mechanics with
`--legacy --config.node-linker=hoisted --prod --ignore-scripts`. The assembly
does not hand-merge a virtual store or carry workspace links. Workspace
packages declare their compiled `dist` release files, while the chosen pnpm
closure retains the transitive runtime files it needs. Runtime payloads use
the selected official Node distribution and the verified PostgreSQL server
closure (`bin`, `lib`, and `share`), with required licenses and a candidate
manifest.

The stable `bin\heptalogos.cmd` invokes the private Node runtime and the small
readable `portable-launcher.mjs`. The assembly manifest is deliberately
uninitialized: it contains no locator, absolute assembly-root identity, or
installation credential. On first start the launcher derives the current
portable root, creates the existing lifecycle-root locator with exclusive
identity materialization, allocates a free loopback PostgreSQL port, and passes
it to existing Bootstrap. A subsequent start at the same path reuses the
locator, identity, canonical data, and persisted port; it does not rebuild the
installation merely because the path is not the assembly path.

OpenClaw remains inside the Product Host dependency closure. The exact root
CLI package, `@openclaw/gateway-client`, `@openclaw/gateway-protocol`, and wire
protocol are checked separately; P4 does not assume those version axes are
identical without probing them.

## Exact candidate

```yaml
stagingRoot: C:\dev\Heptalogos\tmp\p4-portable-stage-20260905-final-10
qualificationRoot: C:\Users\Arsvine\AppData\Local\Temp\heptalogos-portable-product-20260905-final-acceptance-5
platform: Windows x64
productGeneration: aa2266e721df50cdc427d8e38e1630a1b659f25cc99c8766f5bb61b343893a4b
bootstrapGeneration: 8709e0d74b8e230517fede8596e92a555232949cb10a4ba79a3bac3153e6cb18
node: 24.20.0
postgres: 18.6
openclawRootPackage: 2026.9.1
openclawGatewayClientPackage: 2026.9.1
openclawGatewayProtocolPackage: 2026.9.1
openclawWireProtocol: 4
persistedPostgresPort: 41792
```

The copied root had zero reparse points, zero repository-path hits in its
JavaScript/JSON runtime files, and zero `workspace:` references in its direct
first-party runtime manifests. Its deployed first-party packages contained no
top-level `src` or `test` directories, and the private Node could import the
deployed OpenClaw protocol package and report wire version `4`. The initial
copied root had no `heptalogos.bootstrap.json`; that file was created only by
the first stable launch.

## Product scenario evidence

The first run was performed from the external root with a clean PATH that
exposed only Windows System32, with HOME set to the normal user profile. It
used the stable launcher, private Node, private PostgreSQL, the built Product
Host/CLI, and the local OpenClaw Subject runtime. The qualification helper
used one external working directory for the whole run and passed no registry
or workspace path to the product.

```text
stable launcher first start and private runtime boot                 PASS
first administrator claim and protected login                         PASS
Configuration definition/effective-value inspection                  PASS
gateway/SecretRef/model binding through Management                   PASS
Subject OpenClaw READY and isolated runtime                          PASS
NO_COMMUNICATION Reaction terminal state; no commit/outbound          PASS
COMMUNICATE → Review → CommunicationCommit → Expression → one outbound PASS
normal console Ctrl+C: Host/endpoint/PostgreSQL/OpenClaw shutdown     PASS
same-position restart with identity/data continuity                  PASS
post-restart Subject interaction to terminal state                   PASS
```

The final run materialized installation
`01a07071-3697-7754-b369-fd4e7fb98849`, instance
`01a07071-3697-72f6-a5ae-536bf5aee71d`, and Subject
`01a07071-6c33-7340-acd5-26df990c89f3`. The initial BootId was
`01a07071-3fa4-73a1-b679-304ac48dbd77`; the restart produced
`01a07073-f9b8-7184-ae55-aa6ea22ddcb1`, while keeping those identities and
reusing persisted PostgreSQL port `41792`. Both interactions were checked after their Reaction
and WorkItem terminal states; an HTTP `ACCEPTED` response was not used as
completion evidence.

The accepted communication carried OpenClaw `2026.9.1` / `subject` provenance
and terminal tool `heptalogos_propose_communication`. Canonical PostgreSQL
queries showed one CommunicationCommit (`01a07072-fea3-74c7-8674-d91f1d79fef1`)
and one outbound MessageFact (`01a07072-fedd-740e-a011-e650f82d6ee9`) linked
to that commit. The no-communication Reaction had no CommunicationCommit and
no outbound MessageFact. After each real console Ctrl+C, the endpoint
descriptor and PostgreSQL postmaster PID were absent and no product Node,
OpenClaw, or PostgreSQL process remained before the outer batch prompt was
answered. The `cmd.exe` wrapper's `Terminate batch job` confirmation is shell
behavior after Product Host shutdown, not a surviving Product resource.

An earlier development-only probe against a predecessor copy was interrupted
when its temporary loopback provider had been stopped by the surrounding
execution; that result is not used as acceptance evidence. The final copied
candidate was rerun with the provider alive and both initial and restart
scenarios completed PASS.

## Qualification boundary

```yaml
sourceLessPortableProductRoot: PASS
repositoryExternalCopiedArtifact: PASS
privateNodeForCandidate: PASS
privatePostgresForCandidate: PASS
subjectOpenClawBundledRuntimeForCandidate: PASS
productL4ScenarioFromCopiedRoot: PASS
otherOperatingSystems: NOT_RUN
otherArchitectures: NOT_RUN
systemServiceInstallation: NOT_RUN
installerOrUninstaller: NOT_RUN
serviceAccountAcl: NOT_RUN
codeSigningOrNotarization: NOT_RUN
tufUpdateOrRemoteRelease: NOT_RUN
hardwarePowerLoss: NOT_RUN
machineOperationsOpenClawDistribution: NOT_RUN
liveExternalProvider: NOT_RUN
```

The PASS claims apply only to this Windows x64 candidate and the local
loopback model fixture. They do not claim a live external provider, another OS,
an installed service, service-account permissions, signing, update security,
hardware recovery, or the separate Machine Operations OpenClaw role.
