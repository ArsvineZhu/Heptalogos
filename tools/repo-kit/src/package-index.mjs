import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { discoverWorkspacePackages } from "./workspace.mjs";

const PACKAGE_INDEX_PATH = "packages/INDEX.md";

function normalize(root, path) {
  return relative(root, path).replaceAll("\\", "/");
}

function isWithin(root, path) {
  const remainder = relative(resolve(root), resolve(path));
  return remainder === "" || (!remainder.startsWith("..") && !isAbsolute(remainder));
}

function isDirectPackagePath(packagesRoot, path) {
  if (!isWithin(packagesRoot, path)) return false;
  const parts = normalize(packagesRoot, path).split("/");
  return parts.length === 1 && parts[0].length > 0;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function section(source, heading) {
  const marker = `## ${heading}`;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  const body = source.slice(start + marker.length);
  const nextHeading = body.search(/^##\s+/mu);
  return nextHeading < 0 ? body : body.slice(0, nextHeading);
}

function purposeSummary(source) {
  const paragraph = section(source, "Purpose")
    .trim()
    .split(/\r?\n\s*\r?\n/u, 1)[0]
    .replace(/\s+/gu, " ")
    .trim();
  return paragraph.length > 0
    ? paragraph
    : "Purpose is documented in the package README.";
}

function escapeTableCell(value) {
  return value.replaceAll("|", "\\|");
}

export async function collectPackageIndex({ root = process.cwd() } = {}) {
  const repositoryRoot = resolve(root);
  const packagesRoot = join(repositoryRoot, "packages");
  const workspacePackages = await discoverWorkspacePackages({ cwd: repositoryRoot });
  const packages = workspacePackages
    .map((workspacePackage) => {
      const directory = resolve(repositoryRoot, workspacePackage.path);
      return { directory, workspacePackage };
    })
    .filter(({ directory }) => isDirectPackagePath(packagesRoot, directory))
    .sort((left, right) => left.directory.localeCompare(right.directory))
    .map(({ directory }) => {
      const directoryName = normalize(packagesRoot, directory);
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
        name: manifest.name,
        readmePath,
        readmeLink: `./${directoryName}/README.md`,
        tags: project.tags,
        purpose: purposeSummary(readFileSync(readmePath, "utf8")),
      };
    });

  return { root: repositoryRoot, packages };
}

export function renderPackageIndex(model) {
  const packages = Array.isArray(model) ? model : model.packages;
  if (!Array.isArray(packages))
    throw new TypeError("package index model must contain packages[]");
  const rows = packages.map(
    (entry) =>
      `| [${entry.name}](${entry.readmeLink}) | ${escapeTableCell(entry.tags.join(", "))} | ${escapeTableCell(entry.purpose)} |`,
  );
  return [
    "# Package index",
    "",
    "| Package | Semantic tags | Responsibility |",
    "| --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

function tableRows(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/u)) {
    const match = line.match(/^\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/u);
    if (match === null) continue;
    if (match[1].toLowerCase() === "package") continue;
    if (/^[-: ]+$/u.test(match[1])) continue;
    rows.push({
      packageCell: match[1],
      tagsCell: match[2],
      responsibilityCell: match[3],
    });
  }
  return rows;
}

export async function validatePackageIndex({ root = process.cwd(), text } = {}) {
  const repositoryRoot = resolve(root);
  const packagesRoot = join(repositoryRoot, "packages");
  const source = text ?? readFileSync(join(repositoryRoot, PACKAGE_INDEX_PATH), "utf8");
  const model = await collectPackageIndex({ root: repositoryRoot });
  const expected = new Map(model.packages.map((entry) => [entry.directoryName, entry]));
  const errors = [];
  const seen = new Set();

  for (const row of tableRows(source)) {
    const link = row.packageCell.match(/^\[([^\]]+)\]\(([^)]+)\)$/u);
    if (link === null) {
      errors.push("packages/INDEX.md contains a malformed package row");
      continue;
    }
    const [, label, target] = link;
    const resolvedTarget = resolve(
      dirname(join(repositoryRoot, PACKAGE_INDEX_PATH)),
      target,
    );
    if (!isWithin(packagesRoot, resolvedTarget)) {
      errors.push(`packages/INDEX.md package link escapes packages/: ${target}`);
      continue;
    }
    const targetRelative = normalize(packagesRoot, resolvedTarget);
    const directoryName = targetRelative.endsWith("/README.md")
      ? targetRelative.slice(0, -"/README.md".length)
      : undefined;
    const entry = directoryName === undefined ? undefined : expected.get(directoryName);
    if (entry === undefined) {
      errors.push(`packages/INDEX.md links nonexistent package README: ${target}`);
      continue;
    }
    if (seen.has(entry.directoryName)) {
      errors.push(`packages/INDEX.md contains duplicate package row: ${entry.name}`);
      continue;
    }
    seen.add(entry.directoryName);
    if (label !== entry.name) {
      errors.push(
        `packages/INDEX.md package label does not match manifest name: ${entry.name}`,
      );
    }
    if (resolve(resolvedTarget) !== resolve(entry.readmePath)) {
      errors.push(
        `packages/INDEX.md package link does not point to README: ${entry.name}`,
      );
    }
    if (row.tagsCell !== entry.tags.join(", ")) {
      errors.push(
        `packages/INDEX.md semantic tags do not match Nx metadata: ${entry.name}`,
      );
    }
  }

  for (const entry of model.packages) {
    if (!seen.has(entry.directoryName)) {
      errors.push(`packages/INDEX.md missing package row: ${entry.name}`);
    }
  }
  return errors;
}
