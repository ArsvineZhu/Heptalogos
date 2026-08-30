# Heptalogos Repository Genesis

**Status: COMPLETE**

This repository is a clean-room root-only project. `Architecture_Corpus/` is the
only architecture authority. `C:\dev\Heptalogos_Archived` and
`D:\Users\Arsvine\Downloads\Heptalogos_Architecture_Corpus\pilot` were read-only
references; no source, package topology, lockfile, generated artifact, or
qualification result was imported.

## Authority and policy decisions

- Root `AGENTS.md` remains the always-on policy. The intentionally deleted
  `Architecture_Corpus/AGENTS.md` was removed from the Corpus manifest and
  `SHA256SUMS.txt`; no replacement was restored.
- Retained as fresh policy: LF text normalization, editor defaults, focused
  ignore rules, npm registry defaults, Prettier, and ESLint 10 with
  `typescript-eslint` 8.
- Archived `.gitattributes` and `.editorconfig` rules remain valid; the old
  `.gitignore` and `.prettierignore` were reduced to clean-room/toolchain
  outputs, and `.npmrc` was recreated without credentials or old topology.
- Archived `.oxlintrc.json` was rejected because the current Corpus toolchain
  lane makes ESLint the lint authority; no Oxlint dependency or configuration
  is introduced.
- Rejected archived Oxlint policy and all topology-specific assumptions.
- Adopted from the pilot only as configuration evidence: root-only pnpm
  workspace, strict catalogs, pnpm's default isolated linker, Node 24, pnpm 11,
  Nx 23, the TypeScript 7/TS6 side-by-side compiler lane, and the minimal
  Vitest lane.
- Nx's official `@nx/js/typescript` plugin owns inferred TypeScript 7
  `build`/`typecheck` tasks. The compatibility `tsc6` target remains an
  isolated direct compiler lane; no custom TypeScript launcher wrapper remains.
- pnpm peer/engine and release-age policy is explicit: strict peer and engine
  checks are enabled, `minimumReleaseAge` is pinned to 1440 minutes, and the
  two version-specific native-binding exceptions are retained.
- Rejected pilot qualification dependencies, binary allowlists, result
  overlays, `node_modules`, its lockfile, and product/runtime dependencies.
- pnpm 11 generated the two Rolldown native-binding entries in
  `minimumReleaseAgeExclude` during fresh resolution because this machine's
  active release-age policy rejects those newly published lockfile entries.
  They are the minimal install-policy exceptions required by the frozen gate;
  the pilot's larger exclusion set was not copied.
- `Architecture_Corpus/references/dependency-routing.json` is the sole
  external package-identity authority. Each route now declares exact
  `packages`; `persistence.postgres` intentionally declares `[]`, while
  `persistence.pg-driver` declares `pg`. `prettier` is listed separately as
  repository tooling. No package-to-role map is maintained under `scripts/`.

## Environment baseline

| Check                               | Status | Evidence                                                                                                                                |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Node                                | PASS   | `node --version` resolves `v24.19.0`                                                                                                    |
| Corepack pnpm                       | PASS   | Corepack resolves `pnpm@11.22.0`                                                                                                        |
| User-scoped bare pnpm               | PASS   | PNPM_HOME shim precedes the retained 11.8.0 npm shim and resolves 11.22.0                                                               |
| Corepack default policy             | PASS   | User `COREPACK_DEFAULT_TO_LATEST=0`                                                                                                     |
| package-manager integrity recording | PASS   | npm registry reports `sha512-H/hwxMYTPf2I+yr8Rt0T1H8JyXlLQ4xv20fKmMrzvBY4HuC+k6CRuOOCTPAfiJ9G19niCRD7C+GrD7W6qA3WIQ==` for pnpm 11.22.0 |

The repository uses the exact runnable `packageManager: pnpm@11.22.0`; the
registry integrity evidence is recorded here. A hash-suffixed representation is
not required for this Genesis gate.

## Genesis materialization

The root contains fresh repository policy/configuration, one Nx project, the
TypeScript 7 canonical lane, the isolated TypeScript 6 compiler-API fixture,
three source files, permanent repository gates, and a separate Genesis
acceptance gate with a `GENESIS_READY` runtime/test/build smoke skeleton. No
Foundation subsystem is implemented.

## Phase boundary

Repository Genesis establishes repository/toolchain correctness only.

Architecture boundary gates are introduced incrementally when real Foundation
projects/packages and their ownership metadata exist.

No heuristic is accepted as a substitute for explicit architecture metadata.

Permanent verification is clone-safe and evolves with the repository. It covers
resource and Corpus integrity, package resolution and declared dependency
policy, current toolchain policy, formatting, lint, typecheck, tests, build, and
runtime smoke where applicable. `pnpm verify` does not require the archived
repository, Genesis-only root topology, absence of Foundation dependencies,
absence of future workspace directories, or the current smoke-file set.

Genesis acceptance is phase-specific and one-time. `pnpm check:genesis` and
`pnpm verify:genesis` retain only clean-room donor evidence, the current Genesis
root topology, the Genesis dependency baseline, and the minimal Genesis smoke
acceptance. Repository Genesis is closed when both aggregate gates pass.

