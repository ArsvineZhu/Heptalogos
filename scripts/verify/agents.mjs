#!/usr/bin/env node

/**
 * Validates the objective structure of the repository's procedural Skills.
 * @module agents
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  findRepositoryFilesSync,
  isWithinPath,
  markdownLinks,
  parseYaml,
} from "@heptalogos/repo-kit";

const scriptFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptFile), "../..");
const skillsRoot = path.join(repoRoot, ".agents", "skills");
const oldRoutingRoot = path.join(repoRoot, ".agents", "heptalogos");
const expectedSkills = new Set([
  "scope-control",
  "mechanics-routing",
  "lifecycle-change",
  "durable-state-change",
  "preproduction-evolution",
  "claim-verification",
  "documentation-maintenance",
]);
const deprecatedSkills = new Set([
  "heptalogos-architecture",
  "heptalogos-config-data",
  "heptalogos-dependencies",
  "heptalogos-extensions",
  "heptalogos-interaction",
  "heptalogos-management",
  "heptalogos-runtime-durability",
  "heptalogos-verification",
]);

const errors = [];

function fail(message) {
  errors.push(message);
}

function requireFile(file, label) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`Missing file: ${label ?? path.relative(repoRoot, file)}`);
    return false;
  }
  return true;
}

function requireDirectory(directory, label) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    fail(`Missing directory: ${label ?? path.relative(repoRoot, directory)}`);
    return false;
  }
  return true;
}

function requireAbsent(file, label) {
  if (fs.existsSync(file)) fail(`Deprecated file remains: ${label}`);
}

function parseFrontmatter(source, file) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/u);
  if (!match) {
    fail(`Missing YAML frontmatter: ${path.relative(repoRoot, file)}`);
    return undefined;
  }
  try {
    const parsed = parseYaml(match[1], file);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      fail(`Skill frontmatter must be a mapping: ${path.relative(repoRoot, file)}`);
      return undefined;
    }
    return parsed;
  } catch (error) {
    fail(
      `Invalid YAML frontmatter: ${path.relative(repoRoot, file)}: ${error.message}`,
    );
    return undefined;
  }
}

function validateSkillLinks(skillName, skillFile, source) {
  for (const { target } of markdownLinks(source)) {
    const resolved = path.resolve(path.dirname(skillFile), decodeURI(target));
    if (!isWithinPath(repoRoot, resolved)) {
      fail(`Skill reference escapes repository: ${skillName}: ${target}`);
      continue;
    }
    if (!fs.existsSync(resolved)) {
      fail(`Broken Skill reference: ${skillName}: ${target}`);
    }
  }
}

requireFile(path.join(repoRoot, "AGENTS.md"));
requireFile(path.join(repoRoot, "docs", "AGENTS.md"));
requireFile(path.join(repoRoot, "packages", "AGENTS.md"));
requireDirectory(skillsRoot, ".agents/skills directory");
requireAbsent(
  path.join(oldRoutingRoot, "corpus-routes.json"),
  ".agents/heptalogos/corpus-routes.json",
);
requireAbsent(
  path.join(oldRoutingRoot, "tests", "skill-routing-cases.json"),
  ".agents/heptalogos/tests/skill-routing-cases.json",
);

const actualSkills = new Set();
if (fs.existsSync(skillsRoot) && fs.statSync(skillsRoot).isDirectory()) {
  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    actualSkills.add(entry.name);
    const skillFile = path.join(skillsRoot, entry.name, "SKILL.md");
    if (!requireFile(skillFile, `.agents/skills/${entry.name}/SKILL.md`)) continue;
    const source = fs.readFileSync(skillFile, "utf8");
    const frontmatter = parseFrontmatter(source, skillFile);
    if (frontmatter !== undefined) {
      if (frontmatter.name !== entry.name) {
        fail(
          `Skill frontmatter name mismatch: ${entry.name} -> ${frontmatter.name ?? "<missing>"}`,
        );
      }
      if (
        typeof frontmatter.description !== "string" ||
        frontmatter.description.trim() === ""
      ) {
        fail(`Skill description is required: ${entry.name}`);
      }
    }
    validateSkillLinks(entry.name, skillFile, source);
  }
}

for (const name of expectedSkills) {
  if (!actualSkills.has(name)) fail(`Required procedural Skill is missing: ${name}`);
}
for (const name of actualSkills) {
  if (!expectedSkills.has(name)) {
    fail(
      deprecatedSkills.has(name)
        ? `Deprecated topical Skill remains: ${name}`
        : `Unexpected Skill directory: ${name}`,
    );
  }
}

console.log("Heptalogos procedural Skill validation");
console.log(`repo root: ${repoRoot}`);
console.log(`skills: ${actualSkills.size}`);
console.log(
  `skill files: ${findRepositoryFilesSync({ root: skillsRoot, patterns: ["*/SKILL.md"] }).length}`,
);

if (errors.length > 0) {
  console.error(`\nFAIL (${errors.length})`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nPASS");
}
