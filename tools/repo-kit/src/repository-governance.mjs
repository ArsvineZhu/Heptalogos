import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { codeBlocksInSection } from "./markdown.mjs";

const RESPONSIBILITY_ROOTS = Object.freeze([
  ".agents",
  ".github",
  "docs",
  "packages",
  "scripts",
  "tests",
  "tools",
]);

const TRANSIENT_ROOTS = new Set([
  ".codegraph",
  ".git",
  ".nx",
  ".pnpm-store",
  ".superpowers",
  ".vite",
  ".cache",
  ".worktrees",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
  "tmp",
]);

const TOPOLOGY_DOCUMENT = "docs/engineering/README.md";
const CURRENT_REPOSITORY_PACKAGE_NAME = "heptalogos";
const CURRENT_MACHINE_AUTHORITIES = Object.freeze([
  {
    id: "compatibility-obligations",
    kind: "EXECUTABLE_MACHINE_AUTHORITY",
    path: "docs/governance/compatibility-obligations.json",
  },
  {
    id: "dependency-routing",
    kind: "EXECUTABLE_MACHINE_AUTHORITY",
    path: "docs/dependencies/dependency-routing.json",
  },
  {
    id: "dependency-status",
    kind: "EXECUTABLE_MACHINE_AUTHORITY",
    path: "docs/qualification/dependency-status.json",
  },
  {
    id: "qualification-status",
    kind: "CURRENT_EVIDENCE_PROJECTION",
    path: "docs/qualification/results/qualification-status.json",
  },
]);

function topologyRoots(source) {
  const block = codeBlocksInSection(source, "Current responsibility roots")[0];
  if (block === undefined) return [];
  return block
    .split(/\r?\n/u)
    .map((line) => line.trim().replace(/\/$/u, ""))
    .filter((line) => line.length > 0);
}

export function validateRootTopology({ root = process.cwd() } = {}) {
  const repositoryRoot = resolve(root);
  const errors = [];
  const topologyPath = join(repositoryRoot, TOPOLOGY_DOCUMENT);
  if (!existsSync(topologyPath) || !statSync(topologyPath).isFile()) {
    return [`${TOPOLOGY_DOCUMENT} is missing; it must document responsibility roots`];
  }

  const documentedRoots = topologyRoots(readFileSync(topologyPath, "utf8"));
  const expected = new Set(RESPONSIBILITY_ROOTS);
  if (
    documentedRoots.length !== RESPONSIBILITY_ROOTS.length ||
    documentedRoots.some((name, index) => name !== RESPONSIBILITY_ROOTS[index])
  ) {
    errors.push(
      `${TOPOLOGY_DOCUMENT} must declare the reviewed responsibility roots in canonical order`,
    );
  }

  for (const name of RESPONSIBILITY_ROOTS) {
    const path = join(repositoryRoot, name);
    if (!existsSync(path) || !statSync(path).isDirectory()) {
      errors.push(`required responsibility root is missing: ${name}`);
    }
  }

  if (existsSync(repositoryRoot)) {
    for (const entry of readdirSync(repositoryRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || TRANSIENT_ROOTS.has(entry.name)) continue;
      if (!expected.has(entry.name)) {
        errors.push(
          `unexpected responsibility root: ${entry.name}; document its owner and update the topology contract`,
        );
      }
    }
  }
  return errors;
}

export function validateRootPackageIdentity({ root = process.cwd() } = {}) {
  const repositoryRoot = resolve(root);
  const packagePath = join(repositoryRoot, "package.json");
  if (!existsSync(packagePath) || !statSync(packagePath).isFile()) {
    return [
      "root package.json is missing; current repository identity cannot be verified",
    ];
  }

  let packageJson;
  try {
    packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch (error) {
    return [`root package.json is unreadable: ${error.message}`];
  }

  const errors = [];
  if (packageJson.private !== true) {
    errors.push("root package.json must remain private");
  }
  if (packageJson.name !== CURRENT_REPOSITORY_PACKAGE_NAME) {
    errors.push(
      `root package.json name must equal the current repository identity ${CURRENT_REPOSITORY_PACKAGE_NAME}; got ${JSON.stringify(packageJson.name)}`,
    );
  }
  return errors;
}

export {
  CURRENT_REPOSITORY_PACKAGE_NAME,
  CURRENT_MACHINE_AUTHORITIES,
  RESPONSIBILITY_ROOTS,
};
