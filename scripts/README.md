# Repository scripts

`scripts/verify/` = permanent current repository gates.

Reusable implementation belongs in `tools/repo-kit`.

One-time phase acceptance scripts do not remain after phase closure; their
commands/results live in completed plans and Git history. `scripts/phases/` is
not a historical-tools directory.
