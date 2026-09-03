# Current-Tree Hygiene

This playbook describes the permanent current-tree properties checked by
check:hygiene. It keeps current executable identities semantic while leaving
development chronology to Git and historical evidence.

## Current properties

Current source, tests, fixtures, scripts, tooling, configuration, workflow
definitions, manifests, Skills, and agent instructions must not use a
milestone, PR, session, or corrective-cycle identity as their executable/test
identity. A semantic name is preferred; stable problem, schema, protocol,
durable, public API, and Spec traceability identifiers remain valid.

The compatibility register at
project/governance/compatibility-obligations.json must be valid JSON with
schemaVersion 1, compatibilityEpoch PRE_PRODUCTION, and an obligations array.
The array may contain a real declared obligation. The register is Authority;
the scanner does not require it to remain empty.

## Scope

The scanner covers tracked current executable and test paths under the
repository's maintained source, tooling, workflow, and configuration roots.
Historical Plans, qualification history, ordinary documentation prose, and
generated output remain owned by their respective planes. The scanner does not
decide whether a word such as legacy, obsolete, or deprecated describes a
compatibility path.

## Handling a finding

Inspect the identity and semantic owner. Rename a development-only identity to
the current role and update its callers when the finding is only a path or
label. If code actually accepts an obsolete internal shape, rewrite the
current owner and callers under PRE_PRODUCTION; do not add a bridge without a
declared obligation. A product-domain tombstone remains when its current
contract requires one.

Do not add a blacklist, baseline, allow-list, manifest, or test that merely
remembers a deleted repository artifact. Do not reject a current file merely
because its explanatory prose uses historical vocabulary. Do not treat a
skipped or blocked check as PASS.

## Verification

Run check:hygiene after current identity or compatibility-register changes,
then run the other scoped repository checks required by the active Plan. A
passing result proves only the current identity/register properties scanned by
this check.
