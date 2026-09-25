import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config.js";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["qualification/**/*.test.ts"],
      testTimeout: 900_000,
      hookTimeout: 180_000,
    },
  }),
);
