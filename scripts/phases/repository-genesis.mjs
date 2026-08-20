import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const errors = [];

function fail(message) {
  errors.push(message);
}

const allowedRootEntries = new Set([
  ".agents",
  ".cache",
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".git",
  ".nx",
  ".pnpm-store",
  ".node-version",
  ".npmrc",
  ".prettierignore",
  ".prettierrc.json",
  ".vite",
  "AGENTS.md",
  "Architecture_Corpus",
  "GENESIS_EVIDENCE.json",
  "coverage",
  "dist",
  "REPOSITORY_GENESIS_PLAN.md",
  "eslint.config.mjs",
  "fixtures",
  "nx.json",
  "node_modules",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "scripts",
  "src",
  "test-results",
  "tsconfig.base.json",
  "tsconfig.json",
  "tsconfig.toolchain.json",
  "tsconfig.ts6.json",
  "vitest.config.ts",
]);

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (!allowedRootEntries.has(entry.name)) fail(`unexpected root entry: ${entry.name}`);
}

const ignoredDirectories = new Set([
  ".git",
  ".nx",
  ".pnpm-store",
  ".vite",
  ".cache",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);
const forbiddenLockfiles = new Set([
  "package-lock.json",
  "yarn.lock",
  "npm-shrinkwrap.json",
  "bun.lock",
  "bun.lockb",
]);

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walk(path);
      continue;
    }
    if (forbiddenLockfiles.has(entry.name)) fail(`forbidden lockfile: ${path}`);
  }
}
walk(root);

if (existsSync(join(root, "Architecture_Corpus", "AGENTS.md"))) {
  fail("Architecture_Corpus/AGENTS.md must remain deleted");
}

const genesisWorkspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
if (!/^packages:\s*\r?\n\s+- \.\s*$/m.test(genesisWorkspace)) {
  fail("Genesis workspace packages must remain root-only");
}
const genesisNxConfig = JSON.parse(readFileSync(join(root, "nx.json"), "utf8"));
if (!genesisNxConfig.plugins?.some((plugin) => plugin.plugin === "@nx/js/typescript")) {
  fail("Genesis Nx plugin: @nx/js/typescript is not configured");
}
const genesisProjectConfig = JSON.parse(
  readFileSync(join(root, "src", "project.json"), "utf8"),
);
if (genesisProjectConfig.targets?.build || genesisProjectConfig.targets?.typecheck) {
  fail("Genesis project.json must let @nx/js/typescript infer build/typecheck targets");
}

try {
  const top = resolve(
    execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
  );
  if (top !== root) fail(`git top-level is not current repository: ${top}`);
  const evidencePath = join(root, "GENESIS_EVIDENCE.json");
  if (!existsSync(evidencePath)) {
    fail("Genesis evidence file is missing");
  } else {
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    const donorSha = evidence.donorCommit;
    if (!/^\w{40}$/u.test(donorSha) || evidence.donorRef !== "dev/rewrite") {
      fail("Genesis evidence does not contain a valid dev/rewrite donor commit");
    }
    try {
      execFileSync("git", ["cat-file", "-e", `${donorSha}^{commit}`], {
        cwd: root,
        stdio: "ignore",
      });
      fail(
        `archived donor commit object is present in the clean-room database: ${donorSha}`,
      );
    } catch {
      // The donor commit must not be reachable from the new repository object database.
    }
  }
} catch (error) {
  fail(`git independence check failed: ${error.message}`);
}

const scanFiles = [
  "package.json",
  "pnpm-workspace.yaml",
  "nx.json",
  "eslint.config.mjs",
  "tsconfig.base.json",
  "tsconfig.json",
  "tsconfig.toolchain.json",
  "tsconfig.ts6.json",
  "vitest.config.ts",
  ...["src", "scripts", "fixtures"].flatMap((directory) => {
    const files = [];
    const collect = (path) => {
      for (const entry of readdirSync(path, { withFileTypes: true })) {
        const child = join(path, entry.name);
        if (entry.isDirectory()) collect(child);
        else if (entry.isFile()) {
          const relative = child.slice(root.length + 1);
          const normalized = relative.replaceAll("\\", "/");
          if (
            normalized !== "scripts/check-clean-room.mjs" &&
            normalized !== "scripts/check-dependency-routes.mjs" &&
            normalized !== "scripts/dependency-route-authority.mjs" &&
            normalized !== "scripts/check-repository.mjs"
          ) {
            files.push(relative);
          }
        }
      }
    };
    collect(join(root, directory));
    return files;
  }),
];
const forbiddenReferences = [
  "Heptalogos_Archived",
  "Heptalogos_Architecture_Corpus",
  "Cedar",
  "DBOS",
  "Fastify",
  "oclif",
  "oxlint",
];
for (const relativePath of scanFiles) {
  const source = readFileSync(join(root, relativePath), "utf8");
  for (const reference of forbiddenReferences) {
    if (source.includes(reference))
      fail(`${relativePath}: forbidden reference ${reference}`);
  }
}

const genesisPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const genesisDependencyBaseline = new Set([
  "@nx/js",
  "@types/node",
  "@typescript/native",
  "eslint",
  "nx",
  "prettier",
  "typescript",
  "typescript-eslint",
  "vitest",
]);
for (const dependency of Object.keys(genesisPackage.devDependencies ?? {})) {
  if (!genesisDependencyBaseline.has(dependency)) {
    fail(`Genesis baseline dependency present: ${dependency}`);
  }
}

const expectedGenesisFiles = [
  "src/index.ts",
  "src/main.ts",
  "src/index.test.ts",
  "src/project.json",
  "src/tsconfig.build.json",
  "src/tsconfig.json",
  "GENESIS_EVIDENCE.json",
  "fixtures/ts6-api-lane.ts",
  "scripts/check-toolchain.mjs",
  "scripts/check-corpus-integrity.mjs",
  "scripts/check-dependency-routes.mjs",
  "scripts/check-boundaries.mjs",
  "scripts/check-clean-room.mjs",
  "scripts/check-repository.mjs",
  "scripts/dependency-route-authority.mjs",
];
for (const relativePath of expectedGenesisFiles) {
  if (
    !existsSync(join(root, relativePath)) ||
    !statSync(join(root, relativePath)).isFile()
  ) {
    fail(`Genesis file missing: ${relativePath}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log("PASS Repository Genesis acceptance");
}
