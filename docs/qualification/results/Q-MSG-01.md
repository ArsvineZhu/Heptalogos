# Q-MSG-01 资格证据

```yaml
qualificationId: Q-MSG-01
role: OneBot/Milky messaging interop
evidenceStatus: PASS
preImplementationDecisionState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
selectedRoute: "direct thin OneBot/Milky anti-corruption adapters"
```

## Observed properties

```yaml
evidence:
  milky_text_reply_media: PASS
  onebot_mapping: PASS
  satori_mapping: PASS
  rich_mixed_segments: PASS
  edit_delete: PASS
  unknown_segment_retention: PASS
  nullability_id_time: PASS
  direct_thin_adapter_l1: PASS
  live_protocol: NOT_RUN
  satori_outside_current_route_l2: NOT_RUN
```

## NOT_RUN / deferred properties

- `live_protocol`: No real OneBot/Milky session is allowed in this Pilot.
- `satori_outside_current_route_l2`: Satori runtime/package reuse is outside the current Foundation route; no L2 reuse proof is required for the adopted direct-adapter route.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Real OneBot/Milky protocol conformance remains implementation qualification. Satori runtime/package reuse is outside the current Foundation route and therefore is not a pending alternative to this RoleDecision.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。
