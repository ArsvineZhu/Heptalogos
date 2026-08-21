# C-CLI-01 资格证据

```yaml
qualificationId: C-CLI-01
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "oclif static read, planned mutation, dynamic action, watch, approval, completion, redacted stdin/file JSON, Problem exit, and Windows shell arguments"
```

## Observed properties

```yaml
evidence:
  status_json_stdout: PASS
  stderr_exit_projection: PASS
  typed_mutation_plan: PASS
  stdin_secret_redaction: PASS
  file_complex_json: PASS
  problem_exit_mapping: PASS
  dynamic_action: PASS
  long_operation_watch: PASS
  approval: PASS
  completion: PASS
  powershell_quoting: PASS
  cmd_quoting: PASS
  posix_quoting: NOT_RUN
```

## NOT_RUN / deferred properties

- `posix_quoting`: No POSIX shell was runnable on the recorded Windows host.

## Authority boundary

本记录只描述已观察到的 conformance properties。`RoleDecision` 读取 `../dependency-status.json`；未运行的 platform/native/source-less/product property 由 `ImplementationQualification` 管理，不能据此自行更换已采用 route。
