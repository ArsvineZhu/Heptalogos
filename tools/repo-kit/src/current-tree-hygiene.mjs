import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".nx",
  ".pnpm-store",
  ".vite",
  ".cache",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
  "tmp",
  "generated",
  "caches",
]);

const SELF_EXEMPTIONS = new Set([
  "tools/repo-kit/src/current-tree-hygiene.mjs",
  "tools/repo-kit/test/current-tree-hygiene.test.mjs",
  "scripts/verify/current-tree-hygiene.mjs",
]);

const DEVELOPMENT_IDENTITY_PATTERN =
  /(?<![a-z0-9])(?:m\d+[a-z]?|h\d+(?:a[-_]?\d+|b|s)?(?:[-_]s)?)(?![a-z0-9])/iu;
const PR_ID_PATTERN = /(?<![a-z0-9])pr[-_]?\d+(?![a-z0-9])/iu;
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

function isDirectoryExcluded(name) {
  return EXCLUDED_DIRECTORIES.has(name);
}

function collectFiles(root, candidate, output) {
  if (!existsSync(candidate)) return;
  const stats = statSync(candidate);
  if (stats.isFile()) {
    output.add(normalize(root, candidate));
    return;
  }
  if (!stats.isDirectory()) return;
  for (const entry of readdirSync(candidate, { withFileTypes: true })) {
    if (entry.isDirectory() && isDirectoryExcluded(entry.name)) continue;
    if (entry.isSymbolicLink()) continue;
    collectFiles(root, join(candidate, entry.name), output);
  }
}

function addFinding(findings, code, path, message) {
  findings.push({ code, path, message });
}

function scanCompatibilityRegister(root, findings) {
  const path = join(
    root,
    "Architecture_Corpus",
    "references",
    "compatibility-obligations.json",
  );
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

export function scanCurrentTree({ root = process.cwd() } = {}) {
  const repositoryRoot = resolve(root);
  const findings = [];
  const files = new Set();

  for (const relativePath of SCAN_ROOTS) {
    collectFiles(repositoryRoot, join(repositoryRoot, relativePath), files);
  }
  for (const entry of readdirSync(repositoryRoot, { withFileTypes: true })) {
    if (/^tsconfig.*\.json$/iu.test(entry.name) && entry.isFile()) {
      files.add(entry.name);
    }
  }

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
