import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { containsDevelopmentProvenance } from "./current-tree-hygiene.mjs";
import { findRepositoryFilesSync } from "./discovery.mjs";
import { markdownLinks, markdownTargets } from "./markdown.mjs";
import {
  isWithinPath as isWithin,
  normalizeRepositoryPath as normalize,
} from "./paths.mjs";
import { CURRENT_MACHINE_AUTHORITIES } from "./repository-governance.mjs";

const requiredEntrypoints = [
  "docs/README.md",
  "docs/INDEX.md",
  "docs/AGENTS.md",
  "docs/governance/constitution.md",
  "docs/governance/pre-production-evolution.md",
  "docs/governance/compatibility-obligations.json",
  "docs/architecture/README.md",
  "docs/dependencies/dependency-routing.json",
  "docs/qualification/dependency-status.json",
];

const currentAuthorityByFilename = new Map(
  CURRENT_MACHINE_AUTHORITIES.map((entry) => [basename(entry.path), entry]),
);

const provenanceStandingDocumentRoots = Object.freeze([
  "docs/architecture/",
  "docs/governance/",
  "docs/product/",
  "docs/reference/",
  "docs/dependencies/",
  "docs/engineering/repository/",
  "docs/engineering/playbooks/",
  "docs/engineering/gotchas/repository/",
]);

const provenanceStandingDocuments = new Set([
  "docs/engineering/README.md",
  "docs/engineering/PLAYBOOK.md",
]);

