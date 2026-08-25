# Gotchas

| Entry                                                                                   | Scope                             | Evidence                                                                        |
| --------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| [Windows command shims](gotchas/process/windows-command-shims.md)                       | Process execution                 | `tools/repo-kit/test/process.test.mjs`                                          |
| [proper-lockfile stale reclaim](gotchas/bootstrap/proper-lockfile-stale-reclaim.md)     | Bootstrap ownership               | `packages/bootstrap-runtime/src/bootstrap-ownership.test.ts`                    |
| [Private PostgreSQL extracted runtime](gotchas/postgres/private-runtime.md)             | PostgreSQL bootstrap              | `packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts` |
| [Independent Review is external](gotchas/repository/independent-review-is-external.md)  | Current live Ready PR governance  | `AGENTS.md`, `docs/engineering/playbooks/repository/milestone-pr-closure.md`    |
| [PRE_PRODUCTION maintenance bias](gotchas/repository/preproduction-maintenance-bias.md) | Compatibility and history cleanup | Corpus 26 + compatibility register                                              |
