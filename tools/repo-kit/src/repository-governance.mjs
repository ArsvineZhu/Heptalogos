import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

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
const MACHINE_AUTHORITY_CONSUMERS = Object.freeze([
  {
    authority: "docs/governance/compatibility-obligations.json",
    consumers: [
      "tools/repo-kit/src/documentation.mjs",
      "tools/repo-kit/src/current-tree-hygiene.mjs",
    ],
  },
  {
    authority: "docs/dependencies/dependency-routing.json",
    consumers: [
      "tools/repo-kit/src/dependency-authority.mjs",
      "scripts/verify/dependencies.mjs",
    ],
  },
  {
    authority: "docs/qualification/dependency-status.json",
    consumers: ["scripts/verify/dependencies.mjs"],
  },
]);

function topologyRoots(source) {
  const heading = source.indexOf("## Current responsibility roots");
  if (heading < 0) return [];
  const fence = "```";
  const opening = source.indexOf(`${fence}text`, heading);
  if (opening < 0) return [];
  const contentStart = source.indexOf("\n", opening);
  const closing = contentStart < 0 ? -1 : source.indexOf(fence, contentStart + 1);
  if (contentStart < 0 || closing < 0) return [];
  return source
    .slice(contentStart + 1, closing)
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

function consumerMentionsAuthority(source, authority) {
  const segments = authority.split("/");
  return segments.every((segment) => source.includes(segment));
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

export function validateMachineAuthorityConsumers({ root = process.cwd() } = {}) {
  const repositoryRoot = resolve(root);
  const errors = [];
  for (const entry of MACHINE_AUTHORITY_CONSUMERS) {
    const authorityPath = join(repositoryRoot, entry.authority);
    if (!existsSync(authorityPath) || !statSync(authorityPath).isFile()) {
      errors.push(`machine Authority is missing: ${entry.authority}`);
      continue;
    }
    const consumerFound = entry.consumers.some((consumer) => {
      const consumerPath = join(repositoryRoot, consumer);
      if (!existsSync(consumerPath) || !statSync(consumerPath).isFile()) return false;
      return consumerMentionsAuthority(
        readFileSync(consumerPath, "utf8"),
        entry.authority,
      );
    });
    if (!consumerFound) {
      errors.push(`machine Authority has no current consumer: ${entry.authority}`);
    }
  }
  return errors;
}

export {
  CURRENT_REPOSITORY_PACKAGE_NAME,
  MACHINE_AUTHORITY_CONSUMERS,
  RESPONSIBILITY_ROOTS,
};
