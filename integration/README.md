# Integration projects

`integration/` contains repository-level composition and qualification
projects. It is not a published product package; each project owns only the
cross-package scenarios and support needed to prove its declared composition.

- [Foundation integration](./foundation/README.md) composes the asynchronous
  Foundation spine across Bootstrap, data, runtime, and execution boundaries.
- [Product Host integration](./product-host/README.md) qualifies the built
  headless Host and reference CLI against real PostgreSQL and the current
  native credential-store profile.
- [Model gateway integration](./model-gateway/README.md) proves the installed
  Chat/Responses SDK adapters locally and contains the separate protected live
  NewAPI-to-DeepSeek Chat qualification harness.
