# Repository Kit

`@heptalogos/repo-kit` is private repository and development tooling. It is
not a product or Foundation runtime dependency.

Add a new helper only after a concrete repeated repository need exists. Keep
scripts as thin executable entrypoints and place reusable mechanics here.

Current-tree hygiene scanning is exposed through `current-tree-hygiene.mjs` and
is invoked by the permanent `pnpm check:hygiene` repository gate.
