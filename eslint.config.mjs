import { parser, plugin } from "typescript-eslint";
import nxPlugin from "@nx/eslint-plugin";

const packageSourceFiles = ["packages/**/*.ts"];

function restrictPackageImportsOutside(packageName, allowedFiles, message) {
  return {
    files: packageSourceFiles,
    ignores: allowedFiles,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: packageName, message }],
          patterns: [{ group: [`${packageName}/**`], message }],
        },
      ],
    },
  };
}

function restrictExactImportsOutside(specifier, allowedFiles, message) {
  return {
    files: packageSourceFiles,
    ignores: allowedFiles,
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: specifier, message }] }],
    },
  };
}

const restrictedImportRules = [
  restrictPackageImportsOutside(
    "@heptalogos/repo-kit",
    [],
    "Repository tooling must not enter product package source.",
  ),
  restrictPackageImportsOutside(
    "knip",
    [],
    "Repository analysis tooling must not enter product package source.",
  ),
  restrictPackageImportsOutside(
    "prettier",
    [],
    "Repository formatting tooling must not enter product package source.",
  ),
  restrictPackageImportsOutside(
    "ajv",
    [
      "packages/schema-runtime/**",
      "packages/bootstrap-state/src/codec.ts",
      "packages/bootstrap-state/src/journal.ts",
      "packages/bootstrap-state/src/bootstrap-owner-witness-codec.ts",
      "packages/bootstrap-state/src/maintenance-codec.ts",
      "packages/bootstrap-runtime/src/locator.ts",
    ],
    "Ajv mechanics belong behind the SchemaRuntime/bootstrap schema adapters.",
  ),
  restrictPackageImportsOutside(
    "typebox",
    [
      "packages/schema-runtime/**",
      "packages/bootstrap-state/src/codec.ts",
      "packages/bootstrap-state/src/journal.ts",
      "packages/bootstrap-state/src/bootstrap-owner-witness-codec.ts",
      "packages/bootstrap-state/src/maintenance-codec.ts",
      "packages/bootstrap-runtime/src/locator.ts",
    ],
    "TypeBox mechanics belong behind the SchemaRuntime/bootstrap schema adapters.",
  ),
  restrictExactImportsOutside(
    "@heptalogos/canonical-schema",
    [
      "packages/bootstrap-runtime/test/integration/canonical-initialization.integration.test.ts",
      "packages/bootstrap-runtime/test/support/canonical-postgres.ts",
    ],
    "Canonical schema internals are consumed by the explicit integration fixtures only.",
  ),
  restrictPackageImportsOutside(
    "@opentelemetry/api",
    [
      "packages/execution-lineage/src/observability-adapter.ts",
      "packages/execution-lineage/test/unit/execution-context-runtime.test.ts",
    ],
    "OpenTelemetry mechanics belong behind the execution-lineage observability adapter.",
  ),
  restrictPackageImportsOutside(
    "cordis",
    ["packages/runtime-substrate/**"],
    "Cordis mechanics belong behind RuntimeSubstrate.",
  ),
  restrictPackageImportsOutside(
    "@dagrejs/graphlib",
    ["packages/runtime-kernel/**"],
    "Graphlib mechanics belong behind the Runtime Kernel graph adapter.",
  ),
  restrictExactImportsOutside(
    "@heptalogos/execution-lineage/runtime-kernel",
    ["packages/runtime-kernel/**"],
    "The Runtime Kernel may use only its explicit execution-lineage adapter subpath.",
  ),
  restrictPackageImportsOutside(
    "@heptalogos/bootstrap-state",
    ["packages/bootstrap-runtime/**", "packages/bootstrap-state/**"],
    "BootstrapState is limited to its owning bootstrap packages.",
  ),
  restrictPackageImportsOutside(
    "@heptalogos/private-postgres",
    [
      "packages/private-postgres/**",
      "packages/bootstrap-runtime/**",
      "packages/host-ownership/test/integration/host-ownership.integration.test.ts",
      "packages/persistence/test/integration/persistence.integration.test.ts",
    ],
    "Private PostgreSQL mechanics are limited to their owner and explicit bootstrap integration boundaries.",
  ),
  restrictExactImportsOutside(
    "@bybrave/proper-lockfile2",
    ["packages/bootstrap-runtime/src/bootstrap-ownership.ts"],
    "The bootstrap lock provider is limited to the bootstrap ownership adapter.",
  ),
  restrictExactImportsOutside(
    "execa",
    ["packages/private-postgres/src/process-adapter.ts"],
    "Process execution mechanics are limited to the private PostgreSQL process adapter.",
  ),
  restrictPackageImportsOutside(
    "pg",
    [
      "packages/host-ownership/**",
      "packages/persistence/**",
      "packages/canonical-schema/**",
      "packages/signal/**",
      "packages/bootstrap-runtime/test/integration/host-maintenance.integration.test.ts",
      "packages/bootstrap-runtime/test/integration/bootstrap-recovery.integration.test.ts",
      "packages/bootstrap-runtime/test/integration/canonical-initialization.integration.test.ts",
      "packages/bootstrap-runtime/test/support/canonical-postgres.ts",
    ],
    "The pg driver is limited to persistence/ownership adapters and explicit integration fixtures.",
  ),
  restrictPackageImportsOutside(
    "kysely",
    [
      "packages/persistence/**",
      "packages/canonical-schema/**",
      "packages/signal/**",
      "packages/work-queue/**",
      "packages/execution-lineage/src/activity-repository.ts",
      "packages/evidence/src/evidence-service.ts",
      "packages/bootstrap-runtime/test/integration/execution-foundation.integration.test.ts",
    ],
    "Kysely mechanics are limited to repository/migration adapters and explicit integration fixtures.",
  ),
  restrictExactImportsOutside(
    "@heptalogos/persistence/foundation-repository",
    [
      "packages/execution-lineage/**",
      "packages/evidence/**",
      "packages/persistence/**",
      "packages/signal/**",
      "packages/work-queue/**",
      "packages/bootstrap-runtime/test/integration/execution-foundation.integration.test.ts",
    ],
    "The persistence foundation repository is an explicit internal adapter subpath.",
  ),
  restrictExactImportsOutside(
    "@heptalogos/work-queue/foundation-repository",
    [
      "packages/work-queue/**",
      "packages/bootstrap-runtime/test/integration/durable-work-host.integration.test.ts",
    ],
    "The WorkQueue foundation repository is an explicit internal adapter subpath.",
  ),
];

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
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
  ...restrictedImportRules,
];
