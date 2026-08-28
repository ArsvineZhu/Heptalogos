# Playbooks

Use the [mechanics ownership and library-first playbook](playbooks/mechanics-ownership-and-library-first.md) before introducing generic helpers, adapters, or library-backed mechanics.

| Entry                                                                                  | Scope                                                         | Evidence                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| [Subprocess execution](playbooks/process/subprocess-execution.md)                      | Repository subprocesses                                       | `tools/repo-kit/src/process.mjs`      |
| [Milestone PR closure](playbooks/repository/milestone-pr-closure.md)                   | Branch and PR closure                                         | `AGENTS.md` + manual verify workflow  |
| [H-stage stabilization closure](playbooks/repository/h-stage-stabilization-closure.md) | Stabilization branch, live PR candidate and closure gates     | current plan + manual verify workflow |
| [Current-tree hygiene](playbooks/repository/current-tree-hygiene.md)                   | Current-tree provenance, compatibility and archaeology sweeps | `pnpm check:hygiene` + Corpus 26      |
