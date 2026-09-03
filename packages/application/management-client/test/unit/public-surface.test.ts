import { describe, expect, it } from "vitest";
import {
  createManagementClient,
  type CapabilityGraphResult,
  type RuntimeGraphResult,
} from "../../src/index.js";
import * as managementClientPublic from "../../src/index.js";

describe("ManagementClient public facade", () => {
  it("keeps generated transport and modules closure-private", () => {
    expect(Object.keys(managementClientPublic).sort()).toEqual([
      "ManagementClientError",
      "createManagementClient",
    ]);
    const client = createManagementClient({ origin: "http://127.0.0.1:1" });
    expect("transport" in client).toBe(false);
  });

  it("exposes strongly typed Runtime and Capability graph results", () => {
    const runtimeConsumer = (value: RuntimeGraphResult) =>
      value.data.systems.map((system) => ({
        role: system.role,
        actualState: system.actualState,
        serviceIds: system.serviceRequirements.map((item) => item.serviceId),
      }));
    const capabilityConsumer = (value: CapabilityGraphResult) =>
      value.data.capabilities.flatMap((entry) =>
        entry.providers.map((provider) => provider.providerId),
      );
    expect(runtimeConsumer).toBeTypeOf("function");
    expect(capabilityConsumer).toBeTypeOf("function");
  });

  it("generates only from the ProductHost-owned OpenAPI artifact", async () => {
    const source = await readFile(
      resolve("packages/application/management-client/scripts/generate.mjs"),
      "utf8",
    );
    expect(source).toContain("product-host/generated/management.openapi.json");
    expect(source).not.toContain("product-host/dist");
    expect(source).not.toContain("createManagementHttpApp");
  });
});
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
