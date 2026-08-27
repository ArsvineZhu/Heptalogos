import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const SELF_EXEMPTIONS = new Set([
  "tools/repo-kit/src/current-tree-hygiene.mjs",
  "tools/repo-kit/test/current-tree-hygiene.test.mjs",
  "scripts/verify/current-tree-hygiene.mjs",
]);

const DEVELOPMENT_IDENTITY_PATTERN =
  /(?<![a-z0-9])(?:m\d+[a-z]?|h\d+(?:[-_]?s|[a-z](?:[-_]?\d+)?))(?![a-z0-9])/iu;
const PR_ID_PATTERN = /(?<![a-z0-9])pr\s*#?\s*\d+(?![a-z0-9])/iu;
const CORRECTIVE_CYCLE_PATTERN =
  /\b(?:corrective[-_ ]?cycle[-_ ]?\d+|session[-_ ]?(?:id[-_ ]?)?\d+)\b/iu;
const HISTORICAL_COMPATIBILITY_PATTERN =
  /\b(?:legacy|obsolete|deprecated|upcast|downcast)\b|\bbackward[- ]compat(?:ibility)?\b|\b(?:compatibility\s+(?:shim|bridge|alias)|(?:shim|bridge|alias)\s+compatibility)\b|\b(?:old|previous)\s+(?:schema|format|payload|field|api)\b/iu;

const SCAN_ROOTS = [
  "AGENTS.md",
  ".agents",
  ".github",
  "fixtures",
  "packages",
  "scripts/README.md",
  "scripts/verify",
  "tools",
  "package.json",
  "project.json",
  "pnpm-workspace.yaml",
  "nx.json",
  "eslint.config.mjs",
  "vitest.config.ts",
];

function normalize(root, file) {
  return relative(root, file).replaceAll("\\", "/");
}

function addFinding(findings, code, path, message) {
  findings.push({ code, path, message });
}

function normalizeTrackedPath(path) {
  return path.replaceAll("\\", "/").replace(/^\.\//u, "");
}

function isScannedPath(relativePath) {
  return (
    SCAN_ROOTS.some(
      (scanRoot) =>
        relativePath === scanRoot || relativePath.startsWith(`${scanRoot}/`),
    ) || /^tsconfig.*\.json$/iu.test(relativePath)
  );
}

function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

export function listTrackedPaths({ root = process.cwd() } = {}) {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd: resolve(root),
    encoding: "buffer",
  });
  return output
    .toString("utf8")
    .split("\0")
    .filter((path) => path.length > 0)
    .map(normalizeTrackedPath);
}

function scanCompatibilityRegister(root, findings) {
  const path = join(root, "docs", "governance", "compatibility-obligations.json");
  const relativePath = normalize(root, path);
  if (!existsSync(path)) {
    addFinding(
      findings,
      "compatibility-register",
      relativePath,
      "compatibility obligation register is missing",
    );
    return;
  }

  let register;
  try {
    register = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    addFinding(
      findings,
      "compatibility-register",
      relativePath,
      `compatibility obligation register is invalid JSON: ${error.message}`,
    );
    return;
  }

  if (
    register?.schemaVersion !== 1 ||
    register?.compatibilityEpoch !== "PRE_PRODUCTION" ||
    !Array.isArray(register?.obligations) ||
    register.obligations.length !== 0
  ) {
    addFinding(
      findings,
      "compatibility-register",
      relativePath,
      "this repository requires PRE_PRODUCTION with an empty obligations array",
    );
  }
}

export function scanCurrentTree({ root = process.cwd(), trackedPaths } = {}) {
  const repositoryRoot = resolve(root);
  const findings = [];
  const files = new Set(
    (trackedPaths ?? listTrackedPaths({ root: repositoryRoot }))
      .map(normalizeTrackedPath)
      .filter(isScannedPath)
      .filter((relativePath) => pathExists(join(repositoryRoot, relativePath))),
  );

  if (existsSync(join(repositoryRoot, "GENESIS_EVIDENCE.json"))) {
    addFinding(
      findings,
      "closed-phase-artifact",
      "GENESIS_EVIDENCE.json",
      "one-time Repository Genesis evidence must not remain in the current tree",
    );
  }
  if (existsSync(join(repositoryRoot, "scripts/phases"))) {
    addFinding(
      findings,
      "closed-phase-artifact",
      "scripts/phases",
      "one-time phase scripts must not remain in the current tree",
    );
  }

  for (const relativePath of [...files].sort()) {
    if (SELF_EXEMPTIONS.has(relativePath)) continue;
    const file = join(repositoryRoot, relativePath);
    let stats;
    try {
      stats = lstatSync(file);
    } catch (error) {
      addFinding(findings, "read-error", relativePath, error.message);
      continue;
    }
    if (stats.isSymbolicLink()) {
      addFinding(
        findings,
        "symbolic-link-residue",
        relativePath,
        "symbolic links are not allowed in scanned canonical or executable surfaces",
      );
      continue;
    }
    if (!stats.isFile()) {
      addFinding(
        findings,
        "read-error",
        relativePath,
        "tracked scanned path is not a regular file",
      );
      continue;
    }
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch (error) {
      addFinding(findings, "read-error", relativePath, error.message);
      continue;
    }

    if (
      DEVELOPMENT_IDENTITY_PATTERN.test(relativePath) ||
      DEVELOPMENT_IDENTITY_PATTERN.test(content) ||
      PR_ID_PATTERN.test(relativePath) ||
      PR_ID_PATTERN.test(content) ||
      CORRECTIVE_CYCLE_PATTERN.test(relativePath) ||
      CORRECTIVE_CYCLE_PATTERN.test(content)
    ) {
      addFinding(
        findings,
        "development-provenance",
        relativePath,
        "current executable identity contains development milestone/provenance",
      );
    }

    if (
      (relativePath.startsWith("packages/") || relativePath.startsWith("fixtures/")) &&
      HISTORICAL_COMPATIBILITY_PATTERN.test(content)
    ) {
      addFinding(
        findings,
        "historical-compatibility",
        relativePath,
        "current implementation/test surface contains high-signal project-history compatibility wording",
      );
    }
  }

  scanCompatibilityRegister(repositoryRoot, findings);
  findings.sort((left, right) =>
    `${left.code}:${left.path}:${left.message}`.localeCompare(
      `${right.code}:${right.path}:${right.message}`,
    ),
  );
  return { root: repositoryRoot, findings };
}

export const currentTreeHygieneSelfExemptions = [...SELF_EXEMPTIONS];
