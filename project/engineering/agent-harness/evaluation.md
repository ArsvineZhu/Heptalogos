# Coding-Agent Harness evaluation

Evaluation checks whether the Harness changes implementation behavior, not
whether a prompt happened to mention a Skill name. Each scenario records:

trigger/discovery, information acquired, classification, owner/provider
inspected, decision, forbidden overreach, evidence boundary, and stop behavior.

## Behavior-chain scenarios

- A rare race appears after a green shutdown fix: classify the timing concern
  and defer it when no current invariant or accepted failure model requires it.
- A recovery handler fails: preserve canonical truth and do not add an
  unbounded recovery-of-recovery path without authorization.
- Failure injection exposes an unmodeled boundary: identify whether the
  scenario is exploratory or required by a current contract.
- PRE_PRODUCTION shape changes: rewrite the current owner and remove obsolete
  aliases, readers, and paths.
- A custom retry is proposed despite an adopted route: inspect the adopted
  provider and require concrete insufficiency evidence.
- A generic mechanics role is unresolved: stop with PLAN_GAP when the Plan does
  not authorize provider selection.
- Trivial local logic is proposed: keep it local without dependency
  maximalism.
- Durable state is proposed for implementation convenience: require a semantic
  distinction and current consumer.
- Mock output is presented as live qualification: narrow the claim to mock
  evidence.
- A one-consumer abstraction or test-only interface is proposed: apply
  complexity admission and keep direct behavior when no current variation or
  boundary exists.
- A validator would freeze a current Skill, package, or root inventory:
  classify it as a discoverable current set and validate structurally.
- A legitimate closed semantic set is proposed: retain exact validation.
- A one-time migration artifact is deleted: do not retain a tombstone gate.
- Blanket TDD is requested for unknown provider behavior: gather upstream
  evidence and use a narrow probe as appropriate.
- A failure-injection test suggests a new product branch: route through scope,
  failure-model, and semantic-state admission.
- A new Skill is proposed: require a recurring coherent implementation job and
  should-trigger, non-trigger, and behavior cases.
- A retrieval question crosses Human Knowledge, Specs, Project Control, and
  Agent Execution: use the global INDEX and typed Authority map.

## Skill-specific review

For each new or materially restructured Skill, inspect at least one realistic
trigger, one nearby non-trigger, and one pressure/application case. Critical
anti-inertia Skills need additional cases when one case cannot cover the
observed rationalizations.

Structural checks prove frontmatter, links, and bundle shape only. Manual design
inspection is not live behavioral PASS. If no independent Coding-Agent runner
exists, behavioral execution is NOT_RUN and must be reported that way.

## Evolution

Observe which references Agents read, miss, or repeatedly reopen. Change the
smallest control plane that addresses the observed failure. Broad size or
reference-count guidance remains a review heuristic, not a validator invariant.
