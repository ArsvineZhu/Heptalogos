# Workspace packages

packages/ contains the product and Foundation workspace packages. Each package
README provides the local purpose, semantic ownership, public surface,
relationships, verification, and relevant handoffs.

Before changing a package, read its README and use the [package
INDEX](INDEX.md) for cross-package discovery. Exact current behavior belongs in
the relevant Specs; repository-wide Agent behavior belongs in root AGENTS or a
procedural Skill; human procedures belong in project/engineering.

When adding or removing a package, update its manifest, workspace metadata,
README, deliberate package INDEX projection, dependency direction, and focused
verification. A package-local AGENTS file is added only for a real recurring
scope-specific behavior need.
