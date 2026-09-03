# Qualification

This area owns observed property evidence. It does not own product
Architecture, dependency role decisions, current development order, or
implementation authorization.

Evidence states are exactly:

```text
PASS
FAIL
NOT_RUN
BLOCKED
```

Use the boundary that matches the claim:

```text
unit/package
→ real database or provider
→ process restart/crash
→ native operating system/platform
→ source-less or shipping artifact
```

A result record states the property, actual environment/provider/artifact,
executed scenario or command, tested revision when materially relevant, result,
and any untested boundary needed to interpret it. Adjacent tests, mocks,
historical records, or one platform do not upgrade an unexecuted claim.

Keep provider/mechanics role decisions in
[dependency-status.json](dependency-status.json) and implementation routes in
the [dependency area](../dependencies/README.md). Keep executed records under
[results](results/README.md) and supporting evidence under [evidence](evidence/).
Existing Q/C filenames are retained as historical evidence identities; new
records use semantic property names.
