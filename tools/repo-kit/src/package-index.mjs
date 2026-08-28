import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { firstSectionParagraph } from "./markdown.mjs";
import { normalizeRepositoryPath as normalize } from "./paths.mjs";
import { discoverProductPackages } from "./workspace.mjs";

const PACKAGE_INDEX_PATH = "packages/INDEX.md";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function purposeSummary(source) {
  const paragraph = firstSectionParagraph(source, "Purpose")
    .replace(/\s+/gu, " ")
    .trim();
  return paragraph.length > 0
    ? paragraph
    : "Purpose is documented in the package README.";
}

function escapeTableCell(value) {
  return value.replaceAll("|", "\\|");
}

export async function collectPackageIndex({
  root = process.cwd(),
  productPackages,
} = {}) {
  const repositoryRoot = resolve(root);
  const packagesToCollect =
    productPackages ?? (await discoverProductPackages({ root: repositoryRoot }));
  const packages = packagesToCollect.map(
    ({ directory, directoryName, manifestName }) => {
      const manifestPath = join(directory, "package.json");
      const projectPath = join(directory, "project.json");
      const readmePath = join(directory, "README.md");
      if (!existsSync(manifestPath)) {
        throw new Error(
          `${normalize(repositoryRoot, directory)} is missing package.json`,
        );
      }
      if (!existsSync(projectPath)) {
        throw new Error(
          `${normalize(repositoryRoot, directory)} is missing project.json`,
        );
      }
      if (!existsSync(readmePath) || !statSync(readmePath).isFile()) {
        throw new Error(`${normalize(repositoryRoot, directory)} is missing README.md`);
      }
      const manifest = readJson(manifestPath);
      const project = readJson(projectPath);
      if (typeof manifest.name !== "string" || manifest.name.length === 0) {
        throw new Error(`${normalize(repositoryRoot, manifestPath)} must declare name`);
      }
      if (
        !Array.isArray(project.tags) ||
        !project.tags.every((tag) => typeof tag === "string")
      ) {
        throw new Error(
          `${normalize(repositoryRoot, projectPath)} must declare string tags[]`,
        );
      }
      return {
        directoryName,
        name: manifestName,
        readmePath,
        readmeLink: `./${directoryName}/README.md`,
        tags: project.tags,
        purpose: purposeSummary(readFileSync(readmePath, "utf8")),
      };
    },
  );

  return { root: repositoryRoot, packages };
}

export function renderPackageIndex(model) {
  const packages = Array.isArray(model) ? model : model.packages;
  if (!Array.isArray(packages))
    throw new TypeError("package index model must contain packages[]");
  const rows = packages.map((entry) => [
    `[${entry.name}](${entry.readmeLink})`,
    escapeTableCell(entry.tags.join(", ")),
    escapeTableCell(entry.purpose),
  ]);
  const headers = ["Package", "Semantic tags", "Responsibility"];
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );
  const renderRow = (cells) =>
    `| ${cells.map((cell, index) => cell.padEnd(widths[index])).join(" | ")} |`;
  return [
    "# Package index",
    "",
    renderRow(headers),
    renderRow(widths.map((width) => "-".repeat(width))),
    ...rows.map(renderRow),
    "",
  ].join("\n");
}

export async function validatePackageIndex({
  root = process.cwd(),
  text,
  productPackages,
} = {}) {
  const repositoryRoot = resolve(root);
  const model = await collectPackageIndex({ root: repositoryRoot, productPackages });
  const expected = renderPackageIndex(model).replace(/\r\n?/gu, "\n");
  const actual = (
    text ?? readFileSync(join(repositoryRoot, PACKAGE_INDEX_PATH), "utf8")
  ).replace(/\r\n?/gu, "\n");
  return actual === expected
    ? []
    : [
        "packages/INDEX.md is stale; regenerate it from workspace manifests, Nx tags, and package README Purpose sections",
      ];
}
