import { describe, expect, it } from "vitest";
import { asContentDigest, digestCanonicalJson } from "@heptalogos/foundation-contracts";
import {
  BOOTSTRAP_STATE_DIGEST_DOMAIN,
  parseBootstrapState,
  sealBootstrapState,
} from "./codec.js";
import type { BootstrapStateBodyV1 } from "./model.js";

function makeState(): BootstrapStateBodyV1 {
  return {
    schemaVersion: 1,
    revision: 1,
    activeBootstrapRuntimeGeneration: asContentDigest(
      "BootstrapRuntimeGenerationId",
      digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "bootstrap" }),
    ),
    activeProductGeneration: asContentDigest(
      "ProductGenerationId",
      digestCanonicalJson("test.product-generation/v1", { generation: "product" }),
    ),
  };
}

describe("BootstrapState codec", () => {
  it("seals and parses a valid state", () => {
    const sealed = sealBootstrapState(makeState());
    const result = parseBootstrapState(JSON.stringify(sealed));

    expect(result).toEqual({ ok: true, value: sealed });
    expect(sealed.digest.domain).toBe(BOOTSTRAP_STATE_DIGEST_DOMAIN);
  });

  it("rejects a state digest mismatch", () => {
    const sealed = sealBootstrapState(makeState());
    const text = JSON.stringify({
      ...sealed,
      digest: { ...sealed.digest, hex: "0".repeat(64) },
    });

    const result = parseBootstrapState(text);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.problem.problemCode).toBe("bootstrap.state.digest_mismatch");
  });

  it("rejects unknown top-level and state fields", () => {
    const sealed = sealBootstrapState(makeState());
    const topLevel = parseBootstrapState(
      JSON.stringify({ ...sealed, unexpected: true }),
    );
    const stateLevel = parseBootstrapState(
      JSON.stringify({ ...sealed, state: { ...sealed.state, unexpected: true } }),
    );

    expect(topLevel.ok).toBe(false);
    expect(stateLevel.ok).toBe(false);
    if (!topLevel.ok)
      expect(topLevel.problem.problemCode).toBe("bootstrap.state.invalid_schema");
    if (!stateLevel.ok)
      expect(stateLevel.problem.problemCode).toBe("bootstrap.state.invalid_schema");
  });

  it("rejects revision values that are zero, negative, or non-integer", () => {
    for (const revision of [0, -1, 1.5]) {
      const state = { ...makeState(), revision } as BootstrapStateBodyV1;
      const result = parseBootstrapState(JSON.stringify(sealBootstrapState(state)));
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.problem.problemCode).toBe("bootstrap.state.invalid_schema");
    }
  });

  it("rejects missing generation references", () => {
    const { activeProductGeneration: _product, ...withoutProduct } = makeState();
    const result = parseBootstrapState(
      JSON.stringify(sealBootstrapState(withoutProduct as BootstrapStateBodyV1)),
    );

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.problem.problemCode).toBe("bootstrap.state.invalid_schema");
  });

  it("does not coerce a string revision into a number", () => {
    const sealed = sealBootstrapState(makeState());
    const raw = { ...sealed, state: { ...sealed.state, revision: "1" } };
    const result = parseBootstrapState(JSON.stringify(raw));

    expect(raw.state.revision).toBe("1");
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.problem.problemCode).toBe("bootstrap.state.invalid_schema");
  });

  it("rejects generation references that are not lowercase SHA-256 digests", () => {
    const sealed = sealBootstrapState(makeState());
    const invalid = {
      ...sealed,
      state: { ...sealed.state, activeProductGeneration: "banana" },
    };

    const result = parseBootstrapState(JSON.stringify(invalid));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.problemCode).toBe("bootstrap.state.invalid_schema");
    }
  });

  it("keeps parser and schema details stable and bounded", () => {
    const invalidJson = parseBootstrapState('{"state":');
    const invalidSchema = parseBootstrapState(
      JSON.stringify({ state: {}, digest: {} }),
    );

    expect(invalidJson).toMatchObject({
      ok: false,
      problem: {
        detail: "Bootstrap state JSON could not be parsed",
      },
    });
    expect(invalidSchema).toMatchObject({
      ok: false,
      problem: {
        detail: "Bootstrap state does not match the supported schema",
      },
    });
  });
});
