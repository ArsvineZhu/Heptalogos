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
