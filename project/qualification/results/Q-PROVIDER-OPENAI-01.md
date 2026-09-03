# Q-PROVIDER-OPENAI-01 OpenAI Responses provider qualification

```yaml
qualificationId: Q-PROVIDER-OPENAI-01
role: one real OpenAI Responses structured-output route through current Product owners
date: 2026-09-03
evidenceStatus: BLOCKED
implementationQualification: PASS
liveProviderQualification: BLOCKED
testedProperty: "Provider prerequisite configuration, protected SecretRef resolution, NetworkAccess policy, AI SDK structured-output invocation boundary, and Product Host restart persistence"
```

## Implemented route and local evidence

```yaml
providerKind: openai
aiSdk: "ai 7.0.91"
officialProvider: "@ai-sdk/openai 4.0.57"
api: OpenAI Responses API
origin: https://api.openai.com
path: /v1/**
providerConstruction: "createOpenAI({ apiKey, fetch })"
modelSelection: "openai.responses(model)"
generation: "generateText + Output.object(jsonSchema(...))"
providerStore: false
qualificationModel: gpt-5.6-luna
modelCapabilities:
  - text-generation
  - structured-output
  - usage-metadata
  - abort-timeout
invocationBudget: maxOutputTokens
bindings:
  - subject.primary
  - subject.expression
configurationDefinition: ai.provider.transport.v1
networkProfile: network-access.openai-api.v1
secretPurpose: provider.openai.api-key
secretConsumer: system.ai-runtime
secretScope: provider-profile
```

The local owner/unit and Product Host proofs are PASS. The Windows Product
Host integration exercised Management plan/execute, redacted action planning,
configuration activation, protected Secret metadata, provider/model/binding
readiness, stale-plan rejection, and persistence across a built Host restart.
The qualification harness is manually dispatched and remains outside normal
`pnpm verify`.

## Live provider claim

```yaml
protectedApiKeyInput: BLOCKED
liveResponsesRequest: NOT_RUN
liveStructuredOutput: NOT_RUN
liveProviderEvidence: NOT_RUN
```

No protected OpenAI API key was supplied to the harness in this execution.
The live claim is therefore BLOCKED, not PASS or inferred from mocks/local
unit tests. No API key, authorization header, raw provider request/response,
OS credential locator, or provider body is recorded here.

This record owns only evidence status. It does not qualify another platform,
a source-less artifact, a service installation, a second provider, or any
Subject implementation.
