# C-STORAGE-FS-01 资格证据

```yaml
qualificationId: C-STORAGE-FS-01
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "Scoped traversal, absolute/junction escape, case collision, bounded depth/filter, atomic replacement, and watcher close"
```

## Observed properties

```yaml
evidence:
  dotdot_escape: PASS
  absolute_escape: PASS
  symlink_junction_escape: PASS
  case_normalization_collision: PASS
  depth_filter: PASS
  concurrent_atomic_replace: PASS
  watch_change_and_close: PASS
  posix_symlink_escape: NOT_RUN
  macos_linux_path_behavior: NOT_RUN
```

## NOT_RUN / deferred properties

- `posix_symlink_escape`: The current Windows run exercises junction/reparse behavior instead.
- `macos_linux_path_behavior`: No macOS/Linux host was available.

## Authority boundary

本记录只描述已观察到的 conformance properties。`RoleDecision` 读取 `../dependency-status.json`；未运行的 platform/native/source-less/product property 由 `ImplementationQualification` 管理，不能据此自行更换已采用 route。
