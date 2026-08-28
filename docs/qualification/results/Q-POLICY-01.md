# Q-POLICY-01 资格证据

```yaml
qualificationId: Q-POLICY-01
role: Cedar runtime binding
evidenceStatus: PASS
preImplementationDecisionState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
selectedRoute: "`@cedar-policy/cedar-wasm`"
```

## Observed properties

```yaml
evidence:
  permit: PASS
  forbid_precedence: PASS
  unknown_action: PASS
  invalid_policy: PASS
  malformed_binding: PASS
  cedar_authorization_l0: PASS
  raw_wasm_comparison: NOT_RUN
  source_less_closure: NOT_RUN
```

## NOT_RUN / deferred properties

- `raw_wasm_comparison`: Raw cedar-wasm was not added as a competing provider; source-less/native closure requires a separate L2/L3 qualification.
- `source_less_closure`: Source-less/native closure is L3 product evidence.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

WASM loading/source-less and exact PolicyService integration remain implementation qualification.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。
