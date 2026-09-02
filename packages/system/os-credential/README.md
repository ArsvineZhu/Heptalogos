# @heptalogos/os-credential

## Purpose

os-credential is the narrow adapter for callback-scoped access to the operating
system credential store. It supplies generic keyring mechanics to Bootstrap
and local clients without becoming a SecretService, session authority, or
plaintext fallback.

## Owns

- The OsCredentialStore contract and napi-rs keyring Entry adapter.
- Existence, set, delete, and callback-scoped credential access.
- Native keyring error normalization at this boundary.

## Does not own

- Bootstrap credential provisioning policy.
- Administrator passwords, claim semantics, or HTTP session authority.
- OpenClaw credentials or arbitrary application configuration.
- A plaintext file, environment-variable, or in-memory cache fallback.

## Verification

Run package unit tests and the current-profile native keyring qualification
when the adapter changes. The recorded platform result is scoped to the profile
actually executed.

## Knowledge references

- [`Secret Spec`](../../../specs/system/secret.md)
- [`Storage lifecycle Architecture`](../../../docs/architecture/storage-lifecycle.md)