const authorityReferencePattern =
  /(?<![A-Za-z0-9_./\\-])(?:\.\.?\/|[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.json\b/gu;

function localMarkdownLinks(text) {
  return markdownLinks(text, { ignoreFencedCode: true });
}

function localMarkdownTargets(text) {
  return markdownTargets(text, { ignoreFencedCode: true });
}

function isHistoricalPlan(relativePath) {
  return /^docs\/plans\/(?:completed|superseded|abandoned)\//u.test(relativePath);
}

function isStandingDocument(relativePath) {
  return !isHistoricalPlan(relativePath);
}

function isAuthorityStandingDocument(relativePath) {
  if (!isStandingDocument(relativePath)) return false;
  if (
    relativePath.startsWith("docs/plans/") ||
    relativePath.startsWith("docs/roadmap/") ||
    relativePath.startsWith("docs/qualification/evidence/") ||
    (relativePath.startsWith("docs/qualification/results/") &&
      relativePath !== "docs/qualification/results/README.md")
  ) {
    return false;
  }
  return true;
}

function isProvenanceStandingDocument(relativePath) {
  return (
    provenanceStandingDocuments.has(relativePath) ||
    provenanceStandingDocumentRoots.some((root) => relativePath.startsWith(root))
  );
}

function authorityForReference(reference) {
  return currentAuthorityByFilename.get(basename(reference.replaceAll("\\", "/")));
}

function resolveAuthorityReference(repository, sourcePath, reference) {
  const normalized = reference.replaceAll("\\", "/");
  const target = normalized.startsWith("docs/")
    ? resolve(repository, normalized)
    : resolve(dirname(sourcePath), normalized);
  return normalize(repository, target);
}

function validateCanonicalAuthorityReference(
  repository,
  sourcePath,
  reference,
  errors,
  reported,
) {
  const authority = authorityForReference(reference);
  if (!authority) return;
  const resolvedTarget = resolveAuthorityReference(repository, sourcePath, reference);
  if (resolvedTarget === authority.path) return;

  const key = `${authority.path}|${reference}|${resolvedTarget}`;
  if (reported.has(key)) return;
  reported.add(key);
  addError(
    errors,
    "noncanonical-authority-reference",
    normalize(repository, sourcePath),
    `current Authority ${authority.path} must be referenced from its canonical home; ${reference} resolves to ${resolvedTarget}`,
  );
}

function validateCanonicalAuthorityReferences(sourcePath, source, repository, errors) {
  const reported = new Set();
  for (const { target } of localMarkdownLinks(source)) {
    validateCanonicalAuthorityReference(
      repository,
      sourcePath,
      target,
      errors,
      reported,
    );
  }

  for (const match of source.matchAll(authorityReferencePattern)) {
    const prefix = source.slice(Math.max(0, match.index - 12), match.index);
    if (/(?:https?:|mailto:)[^\s]*$/iu.test(prefix)) continue;
    validateCanonicalAuthorityReference(
      repository,
      sourcePath,
      match[0],
      errors,
      reported,
    );
  }
}

function addError(errors, code, path, message) {
  errors.push({ code, path, message });
}

function validateEntrypoints(repository, errors) {
  for (const relativePath of requiredEntrypoints) {
    const path = join(repository, relativePath);
    if (!existsSync(path) || !statSync(path).isFile()) {
      addError(
        errors,
        "missing-entrypoint",
        relativePath,
        "required documentation entrypoint is missing",
      );
    }
  }
}

function validateJson(files, repository, errors) {
  for (const path of files.filter((file) => file.endsWith(".json"))) {
    try {
      JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      addError(errors, "invalid-json", normalize(repository, path), error.message);
    }
  }
}

function validateTranslationPolicy(files, repository, errors) {
  for (const path of files) {
    const relativePath = normalize(repository, path);
    if (
      /\.zh\.md$/iu.test(relativePath) ||
      /\.i18n\.ya?ml$/iu.test(relativePath) ||
      /(^|\/)translation-manifest(?:\.[^/]+)?$/iu.test(relativePath)
    ) {
      addError(
        errors,
        "translation-disabled",
        relativePath,
        "translation sidecars and manifests are disabled during PRE_PRODUCTION development",
      );
    }
  }
}

function validateNestedAgents(files, repository, errors) {
  for (const path of files) {
    const relativePath = normalize(repository, path);
    if (
      relativePath.startsWith("docs/") &&
      relativePath !== "docs/AGENTS.md" &&
      relativePath.endsWith("/AGENTS.md")
    ) {
      addError(
        errors,
        "nested-docs-agents",
        relativePath,
        "docs may contain only the root docs/AGENTS.md",
      );
    }
  }
}

function validateStandingLinks(markdownFiles, repository, errors) {
  for (const path of markdownFiles) {
    const relativePath = normalize(repository, path);
    if (!isStandingDocument(relativePath)) continue;
    const source = readFileSync(path, "utf8");
    if (source.includes("Architecture_Corpus/")) {
      addError(
        errors,
        "removed-corpus-path",
        relativePath,
        "current documentation must not reference the removed Architecture_Corpus/ home",
      );
    }
    if (source.includes("references/compatibility-obligations.json")) {
      addError(
        errors,
        "stale-current-home",
        relativePath,
        "current documentation must link the compatibility register from docs/governance/compatibility-obligations.json",
      );
    }
    if (source.includes("qualification/依赖资格矩阵.md")) {
      addError(
        errors,
        "stale-current-home",
        relativePath,
        "current documentation must link dependency qualification state from docs/qualification/dependency-status.json and docs/qualification/dependency-matrix.md",
      );
    }
    if (isAuthorityStandingDocument(relativePath)) {
      validateCanonicalAuthorityReferences(path, source, repository, errors);
    }
    for (const target of localMarkdownTargets(source)) {
      const resolvedTarget = resolve(dirname(path), target);
      if (!isWithin(repository, resolvedTarget)) {
        addError(
          errors,
          "link-outside-repository",
          relativePath,
          `local documentation link escapes repository: ${target}`,
        );
      } else if (!existsSync(resolvedTarget)) {
        addError(
          errors,
          "broken-current-link",
          relativePath,
          `local documentation link does not resolve: ${target}`,
        );
      }
    }
  }
}

function validateStandingProvenance(markdownFiles, repository, errors) {
  for (const path of markdownFiles) {
    const relativePath = normalize(repository, path);
    if (!isProvenanceStandingDocument(relativePath)) continue;
    const source = readFileSync(path, "utf8");
    if (containsDevelopmentProvenance(source, { ignoreQualificationIds: true })) {
      addError(
        errors,
        "development-provenance",
        relativePath,
        "standing documentation must not contain development milestone, PR, session, or corrective-cycle provenance",
      );
    }
  }
}

function validateDocumentationIndex(docsRoot, repository, errors) {
  const indexPath = join(docsRoot, "INDEX.md");
  if (!existsSync(indexPath)) return;
  const expectedAreas = readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const counts = new Map(expectedAreas.map((area) => [area, 0]));
  for (const target of localMarkdownTargets(readFileSync(indexPath, "utf8"))) {
    const resolvedTarget = resolve(dirname(indexPath), target);
    if (!isWithin(docsRoot, resolvedTarget)) continue;
    const pathParts = normalize(docsRoot, resolvedTarget).split("/");
    const area = pathParts[0];
    if (counts.has(area)) counts.set(area, counts.get(area) + 1);
  }
  for (const area of expectedAreas) {
    const count = counts.get(area);
    if (count !== 1) {
      addError(
        errors,
        count === 0 ? "unindexed-documentation-area" : "duplicate-documentation-area",
        `docs/${area}`,
        `docs/INDEX.md must link first-level area exactly once (found ${count})`,
      );
    }
  }
}

function validateArchitectureIndex(docsRoot, repository, errors) {
  const architectureRoot = join(docsRoot, "architecture");
  const indexPath = join(architectureRoot, "README.md");
  if (!existsSync(indexPath)) return;
  const expected = [
    ...readdirSync(architectureRoot, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md",
      )
      .map((entry) => join(architectureRoot, entry.name)),
    ...findRepositoryFilesSync({
      root: repository,
      patterns: ["docs/architecture/contracts/**/*.md"],
    }),
  ].sort((left, right) => left.localeCompare(right));
  const counts = new Map(expected.map((path) => [normalize(repository, path), 0]));
  for (const target of localMarkdownTargets(readFileSync(indexPath, "utf8"))) {
    const resolvedTarget = resolve(dirname(indexPath), target);
    const relativeTarget = normalize(repository, resolvedTarget);
    if (counts.has(relativeTarget))
      counts.set(relativeTarget, counts.get(relativeTarget) + 1);
  }
  for (const [relativeTarget, count] of counts) {
    if (count === 0) {
      addError(
        errors,
        "unindexed-architecture-document",
        relativeTarget,
        "architecture README must link every direct architecture and contract document",
      );
    } else if (count > 1) {
      addError(
        errors,
        "duplicate-architecture-document",
        relativeTarget,
        `architecture README links this document ${count} times`,
      );
    }
  }
}

export function validateDocumentation({ root = process.cwd() } = {}) {
  const repository = resolve(root);
  const docsRoot = join(repository, "docs");
  const errors = [];
  validateEntrypoints(repository, errors);
  if (!existsSync(docsRoot) || !statSync(docsRoot).isDirectory()) {
    addError(errors, "missing-docs-root", "docs", "documentation root is missing");
    return { errors, markdownCount: 0, jsonCount: 0 };
  }

  const files = findRepositoryFilesSync({
    root: repository,
    patterns: ["docs/**/*.md", "docs/**/*.json"],
  });
  const markdownFiles = files.filter((path) => path.endsWith(".md"));
  const jsonFiles = files.filter((path) => path.endsWith(".json"));
  validateJson(jsonFiles, repository, errors);
  validateTranslationPolicy(files, repository, errors);
  validateNestedAgents(files, repository, errors);
  validateStandingLinks(markdownFiles, repository, errors);
  validateStandingProvenance(markdownFiles, repository, errors);
  validateDocumentationIndex(docsRoot, repository, errors);
  validateArchitectureIndex(docsRoot, repository, errors);

  errors.sort((left, right) =>
    `${left.code}:${left.path}:${left.message}`.localeCompare(
      `${right.code}:${right.path}:${right.message}`,
    ),
  );
  return { errors, markdownCount: markdownFiles.length, jsonCount: jsonFiles.length };
}
