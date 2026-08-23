import { builtinModules } from "node:module";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverWorkspacePackages,
  packageRoutes,
  repositoryToolingPackages,
} from "@heptalogos/repo-kit";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const errors = [];
const packageJsonCache = new Map();
const ignoredDirectories = new Set([
  ".git",
  ".nx",
  ".pnpm-store",
  ".vite",
  ".cache",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);
const builtins = new Set([
  ...builtinModules,
  ...builtinModules
    .filter((name) => !name.startsWith("node:"))
    .map((name) => `node:${name}`),
]);

const restrictedImports = new Map([
  [
    "@heptalogos/bootstrap-state",
    ["packages/bootstrap-runtime/", "packages/bootstrap-state/"],
  ],
  [
    "@heptalogos/private-postgres",
    [
      "packages/private-postgres/",
      "packages/bootstrap-runtime/",
      "packages/host-ownership/src/host-ownership.integration.test.ts",
    ],
  ],
  [
    "@bybrave/proper-lockfile2",
    ["packages/bootstrap-runtime/src/bootstrap-ownership.ts"],
  ],
  ["execa", ["packages/private-postgres/src/process-adapter.ts"]],
  [
    "pg",
    [
      "packages/host-ownership/",
      "packages/bootstrap-runtime/src/host-maintenance.integration.test.ts",
      "packages/bootstrap-runtime/src/bootstrap-recovery.integration.test.ts",
    ],
  ],
]);

const hostOwnershipSourcePrefix = "packages/host-ownership/src/";
const hostOwnershipAdapterSourcePaths = new Set([
  "packages/host-ownership/src/bootstrap-admin.ts",
  "packages/host-ownership/src/host-lease-connection.ts",
]);
const hostOwnershipPublicSource = readFileSync(
  resolve(root, "packages/host-ownership/src/index.ts"),
  "utf8",
);
if (/\b(?:Client|Pool|XState|StateMachine)\b/u.test(hostOwnershipPublicSource)) {
  errors.push(
    "packages/host-ownership/src/index.ts: raw PostgreSQL/XState mechanics must not leak through the public Host ownership contract",
  );
}

const bootstrapRuntimePublicSource = readFileSync(
  resolve(root, "packages/bootstrap-runtime/src/index.ts"),
  "utf8",
);
const rawBootstrapAuthorityExports = [
  "acquireBootstrapOwnership",
  "acquireBootstrapRecoveryLease",
  "reclaimAbandonedBootstrapOwnership",
  "recoverAbandonedBootstrapToHost",
  "recoverInterruptedHostMaintenance",
  "openMaintenanceStateAccess",
  "OwnedMaintenanceStateAccess",
  "BOOTSTRAP_RECOVERY_STALE_MS",
  "assertLocalInstallationOwnerFor",
];
if (
  rawBootstrapAuthorityExports.some((name) =>
    new RegExp(`\\b${name}\\b`, "u").test(bootstrapRuntimePublicSource),
  )
) {
  errors.push(
    "packages/bootstrap-runtime/src/index.ts: raw bootstrap/recovery Authority primitive leaked through the public bootstrap-runtime contract",
  );
}

export function isRestrictedImportAllowed(specifier, relativePath) {
  const allowedPaths = restrictedImports.get(specifier);
  if (!allowedPaths) return true;
  const normalizedPath = relativePath.replaceAll("\\", "/");
  return allowedPaths.some((allowedPath) =>
    allowedPath.endsWith("/")
      ? normalizedPath.startsWith(allowedPath)
      : normalizedPath === allowedPath,
  );
}

export function isCrossWorkspaceRelativeImport({
  sourcePackageName,
  targetPackageName,
}) {
  return (
    typeof sourcePackageName === "string" &&
    typeof targetPackageName === "string" &&
    sourcePackageName !== targetPackageName
  );
}

function collect(directory, matcher, files = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) collect(path, matcher, files);
    } else if (entry.isFile() && matcher(path, entry.name)) {
      files.push(path);
    }
  }
  return files;
}

