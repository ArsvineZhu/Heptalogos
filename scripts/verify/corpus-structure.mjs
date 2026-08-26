import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const requiredEntrypoints = [
  "Architecture_Corpus/README.md",
  "Architecture_Corpus/INDEX.md",
  "Architecture_Corpus/00-项目宪法与工程宪法.md",
  "Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md",
  "Architecture_Corpus/qualification/results/README.md",
  "Architecture_Corpus/references/compatibility-obligations.json",
];
const forbiddenArtifacts = [
  "Architecture_Corpus/manifest.json",
  "Architecture_Corpus/SHA256SUMS.txt",
  "Architecture_Corpus/AGENTS.md",
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
    targets.push(target.split("#", 1)[0]);
  }
  return targets.filter(Boolean);
}

function fail(errors, message) {
  errors.push(message);
}

export function validateCorpus({ root = repositoryRoot } = {}) {
  const repository = resolve(root);
  const corpusRoot = join(repository, "Architecture_Corpus");
  const errors = [];

  for (const relativePath of requiredEntrypoints) {
    const path = join(repository, relativePath);
    if (!existsSync(path) || !statSync(path).isFile()) {
      fail(errors, `required Corpus entrypoint missing: ${relativePath}`);
    }
  }

  for (const relativePath of forbiddenArtifacts) {
    const path = join(repository, relativePath);
    if (existsSync(path))
      fail(errors, `forbidden Corpus artifact exists: ${relativePath}`);
  }

  if (!existsSync(corpusRoot) || !statSync(corpusRoot).isDirectory()) {
    fail(errors, "Architecture_Corpus directory is missing");
    return { errors };
  }

  const corpusFiles = walkFiles(corpusRoot);
  const markdownFiles = corpusFiles.filter((path) => path.endsWith(".md"));
  const jsonFiles = corpusFiles.filter((path) => path.endsWith(".json"));

  for (const path of markdownFiles) {
    const source = readFileSync(path, "utf8");
    for (const target of localMarkdownTargets(source)) {
      const resolvedTarget = resolve(path.replace(/[^\\/]+$/u, ""), target);
      if (!isWithin(corpusRoot, resolvedTarget)) {
        fail(
          errors,
          `${normalize(repository, path)}: local Markdown link escapes Architecture_Corpus: ${target}`,
        );
        continue;
      }
      if (!existsSync(resolvedTarget)) {
        fail(
          errors,
          `${normalize(repository, path)}: broken local Markdown link: ${target}`,
        );
      }
    }
  }

  for (const path of jsonFiles) {
    try {
      JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      fail(errors, `${normalize(repository, path)}: invalid JSON: ${error.message}`);
    }
  }

  const indexPath = join(corpusRoot, "INDEX.md");
  const indexLinks = new Set();
  if (existsSync(indexPath)) {
    for (const target of localMarkdownTargets(readFileSync(indexPath, "utf8"))) {
      indexLinks.add(normalize(corpusRoot, resolve(corpusRoot, target)));
    }
  }

  for (const entry of readdirSync(corpusRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !/^\d{2}-.+\.md$/u.test(entry.name)) continue;
    const relativePath = entry.name;
    if (!indexLinks.has(relativePath)) {
      fail(
        errors,
        `INDEX.md does not link top-level normative document: ${relativePath}`,
      );
    }
  }

  const specsRoot = join(corpusRoot, "specs");
  for (const path of walkFiles(specsRoot).filter((file) => file.endsWith(".md"))) {
    const relativePath = normalize(corpusRoot, path);
    if (!indexLinks.has(relativePath)) {
      fail(errors, `INDEX.md does not link specification: ${relativePath}`);
    }
  }

  const qualificationResultsRoot = join(corpusRoot, "qualification", "results");
  const resultsReadme = join(qualificationResultsRoot, "README.md");
  const resultLinks = new Set();
  if (existsSync(resultsReadme)) {
    for (const target of localMarkdownTargets(readFileSync(resultsReadme, "utf8"))) {
      resultLinks.add(
        normalize(qualificationResultsRoot, resolve(qualificationResultsRoot, target)),
      );
    }
  }
  for (const path of walkFiles(qualificationResultsRoot).filter(
    (file) => file.endsWith(".md") && file !== resultsReadme,
  )) {
    const relativePath = normalize(qualificationResultsRoot, path);
    if (!resultLinks.has(relativePath)) {
      fail(
        errors,
        `qualification/results/README.md does not link result: ${relativePath}`,
      );
    }
  }

  return { errors, markdownCount: markdownFiles.length, jsonCount: jsonFiles.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateCorpus();
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(`FAIL ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `PASS corpus structure: markdown=${result.markdownCount} json=${result.jsonCount}`,
    );
  }
}
