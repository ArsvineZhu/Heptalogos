# Heptalogos Codex Skills Package

This directory contains operational routing metadata for coding agents. It is
not architecture authority.

Expected repository layout:

```text
repo/
├── .agents/       # Skills, routes, and routing tests
├── docs/          # logical Architecture Corpus and repository documentation
└── AGENTS.md
```

`corpus-routes.json` is a discovery index. Every route value is a
repository-relative path to a current document under `docs/`; it does not
restate architecture decisions. The route schema is versioned independently
from document filenames.

## Validation

Run from the repository root:

```bash
node .agents/heptalogos/validate-skill-resources.mjs
```

The validator checks:

- `docs/` and the repository `AGENTS.md` exist;
- every routed documentation resource exists under `docs/`;
- active routes do not point into completed plans;
- every Skill has valid `name` / `description` frontmatter;
- route keys and Skill directory names match;
- direct `../../../docs/...` Skill links resolve;
- no Skill exceeds the package's 500-word body budget;
- routing cases reference existing Skills.

The validator checks routing and resource structure; it does not maintain a
file-size or checksum manifest and it does not pretend to prove model routing
behavior.

## Behavioral routing cases

`tests/skill-routing-cases.json` contains representative prompts and
expected Heptalogos Skill selections. These are intended for live Codex
skill-discovery regression checks when a Codex runtime is available. The
resource validator checks their schema and referenced Skill names.
