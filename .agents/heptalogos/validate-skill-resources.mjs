#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);               // .agents/heptalogos
const agentsDir = path.dirname(scriptDir);                 // .agents
const repoRoot = path.dirname(agentsDir);                  // repo root
const skillsDir = path.join(agentsDir, 'skills');
const routesPath = path.join(scriptDir, 'corpus-routes.json');
const casesPath = path.join(scriptDir, 'tests', 'skill-routing-cases.json');
const packageManifestPath = path.join(scriptDir, 'package-manifest.json');
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

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function validatePackageManifest(manifest) {
  if (!Array.isArray(manifest?.files)) {
    fail('package-manifest.json: files must be an array');
    return;
  }

  const seen = new Set();
  for (const entry of manifest.files) {
    if (!entry?.path || seen.has(entry.path)) {
      fail(`package-manifest.json: invalid or duplicate entry: ${entry?.path ?? '<missing>'}`);
      continue;
    }
    seen.add(entry.path);
    const file = path.resolve(repoRoot, entry.path);
    if (!requireFile(file, `package-manifest.json -> ${entry.path}`)) continue;
    const size = fs.statSync(file).size;
    const hash = sha256(file);
    if (size !== entry.size) {
      fail(`Package manifest size mismatch: ${entry.path} (expected ${entry.size}, got ${size})`);
    }
    if (hash !== entry.sha256) {
      fail(`Package manifest hash mismatch: ${entry.path}`);
    }
  }
}

function walkRouteValues(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) visit(item);
    return;
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) walkRouteValues(child, visit);
  }
}

function parseFrontmatter(text, file) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(`Missing YAML frontmatter: ${path.relative(repoRoot, file)}`);
    return null;
  }

  const result = {};
  for (const line of match[1].split('\n')) {
    const index = line.indexOf(':');
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    result[key] = value;
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

requireFile(routesPath);
requireFile(rootAgentsPath);
requireFile(casesPath);
requireFile(packageManifestPath);

const routesDoc = readJson(routesPath);
const casesDoc = readJson(casesPath);
const packageManifestDoc = readJson(packageManifestPath);
if (!routesDoc) process.exitCode = 1;
if (packageManifestDoc) validatePackageManifest(packageManifestDoc);

const corpusRoot = routesDoc
  ? path.resolve(repoRoot, routesDoc.corpusRoot ?? 'Architecture_Corpus')
  : path.join(repoRoot, 'Architecture_Corpus');

if (!fs.existsSync(corpusRoot) || !fs.statSync(corpusRoot).isDirectory()) {
  fail(`Missing corpus root: ${path.relative(repoRoot, corpusRoot)}`);
}

const routeNames = new Set(Object.keys(routesDoc?.routes ?? {}));
const skillNames = new Set();

if (fs.existsSync(skillsDir)) {
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillName = entry.name;
    const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
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

    const linkRegex = /\]\((\.\.\/\.\.\/\.\.\/Architecture_Corpus\/[^)]+)\)/gu;
    for (const match of text.matchAll(linkRegex)) {
      const resolved = path.resolve(path.dirname(skillFile), decodeURI(match[1]));
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        fail(`Broken direct Corpus link in ${skillName}: ${match[1]}`);
      }
    }
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

for (const [skillName, route] of Object.entries(routesDoc?.routes ?? {})) {
  walkRouteValues(route, (relativePath) => {
    if (typeof relativePath !== 'string') {
      fail(`Non-string Corpus route value in ${skillName}`);
      return;
    }
    const file = path.resolve(corpusRoot, relativePath);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      fail(`Broken Corpus route for ${skillName}: ${relativePath}`);
    }
  });
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
console.log(`corpus root: ${corpusRoot}`);
console.log(`skills:      ${skillNames.size}`);
for (const note of notes) console.log(`  - ${note}`);

if (errors.length > 0) {
  console.error(`\nFAIL (${errors.length})`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log('\nPASS');
}
