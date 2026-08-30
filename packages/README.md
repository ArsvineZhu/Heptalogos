# Workspace packages

packages/ contains the product and Foundation workspace packages. Each package
README is a local human/developer explanation of purpose, semantic ownership,
public surface, relationships, verification, and relevant handoffs. It is not
a second normative contract owner.

Before changing a package, read its README and use the [package
INDEX](INDEX.md) for cross-package discovery. Exact current behavior belongs in
the relevant Specs; repository-wide Agent behavior belongs in root AGENTS or a
procedural Skill; human procedures belong in project/engineering.

Package README headings are chosen for the package's explanation. A useful
README normally identifies purpose, what the package owns and does not own,
important boundaries, public surface, relevant verification, and links to
Architecture or Specs, but no fixed heading template is required.

When adding or removing a package, update its manifest, workspace metadata,
README, deliberate package INDEX projection, dependency direction, and focused
verification. A package-local AGENTS file is added only for a real recurring
scope-specific behavior need.
