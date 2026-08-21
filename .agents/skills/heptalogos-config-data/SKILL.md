---
name: heptalogos-config-data
description: Use when changing Heptalogos configuration, defaults, secrets, ConfigurationRoot, storage workspaces, DataOwner lifecycle, backup/restore, portability, retention, purge, content/blob ownership, or persistent owner-native stores.
---

# Heptalogos Configuration and Data

## Authority route

Corpus root: `../../../Architecture_Corpus/`  
Route index: `../../heptalogos/corpus-routes.json`

Read the route's core files, including:

- [Data / Evidence / content / persistence](../../../Architecture_Corpus/12-数据-证据-内容与持久化.md)
- [Backup / Subject portability / update / recovery](../../../Architecture_Corpus/13-备份-Subject可移植性-更新与恢复.md)
- [Configuration governance](../../../Architecture_Corpus/21-配置治理与Configuration-Surface.md)
- [Storage topology / lifecycle roots / DataOwner](../../../Architecture_Corpus/23-存储拓扑-生命周期根与DataOwner.md)
- [S04 Configuration / Secret / management surface](../../../Architecture_Corpus/specs/S04-配置-Secret-管理Surface.md)
- [S17 Storage workspace / data lifecycle](../../../Architecture_Corpus/specs/S17-Storage-Workspace-DataLifecycle.md)

Machine-readable authorities:

- [configuration-governance.json](../../../Architecture_Corpus/references/configuration-governance.json)
- [storage-governance.json](../../../Architecture_Corpus/references/storage-governance.json)

## Procedure

1. Classify every behavior-affecting literal: product invariant, installation/Subject/resource config, secret, derived state, or implementation constant.
2. Preserve `source/proposal != active`; define owner, scope, schema, default authority, constraints, visibility, manageability, activation mode, sensitivity, and runtime consumer.
3. Store secret references, not plaintext. Resolve secrets through the owning scoped service and purpose.
4. Treat ConfigurationRoot, DataRoot, BlobRoot, BackupRoot, package generations, and other lifecycle roots as independent unless the Corpus explicitly binds them.
5. Obtain persistent paths through Foundation workspace/path contracts. Do not invent extension/component persistence paths.
6. Register owner-native persistent stores through DataOwner lifecycle governance; Foundation storage mechanics do not impose a universal data model.
7. Model deletion as an owned workflow across canonical, derived/index, CAS/blob, Evidence, backup/export, and restore fences.
8. Model backup/restore by logical owners and portability semantics, not by copying one directory or dumping one database and assuming completeness.

## Stop conditions

Stop if a new config value has no real consumer, a secret would enter ordinary config/logging, portable Subject truth exists only in runtime/provider-private state, or a restore path would revive stale sessions/approvals/effects without continuity rules.
