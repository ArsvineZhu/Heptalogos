import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const errors = [];

function fail(message) {
  errors.push(message);
}

try {
  const top = resolve(
    execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
  );
  if (top !== root) fail(`git top-level is not current repository: ${top}`);
} catch (error) {
  fail(`git repository check failed: ${error.message}`);
}

for (const file of ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"]) {
  if (!existsSync(join(root, file))) fail(`required repository file missing: ${file}`);
}

const ignoredDirectories = new Set([
  ".git",
  ".nx",
  ".pnpm-store",
  ".vite",
  ".cache",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);
const forbiddenLockfiles = new Set([
  "package-lock.json",
  "yarn.lock",
  "npm-shrinkwrap.json",
  "bun.lock",
  "bun.lockb",
]);

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walk(path);
    } else if (forbiddenLockfiles.has(entry.name)) {
      fail(`forbidden second package-resolution file: ${path}`);
    }
  }
}
walk(root);

const implementationFiles = ["package.json", "pnpm-workspace.yaml"];
for (const relativePath of implementationFiles) {
  const source = readFileSync(join(root, relativePath), "utf8");
  for (const reference of ["Heptalogos_Archived", "Heptalogos_Architecture_Corpus"]) {
    if (source.includes(reference))
      fail(`${relativePath}: forbidden donor reference ${reference}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log("PASS repository correctness");
}
