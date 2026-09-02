# System packages

System packages own cross-cutting mechanics and semantic system services used
by the headless Product Host. They are not a generic product framework and do
not contain GUI or Machine Operations implementation.

| Package                                    | Owns                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| [os-credential](./os-credential/README.md) | Callback-scoped OS credential/keyring mechanics.                           |
| [management](./management/README.md)       | Administrator, claims, sessions, Management contracts, and P1 Read Models. |
