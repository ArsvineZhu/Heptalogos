import { parser, plugin } from "typescript-eslint";
import nxPlugin from "@nx/eslint-plugin";

export default [
  {
    ignores: [
      "node_modules/**",
      "**/dist/**",
      "coverage/**",
      ".nx/**",
      ".vite/**",
      ".cache/**",
      ".agents/**",
      "tests/toolchain/ts6-api-lane.ts",
    ],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": plugin,
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  {
    files: ["packages/*/src/**/*.ts"],
    plugins: {
      "@nx": nxPlugin,
    },
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          depConstraints: [
            {
              sourceTag: "kind:product",
              onlyDependOnLibsWithTags: ["kind:product"],
            },
            {
              sourceTag: "kind:tooling",
              onlyDependOnLibsWithTags: ["kind:tooling"],
            },
            {
              sourceTag: "area:shared",
              onlyDependOnLibsWithTags: ["area:shared"],
            },
            {
              sourceTag: "area:data",
              onlyDependOnLibsWithTags: ["area:shared", "area:bootstrap", "area:data"],
            },
            {
              sourceTag: "area:execution",
              onlyDependOnLibsWithTags: ["area:shared", "area:data", "area:execution"],
            },
            {
              sourceTag: "area:bootstrap",
              onlyDependOnLibsWithTags: ["area:shared", "area:bootstrap", "area:data"],
            },
            {
              sourceTag: "area:service",
              onlyDependOnLibsWithTags: [
                "area:shared",
                "area:bootstrap",
                "area:data",
                "area:execution",
                "area:service",
                "area:runtime",
              ],
              // The current WorkQueue contract includes a Runtime Kernel
              // generation-pinned handler seam; semantic checks keep that
              // exception scoped to the explicit production import.
            },
            {
              sourceTag: "area:runtime",
              onlyDependOnLibsWithTags: [
                "area:shared",
                "area:data",
                "area:execution",
                "area:runtime",
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
];
