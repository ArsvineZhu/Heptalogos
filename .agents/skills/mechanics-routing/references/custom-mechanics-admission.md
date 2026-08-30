# Custom mechanics admission

Use this reference when existing project mechanics and adopted routes appear
insufficient.

Record:

Mechanic:
Current consumer and semantic owner:
Existing repository primitive inspected:
Dependency role and status:
Adopted provider capability inspected:
Standard, Node, or OS option:
Relevant mature library option:
Narrow adapter or composition feasibility:
Concrete insufficiency:
Custom maintenance surface:
Lifecycle, concurrency, security, and cross-platform burden:
Current authorization:

Decision:

- Reuse an existing project route when it is sufficient.
- Use the adopted provider behind the current or narrow Heptalogos adapter when
  that role is adopted.
- Use a Standard, language, Node, or OS facility when it is sufficient.
- Use a mature library only through existing dependency governance when the
  current role permits it.
- Report PLAN_GAP when a foundational provider role is unresolved and selection
  is not authorized.
- Write custom generic mechanics only when concrete evidence shows the prior
  routes cannot satisfy the current requirement.

Library-First does not require a dependency for trivial transformations or
Heptalogos-specific semantic logic. It targets non-trivial reusable generic
mechanics with mature external ownership.
