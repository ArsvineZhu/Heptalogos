import {
  createBootId,
  createInstallationId,
  createInstanceId,
} from "@heptalogos/foundation-contracts";
import { describe, expect, it } from "vitest";
import type {
  BootstrapKeyProvider,
  BootstrapKeyRequestContext,
} from "./bootstrap-key-provider.js";

describe("BootstrapKeyProvider", () => {
  it("keeps password plaintext inside one callback-scoped lifetime", async () => {
    const context: BootstrapKeyRequestContext = {
      installationId: createInstallationId(),
      instanceId: createInstanceId(),
      bootId: createBootId(),
      purpose: "private-postgres-bootstrap-superuser",
    };
    let callbackCount = 0;
    let callbackPassword: Uint8Array | undefined;
    let providerBuffer: Uint8Array | undefined;

    const provider: BootstrapKeyProvider = {
      async withPrivatePostgresBootstrapPassword(_context, use) {
        providerBuffer = new TextEncoder().encode("M3_TEST_SCOPED_PASSWORD");
        try {
          return await use(providerBuffer);
        } finally {
          providerBuffer.fill(0);
          providerBuffer = undefined;
        }
      },
    };

    await provider.withPrivatePostgresBootstrapPassword(context, async (password) => {
      callbackCount += 1;
      callbackPassword = password;
      expect(new TextDecoder().decode(password)).toBe("M3_TEST_SCOPED_PASSWORD");
      return "used";
    });

    expect(callbackCount).toBe(1);
    expect(callbackPassword).toBeDefined();
    expect(new TextDecoder().decode(callbackPassword)).toBe(
      "\0".repeat(callbackPassword?.length ?? 0),
    );
    expect("getPassword" in provider).toBe(false);
  });
});
