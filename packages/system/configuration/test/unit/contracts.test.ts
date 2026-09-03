import { describe, expect, it } from "vitest";
import { compileSchema } from "@heptalogos/schema-runtime";
import {
  configurationActivateInputSchema,
  configurationRevisionCreateInputSchema,
  providerTransportConfigSchema,
} from "../../src/index.js";

describe("Configuration current contracts", () => {
  it("accepts the bounded provider transport value and rejects out-of-range values", () => {
    const validator = compileSchema(providerTransportConfigSchema);
    expect(
      validator.validate({
        schemaVersion: 1,
        timeoutMs: 60_000,
        requestBodyBudgetBytes: 60_000,
        responseBodyBudgetBytes: 1_048_576,
        expandedResponseBodyBudgetBytes: 4_194_304,
      }).ok,
    ).toBe(true);
    expect(
      validator.validate({
        schemaVersion: 1,
        timeoutMs: 999,
        requestBodyBudgetBytes: 60_000,
        responseBodyBudgetBytes: 1_048_576,
        expandedResponseBodyBudgetBytes: 4_194_304,
      }).ok,
    ).toBe(false);
  });

  it("keeps revision and activation inputs strict", () => {
    expect(
      compileSchema(configurationRevisionCreateInputSchema).validate({
        definitionId: "ai.provider.transport.v1",
        scopeRef: {
          schemaVersion: 1,
          resourceKind: "installation",
          resourceId: "installation-1",
        },
        value: {
          schemaVersion: 1,
          timeoutMs: 60_000,
          requestBodyBudgetBytes: 60_000,
          responseBodyBudgetBytes: 1_048_576,
          expandedResponseBodyBudgetBytes: 4_194_304,
        },
      }).ok,
    ).toBe(true);
    expect(
      compileSchema(configurationActivateInputSchema).validate({
        revisionId: "01j00000000000000000000000",
        unexpected: true,
      }).ok,
    ).toBe(false);
  });
});
