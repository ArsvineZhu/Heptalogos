# Windows command shims from Node subprocesses

## Scope

Node child process invocation of pnpm/npm-style command shims on Windows.

## Symptom

Direct ad-hoc spawn logic or manual `cmd.exe /c` strings can fail or corrupt
arguments depending on shim resolution and shell quoting.

## Root cause

Windows command/shim resolution and shell parsing are not POSIX argv semantics.
Reconstructing a command line with `args.join(" ")` loses the original argv
boundary and introduces quoting/metacharacter bugs.

## Repository rule

Use `@heptalogos/repo-kit` process helpers. Pass command and argv separately.
Ordinary repository subprocesses use `shell: false`. Shell execution must be an
explicit, separately reviewed operation.

## Regression evidence

`tools/repo-kit/test/process.test.mjs` and
`scripts/verify/toolchain.mjs`.
