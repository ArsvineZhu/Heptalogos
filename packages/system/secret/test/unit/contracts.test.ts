import { describe, expect, it } from "vitest";
import { compileSchema } from "@heptalogos/schema-runtime";
import {
  secretMetadataSchema,
  secretResolutionContextSchema,
  secretSetInputSchema,
} from "../../src/index.js";

describe("Secret current contracts", () => {
  it("validates redacted metadata without a material field", () => {
    const metadata = {
      schemaVersion: 1,
      secretId: "01j00000000000000000000000",
      state: "ACTIVE",
      purpose: "provider.openai.api-key",
      scopeRef: {
        schemaVersion: 1,
        resourceKind: "provider-profile",
        resourceId: "01j00000000000000000000001",
      },
      backendKind: "os-credential",
      createdAt: "2026-09-03T00:00:00.000Z",
    };
    expect(compileSchema(secretMetadataSchema).validate(metadata).ok).toBe(true);
    expect(
      compileSchema(secretMetadataSchema).validate({ ...metadata, material: "secret" })
        .ok,
    ).toBe(false);
  });

  it("keeps protected input and exact resolution context bounded", () => {
    expect(
      compileSchema(secretSetInputSchema).validate({
        purpose: "provider.openai.api-key",
        scopeRef: {
          schemaVersion: 1,
          resourceKind: "provider-profile",
          resourceId: "01j00000000000000000000001",
        },
        material: "protected-input",
      }).ok,
    ).toBe(true);
    expect(
      compileSchema(secretResolutionContextSchema).validate({
        consumer: "system.ai-runtime",
        purpose: "provider.openai.api-key",
      }).ok,
    ).toBe(true);
  });
});
