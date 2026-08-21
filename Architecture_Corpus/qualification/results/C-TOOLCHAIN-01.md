# C-TOOLCHAIN-01 资格证据

```yaml
qualificationId: C-TOOLCHAIN-01
evidenceStatus: PASS
qualificationState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "TS7 canonical compiler, consumer declarations, NodeNext ESM, Node24 types, skipLibCheck=false, and isolated TS6 tooling lane"
```

## Observed properties

```yaml
evidence:
  ts7_canonical_compiler: PASS
  ts7_representative_dependency_consumer_compile: PASS
  esnext_nodenext_esm_compile: PASS
  node24_types_alignment: PASS
  skip_lib_check_false_gate: PASS
  ts6_api_lane_isolation: PASS
  hey_api_generator_ts6_compatibility_lane: PASS
  hey_api_generator_ts7_published_declarations: NOT_RUN
  typescript_eslint_ts6_api_constraint: PASS
  nx_ts7_ts6_side_by_side_model: PASS
```

## NOT_RUN / deferred properties

- `hey_api_generator_ts7_published_declarations`: Hey API generator is deliberately isolated to the TS6 compiler-API compatibility lane; generated ManagementClient output is covered by C-MGMT-01.

## Authority boundary

本记录只描述已观察到的 conformance properties。`RoleDecision` 读取 `../dependency-status.json`；未运行的 platform/native/source-less/product property 由 `ImplementationQualification` 管理，不能据此自行更换已采用 route。
