import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  authority,
  readPackageManagerBaseline,
  validateNodeVersionProjections,
  readWorkspaceCatalog,
  readWorkspaceSection,
  resolveExpectedInstalledPackageVersions,
  runPnpm,
  runProcessChecked,
} from "@heptalogos/repo-kit";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
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

async function run(label, command, args) {
  try {
    const result =
      command === "pnpm"
        ? await runPnpm(args, { cwd: root })
        : await runProcessChecked(command, args, { cwd: root });
    return `${result.stdout}${result.stderr}`.trim();
  } catch (error) {
    const result = error.result;
    const detail = result ? `${result.stdout}${result.stderr}`.trim() : error.message;
    fail(`${label}: process failed${detail ? ` (${detail})` : ""}`);
    return detail;
  }
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

let baseline;
let catalog;
let overrides;
let expectedInstalledVersions = {};
try {
  baseline = readPackageManagerBaseline({ root });
} catch (error) {
  fail(`package manager Authority is unreadable: ${error.message}`);
}
try {
  for (const error of validateNodeVersionProjections({ root })) fail(error);
} catch (error) {
  fail(`Node version projections are unreadable: ${error.message}`);
}
try {
  catalog = readWorkspaceCatalog({ root });
} catch (error) {
  fail(`workspace catalog Authority is unreadable: ${error.message}`);
}
try {
  overrides = readWorkspaceSection({ root, section: "overrides" });
} catch (error) {
  fail(`workspace overrides Authority is unreadable: ${error.message}`);
}

const toolchainPackageNames = [
  "@nx/js",
  "@nx/eslint-plugin",
  "@types/node",
  "@typescript/native",
  "eslint",
  "nx",
  "prettier",
  "typescript",
  "typescript-eslint",
  "vitest",
];
try {
  expectedInstalledVersions = resolveExpectedInstalledPackageVersions({
    root,
    packageNames: toolchainPackageNames,
  });
} catch (error) {
  fail(`installed-version Authority is unreadable: ${error.message}`);
}

const minimumReleaseAge = authority.repositoryMaterialization?.minimumReleaseAge;
if (!Number.isInteger(minimumReleaseAge) || minimumReleaseAge < 0) {
  fail("dependency routing Authority must declare a non-negative minimumReleaseAge");
}

expectEqual("node", process.versions.node, baseline?.node);
expectEqual("packageManager", packageJson.packageManager, baseline?.packageManager);
expectEqual("engines.node", packageJson.engines?.node, baseline?.node);
if (!/^catalogMode:\s+strict$/m.test(workspace)) {
  fail("workspace catalogMode: expected strict");
}
if (!/^strictPeerDependencies:\s+true$/m.test(workspace)) {
  fail("workspace strictPeerDependencies: expected true");
}
if (!/^engineStrict:\s+true$/m.test(workspace)) {
  fail("workspace engineStrict: expected true");
}
if (
  Number.isInteger(minimumReleaseAge) &&
  !new RegExp(`^minimumReleaseAge:\\s+${minimumReleaseAge}$`, "m").test(workspace)
) {
  fail(`workspace minimumReleaseAge: expected ${minimumReleaseAge}`);
}
if (/^nodeLinker:/m.test(workspace)) {
  fail("workspace nodeLinker: expected pnpm default isolated");
}
const pnpmConfigOutput = await run("pnpm.config", "pnpm", ["config", "list", "--json"]);
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
  expectEqual(
    "pnpm effective minimumReleaseAge",
    pnpmConfig.minimumReleaseAge,
    minimumReleaseAge,
  );
} catch (error) {
  fail(`pnpm.config: invalid JSON (${error.message})`);
}
if (!nxConfig.plugins?.some((plugin) => plugin.plugin === "@nx/js/typescript")) {
  fail("nx plugin: @nx/js/typescript is not configured");
}
expectEqual(
  "workspace @types/node override",
  overrides?.["@types/node"],
  catalog?.["@types/node"],
);
if (!/^  esbuild:\s+true$/m.test(workspace) || !/^  nx:\s+true$/m.test(workspace)) {
  fail("workspace allowBuilds: expected only esbuild and nx");
}

for (const name of toolchainPackageNames) {
  expectEqual(
    `devDependencies.${name}`,
    packageJson.devDependencies?.[name],
    "catalog:",
  );
  expectEqual(
    `installed.${name}`,
    packageVersion(name),
    expectedInstalledVersions[name],
  );
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
const pnpmVersion = await run("pnpm.version", pnpmCommand, ["--version"]);
expectEqual("pnpm.version", pnpmVersion, baseline?.packageManagerVersion);
const tsc7Version = await run("tsc7.version", "pnpm", ["exec", "tsc", "--version"]);
if (!tsc7Version.includes(expectedInstalledVersions["@typescript/native"])) {
  fail(`tsc7.version: expected ${expectedInstalledVersions["@typescript/native"]}`);
}
await run("tsc7.compile", "pnpm", ["exec", "tsc", "-p", "tsconfig.toolchain.json"]);
const tsc6Version = await run("tsc6.version", "pnpm", ["exec", "tsc6", "--version"]);
const expectedTs6Major = expectedInstalledVersions.typescript?.split(".")[0];
if (
  expectedTs6Major === undefined ||
  !new RegExp(`^Version ${expectedTs6Major}\\.`, "m").test(tsc6Version)
) {
  fail(
    `tsc6.version: expected TypeScript ${expectedTs6Major ?? "6"} compatibility lane`,
  );
}
await run("tsc6.compile", "pnpm", ["exec", "tsc6", "-p", "tsconfig.ts6.json"]);

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
