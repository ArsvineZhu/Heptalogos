import { isAbsolute, relative, resolve } from "node:path";

export function normalizeRepositoryPath(root, path) {
  return relative(root, path).replaceAll("\\", "/");
}

export function isWithinPath(root, path) {
  const remainder = relative(resolve(root), resolve(path));
  return remainder === "" || (!remainder.startsWith("..") && !isAbsolute(remainder));
}
