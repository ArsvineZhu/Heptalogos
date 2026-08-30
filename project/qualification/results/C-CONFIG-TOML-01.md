# C-CONFIG-TOML-01 资格证据

```yaml
qualificationId: C-CONFIG-TOML-01
evidenceStatus: PASS
qualificationState: CLOSED
roleDecision: ADOPTED
implementationQualification: NOT_REQUIRED
testedProperty: "js-toml round-trip, depth/invalid/undefined errors, local datetime, Unicode and newline preservation"
```

## Observed properties

```yaml
evidence:
  round_trip: PASS
  depth_error: PASS
  local_datetime: PASS
  undefined_failure: PASS
  unicode_newline: PASS
  invalid_toml: PASS
```

## NOT_RUN / deferred properties

- none

## Authority boundary

本记录只描述已观察到的 conformance properties。`RoleDecision` 读取 `../dependency-status.json`；未运行的 platform/native/source-less/product property 由 `ImplementationQualification` 管理，不能据此自行更换已采用 route。
