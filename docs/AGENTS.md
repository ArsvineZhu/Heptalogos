# Documentation Agent Contract

This contract governs current documentation under `docs/**`.

- Keep one canonical home per fact and respect the document-class owner.
- Standing documents describe present truth; plans and historical records may
  preserve chronology and historical paths.
- README answers what an area is and why it exists. INDEX provides compact
  navigation. AGENTS contains persistent subtree instructions. Do not duplicate
  architecture, governance, or Skill content in any of them.
- Architecture is conceptual and human-readable. `docs/specs/**` owns concise
  normative current contracts. Plans authorize changes; qualification records
  own executed evidence.
- Active executable plans live under `docs/plans/active/`; completed and
  superseded plans are historical and are not current routes.
- Every current local Markdown link must resolve. Use ASCII semantic slugs for
  durable filenames, and keep derived facts generated or freshness-checked.
- Keep current and historical evidence separate and preserve
  `PASS | FAIL | NOT_RUN | BLOCKED` distinctions.
- Load the `documentation-maintenance` Skill when documentation topology,
  canonical ownership, navigation, or migration changes.

Do not create nested `AGENTS.md` files under `docs/`.
