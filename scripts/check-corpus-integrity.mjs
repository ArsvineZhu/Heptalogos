import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const corpusRoot = join(root, "Architecture_Corpus");
const manifestPath = join(corpusRoot, "manifest.json");
const sumsPath = join(corpusRoot, "SHA256SUMS.txt");
const errors = [];

function fail(message) {
  errors.push(message);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(path));
    else if (entry.isFile())
      files.push(relative(corpusRoot, path).replaceAll("\\", "/"));
  }
  return files;
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail(`manifest.json: invalid JSON (${error.message})`);
}

const files = Array.isArray(manifest?.files) ? manifest.files : [];
if (manifest?.contentFileCount !== files.length) {
  fail(
    `manifest contentFileCount: expected ${files.length}, got ${manifest?.contentFileCount}`,
  );
}

const manifestFiles = new Map();
for (const entry of files) {
  if (!entry?.path || manifestFiles.has(entry.path)) {
    fail(`manifest files: invalid or duplicate entry ${JSON.stringify(entry?.path)}`);
    continue;
  }
  manifestFiles.set(entry.path, entry);
  const path = join(corpusRoot, entry.path);
  if (!existsSync(path)) {
    fail(`manifest file missing: ${entry.path}`);
    continue;
  }
  const stats = statSync(path);
  if (stats.size !== entry.size) {
    fail(`manifest size mismatch: ${entry.path}`);
  }
  if (sha256(path) !== entry.sha256) {
    fail(`manifest hash mismatch: ${entry.path}`);
  }
}

const actualContentFiles = new Set(
  collectFiles(corpusRoot).filter(
    (path) => path !== "manifest.json" && path !== "SHA256SUMS.txt",
  ),
);
for (const path of manifestFiles.keys()) {
  if (!actualContentFiles.has(path)) fail(`manifest file set missing on disk: ${path}`);
}
for (const path of actualContentFiles) {
  if (!manifestFiles.has(path)) fail(`unregistered Corpus file: ${path}`);
}

if (manifestFiles.has("AGENTS.md") || existsSync(join(corpusRoot, "AGENTS.md"))) {
  fail("Corpus-local AGENTS.md must remain absent");
}

const sums = new Map();
for (const [index, line] of readFileSync(sumsPath, "utf8").split(/\r?\n/).entries()) {
  if (line.trim() === "") continue;
  const match = line.match(/^([0-9a-f]{64})\s{2}(.+)$/i);
  if (!match) {
    fail(`SHA256SUMS.txt line ${index + 1}: invalid format`);
    continue;
  }
  const [, hash, path] = match;
  if (sums.has(path)) fail(`SHA256SUMS.txt: duplicate entry ${path}`);
  sums.set(path, hash.toLowerCase());
}

const expectedSumPaths = new Set([...manifestFiles.keys(), "manifest.json"]);
for (const path of expectedSumPaths) {
  if (!sums.has(path)) {
    fail(`SHA256SUMS.txt: missing entry ${path}`);
    continue;
  }
  const target = join(corpusRoot, path);
  if (!existsSync(target)) {
    fail(`SHA256SUMS.txt: target missing ${path}`);
    continue;
  }
  if (sha256(target) !== sums.get(path)) {
    fail(`SHA256SUMS.txt hash mismatch: ${path}`);
  }
}
for (const path of sums.keys()) {
  if (!expectedSumPaths.has(path)) {
    fail(`SHA256SUMS.txt: unexpected entry ${path}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(`PASS corpus manifest=${files.length} sha256=${sums.size}`);
}
