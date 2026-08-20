# Subprocess execution

Use the repository-only process helpers from `@heptalogos/repo-kit`:

- `runProcess(command, args, options)` for a structured, non-throwing result;
- `runProcessChecked(command, args, options)` for a checked invocation;
- `runPnpm(args, options)` for the repository pnpm shim;
- `runNode(script, args, options)` for the current Node executable.

Pass the executable and argv as separate values. The helpers do not enable a
shell implicitly and preserve the original argument boundaries.

Do not hand-build `cmd.exe` invocations, select `.cmd` files manually, or join
arguments into a shell command string for ordinary repository subprocesses.
Shell execution is an explicit, separately reviewed operation with its own
security and quoting contract.
