# PRE_PRODUCTION Maintenance Bias

This is a recurring Agent failure mode when maintaining a rapidly evolving
project:

```text
maintenance-project default: unknown old dependency -> preserve/compat
Heptalogos PRE_PRODUCTION default: no declared obligation -> rewrite/delete
```

## Rules

```text
Existence is not justification.
Merged is not Authority.
Old dev DB is not a user.
Previous milestone is not a compatibility consumer.
Prepare for future evolution != implement present backward compatibility.
```

Check `project/governance/compatibility-obligations.json` before
preserving a reader, alias, fallback, migration, or dual format. If a real
external consumer or retained production state is discovered but not declared,
stop as `PLAN_GAP` and request architecture review. Do not rename compatibility
baggage while keeping its behavior.
