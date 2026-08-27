import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { markdownTargets, section } from "./markdown.mjs";
import {
  isWithinPath as isWithin,
  normalizeRepositoryPath as normalize,
} from "./paths.mjs";
import { discoverProductPackages } from "./workspace.mjs";
import { findRepositoryFilesSync } from "./discovery.mjs";

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

function hasHeading(source, heading) {
  return new RegExp(
    `^## ${heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`,
    "mu",
  ).test(source);
}

function wordCount(source) {
  return source.trim().split(/\s+/u).filter(Boolean).length;
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
    for (const agentPath of findRepositoryFilesSync({
      root: packageInfo.directory,
      patterns: ["**/AGENTS.md"],
    })) {
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
