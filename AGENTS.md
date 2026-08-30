# AGENTS.md

Repository-wide execution contract for Heptalogos. This is the persistent
behavior context for Coding Agents, not an architecture summary, roadmap, or
knowledge encyclopedia.

## Work authorization

- Execute the explicitly named approved active plan. Do not choose another plan
  by recency, filename, convenience, or perceived completeness.
- The current Architecture Corpus supplies standing semantics. The active plan
  authorizes the current change sequence and task decisions; it does not
  silently redefine standing semantics.
- Current code and tests are implementation reality, not Authority for an
  unresolved semantic choice.
- A non-trivial missing decision, unauthorized boundary movement, or unresolved
  Authority conflict is `PLAN_GAP`. Stop and report the smallest concrete
  blocker with the evidence that exposed it.

## Current value and executable truth

Implement what the active plan, current consumer, current executable path, and
accepted failure model require. Future usefulness or theoretical completeness
does not independently authorize current implementation.

A component can be architecturally elegant and locally correct while the
required executable path is still broken. Prioritize the current Product or
Foundation spine and its real consumers; do not grow Foundation capability in
the absence of that need.

A completed acceptance condition closes the current change. New implementation
work requires new admissible current evidence, an accepted current-Horizon
failure case, a current consumer/invariant, or an explicit active-plan
requirement.

## Present tree and PRE_PRODUCTION

Current source, tests, fixtures, tooling, configuration, workflows, and
instructions describe present semantics. Development chronology belongs in Git
and historical records, not current executable identities.

`CompatibilityEpoch = PRE_PRODUCTION`. Only
`docs/governance/compatibility-obligations.json` declares compatibility
obligations. Internal development history does not create compatibility work.
When the current internal shape changes, rewrite the canonical shape, update
current consumers/tests, rewrite the development baseline, reset project-owned
state where appropriate, and remove obsolete paths.

Do not preserve internal history with legacy readers, aliases, shims, dual
formats, fallback parsers, or bridge migrations. Current names and structures
must express present roles.

## Ownership and complexity admission

- Keep semantic ownership and canonical mutation Authority singular. Do not
  bypass an owning service or create a second Authority path to simplify an
  implementation or test.
- Use the adopted project primitive/provider route for generic mechanics. New
  foundational dependencies, duplicate mechanics, or subsystem boundaries
  require explicit plan authorization.
- New persistent/product state is admitted only for a real new semantic fact
  that a current consumer must preserve across the relevant durability boundary.
- Resilience complexity requires a current failure model. Security complexity
  requires a current threat. Failure-injection tests provide evidence about a
  scenario; they do not independently create product architecture.
- Bounded fencing or fail-stop is a valid outcome when it preserves canonical
  truth. A first-order recovery does not authorize recovery-of-recovery,
  fallback-of-fallback, or another unbounded recovery layer.
- A fix does not automatically authorize another hardening pass. Classify new
  findings before implementation and return to the original task after a
  deferred finding is recorded.

## Skills and evidence

Repository Skills are an open-ended set of on-demand implementation procedures.
Load a Skill when its metadata trigger matches the engineering activity. A
Skill must improve the decision procedure, not merely route to a topic or
replace the active plan.

Verification states are exactly `PASS | FAIL | NOT_RUN | BLOCKED`. Every claim
must match evidence that actually ran: mock evidence does not prove a live
protocol or provider, one platform does not prove another, and source-tree
execution does not prove a source-less shipping artifact.

## Repository execution policy

Ordinary GitHub Actions remain disabled. Use local verification entry points,
run focused checks while editing, and run the permanent gates required by the
active plan before claiming completion. Keep `pnpm verify` runnable.

For work under `docs/**` or `packages/**`, follow the corresponding scope
contract and read the target README/INDEX before editing. Do not add nested
scope instructions unless a subtree has a distinct persistent behavior need.
