/**
 * Derives the retrieval-oriented package index from package metadata and
 * package README ownership/boundary sections.
 * @module package-index
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { firstSectionParagraph, section } from "./markdown.mjs";
import { normalizeRepositoryPath as normalize } from "./paths.mjs";
import { discoverProductPackages } from "./workspace.mjs";

const PACKAGE_INDEX_PATH = "packages/INDEX.md";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizeText(value) {
  return value.replace(/\s+/gu, " ").trim();
}

function purposeSummary(source) {
  const paragraph = normalizeText(firstSectionParagraph(source, "Purpose"));
  return paragraph.length > 0
    ? paragraph
    : "Purpose is documented in the package README.";
}

function sectionItems(source, heading) {
  const lines = section(source, heading).split(/\r?\n/gu);
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const item = trimmed.match(/^[-*+]\s+(.+)$/u);
    if (item !== null) {
      items.push(normalizeText(item[1]));
    } else if (items.length > 0 && trimmed.length > 0) {
      items[items.length - 1] = normalizeText(`${items[items.length - 1]} ${trimmed}`);
    }
  }
  return items.join("; ");
}

function sectionSummary(source, heading) {
  return normalizeText(
    section(source, heading)
      .replace(/^\s*[-*+]\s+/gmu, "")
      .replace(/\r?\n/gu, " "),
  );
}

function packageOwnership(source) {
  return sectionItems(source, "Owns") || purposeSummary(source);
}

function packageBoundaries(source) {
  return (
    sectionSummary(source, "Dependencies and boundaries") ||
    sectionItems(source, "Does not own") ||
    "See the package README for current boundaries."
  );
}

function packageReadWhen(source) {
  return purposeSummary(source);
}

function escapeTableCell(value) {
  return value.replaceAll("|", "\\|");
}

/** Build package-index entries from package metadata and README sections. */
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
      const readmeSource = readFileSync(readmePath, "utf8");
      return {
        directoryName,
        name: manifestName,
        readmePath,
        readmeLink: `./${directoryName}/README.md`,
        tags: project.tags,
        owns: packageOwnership(readmeSource),
        readWhen: packageReadWhen(readmeSource),
        boundaries: packageBoundaries(readmeSource),
      };
    },
  );

  return { root: repositoryRoot, packages };
}

/** Render the canonical package navigation table from an index model. */
export function renderPackageIndex(model) {
  const packages = Array.isArray(model) ? model : model.packages;
  if (!Array.isArray(packages))
    throw new TypeError("package index model must contain packages[]");
  const rows = packages.map((entry) => [
    `[${entry.name}](${entry.readmeLink})`,
    escapeTableCell(entry.tags.join(", ")),
    escapeTableCell(entry.owns),
    escapeTableCell(entry.readWhen),
    escapeTableCell(entry.boundaries),
  ]);
  const headers = [
    "Package",
    "Semantic tags",
    "Owns",
    "Read when / purpose",
    "Key boundaries / relationships",
  ];
  const renderRow = (cells) => `| ${cells.join(" | ")} |`;
  return [
    "# Package index",
    "",
    "<!-- prettier-ignore -->",
    renderRow(headers),
    renderRow(headers.map(() => "---")),
    ...rows.map(renderRow),
    "",
  ].join("\n");
}

/** Compare package index text with the current generated canonical projection. */
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
