import { builtinModules } from "node:module";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  authority,
  packageRoutes,
  repositoryToolingPackages,
  routes,
} from "../../tools/repo-kit/src/dependency-authority.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const workspacePath = join(root, "pnpm-workspace.yaml");
const workspace = readFileSync(workspacePath, "utf8");
const errors = [];
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
const nodeBuiltinNames = new Set([
  ...builtinModules,
  ...builtinModules
    .filter((name) => !name.startsWith("node:"))
    .map((name) => `node:${name}`),
]);
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

function fail(message) {
  errors.push(message);
}

function collectPackageManifests(directory, manifests = []) {
  if (!existsSync(directory)) return manifests;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        collectPackageManifests(path, manifests);
      }
    } else if (entry.isFile() && entry.name === "package.json") {
      manifests.push(path);
    }
  }
  return manifests;
}

for (const roleId of ["runtime.node", "tooling.build", "testing.foundation"]) {
  const route = routes.get(roleId);
  if (!route) fail(`dependency route missing: ${roleId}`);
  else if (route.directive !== "USE") {
    fail(`required dependency route is not adopted for use: ${roleId}`);
  }
}

const materialization = authority.repositoryMaterialization;
if (materialization?.catalogMode !== "strict") {
  fail("dependency routing requires strict catalog mode");
}
if (
  materialization?.packageReferences !==
  "workspace package.json uses catalog: references; pnpm-lock.yaml owns exact resolved closure"
) {
  fail("dependency routing package reference policy is not present");
}
if (!materialization?.packageIdentity?.includes("routes[].packages")) {
  fail("dependency routing package identity authority is not present");
}

const packageManifests = collectPackageManifests(root);
const manifests = [];
const workspacePackageNames = new Set();
for (const manifestPath of packageManifests) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifests.push({ manifest, path: manifestPath });
  if (typeof manifest.name === "string" && manifest.name.length > 0) {
    workspacePackageNames.add(manifest.name);
  } else if (manifestPath !== join(root, "package.json")) {
    fail(`${manifestPath}: workspace package manifest must declare name`);
  }
}

const externalDependencyNames = new Set();
for (const { manifest, path: manifestPath } of manifests) {
  for (const section of dependencySections) {
    for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
      if (nodeBuiltinNames.has(name)) {
        fail(
          `${manifestPath}: ${section}.${name} is a Node builtin, not a package dependency`,
        );
        continue;
      }
      if (typeof specifier !== "string") {
        fail(`${manifestPath}: ${section}.${name} must use a string specifier`);
        continue;
      }
      if (workspacePackageNames.has(name)) {
        if (!specifier.startsWith("workspace:")) {
          fail(
            `${manifestPath}: ${section}.${name} targets a workspace package and must use workspace: (got ${specifier})`,
          );
        }
        continue;
      }
      if (specifier.startsWith("workspace:")) {
        fail(
          `${manifestPath}: ${section}.${name} uses workspace: but no workspace package owns that name`,
        );
        continue;
      }
      if (specifier !== "catalog:") {
        fail(
          `${manifestPath}: ${section}.${name} must use catalog: (got ${specifier})`,
        );
      }
      externalDependencyNames.add(name);
    }
  }
}

for (const name of ["@nx/js", "@typescript/native", "typescript", "nx"]) {
  if (!externalDependencyNames.has(name)) {
    fail(`required toolchain dependency missing: ${name}`);
  }
}

for (const name of externalDependencyNames) {
  const route = packageRoutes.get(name);
  const isRepositoryTooling = repositoryToolingPackages.has(name);
  if (!route && !isRepositoryTooling) {
    fail(`external dependency has no Corpus package identity: ${name}`);
    continue;
  }
  if (route && route.directive !== "USE") {
    fail(`dependency route is not adopted for use: ${name} -> ${route.roleId}`);
  }
  if (route && isRepositoryTooling) {
    fail(
      `package identity is assigned to both a route and repository tooling: ${name}`,
    );
  }
}

function hasCatalogEntry(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*(?:["']${escaped}["']|${escaped}):\\s+`, "m").test(workspace);
}

for (const name of externalDependencyNames) {
  if (!hasCatalogEntry(name)) {
    fail(`catalog entry missing for direct external dependency: ${name}`);
  }
}

if (!/^catalogMode:\s+strict$/m.test(workspace)) fail("catalogMode is not strict");
if (!/^strictPeerDependencies:\s+true$/m.test(workspace)) {
  fail("strictPeerDependencies must be explicitly enabled");
}
if (!/^engineStrict:\s+true$/m.test(workspace)) {
  fail("engineStrict must be explicitly enabled");
}
if (!/^minimumReleaseAge:\s+1440$/m.test(workspace)) {
  fail("minimumReleaseAge must be explicitly pinned to 1440 minutes");
}
if (/^nodeLinker:/m.test(workspace)) {
  fail("nodeLinker must remain pnpm's explicit default: isolated");
}
if (!/^  ["']?@types\/node["']?:\s+24\.13\.3\s*$/m.test(workspace)) {
  fail("@types/node override is not pinned to 24.13.3");
}
if (!existsSync(join(root, "pnpm-lock.yaml"))) fail("pnpm-lock.yaml is missing");

const lockNames = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) =>
    [
      "package-lock.json",
      "yarn.lock",
      "npm-shrinkwrap.json",
      "bun.lock",
      "bun.lockb",
    ].includes(name),
  );
for (const name of lockNames) {
  fail(`second package-resolution authority present: ${name}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "PASS dependency routes; workspace/internal, external npm, Node builtin, and repository tooling categories are valid",
  );
}
