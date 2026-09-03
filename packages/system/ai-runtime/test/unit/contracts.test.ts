import { describe, expect, it } from "vitest";
import { compileSchema } from "@heptalogos/schema-runtime";
import {
  CURRENT_MODEL_CAPABILITIES,
  modelBindingSchema,
  modelProfileSchema,
  providerProfileSchema,
} from "../../src/index.js";

describe("AIRuntime current contracts", () => {
  it("keeps the exact four-capability and two-binding surface", () => {
    expect(CURRENT_MODEL_CAPABILITIES).toEqual([
      "text-generation",
      "structured-output",
      "usage-metadata",
      "abort-timeout",
    ]);
    expect(
      compileSchema(modelBindingSchema).validate({
        schemaVersion: 1,
        modelBindingId: "01j00000000000000000000000",
        role: "subject.primary",
        modelProfileId: "01j00000000000000000000001",
        revision: 1,
        enabled: true,
      }).ok,
    ).toBe(true);
    expect(
      compileSchema(modelBindingSchema).validate({
        schemaVersion: 1,
        modelBindingId: "01j00000000000000000000000",
        role: "operator",
        modelProfileId: "01j00000000000000000000001",
        revision: 1,
        enabled: true,
      }).ok,
    ).toBe(false);
  });

  it("requires the fixed OpenAI Responses settings", () => {
    const base = {
      schemaVersion: 1,
      providerProfileId: "01j00000000000000000000000",
      providerKind: "openai",
      configurationRevisionRef: "01j00000000000000000000001",
      secretRefs: [],
      networkAccessProfileRef: "network-access.openai-api.v1",
      enabled: false,
      providerSettings: { api: "responses", store: false },
    };
    expect(compileSchema(providerProfileSchema).validate(base).ok).toBe(true);
    expect(
      compileSchema(providerProfileSchema).validate({
        ...base,
        providerSettings: { api: "chat", store: true },
      }).ok,
    ).toBe(false);
    expect(
      compileSchema(modelProfileSchema).validate({
        schemaVersion: 1,
        modelProfileId: "01j00000000000000000000001",
        providerProfileId: "01j00000000000000000000000",
        providerModelIdentifier: "gpt-5.6-luna",
        consumedCapabilities: [...CURRENT_MODEL_CAPABILITIES],
        generation: 1,
        configurationRevisionRef: "01j00000000000000000000001",
      }).ok,
    ).toBe(true);
  });
});
