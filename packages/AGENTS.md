# Package Workspace Agent Contract

This scope adds behavior unique to work under packages/**.

- Before editing, read the target package README. For cross-package work, use
  packages/INDEX.md and packages/README.md to discover ownership and
  relationships.
- Keep changes inside the documented semantic owner and dependency direction.
  Exact current invariants come from relevant Specs; update the package's
  human explanation when its public surface or local boundary changes.
- Package README explains purpose, ownership, public surface, important
  handoffs, and local verification; exact normative contracts remain in Specs.
- Run focused package verification and affected repository gates.
- A package-local AGENTS file is justified only by recurring package-specific
  persistent behavior that materially differs from this workspace scope.
