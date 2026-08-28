# Documentation Agent Contract

This file governs all current documentation under `docs/**`. It is an
AI-facing operational contract; use concise technical English.

- `docs/` is the complete current documentation system.
- Authority is determined by document class, not by being outside `docs/`.
- Keep one canonical home per fact.
- Keep standing documents in current-state prose; plans and history may
  preserve chronology.
- Do not put reasoning transcripts in standing documents.
- Do not put development-stage provenance in current architecture, governance,
  or reference documents.
- Translation work is disabled during PRE_PRODUCTION development unless project
  governance explicitly reopens it.
- Use language-neutral ASCII semantic slugs for durable filenames.
- Generate derived facts or freshness-check them against their source.
- Do not create nested `AGENTS.md` files under `docs/`.
- Every current local Markdown link must resolve.
- Completed historical plans may reference historical paths as historical facts.
- Executable plans live only under `docs/plans/active/`; completed and
  superseded plans are historical and must not be used as current routes.

Durable source modules require meaningful package/module docs.
Document exported contracts and non-obvious invariants.
Comments explain semantics/why, not syntax.
Do not duplicate TypeScript type information in prose.
Generated API docs are derived; edit source documentation instead.

Before changing documentation, identify its audience, canonical facts, and
current evidence. Update navigation and affected agent routes in the same
change. Preserve `PASS | FAIL | NOT_RUN | BLOCKED` evidence distinctions and
keep historical evidence separate from current truth.
