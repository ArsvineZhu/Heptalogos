# Heptalogos Codex Skills Package

This directory is operational routing metadata for coding agents. It is **not** architecture authority.

Expected repository layout:

```text
repo/
├─ Architecture_Corpus/
├─ .agents/
└─ AGENTS.md
```

The skills live under `.agents/skills/`. From every `SKILL.md`, the Architecture Corpus root is therefore:

```text
../../../Architecture_Corpus/
```

`corpus-routes.json` is a discovery index: it tells an agent **which current Corpus resources to read for a task domain**. It does not restate architecture decisions.

## Validation

Run from repository root:

```bash
node .agents/heptalogos/validate-skill-resources.mjs
```

The validator checks:

- root `Architecture_Corpus/` and `AGENTS.md` exist;
- every routed Corpus resource exists;
- every Skill has valid `name` / `description` frontmatter;
- every description begins with `Use when`;
- route keys and Skill directory names match;
- direct `../../../Architecture_Corpus/...` links resolve;
- no Skill exceeds the package's 500-word body budget.

The validator checks routing and resource structure; it does not maintain a
file-size or checksum manifest and it does not require root `AGENTS.md` to
enumerate every Skill.

Run this after renaming/moving Corpus files or changing Skill routing.

## Behavioral routing cases

`tests/skill-routing-cases.json` contains representative prompts and expected Heptalogos Skill selections. These are intended for live Codex skill-discovery regression checks when a Codex runtime is available. The resource validator only checks their schema and referenced Skill names; it does not pretend to prove model routing behavior.
