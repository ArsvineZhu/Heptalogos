import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { discoverProductPackages } from "./workspace.mjs";

const README_HEADINGS = [
  "Purpose",
  "Owns",
  "Does not own",
  "Public surface",
  "Dependencies and boundaries",
  "Change constraints",
  "Verification",
  "Architecture references",
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

function hasHeading(source, heading) {
  return new RegExp(
    `^## ${heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`,
    "mu",
  ).test(source);
}

function markdownTargets(source) {
  const targets = [];
  const linkPattern = /\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^)]*["'])?\)/gu;
  for (const match of source.matchAll(linkPattern)) {
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

function section(source, heading) {
  const marker = `## ${heading}`;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  const body = source.slice(start + marker.length);
  const nextHeading = body.search(/^##\s+/mu);
  return nextHeading < 0 ? body : body.slice(0, nextHeading);
}

function wordCount(source) {
  return source.trim().split(/\s+/u).filter(Boolean).length;
}

function discoverPackageAgentFiles(directory, files = []) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.name === "AGENTS.md" && (entry.isFile() || entry.isSymbolicLink())) {
      files.push(path);
    } else if (entry.isDirectory()) {
      discoverPackageAgentFiles(path, files);
    }
  }
  return files;
}

export async function validatePackageDocumentation({
  root = process.cwd(),
  productPackages,
} = {}) {
  const repositoryRoot = resolve(root);
  const packagesRoot = join(repositoryRoot, "packages");
  const docsRoot = join(repositoryRoot, "docs");
  const errors = [];
  const packages =
    productPackages ?? (await discoverProductPackages({ root: repositoryRoot }));

  for (const relativePath of [
    "packages/README.md",
    "packages/INDEX.md",
    "packages/AGENTS.md",
  ]) {
    const path = join(repositoryRoot, relativePath);
    if (!existsSync(path) || !statSync(path).isFile()) {
      errors.push(`${relativePath} is missing`);
    }
  }

  const packageAgents = join(packagesRoot, "AGENTS.md");
  if (
    existsSync(packageAgents) &&
    wordCount(readFileSync(packageAgents, "utf8")) > 220
  ) {
    errors.push(`${normalize(repositoryRoot, packageAgents)} exceeds 220 words`);
  }

  for (const packageInfo of packages) {
    for (const agentPath of discoverPackageAgentFiles(packageInfo.directory)) {
      errors.push(
        `${normalize(repositoryRoot, agentPath)}: package AGENTS.md is forbidden`,
      );
    }
  }

  const packageIndex = join(packagesRoot, "INDEX.md");
  const indexLinks = new Map();
  if (existsSync(packageIndex) && statSync(packageIndex).isFile()) {
    for (const target of markdownTargets(readFileSync(packageIndex, "utf8"))) {
      const resolvedTarget = resolve(dirname(packageIndex), target);
      if (!isWithin(packagesRoot, resolvedTarget)) continue;
      const packageRelative = normalize(packagesRoot, resolvedTarget).split("/");
      if (packageRelative.length !== 2 || packageRelative[1] !== "README.md") continue;
      const packageName = packageRelative[0];
      const count = indexLinks.get(packageName) ?? 0;
      indexLinks.set(packageName, count + 1);
      if (!packages.some((candidate) => candidate.directoryName === packageName)) {
        errors.push(`packages/INDEX.md links nonexistent package: ${packageName}`);
      }
    }
  }

  for (const packageInfo of packages) {
    const readme = join(packageInfo.directory, "README.md");
    if (!existsSync(readme) || !statSync(readme).isFile()) {
      errors.push(
        `${normalize(repositoryRoot, packageInfo.directory)} package README.md is missing`,
      );
    } else {
      const source = readFileSync(readme, "utf8");
      for (const heading of README_HEADINGS) {
        if (!hasHeading(source, heading)) {
          errors.push(
            `${normalize(repositoryRoot, readme)}: missing heading "${heading}"`,
          );
        }
      }

      let corpusLinks = 0;
      for (const target of markdownTargets(
        section(source, "Architecture references"),
      )) {
        const resolvedTarget = resolve(dirname(readme), target);
        if (!isWithin(docsRoot, resolvedTarget)) continue;
        if (!existsSync(resolvedTarget) || !statSync(resolvedTarget).isFile()) {
          errors.push(
            `${normalize(repositoryRoot, readme)}: broken architecture documentation link: ${target}`,
          );
        } else {
          corpusLinks += 1;
        }
      }
      if (corpusLinks === 0) {
        errors.push(
          `${normalize(repositoryRoot, readme)} must contain an architecture documentation link in Architecture references`,
        );
      }
    }

    const indexCount = indexLinks.get(packageInfo.directoryName) ?? 0;
    if (indexCount !== 1) {
      errors.push(
        `packages/INDEX.md must link package README exactly once: ${packageInfo.manifestName} (found ${indexCount})`,
      );
    }
  }

  return { errors, packages };
}
