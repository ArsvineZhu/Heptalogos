# Documentation Agent Contract

This contract adds behavior unique to current documentation under `docs/**`.

- Give each current fact one canonical document owner. Classify a change before
  editing and update affected derived projections in the same change.
- `README.md` explains an area and its purpose. `INDEX.md` is a retrieval
  surface. `AGENTS.md` contains persistent subtree behavior. Specs state exact
  current normative contracts; Architecture explains conceptual design.
- Keep current documentation and historical plans/qualification records
  distinct. Current links point to current homes; historical paths may remain
  only as historical text.
- Use semantic ASCII filenames and maintain local navigation. Every current
  Markdown link must resolve, and INDEX entries must provide enough context for
  an unfamiliar reader to choose the target without opening every candidate.
- Maintain generated or derived documentation from its source, and run
  `pnpm check:documentation` when ownership, navigation, or projections change.

Do not create nested `AGENTS.md` files under `docs/`.
