import { parser } from "typescript-eslint";
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
    files: ["packages/*/src/**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
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
                "area:work-queue",
              ],
            },
            {
              sourceTag: "area:work-queue",
              onlyDependOnLibsWithTags: [
                "area:shared",
                "area:bootstrap",
                "area:data",
                "area:execution",
                "area:service",
                "area:work-queue",
                "area:runtime",
              ],
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
];
