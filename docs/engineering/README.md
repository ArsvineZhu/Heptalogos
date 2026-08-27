# Engineering knowledge

`GOTCHA` = a reproduced/understood failure mode, root cause, repository rule,
and regression evidence.

`PLAYBOOK` = the supported procedure for a repeated engineering operation.

The indexes link to detailed entries only when a real repository need exists.
For H-stage stabilization, use the dedicated [closure playbook](playbooks/repository/h-stage-stabilization-closure.md); the generic milestone procedure remains the default for non-stabilization milestones.

For generic helper, adapter, and library decisions, use the [mechanics ownership and library-first playbook](playbooks/mechanics-ownership-and-library-first.md).

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
