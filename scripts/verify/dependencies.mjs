import { builtinModules } from "node:module";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  authority,
  discoverWorkspacePackages,
  packageRoutes,
  readPackageManagerBaseline,
  readWorkspaceCatalog,
  readWorkspaceSection,
  repositoryToolingPackages,
  resolveExpectedInstalledPackageVersions,
  routes,
} from "@heptalogos/repo-kit";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const workspacePath = join(root, "pnpm-workspace.yaml");
const workspace = readFileSync(workspacePath, "utf8");
const qualificationStatusPath = join(
  root,
  "docs",
  "qualification",
  "dependency-status.json",
);
const errors = [];
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

let workspaceCatalog = {};
let workspaceOverrides = {};
let packageManagerBaseline;
try {
  workspaceCatalog = readWorkspaceCatalog({ root });
} catch (error) {
  fail(`workspace catalog Authority is unreadable: ${error.message}`);
}
try {
  workspaceOverrides = readWorkspaceSection({ root, section: "overrides" });
} catch (error) {
  fail(`workspace overrides Authority is unreadable: ${error.message}`);
}
try {
  packageManagerBaseline = readPackageManagerBaseline({ root });
} catch (error) {
  fail(`package manager Authority is unreadable: ${error.message}`);
}

let catalogVersions = {};
try {
  catalogVersions = resolveExpectedInstalledPackageVersions({ root });
} catch (error) {
  fail(`catalog version Authority is unreadable: ${error.message}`);
}

function fail(message) {
  errors.push(message);
}

let qualificationStatus;
try {
  qualificationStatus = JSON.parse(readFileSync(qualificationStatusPath, "utf8"));
} catch (error) {
  fail(`dependency qualification Authority is unreadable: ${error.message}`);
}

const roleDecisionValues = new Set(qualificationStatus?.roleDecisionValues ?? []);
const qualificationDecisions = new Map();
if (!Array.isArray(qualificationStatus?.decisions)) {
  fail("dependency qualification Authority must declare decisions[]");
} else {
  for (const decision of qualificationStatus.decisions) {
    if (typeof decision?.id !== "string" || qualificationDecisions.has(decision.id)) {
      fail(
        "dependency qualification Authority contains a duplicate or invalid decision id",
      );
      continue;
    }
    qualificationDecisions.set(decision.id, decision);
    if (!roleDecisionValues.has(decision.roleDecision)) {
      fail(
        `dependency qualification Authority has invalid roleDecision: ${decision.id}`,
      );
    }
  }
}

for (const roleId of ["runtime.node", "tooling.build", "testing.foundation"]) {
  const route = routes.get(roleId);
  if (!route) fail(`dependency route missing: ${roleId}`);
  else if (route.directive !== "USE") {
    fail(`required dependency route is not adopted for use: ${roleId}`);
  }
}

for (const roleId of routes.keys()) {
  if (!qualificationDecisions.has(roleId)) {
    fail(`dependency route has no qualification decision: ${roleId}`);
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
const minimumReleaseAge = materialization?.minimumReleaseAge;
if (!Number.isInteger(minimumReleaseAge) || minimumReleaseAge < 0) {
  fail("dependency routing minimumReleaseAge must be a non-negative integer");
}

const workspacePackages = await discoverWorkspacePackages({ cwd: root });
const packageManifests = workspacePackages.map(({ path }) =>
  join(path, "package.json"),
);
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

for (const name of externalDependencyNames) {
  if (!Object.hasOwn(workspaceCatalog, name)) {
    fail(`catalog entry missing for direct external dependency: ${name}`);
  }
}

const standingDependencyDocuments = [
  "docs/dependencies/dependency-routing.json",
  "docs/dependencies/implementation-routing.md",
  "docs/dependencies/decision-ledger.md",
  "docs/qualification/dependency-matrix.md",
  "docs/qualification/dependencies.md",
  "docs/qualification/dependency-status.json",
  "docs/engineering/repository/toolchain.md",
  "docs/engineering/gotchas/bootstrap/proper-lockfile-stale-reclaim.md",
];
for (const relativePath of standingDependencyDocuments) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    fail(`standing dependency document is missing: ${relativePath}`);
    continue;
  }
  const source = readFileSync(path, "utf8");
  for (const [name, version] of Object.entries(catalogVersions)) {
    const exactReferences = [`${name} ${version}`, `${name}@${version}`];
    if (exactReferences.some((reference) => source.includes(reference))) {
      fail(
        `${relativePath}: exact npm selection for ${name} must remain in pnpm-workspace.yaml Catalog, not a standing dependency document`,
      );
    }
  }
  if (packageManagerBaseline?.node && source.includes(packageManagerBaseline.node)) {
    fail(
      `${relativePath}: exact Node selection must remain in package.json engines.node, not a standing dependency document`,
    );
  }
}

if (!/^catalogMode:\s+strict$/m.test(workspace)) fail("catalogMode is not strict");
if (!/^strictPeerDependencies:\s+true$/m.test(workspace)) {
  fail("strictPeerDependencies must be explicitly enabled");
}
if (!/^engineStrict:\s+true$/m.test(workspace)) {
  fail("engineStrict must be explicitly enabled");
}
if (
  Number.isInteger(minimumReleaseAge) &&
  !new RegExp(`^minimumReleaseAge:\\s+${minimumReleaseAge}$`, "m").test(workspace)
) {
  fail(`minimumReleaseAge must be explicitly pinned to ${minimumReleaseAge} minutes`);
}
if (/^nodeLinker:/m.test(workspace)) {
  fail("nodeLinker must remain pnpm's explicit default: isolated");
}
if (workspaceOverrides["@types/node"] !== workspaceCatalog["@types/node"]) {
  fail(
    `@types/node override must match catalog Authority (expected ${workspaceCatalog["@types/node"]})`,
  );
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
