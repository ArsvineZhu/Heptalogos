import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const workspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
const baseTsconfig = JSON.parse(readFileSync(join(root, "tsconfig.base.json"), "utf8"));
const nxConfig = JSON.parse(readFileSync(join(root, "nx.json"), "utf8"));
const errors = [];

function fail(message) {
  errors.push(message);
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    fail(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function expectIncludes(label, values, expected) {
  if (!Array.isArray(values) || !values.includes(expected)) {
    fail(`${label}: expected ${JSON.stringify(expected)} to be present`);
  }
}

function run(label, command, args) {
  const isWindowsPnpm = process.platform === "win32" && command === "pnpm";
  const executable = isWindowsPnpm ? (process.env.ComSpec ?? "cmd.exe") : command;
  const executableArgs = isWindowsPnpm
    ? ["/d", "/s", "/c", [command, ...args].join(" ")]
    : args;
  const result = spawnSync(executable, executableArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) {
    fail(`${label}: ${result.error.message}`);
    return "";
  }
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    fail(`${label}: exited ${result.status}${detail ? ` (${detail})` : ""}`);
  }
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

function packageVersion(name) {
  try {
    const packagePath = require.resolve(`${name}/package.json`);
    return JSON.parse(readFileSync(packagePath, "utf8")).version;
  } catch (error) {
    fail(`${name}: unable to resolve package metadata (${error.message})`);
    return undefined;
  }
}

function catalogValue(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = workspace.match(new RegExp(`^  [\"']?${escaped}[\"']?:\\s+(.+)$`, "m"));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
}

expectEqual("node", process.versions.node, "24.19.0");
expectEqual("packageManager", packageJson.packageManager, "pnpm@11.22.0");
expectEqual("engines.node", packageJson.engines?.node, "24.19.0");
if (!/^catalogMode:\s+strict$/m.test(workspace)) {
  fail("workspace catalogMode: expected strict");
}
if (!/^strictPeerDependencies:\s+true$/m.test(workspace)) {
  fail("workspace strictPeerDependencies: expected true");
}
if (!/^engineStrict:\s+true$/m.test(workspace)) {
  fail("workspace engineStrict: expected true");
}
if (!/^minimumReleaseAge:\s+1440$/m.test(workspace)) {
  fail("workspace minimumReleaseAge: expected 1440");
}
if (/^nodeLinker:/m.test(workspace)) {
  fail("workspace nodeLinker: expected pnpm default isolated");
}
const pnpmConfigOutput = run("pnpm.config", "pnpm", ["config", "list", "--json"]);
try {
  const pnpmConfig = JSON.parse(pnpmConfigOutput);
  if (pnpmConfig.nodeLinker != null) {
    fail(
      `pnpm effective nodeLinker: expected isolated default, got ${pnpmConfig.nodeLinker}`,
    );
  }
  expectEqual(
    "pnpm effective strictPeerDependencies",
    pnpmConfig.strictPeerDependencies,
    true,
  );
  expectEqual("pnpm effective engineStrict", pnpmConfig.engineStrict, true);
  expectEqual("pnpm effective minimumReleaseAge", pnpmConfig.minimumReleaseAge, 1440);
} catch (error) {
  fail(`pnpm.config: invalid JSON (${error.message})`);
}
if (!nxConfig.plugins?.some((plugin) => plugin.plugin === "@nx/js/typescript")) {
  fail("nx plugin: @nx/js/typescript is not configured");
}
if (!/^  "?@types\/node"?:\s+24\.13\.3\s*$/m.test(workspace)) {
  fail("workspace @types/node override: expected 24.13.3");
}
if (!/^  esbuild:\s+true$/m.test(workspace) || !/^  nx:\s+true$/m.test(workspace)) {
  fail("workspace allowBuilds: expected only esbuild and nx");
}

const expectedCatalog = {
  "@nx/js": "23.1.1",
  "@types/node": "24.13.3",
  "@typescript/native": "npm:typescript@7.0.2",
  eslint: "10.8.1",
  nx: "23.1.1",
  prettier: "3.9.6",
  typescript: "npm:@typescript/typescript6@6.0.2",
  "typescript-eslint": "8.67.0",
  vitest: "4.1.11",
};

for (const [name, expected] of Object.entries(expectedCatalog)) {
  expectEqual(`catalog.${name}`, catalogValue(name), expected);
  expectEqual(
    `devDependencies.${name}`,
    packageJson.devDependencies?.[name],
    "catalog:",
  );
}

const resolvedVersions = {
  "@nx/js": "23.1.1",
  "@typescript/native": "7.0.2",
  typescript: "6.0.2",
  "@types/node": "24.13.3",
  nx: "23.1.1",
  eslint: "10.8.1",
  "typescript-eslint": "8.67.0",
  vitest: "4.1.11",
  prettier: "3.9.6",
};

for (const [name, expected] of Object.entries(resolvedVersions)) {
  expectEqual(`installed.${name}`, packageVersion(name), expected);
}

expectEqual("tsconfig.target", baseTsconfig.compilerOptions?.target, "ESNext");
expectEqual("tsconfig.module", baseTsconfig.compilerOptions?.module, "NodeNext");
expectEqual(
  "tsconfig.moduleResolution",
  baseTsconfig.compilerOptions?.moduleResolution,
  "NodeNext",
);
expectIncludes("tsconfig.lib", baseTsconfig.compilerOptions?.lib, "ES2025");
expectEqual(
  "tsconfig.verbatimModuleSyntax",
  baseTsconfig.compilerOptions?.verbatimModuleSyntax,
  true,
);
expectEqual("tsconfig.strict", baseTsconfig.compilerOptions?.strict, true);
expectEqual("tsconfig.skipLibCheck", baseTsconfig.compilerOptions?.skipLibCheck, false);

const pnpmCommand = "pnpm";
const pnpmVersion = run("pnpm.version", pnpmCommand, ["--version"]);
expectEqual("pnpm.version", pnpmVersion, "11.22.0");
const tsc7Version = run("tsc7.version", "pnpm", ["exec", "tsc", "--version"]);
if (!tsc7Version.includes("7.0.2")) fail("tsc7.version: expected 7.0.2");
run("tsc7.compile", "pnpm", ["exec", "tsc", "-p", "tsconfig.toolchain.json"]);
const tsc6Version = run("tsc6.version", "pnpm", ["exec", "tsc6", "--version"]);
if (!/^Version 6\./m.test(tsc6Version)) fail("tsc6.version: expected TypeScript 6");
run("tsc6.compile", "pnpm", ["exec", "tsc6", "-p", "tsconfig.ts6.json"]);

const lockfile = readFileSync(join(root, "pnpm-lock.yaml"));
const lockHash = createHash("sha256").update(lockfile).digest("hex");
if (lockfile.length === 0) {
  fail("pnpm-lock.yaml: file is empty");
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(`PASS toolchain.lockfile-sha256 ${lockHash}`);
  console.log("PASS toolchain baseline");
}
