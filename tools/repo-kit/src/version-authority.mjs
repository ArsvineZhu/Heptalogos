import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function readJson(root, name) {
  return JSON.parse(readFileSync(join(resolve(root), name), "utf8"));
}

function unwrapYamlScalar(value) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parsePackageManager(value) {
  if (typeof value !== "string") {
    throw new Error("package.json packageManager must be a string");
  }
  const separator = value.indexOf("@");
  if (separator <= 0 || separator === value.length - 1) {
    throw new Error(`package.json packageManager is not name@version: ${value}`);
  }
  return {
    packageManager: value,
    packageManagerName: value.slice(0, separator),
    packageManagerVersion: value.slice(separator + 1),
  };
}

export function readPackageManagerBaseline({ root = process.cwd() } = {}) {
  const packageJson = readJson(root, "package.json");
  const packageManager = parsePackageManager(packageJson.packageManager);
  const node = packageJson.engines?.node;
  if (typeof node !== "string" || node.length === 0) {
    throw new Error("package.json engines.node must be a non-empty string");
  }
  return { node, ...packageManager };
}

export function readWorkspaceSection({ root = process.cwd(), section } = {}) {
  const source = readFileSync(join(resolve(root), "pnpm-workspace.yaml"), "utf8");
  const lines = source.split(/\r?\n/u);
  const sectionStart = lines.findIndex((line) =>
    new RegExp(`^${section}:\\s*$`, "u").test(line),
  );
  if (sectionStart < 0) {
    throw new Error(`pnpm-workspace.yaml ${section} section is missing`);
  }

  const values = {};
  for (const line of lines.slice(sectionStart + 1)) {
    if (line.length > 0 && !/^\s/u.test(line)) break;
    const match = line.match(/^\s{2}(?:"([^"]+)"|'([^']+)'|([^:\s]+)):\s*(.*?)\s*$/u);
    if (match === null) continue;
    const name = match[1] ?? match[2] ?? match[3];
    values[name] = unwrapYamlScalar(match[4]);
  }
  return values;
}

export function readWorkspaceCatalog({ root = process.cwd() } = {}) {
  return readWorkspaceSection({ root, section: "catalog" });
}

function resolveCatalogVersion(specifier, name) {
  if (typeof specifier !== "string" || specifier.length === 0) {
    throw new Error(`catalog.${name} must be a non-empty string`);
  }
  const target = specifier.startsWith("npm:")
    ? specifier.slice("npm:".length)
    : specifier;
  const separator = target.lastIndexOf("@");
  if (specifier.startsWith("npm:") && separator <= 0) {
    throw new Error(`catalog.${name} npm alias is not package@version: ${specifier}`);
  }
  return separator > 0 ? target.slice(separator + 1) : target;
}

export function resolveExpectedInstalledPackageVersions({
  root = process.cwd(),
  packageNames,
} = {}) {
  const catalog = readWorkspaceCatalog({ root });
  const names = packageNames ?? Object.keys(catalog);
  if (!Array.isArray(names)) throw new TypeError("packageNames must be an array");
  return Object.fromEntries(
    names.map((name) => {
      if (!Object.hasOwn(catalog, name)) {
        throw new Error(`catalog entry is missing: ${name}`);
      }
      return [name, resolveCatalogVersion(catalog[name], name)];
    }),
  );
}
