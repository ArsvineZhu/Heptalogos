import { resolve } from "node:path";
import { glob, globSync } from "tinyglobby";

function normalizePatterns(patterns) {
  if (typeof patterns === "string") return [patterns];
  if (
    !Array.isArray(patterns) ||
    patterns.length === 0 ||
    patterns.some((pattern) => typeof pattern !== "string" || pattern.length === 0)
  ) {
    throw new TypeError("patterns must be a non-empty string array");
  }
  return [...patterns];
}

function normalizeIgnore(ignore) {
  if (ignore === undefined) return [];
  if (!Array.isArray(ignore) || ignore.some((pattern) => typeof pattern !== "string")) {
    throw new TypeError("ignore must be an array of strings");
  }
  return [...ignore];
}

function options(root, ignore) {
  return {
    cwd: resolve(root),
    ignore: normalizeIgnore(ignore),
    absolute: true,
    onlyFiles: true,
    followSymbolicLinks: false,
  };
}

function sortPaths(paths) {
  return paths
    .map((path) => resolve(path))
    .sort((left, right) => left.localeCompare(right));
}

export function findRepositoryFilesSync({
  root = process.cwd(),
  patterns,
  ignore,
} = {}) {
  const normalizedPatterns = normalizePatterns(patterns);
  return sortPaths(globSync(normalizedPatterns, options(root, ignore)));
}

export async function findRepositoryFiles({
  root = process.cwd(),
  patterns,
  ignore,
} = {}) {
  const normalizedPatterns = normalizePatterns(patterns);
  return sortPaths(await glob(normalizedPatterns, options(root, ignore)));
}

export function findProductSourceFilesSync({
  root = process.cwd(),
  patterns,
  ignore,
} = {}) {
  return findRepositoryFilesSync({
    root,
    patterns: patterns ?? ["packages/*/src/**/*.{ts,tsx}"],
    ignore,
  });
}

export function findPackageFilesSync({ root = process.cwd(), patterns, ignore } = {}) {
  return findRepositoryFilesSync({
    root,
    patterns: patterns ?? ["packages/*/**/*"],
    ignore,
  });
}
