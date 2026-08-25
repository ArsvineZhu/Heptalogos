# Playbooks

| Entry                                                                                  | Scope                                                 | Evidence                                     |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| [Subprocess execution](playbooks/process/subprocess-execution.md)                      | Repository subprocesses                               | `tools/repo-kit/src/process.mjs`             |
| [Milestone PR closure](playbooks/repository/milestone-pr-closure.md)                   | Branch and PR closure                                 | `AGENTS.md` + manual verify workflow         |
| [H-stage stabilization closure](playbooks/repository/h-stage-stabilization-closure.md) | Hn-S branch, candidate and external closure gates     | H1-S control record + manual verify workflow |
| [Current-tree hygiene](playbooks/repository/current-tree-hygiene.md)                   | Hn-S provenance, compatibility and archaeology sweeps | `pnpm check:hygiene` + Corpus 26             |