Direct catalog dependencies are limited to `nx`, `@nx/js`, `@typescript/native`
aliased to TypeScript 7.0.2, `typescript` aliased to
`@typescript/typescript6` 6.0.2, ESLint, `typescript-eslint`, `@types/node`
24.13.3, Vitest, and Prettier. The lockfile was resolved from this new manifest
only.

Fresh lockfile SHA-256: `fef4af697339f3b6d7adb5e5924b998c54120880156d8a946345951616667a7f`.

## Verification record

These entries are updated only after the corresponding command is run.

| Gate                           | Status | Command                          |
| ------------------------------ | ------ | -------------------------------- |
| Repository correctness         | PASS   | `pnpm check:repository`          |
| Corpus inventory repair        | PASS   | `pnpm check:corpus`              |
| Routed skill resources         | PASS   | `pnpm check:agents`              |
| Dependency routes              | PASS   | `pnpm check:dependencies`        |
| Source boundaries              | PASS   | `pnpm check:boundaries`          |
| Frozen install                 | PASS   | `pnpm install --frozen-lockfile` |
| Toolchain                      | PASS   | `pnpm toolchain:check`           |
| Formatting                     | PASS   | `pnpm format:check`              |
| Lint                           | PASS   | `pnpm lint`                      |
| Typecheck                      | PASS   | `pnpm typecheck`                 |
| TS6 lane                       | PASS   | `pnpm tsc6`                      |
| Test                           | PASS   | `pnpm test`                      |
| Build                          | PASS   | `pnpm build`                     |
| Runtime smoke                  | PASS   | `pnpm start`                     |
| Aggregate verification         | PASS   | `pnpm verify`                    |
| Genesis acceptance             | PASS   | `pnpm check:genesis`             |
| Genesis aggregate verification | PASS   | `pnpm verify:genesis`            |

`pnpm verify` is the permanent repository correctness gate and does not depend
on the archived repository or Genesis-only topology. `pnpm verify:genesis` adds
the one-time acceptance constraints: donor-object exclusion, the minimal root
topology, and the absence of Foundation dependencies. The recorded donor
commit is `8094be40f6b5ae04a4052f5daa09abb1db3df76d` in
`GENESIS_EVIDENCE.json`.

## Final preflight closure before Foundation M1

The final pre-topology Genesis acceptance was `PASS` for
`pnpm verify:genesis` on the clean-room root topology. M1 then materialized
`docs/`, `tools/`, and `packages/`, so the phase-specific `check:genesis` and
`verify:genesis` root commands were retired. `GENESIS_EVIDENCE.json` and the
phase entrypoint remain as historical evidence and tools; permanent
`pnpm verify` is the continuing repository correctness gate.

## Corrective review record

| Review item                                        | Status | Evidence                                                                                                                                                                                              |
| -------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Official Nx TypeScript plugin/inferred TS7 targets | PASS   | `@nx/js/typescript`, `nx show project`, `@nx/js:typescript-sync`                                                                                                                                      |
| Strict peer/engine policy                          | PASS   | `strictPeerDependencies: true`, `engineStrict: true` and dependency gate                                                                                                                              |
| Explicit release-age policy                        | PASS   | `minimumReleaseAge: 1440` and version-specific exceptions                                                                                                                                             |
| Default isolated linker                            | PASS   | No `nodeLinker` override; pnpm resolves `isolated`                                                                                                                                                    |
| Root Agent authority projection                    | PASS   | `references/constitution.json` uses `../AGENTS.md`                                                                                                                                                    |
| Agent package manifest size/hash validation        | PASS   | validator checks every listed file against size and SHA-256                                                                                                                                           |
| Corpus filesystem/manifest exact-set validation    | PASS   | gate compares recursive content files in both directions                                                                                                                                              |
| Archived donor-object exclusion                    | PASS   | gate rejects recorded donor `8094be40f6b5ae04a4052f5daa09abb1db3df76d` without requiring the archive                                                                                                  |
| Permanent dependency route compliance              | PASS   | exact external identities load from Corpus; internal `workspace:` dependencies are checked from workspace manifests                                                                                   |
| Permanent source dependency compliance             | PASS   | relative imports are local, Node builtins are classified as builtins, workspace imports are internal, external imports are declared and Corpus-routed, and repository tooling is excluded from source |
| Verification lifecycle split                       | PASS   | `verify` is clone-safe; `verify:genesis` carries only Genesis acceptance constraints                                                                                                                  |
| Neutral Genesis runtime entry point                | PASS   | `src/main.ts`; no `src/cli.ts`                                                                                                                                                                        |
| Heuristic architecture enforcement removed         | PASS   | `check-boundaries` contains no filename/path adapter markers; explicit architecture metadata remains a future Foundation concern                                                                      |
| Dependency package identity correction             | PASS   | standards, conventions, built-in mechanics, release tools, and unselected ecosystem packages are absent from `routes[].packages`                                                                      |

The initial TDD red test was observed before the source entry point existed;
the focused smoke test is now `PASS` after the entry point was added.

## Explicitly outside Repository Genesis

PostgreSQL, DBOS crash/recovery, live messaging or model protocols,
source-less/native packaging, cross-platform release qualification, SBOM,
vulnerability, and license evidence remain `NOT_RUN`; they are not represented
as Genesis completion claims.
