# Coding-Agent Harness Design

This document is guidance for human maintainers of the Coding-Agent execution
layer. It does not authorize implementation.

## Operating path

```text
Human/Web Architect research and decisions
→ decision-complete active Plan
→ bounded Coding-Agent context
→ normal coding competence + applicable executor Skill
→ Plan-specified proof
→ STOP
```

The bounded context is disclosed progressively:

```text
root/scoped AGENTS
→ Project Charter
→ designated active Plan and its Required Context
→ affected current Specs/package documentation
→ current code/tests
→ retained executor Skill when its trigger matches
```

Architecture and product intent remain human-owned. Plans authorize bounded
work. Specs define exact current contracts. Skills provide recurring
implementation procedures. Qualification records observed evidence. No layer
becomes Authority merely because an Agent read or generated it.

## Executor jobs

Retained Skills exist only when they provide recurring, project-specific
procedural value:

- claim verification keeps evidence within the executed provider, process,
  platform, or artifact boundary;
- durable-state change checks owner, fence, version, reset, and restart facts
  for an already-authorized state change;
- lifecycle change checks ownership, admission, disposal, fencing, and bounded
  terminal behavior for an already-authorized lifecycle change;
- mechanics routing sends generic work through an existing owner and adopted
  provider;
- PRE_PRODUCTION evolution replaces the current internal shape and removes
  obsolete bridges when no compatibility obligation exists;
- semantic-boundary change carries an already-decided owner/API direction
  through callers, Specs, projections, and proof;
- knowledge maintenance updates the canonical current fact owner and only the
  projections made stale.

Skills do not own architecture, scope admission, provider selection, failure
model design, test strategy, release orchestration, or permanent gate design.

## Maintenance

Keep Skills open-ended and small in number only as a consequence of recurring
need. Remove a Skill when its job is no longer recurring or a mature tool and
normal coding competence provide the same value. Keep structural checks
structural; without an independent runner, behavioral Skill evaluation is
NOT_RUN, not a fabricated PASS.
