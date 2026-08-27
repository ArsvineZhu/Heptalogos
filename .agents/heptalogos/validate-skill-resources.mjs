#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRepositoryFilesSync, parseYaml } from '@heptalogos/repo-kit';

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const agentsDir = path.dirname(scriptDir);
const repoRoot = path.dirname(agentsDir);
const docsRoot = path.join(repoRoot, 'docs');
const skillsDir = path.join(agentsDir, 'skills');
const routesPath = path.join(scriptDir, 'corpus-routes.json');
const casesPath = path.join(scriptDir, 'tests', 'skill-routing-cases.json');
const rootAgentsPath = path.join(repoRoot, 'AGENTS.md');

const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`Cannot parse JSON: ${path.relative(repoRoot, file)}: ${error.message}`);
    return null;
  }
}

function requireFile(file, label = path.relative(repoRoot, file)) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`Missing file: ${label}`);
    return false;
  }
  return true;
}

function isWithin(root, candidate) {
  const remainder = path.relative(path.resolve(root), path.resolve(candidate));
  return remainder === '' || (!remainder.startsWith('..') && !path.isAbsolute(remainder));
}

function parseFrontmatter(text, file) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(`Missing YAML frontmatter: ${path.relative(repoRoot, file)}`);
    return null;
  }

  let result;
  try {
    result = parseYaml(match[1], file);
  } catch (error) {
    fail(`Invalid YAML frontmatter: ${path.relative(repoRoot, file)}: ${error.message}`);
    return null;
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    fail(`YAML frontmatter must be a mapping: ${path.relative(repoRoot, file)}`);
    return null;
  }
  return result;
}

function wordCount(text) {
  return text
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
}

function validateRouteValue(skillName, routeValue, seen) {
  if (typeof routeValue !== 'string') {
    fail(`Non-string documentation route value in ${skillName}`);
    return;
  }
  if (
    routeValue.includes('\\') ||
    path.posix.isAbsolute(routeValue) ||
    routeValue.startsWith('./') ||
    routeValue.startsWith('../') ||
    path.posix.normalize(routeValue) !== routeValue ||
    routeValue.includes('Architecture_Corpus/')
  ) {
    fail(`Invalid repository-relative documentation route for ${skillName}: ${routeValue}`);
    return;
  }
  if (seen.has(routeValue)) {
    fail(`Duplicate documentation route in ${skillName}: ${routeValue}`);
    return;
  }
  seen.add(routeValue);

  const target = path.resolve(repoRoot, routeValue);
  if (!isWithin(docsRoot, target)) {
    fail(`Documentation route escapes docs/ for ${skillName}: ${routeValue}`);
    return;
  }
  if (routeValue.startsWith('docs/plans/completed/')) {
    fail(`Active documentation route points to completed plan for ${skillName}: ${routeValue}`);
  }
  if (!requireFile(target, routeValue)) {
    return;
  }
}

function walkRouteLists(value, skillName) {
  if (Array.isArray(value)) {
    const seen = new Set();
    for (const item of value) {
      if (typeof item === 'string') {
        validateRouteValue(skillName, item, seen);
      } else {
        walkRouteLists(item, skillName);
      }
    }
    return;
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) walkRouteLists(child, skillName);
  }
}

function validateSkillLinks(skillName, skillFile, text) {
  const linkRegex = /\]\((?:<)?(\.\.\/\.\.\/\.\.\/docs\/[^)>\s]+)(?:>)?\)/gu;
  for (const match of text.matchAll(linkRegex)) {
    const resolved = path.resolve(path.dirname(skillFile), decodeURI(match[1]));
    if (!isWithin(docsRoot, resolved) || !requireFile(resolved, match[1])) {
      fail(`Broken direct documentation link in ${skillName}: ${match[1]}`);
    }
  }
}

if (!requireFile(routesPath) || !requireFile(rootAgentsPath) || !requireFile(casesPath)) {
  process.exitCode = 1;
}

if (!fs.existsSync(docsRoot) || !fs.statSync(docsRoot).isDirectory()) {
  fail('Missing docs/ directory');
}
if (!requireFile(path.join(docsRoot, 'AGENTS.md'))) {
  // The detailed error was emitted by requireFile.
}

const routesDoc = readJson(routesPath);
const casesDoc = readJson(casesPath);
if (routesDoc) {
  if (routesDoc.version !== 2) fail('corpus-routes.json must use version 2');
  if ('corpusRoot' in routesDoc || 'skillRelativeCorpusRoot' in routesDoc) {
    fail('corpus-routes.json must not declare a physical documentation root');
  }
  if (!routesDoc.routes || typeof routesDoc.routes !== 'object') {
    fail('corpus-routes.json must contain routes');
  } else {
    for (const [skillName, route] of Object.entries(routesDoc.routes)) {
      walkRouteLists(route, skillName);
    }
  }
}

const routeNames = new Set(Object.keys(routesDoc?.routes ?? {}));
const skillNames = new Set();

if (fs.existsSync(skillsDir)) {
  for (const skillFile of findRepositoryFilesSync({
    root: skillsDir,
    patterns: ['*/SKILL.md'],
  })) {
    const skillName = path.basename(path.dirname(skillFile));
    if (!requireFile(skillFile)) continue;

    skillNames.add(skillName);
    const text = fs.readFileSync(skillFile, 'utf8');
    const frontmatter = parseFrontmatter(text, skillFile);

    if (frontmatter) {
      if (frontmatter.name !== skillName) {
        fail(`Skill frontmatter name mismatch: ${skillName} -> ${frontmatter.name ?? '<missing>'}`);
      }
      if (!frontmatter.description?.startsWith('Use when')) {
        fail(`Skill description must start with "Use when": ${skillName}`);
      }
      if ((frontmatter.description?.length ?? 0) > 500) {
        fail(`Skill description exceeds 500 characters: ${skillName}`);
      }
    }

    const words = wordCount(text);
    if (words > 500) {
      fail(`Skill exceeds 500-word budget: ${skillName} (${words})`);
    } else {
      notes.push(`${skillName}: ${words} words`);
    }

    validateSkillLinks(skillName, skillFile, text);
  }
} else {
  fail('Missing .agents/skills directory');
}

for (const name of routeNames) {
  if (!skillNames.has(name)) fail(`Route has no matching Skill directory: ${name}`);
}
for (const name of skillNames) {
  if (!routeNames.has(name)) fail(`Skill has no route entry: ${name}`);
}

if (casesDoc) {
  if (!Array.isArray(casesDoc.cases)) {
    fail('skill-routing-cases.json: cases must be an array');
  } else {
    const ids = new Set();
    for (const testCase of casesDoc.cases) {
      if (!testCase?.id || !testCase?.prompt || !Array.isArray(testCase?.expectedSkills)) {
        fail('Invalid routing case: id, prompt, expectedSkills[] are required');
        continue;
      }
      if (ids.has(testCase.id)) fail(`Duplicate routing case id: ${testCase.id}`);
      ids.add(testCase.id);
      for (const skillName of testCase.expectedSkills) {
        if (!skillNames.has(skillName)) {
          fail(`Routing case ${testCase.id} references unknown skill: ${skillName}`);
        }
      }
    }
    notes.push(`routing cases: ${casesDoc.cases.length}`);
  }
}

console.log('Heptalogos Codex Skills resource validation');
console.log(`repo root:   ${repoRoot}`);
console.log(`docs root:   ${docsRoot}`);
console.log(`skills:      ${skillNames.size}`);
for (const note of notes) console.log(`  - ${note}`);

if (errors.length > 0) {
  console.error(`\nFAIL (${errors.length})`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log('\nPASS');
}
