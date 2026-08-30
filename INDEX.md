# Heptalogos repository index

Use this page to route an unfamiliar question to the correct information
plane. The linked entry is the first place to read; follow its local INDEX or
README for detail.

| Area                | Use when / questions answered                                                                             | Primary entry                                          | Adjacent boundary                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Human Knowledge     | Product intent, conceptual Architecture, or human/developer reference.                                    | [docs/README.md](./docs/README.md)                     | Exact implementation contracts are in specs/.                              |
| Normative Contracts | Exact current invariants, operations, lifecycle, failure, and cross-boundary implementation requirements. | [specs/README.md](./specs/README.md)                   | Rationale is in docs/architecture; work authorization is in project/plans. |
| Project Control     | Governance, adopted dependencies, roadmap, Plans, qualification, and engineering procedures.              | [project/README.md](./project/README.md)               | Evidence and sequencing do not replace semantic Specs.                     |
| Agent Procedures    | A specialized Coding-Agent implementation workflow or decision method.                                    | [.agents/skills/AGENTS.md](./.agents/skills/AGENTS.md) | Human Harness rationale is in project/engineering/agent-harness/.          |
| Packages            | Package semantic ownership, public surface, dependency direction, and handoffs.                           | [packages/README.md](./packages/README.md)             | Exact current behavior remains in relevant Specs.                          |
| Repository scripts  | Verification entrypoints, maintenance scripts, and executable repository procedures.                      | [Knowledge check](./scripts/verify/knowledge.mjs)      | Shared mechanics and validators are owned by tools/repo-kit.               |
| Tests               | Test planes and executable proof for current packages and repository tooling.                             | [tests/](./tests/)                                     | A test proves only its claim and execution boundary.                       |
| Repository tooling  | Shared discovery, Markdown, process, dependency, and validation mechanics.                                | [repo-kit README](./tools/repo-kit/README.md)          | Repository policy remains in project/governance and the active Plan.       |
| Manual workflow     | The explicitly dispatched cross-platform verification workflow definition.                                | [verify workflow](./.github/workflows/verify.yml)      | Ordinary GitHub Actions remain disabled.                                   |
