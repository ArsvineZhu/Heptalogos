/**
 * Generates and verifies the derived API documentation projection from the
 * TypeDoc declaration graph. The temporary-output comparison keeps generated
 * Markdown out of the semantic source path and makes stale docs fail closed.
 * @module api-docs
 */

import { mkdtemp, rm, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findRepositoryFiles,
  isWithinPath,
  runProcessChecked,
} from "@heptalogos/repo-kit";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const outputDirectory = resolve(root, "docs/reference/api");
const writeMode = process.argv.includes("--write");

if (!isWithinPath(root, outputDirectory) || outputDirectory === root) {
  throw new Error(
    `API documentation output escaped the repository: ${outputDirectory}`,
  );
}

async function markdownFiles(directory) {
  return (
    await findRepositoryFiles({
      root: directory,
      patterns: ["**/*.md"],
    })
  )
    .map((path) => relative(directory, path).replaceAll("\\", "/"))
    .sort();
}

async function readProjection(directory, files) {
  const projection = new Map();
  for (const file of files) {
    projection.set(file, await readFile(join(directory, file), "utf8"));
  }
  return projection;
}

async function generate(directory) {
  const prettierIgnore = join(dirname(directory), "prettier-ignore");
  await writeFile(prettierIgnore, "", "utf8");
  await runProcessChecked(
    "pnpm",
    ["exec", "typedoc", "--options", "typedoc.json", "--out", directory],
    { cwd: root },
  );
  await runProcessChecked(
    "pnpm",
    ["exec", "prettier", "--write", "--ignore-path", prettierIgnore, directory],
    { cwd: root },
  );
}

const temporaryRoot = await mkdtemp(join(root, "tmp", "api-docs-"));
const temporaryOutput = join(temporaryRoot, "reference");

try {
  await mkdir(temporaryOutput, { recursive: true });
  await generate(temporaryOutput);

  const generatedFiles = await markdownFiles(temporaryOutput);
  const trackedFiles = (await markdownFiles(outputDirectory)).filter(Boolean);
  const generated = await readProjection(temporaryOutput, generatedFiles);
  const tracked = await readProjection(outputDirectory, trackedFiles);
  const allFiles = [...new Set([...generatedFiles, ...trackedFiles])].sort(
    (left, right) => left.localeCompare(right),
  );
  const staleFiles = allFiles.filter(
    (file) => generated.get(file) !== tracked.get(file),
  );

  if (writeMode) {
    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(dirname(outputDirectory), { recursive: true });
    await cp(temporaryOutput, outputDirectory, { recursive: true });
    console.log(`WROTE docs/reference/api (${generatedFiles.length} Markdown files)`);
  } else if (staleFiles.length > 0) {
    throw new Error(
      `Generated API documentation is stale (${staleFiles.length} files differ): ${staleFiles.join(", ")}; run pnpm docs:api`,
    );
  } else {
    console.log(
      `PASS generated API documentation is fresh (${generatedFiles.length} Markdown files)`,
    );
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
