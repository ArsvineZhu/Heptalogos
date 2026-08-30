# C-MGMT-01 资格证据

```yaml
qualificationId: C-MGMT-01
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "Generated ManagementClient read/mutation/Problem/operation/union/AbortSignal surfaces and dynamic action envelope"
```

## Observed properties

```yaml
evidence:
  get_read_model: PASS
  post_planned_mutation: PASS
  rfc9457_problem: PASS
  long_operation: PASS
  discriminated_union: PASS
  typed_error: PASS
  abort_signal_request_hooks: PASS
  deterministic_generation: PASS
  dynamic_action_envelope: PASS
  hey_api_generator_ts7_published_declarations: NOT_RUN
```

## NOT_RUN / deferred properties

- `hey_api_generator_ts7_published_declarations`: Hey API generator remains in TS6 API compatibility lane; generated output is exercised through the TS6 tool lane and the C-MGMT runtime fixture.

## Authority boundary

本记录只描述已观察到的 conformance properties。`RoleDecision` 读取 `../dependency-status.json`；未运行的 platform/native/source-less/product property 由 `ImplementationQualification` 管理，不能据此自行更换已采用 route。