function packageName(specifier) {
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

const workspacePackageNames = new Set(
  (await discoverWorkspacePackages({ cwd: root }))
    .map(({ name }) => name)
    .filter((name) => typeof name === "string" && name.length > 0),
);

function packageJsonFor(file) {
  let directory = dirname(file);
  while (directory === root || directory.startsWith(`${root}${sep}`)) {
    if (packageJsonCache.has(directory)) return packageJsonCache.get(directory);
    const packagePath = join(directory, "package.json");
    if (existsSync(packagePath)) {
      const value = JSON.parse(readFileSync(packagePath, "utf8"));
      packageJsonCache.set(directory, value);
      return value;
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return {};
}

function declaredDependencies(manifest) {
  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);
}

function isLocalImport(specifier) {
  return (
    specifier === "." ||
    specifier === ".." ||
    specifier.startsWith("./") ||
    specifier.startsWith("../")
  );
}

const sourcePaths = collect(root, (sourcePath) => /\.(?:ts|tsx)$/u.test(sourcePath));
for (const path of sourcePaths) {
  const relativePath = relative(root, path).replaceAll("\\", "/");
  const source = readFileSync(path, "utf8");
  if (relativePath.startsWith(hostOwnershipSourcePrefix)) {
    for (const forbidden of ["Kysely", "DBOS", "PersistenceService"]) {
      if (new RegExp(`\\b${forbidden}\\b`, "u").test(source)) {
        errors.push(
          `${relativePath}: Host ownership must not materialize ${forbidden}`,
        );
      }
    }
    if (
      /(?:from|import\s*\()\s*["'](?:kysely|dbos|@dbos-inc\/dbos-sdk)["']/u.test(source)
    ) {
      errors.push(`${relativePath}: Host ownership must not import Kysely or DBOS`);
    }
  }
  if (
    source.includes("createHostOwnershipToken") &&
    !(
      relativePath === "packages/foundation-contracts/src/identity.ts" ||
      relativePath === "packages/foundation-contracts/src/index.ts" ||
      relativePath.startsWith(hostOwnershipSourcePrefix) ||
      relativePath === "packages/bootstrap-runtime/src/host-ownership-handoff.ts" ||
      relativePath.endsWith(".test.ts")
    )
  ) {
    errors.push(
      `${relativePath}: HostOwnershipToken creation is outside the Host acquisition path`,
    );
  }
  if (
    relativePath.startsWith(hostOwnershipSourcePrefix) &&
    !hostOwnershipAdapterSourcePaths.has(relativePath) &&
    !relativePath.endsWith(".test.ts") &&
    /from\s+["']pg["']/u.test(source)
  ) {
    errors.push(
      `${relativePath}: raw pg imports are restricted to the Host ownership adapters or tests`,
    );
  }
  const projectPackage = packageJsonFor(path);
  const declared = declaredDependencies(projectPackage);
  const importPattern =
    /(?:from\s+|import\s*\(\s*|import\s+|require\s*\(\s*)(["'])([^"']+)\1/g;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[2];
    if (isLocalImport(specifier)) {
      const resolvedImport = resolve(dirname(path), specifier);
      if (resolvedImport !== root && !resolvedImport.startsWith(`${root}${sep}`)) {
        errors.push(
          `${relativePath}: relative import escapes repository: ${specifier}`,
        );
        continue;
      }
      const targetPackage = packageJsonFor(resolvedImport);
      if (
        isCrossWorkspaceRelativeImport({
          sourcePackageName: projectPackage.name,
          targetPackageName: targetPackage.name,
        })
      ) {
        errors.push(
          `${relativePath}: cross-workspace relative import is not allowed: ${specifier}`,
        );
      }
      continue;
    }
    if (specifier.startsWith("node:")) {
      if (!builtins.has(specifier)) {
        errors.push(`${relativePath}: unknown Node builtin import: ${specifier}`);
      }
      continue;
    }

    const dependency = packageName(specifier);
    if (!isRestrictedImportAllowed(dependency, relativePath)) {
      errors.push(
        `${relativePath}: restricted import is not allowed here: ${specifier}`,
      );
      continue;
    }
    const isWorkspaceDependency = workspacePackageNames.has(dependency);
    if (!declared.has(dependency) && dependency !== projectPackage.name) {
      errors.push(
        `${relativePath}: undeclared ${isWorkspaceDependency ? "workspace" : "external"} import: ${specifier}`,
      );
      continue;
    }
    if (isWorkspaceDependency) {
      continue;
    }
    if (repositoryToolingPackages.has(dependency)) {
      errors.push(
        `${relativePath}: repository tooling import must not enter source: ${specifier}`,
      );
      continue;
    }

    const route = packageRoutes.get(dependency);
    if (!route) {
      errors.push(
        `${relativePath}: external import has no Corpus package identity: ${specifier}`,
      );
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "PASS source dependencies; relative imports are local, Node builtins are builtin, and package imports are classified",
  );
}
