# Playbook index

Use a playbook for a repeated engineering procedure. A playbook explains
supported execution and evidence boundaries; it does not become product
semantic Authority.

| Entry                                                                                      | Scope                                                        | Read when                                                                                                    |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [Mechanics ownership and Library-First](mechanics-ownership-and-library-first.md)          | Generic helpers, adapters, libraries, and mechanics routing. | A change needs parsing, process, concurrency, retry, lifecycle, queue, schema, or another reusable mechanic. |
| [Subprocess execution](process/subprocess-execution.md)                                    | Repository subprocess invocation.                            | Running or changing a child process from repository tooling.                                                 |
| [Current-tree hygiene](repository/current-tree-hygiene.md)                                 | Provenance, compatibility, and closed-phase residue.         | Changing current executable identity or cleanup gates.                                                       |
| [Milestone PR closure](repository/milestone-pr-closure.md)                                 | External review and manual closure sequence.                 | Closing a bounded implementation candidate.                                                                  |
| [Pre-production stabilization closure](repository/pre-production-stabilization-closure.md) | PRE_PRODUCTION stabilization workflow.                       | Closing a bounded stabilization plan.                                                                        |
| [Source documentation](repository/source-documentation.md)                                 | Exported contracts and generated API documentation.          | Changing durable source/API documentation or its projection.                                                 |
