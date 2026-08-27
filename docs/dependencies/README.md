# Dependencies

This area owns the current dependency decision and implementation-routing
documentation. The machine-readable routing file is the canonical source for
adopted implementation paths; prose explains rationale and boundaries.

- [Decision ledger](decision-ledger.md)
- [Implementation routing](implementation-routing.md)
- [Dependency routing](dependency-routing.json)
- [Qualification evidence](../qualification/README.md)

`RoleDecision` and `ImplementationQualification` are separate dimensions.
An adopted generic mechanics provider still requires claim-matched
implementation or product qualification where the current architecture says so.
Do not add a second provider or custom fallback without an explicit reopening
decision.

The Version Authority graph is split by ownership: `package.json` owns the exact
Node and pnpm baseline, `pnpm-workspace.yaml` owns exact npm catalog selections,
`dependency-routing.json` owns independent dependency policy values, and each
domain owns non-npm runtime selections. Verification reads these Authorities;
qualification records only describe what was exercised.
