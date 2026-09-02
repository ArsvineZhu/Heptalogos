# Product

This directory owns the current human-facing Product Authority for
Heptalogos: the product proposition, its durable composition, and the
administrator-facing experience around one persistent Subject.

It is the entry point for product meaning. It does not define exact
implementation contracts, dependency choices, qualification evidence, or
implementation authorization.

## Reading path

| Document                                                | Read when                                                                                                              | Owns                                                                                                              |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Product goals](product-goals.md)                       | Asking what Heptalogos is researching and how it differs from a chatbot or generic agent framework.                    | Product proposition, research purpose, and differentiation.                                                       |
| [Product shape](product-shape.md)                       | Asking what the product consists of, which administrator surfaces exist, or which authority owns an interaction.       | Durable product composition, Control Plane shape, Subject/System Authority boundaries, and carrier semantics.     |
| [Control Plane experience](control-plane-experience.md) | Asking how the living product surface behaves at rest, during attention, in conversation, or during system management. | Stable interaction semantics for Home, Subject Chat, Direct Management, Operator Assistant, and live projections. |

## Ownership boundaries

Product goals and shape are explained here. Conceptual rationale belongs in
[../architecture/](../architecture/README.md); exact current contracts belong
in [../../specs/](../../specs/INDEX.md); development sequence belongs in the
[Roadmap](../../project/roadmap/development-roadmap.md); work authorization
belongs in [Plans](../../project/plans/INDEX.md); and observed results belong
in [Qualification](../../project/qualification/README.md).

The product has one semantic center: a persistent Subject hosted by the
Product Host. Management clients and visual carriers project canonical
Authority; they do not create a second Subject, Host, or Control Plane
Authority.
