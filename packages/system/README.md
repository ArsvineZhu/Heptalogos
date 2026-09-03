# System packages

System packages own cross-cutting mechanics and semantic system services used
by the headless Product Host. They are not a generic product framework and do
not contain GUI or Machine Operations implementation.

| Package                                      | Owns                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| [os-credential](./os-credential/README.md)   | Callback-scoped OS credential/keyring mechanics.                                     |
| [management](./management/README.md)         | Administrator, claims, sessions, Management contracts, and Read Models.              |
| [configuration](./configuration/README.md)   | Product configuration definitions, revisions, activation, and effective values.      |
| [secret](./secret/README.md)                 | Product SecretRef metadata, scope authorization, and OS-backed material resolution.  |
| [network-access](./network-access/README.md) | Current OpenAI outbound origin, method, redirect, deadline, and byte-budget policy.  |
| [ai-runtime](./ai-runtime/README.md)         | OpenAI ProviderProfile/ModelProfile/ModelBinding and structured generation boundary. |
