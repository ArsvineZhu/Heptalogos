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
  const projectPackage = packageJsonFor(path);
  const declared = declaredDependencies(projectPackage);
  const importPattern = /(?:from\s+|import\s*\(\s*|import\s+)(["'])([^"']+)\1/g;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[2];
    if (isLocalImport(specifier)) {
      const resolvedImport = resolve(dirname(path), specifier);
      if (resolvedImport !== root && !resolvedImport.startsWith(`${root}${sep}`)) {
        errors.push(
          `${relativePath}: relative import escapes repository: ${specifier}`,
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
    const isWorkspaceDependency = workspacePackageNames.has(dependency);
    if (!declared.has(dependency)) {
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
