# Gotcha index

Use a gotcha when a failure mode has been reproduced or understood well enough
to record its cause, supported handling, and evidence boundary.

| Entry                                                                           | Scope                                        | Evidence / owner                               |
| ------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| [Windows command shims](process/windows-command-shims.md)                       | Node subprocess resolution on Windows.       | repo-kit process tests                         |
| [proper-lockfile stale reclaim](bootstrap/proper-lockfile-stale-reclaim.md)     | Bootstrap ownership and stale lock behavior. | bootstrap ownership tests                      |
| [Private PostgreSQL runtime](postgres/private-runtime.md)                       | Extracted PostgreSQL profiles and readiness. | bootstrap/private PostgreSQL integration tests |
| [Independent Review is external](repository/independent-review-is-external.md)  | External closure verdict semantics.          | Governance and closure playbooks               |
| [PRE_PRODUCTION maintenance bias](repository/preproduction-maintenance-bias.md) | Compatibility and current-tree cleanup.      | Governance and hygiene gate                    |
