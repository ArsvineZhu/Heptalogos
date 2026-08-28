# C-SCHEMA-01 资格证据

```yaml
qualificationId: C-SCHEMA-01
evidenceStatus: PASS
qualificationState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "JCS vectors, number/Unicode/non-I-JSON boundaries, Ajv non-mutation, unknown diagnostics, and Fastify validator"
```

## Observed properties

```yaml
evidence:
  jcs_basic_vector: PASS
  number_edges: PASS
  unicode_ordering: PASS
  non_i_json_rejection: PASS
  ajv_non_mutating: PASS
  unknown_field_diagnostic: PASS
  fastify_custom_compiler: PASS
  formal_route_version_review: PASS
```

## NOT_RUN / deferred properties

- none

## Authority boundary

本记录只描述已观察到的 conformance properties。`RoleDecision` 读取 `../dependency-status.json`；未运行的 platform/native/source-less/product property 由 `ImplementationQualification` 管理，不能据此自行更换已采用 route。
