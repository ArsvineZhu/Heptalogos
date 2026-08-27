import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

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

function normalize(root, path) {
  return relative(root, path).replaceAll("\\", "/");
}

function isWithin(root, path) {
  const rootPath = resolve(root);
  const candidate = resolve(path);
  const remainder = relative(rootPath, candidate);
  return remainder === "" || (!remainder.startsWith("..") && !isAbsolute(remainder));
}

function walkFiles(directory) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function localMarkdownTargets(text) {
  const targets = [];
  const linkPattern = /\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^)]*["'])?\)/gu;
  for (const match of text.matchAll(linkPattern)) {
    let target = match[1];
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    }
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:") ||
      target.startsWith("#")
    ) {
      continue;
    }
    const path = target.split("#", 1)[0];
    if (path) targets.push(path);
  }
  return targets;
}

function isStandingDocument(relativePath) {
  return !relativePath.startsWith("docs/plans/");
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

function validateDocumentationIndex(docsRoot, repository, errors) {
  const indexPath = join(docsRoot, "INDEX.md");
  if (!existsSync(indexPath)) return;
  const expectedAreas = readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
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
    ...walkFiles(join(architectureRoot, "contracts")).filter((path) =>
      path.endsWith(".md"),
    ),
  ].sort();
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

export function validateDocumentation({ root = repositoryRoot } = {}) {
  const repository = resolve(root);
  const docsRoot = join(repository, "docs");
  const errors = [];
  validateEntrypoints(repository, errors);
  if (!existsSync(docsRoot) || !statSync(docsRoot).isDirectory()) {
    addError(errors, "missing-docs-root", "docs", "documentation root is missing");
    return { errors, markdownCount: 0, jsonCount: 0 };
  }

  const files = walkFiles(docsRoot);
  const markdownFiles = files.filter((path) => path.endsWith(".md"));
  const jsonFiles = files.filter((path) => path.endsWith(".json"));
  validateJson(jsonFiles, repository, errors);
  validateTranslationPolicy(files, repository, errors);
  validateNestedAgents(files, repository, errors);
  validateStandingLinks(markdownFiles, repository, errors);
  validateDocumentationIndex(docsRoot, repository, errors);
  validateArchitectureIndex(docsRoot, repository, errors);

  errors.sort((left, right) =>
    `${left.code}:${left.path}:${left.message}`.localeCompare(
      `${right.code}:${right.path}:${right.message}`,
    ),
  );
  return { errors, markdownCount: markdownFiles.length, jsonCount: jsonFiles.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateDocumentation();
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`FAIL ${error.code} ${error.path}: ${error.message}`);
    }
    process.exitCode = 1;
  } else {
    console.log(
      `PASS documentation structure: markdown=${result.markdownCount} json=${result.jsonCount}`,
    );
  }
}
