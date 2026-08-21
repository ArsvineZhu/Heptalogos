import { describe, expect, it } from "vitest";

import { getRuntimeStatus } from "./index.js";

describe("clean-room runtime skeleton", () => {
  it("reports the genesis-ready status", () => {
    expect(getRuntimeStatus()).toBe("GENESIS_READY");
  });
});
