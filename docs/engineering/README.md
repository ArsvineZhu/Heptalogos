# Engineering knowledge

`GOTCHA` = a reproduced/understood failure mode, root cause, repository rule,
and regression evidence.

`PLAYBOOK` = the supported procedure for a repeated engineering operation.

The indexes link to detailed entries only when a real repository need exists.
For pre-production stabilization, use the dedicated [closure playbook](playbooks/repository/pre-production-stabilization-closure.md); the generic milestone procedure remains the default for non-stabilization milestones.

For generic helper, adapter, and library decisions, use the [mechanics ownership and library-first playbook](playbooks/mechanics-ownership-and-library-first.md).

For source comments and exported API contracts, use the [source documentation playbook](playbooks/repository/source-documentation.md).

For Coding-Agent Harness capability, persistent context, and Skill evolution,
read the [Harness design](repository/agent-harness-design.md) and its
[evaluation protocol](repository/agent-harness-evaluation.md).

## Current responsibility roots

The reviewed long-lived repository responsibilities are grouped under these
roots. Root-level files remain ordinary configuration, manifests, or metadata;
adding another responsibility root requires documenting its owner and updating
this topology contract in the same change.

```text
.agents/
.github/
docs/
packages/
scripts/
tests/
tools/
```
