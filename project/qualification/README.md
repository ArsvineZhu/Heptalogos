# Qualification

This area owns current property evidence and qualification records. It does
not own Architecture decisions or milestone truth.

- [Verification system](verification-system.md)
- [Dependency qualification](dependencies.md)
- [Dependency matrix](dependency-matrix.md)
- [Dependency status](dependency-status.json)
- [Result template](result-template.md)
- [Qualification results](results/README.md)
- [Evidence](evidence/)
- [Deferred and implementation qualification](deferred-and-implementation-qualification.md)

Evidence states are exactly `PASS`, `FAIL`, `NOT_RUN`, and `BLOCKED`.
`qualificationState` describes the closure of the properties in one record; it
does not reopen or close a dependency `RoleDecision`. Historical observations
must remain visibly separate from current-candidate evidence.
