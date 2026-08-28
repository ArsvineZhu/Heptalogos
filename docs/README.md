# Documentation

`docs/` is the complete current documentation system for Heptalogos. It serves
humans, maintainers, operators, and coding agents through separate but linked
document classes.

## Authority and document classes

- [`governance/`](governance/) owns current repository governance and
  compatibility policy.
- [`architecture/`](architecture/) owns the logical Architecture Corpus and
  current Foundation contracts.
- [`dependencies/`](dependencies/) owns dependency decisions and implementation
  routing.
- [`qualification/`](qualification/) owns property evidence and qualification
  status; it does not replace the dependency or milestone Authorities.
- [`roadmap/`](roadmap/) owns current milestone sequencing and eligibility.
- [`plans/`](plans/) owns active implementation plans and completed plan
  records.
- [`engineering/`](engineering/) owns repository procedures and operational
  knowledge.
- [`reference/`](reference/) owns maintained terminology and the generated
  [API reference](reference/api/README.md).

The Architecture Corpus remains a logical Authority concept. Its current
documents live under [`architecture/`](architecture/), [`governance/`](governance/),
[`dependencies/`](dependencies/), [`qualification/`](qualification/), and the
other documented homes above; no special physical root directory is required.

## Reading paths

Start with the [`documentation index`](INDEX.md). Developers should then read
the relevant architecture page, package or repository README, and the active
plan named by the task. The [living development roadmap](roadmap/development-roadmap.md)
provides sequencing and qualification guidance; it is not an architecture
authority or an implementation plan.

Human-facing content may remain Chinese during PRE_PRODUCTION development;
new durable filenames use language-neutral ASCII semantic slugs. AI-facing
operational instructions remain concise technical English. Translation work is
disabled unless project governance explicitly reopens it.

Each current fact has one canonical home. Other documents summarize and link;
completed plans and qualification history may preserve chronology without
becoming current Authority.
