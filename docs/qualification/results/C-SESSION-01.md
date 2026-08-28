# C-SESSION-01 资格证据

```yaml
qualificationId: C-SESSION-01
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "Synthetic opaque server-side session issue/expiry/revoke/authEpoch/recentAuth/reload/concurrency/redaction"
```

## Observed properties

```yaml
evidence:
  issue_expiry_revoke: PASS
  auth_epoch: PASS
  recent_auth: PASS
  serialize_reload_restart: PASS
  parallel_resolve_revoke: PASS
  redaction: PASS
  PostgreSQL_canonical_state: NOT_RUN
  cookie_http_security_projection: NOT_RUN
```

## NOT_RUN / deferred properties

- `PostgreSQL_canonical_state`: This Pilot retains a synthetic contract and does not implement the canonical PostgreSQL session service.
- `cookie_http_security_projection`: HTTP cookie/security projection is outside this L1 contract probe.

## Authority boundary

本记录只描述已观察到的 conformance properties。`RoleDecision` 读取 `../dependency-status.json`；未运行的 platform/native/source-less/product property 由 `ImplementationQualification` 管理，不能据此自行更换已采用 route。
