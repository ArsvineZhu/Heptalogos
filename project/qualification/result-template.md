# Qualification Result Template

Use this optional template for one property question. It is guidance, not a
schema gate.

```yaml
property: "one concrete claim"
boundary: unit | package | database | provider | process | platform | source-less
environment: "actual host/provider/artifact"
testedRevision: "optional revision actually exercised"
result: PASS | FAIL | NOT_RUN | BLOCKED
evidence: "command, test, artifact, or reference"
remainingBoundary: "optional untested boundary relevant to interpretation"
```

Explain what the result proves and what it does not prove. Do not invent a
qualification ID, lifecycle state, candidate identity, review verdict, merge
state, or revalidation field merely to complete this template.
