# C-NET-01 资格证据

```yaml
qualificationId: C-NET-01
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "Manual redirect authorization, streaming byte/decompression limits, AbortSignal/slow response, and connection reset"
```

## Observed properties

```yaml
evidence:
  manual_redirect_block: PASS
  redirect_target_reauthorization: PASS
  bounded_streaming_body_limit: PASS
  abort_timeout: PASS
  slow_response: PASS
  compressed_limit: PASS
  connection_reset: PASS
  proxy_custom_ca: NOT_RUN
  provider_sdk_transport: NOT_RUN
```

## NOT_RUN / deferred properties

- `proxy_custom_ca`: No current product provider/proxy boundary is in Pilot scope.
- `provider_sdk_transport`: No provider SDK transport was selected for this synthetic L1 probe.

## Authority boundary

本记录只描述已观察到的 conformance properties。`RoleDecision` 读取 `../dependency-status.json`；未运行的 platform/native/source-less/product property 由 `ImplementationQualification` 管理，不能据此自行更换已采用 route。
