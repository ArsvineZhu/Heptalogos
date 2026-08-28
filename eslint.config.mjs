import { parser } from "typescript-eslint";
import nxPlugin from "@nx/eslint-plugin";
import jsdocPlugin from "eslint-plugin-jsdoc";

const typescriptLanguageOptions = {
  parser,
  parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
  },
};

const sourceDocumentationRules = {
  "jsdoc/informative-docs": "error",
  "jsdoc/require-description-complete-sentence": ["error", { tags: [] }],
  "jsdoc/require-jsdoc": [
    "error",
    {
      publicOnly: true,
      enableFixer: false,
      exemptEmptyConstructors: true,
      exemptEmptyFunctions: true,
      require: {
        ClassDeclaration: true,
        FunctionDeclaration: true,
        MethodDefinition: true,
      },
      contexts: [
        "TSInterfaceDeclaration",
        "TSTypeAliasDeclaration",
        "TSEnumDeclaration",
        "TSDeclareFunction",
        "TSMethodSignature",
        "ExportNamedDeclaration > VariableDeclaration[kind='const']",
      ],
    },
  ],
};

const sourceDocumentationPlugin = {
  plugins: {
    jsdoc: jsdocPlugin,
  },
  rules: sourceDocumentationRules,
};

export default [
  {
    ignores: [
      "node_modules/**",
      "**/dist/**",
      "coverage/**",
      ".nx/**",
      ".vite/**",
      ".cache/**",
      "tests/toolchain/ts6-api-lane.ts",
    ],
  },
  {
    files: [
      "packages/*/src/**/*.ts",
      "packages/*/src/**/*.tsx",
      "tools/*/src/**/*.{js,mjs,ts}",
      "scripts/**/*.{js,mjs,ts}",
      ".agents/**/*.mjs",
    ],
    ...sourceDocumentationPlugin,
  },
  {
    files: ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"],
    languageOptions: typescriptLanguageOptions,
  },
  {
    files: [
      "packages/*/src/**/*.ts",
      "packages/*/src/**/*.tsx",
      "tools/*/src/**/*.{js,mjs,ts}",
      "scripts/**/*.{js,mjs,ts}",
      ".agents/**/*.mjs",
    ],
    ...sourceDocumentationPlugin,
    rules: {
      ...sourceDocumentationRules,
      "jsdoc/require-file-overview": [
        "error",
        {
          tags: {
            module: {
              mustExist: true,
              initialCommentsOnly: true,
              preventDuplicates: true,
            },
          },
        },
      ],
    },
  },
  {
    files: ["packages/*/src/index.ts"],
    ...sourceDocumentationPlugin,
    rules: {
      ...sourceDocumentationRules,
      "jsdoc/require-file-overview": [
        "error",
        {
          tags: {
            packageDocumentation: {
              mustExist: true,
              initialCommentsOnly: true,
              preventDuplicates: true,
            },
          },
        },
      ],
    },
  },
  {
    files: ["packages/*/src/**/*.ts"],
    languageOptions: typescriptLanguageOptions,
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
