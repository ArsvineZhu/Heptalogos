/**
 * Assembles the current built Product Host and reference CLI into one
 * portable Product root. Dependency closure is delegated to pnpm deploy; this
 * script only places that closure beside private runtime payloads and writes
 * an uninitialized assembly inventory. The stable launcher materializes the
 * installation locator from the user's first execution location.
 * @module assemble-portable-product
 */

import { createHash } from "node:crypto";
import {
  access,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  realpath,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { runProcessSync } from "@heptalogos/repo-kit";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const productHostPackage = resolve(repositoryRoot, "packages/application/product-host");
const cliPackage = resolve(repositoryRoot, "packages/application/cli");
const productIdentities = resolve(
  productHostPackage,
  "dist/generated/build-identities.js",
);
const pnpmCommand = "pnpm";
const requiredPostgresTools =
  process.platform === "win32"
    ? [
        "postgres.exe",
        "initdb.exe",
        "pg_ctl.exe",
        "pg_controldata.exe",
        "pg_isready.exe",
      ]
    : ["postgres", "initdb", "pg_ctl", "pg_controldata", "pg_isready"];
const exactOpenClawVersion = "2026.9.1";
const exactOpenClawWireVersion = "4";

function fail(message) {
  throw new Error(message);
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    const value = argv[index + 1];
    if (
      (option === "--target" ||
        option === "--node-root" ||
        option === "--postgres-root") &&
      (value === undefined || value.startsWith("--"))
    ) {
      fail(`${option} requires one path value`);
    }
    if (
      option === "--target" ||
      option === "--node-root" ||
      option === "--postgres-root"
    ) {
      values.set(option, resolve(value));
      index += 1;
      continue;
    }
    fail(`Unknown option ${String(option)}`);
  }
  for (const option of ["--target", "--node-root", "--postgres-root"]) {
    if (!values.has(option)) fail(`${option} is required`);
  }
  return {
    target: values.get("--target"),
    nodeRoot: values.get("--node-root"),
    postgresRoot: values.get("--postgres-root"),
  };
}

function isInside(parent, child) {
  const parentPath = resolve(parent) + sep;
  const childPath = resolve(child);
  return childPath.startsWith(parentPath);
}

async function requireFile(path, label) {
  try {
    const entry = await lstat(path);
    if (!entry.isFile()) fail(`${label} is not a regular file: ${path}`);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      fail(`${label} is missing: ${path}`);
    }
    throw error;
  }
}

function run(command, args, cwd) {
  const result = runProcessSync(command, args, {
    cwd,
    env: { ...process.env, CI: "true" },
    reject: false,
  });
  if (result.stdout.length > 0) process.stdout.write(result.stdout);
  if (result.stderr.length > 0) process.stderr.write(result.stderr);
  if (result.failed)
    fail(`${command} ${args.join(" ")} exited with ${String(result.exitCode)}`);
}

function probe(command, args, cwd = repositoryRoot) {
  const result = runProcessSync(command, args, {
    cwd,
    reject: false,
  });
  if (result.failed) {
    fail(`Could not verify ${command} ${args.join(" ")}`);
  }
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

async function digestFile(path) {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

async function digestTree(root) {
  const entries = [];
  async function visit(directory, prefix) {
    const children = await readdir(directory, { withFileTypes: true });
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const path = join(directory, child.name);
      const name = prefix === "" ? child.name : `${prefix}/${child.name}`;
      if (child.isSymbolicLink()) {
        entries.push({ path: name, link: await readlink(path) });
      } else if (child.isDirectory()) {
        await visit(path, name);
      } else if (child.isFile()) {
        entries.push({ path: name, sha256: await digestFile(path) });
      }
    }
  }
  await visit(root, "");
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}

async function copyDirectory(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, {
    recursive: true,
    force: true,
    dereference: false,
    verbatimSymlinks: true,
    errorOnExist: false,
  });
}

async function verifyPortableLinks(root) {
  async function visit(directory) {
    const children = await readdir(directory, { withFileTypes: true });
    for (const child of children) {
      const path = join(directory, child.name);
      if (child.isSymbolicLink()) {
        const target = resolve(dirname(path), await readlink(path));
        if (!isInside(root, target) && resolve(root) !== target) {
          fail(`Portable dependency link escapes the Product root: ${path}`);
        }
      } else if (child.isDirectory()) {
        await visit(path);
      }
    }
  }
  await visit(root);
}

async function collectPackageLicenses(roots) {
  const packages = new Map();
  async function visit(root, directory) {
    const children = await readdir(directory, { withFileTypes: true });
    for (const child of children) {
      const path = join(directory, child.name);
      if (child.isDirectory()) await visit(root, path);
      else if (child.isFile() && child.name === "package.json") {
        const packageJson = JSON.parse(await readFile(path, "utf8"));
        if (typeof packageJson.name !== "string") continue;
        const version =
          typeof packageJson.version === "string" ? packageJson.version : "unknown";
        const key = `${packageJson.name}@${version}`;
        if (!packages.has(key)) {
          packages.set(key, {
            name: packageJson.name,
            version,
            license: packageJson.license ?? packageJson.licenses ?? "unknown",
            packageJson: relative(root, path).split(sep).join("/"),
          });
        }
      }
    }
  }
  for (const root of roots) await visit(root, join(root, "node_modules", ".pnpm"));
  return [...packages.values()].sort((left, right) =>
    `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`),
  );
}

const packageDependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

async function visitPackageJson(root, visit) {
  async function walk(directory) {
    const children = await readdir(directory, { withFileTypes: true });
    for (const child of children) {
      const path = join(directory, child.name);
      if (child.isDirectory()) {
        await walk(path);
      } else if (child.isFile() && child.name === "package.json") {
        await visit(path);
      }
    }
  }
  await walk(root);
}

async function rewriteWorkspaceProtocols(roots) {
  const paths = [];
  for (const root of roots) {
    paths.push(join(root, "package.json"));
    const scopeRoot = join(root, "node_modules", "@heptalogos");
    try {
      for (const child of await readdir(scopeRoot, { withFileTypes: true })) {
        if (child.isDirectory())
          paths.push(join(scopeRoot, child.name, "package.json"));
      }
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
        throw error;
    }
  }
  const workspaceVersions = new Map();
  for (const path of paths) {
    const packageJson = JSON.parse(await readFile(path, "utf8"));
    if (
      typeof packageJson.name !== "string" ||
      !packageJson.name.startsWith("@heptalogos/") ||
      typeof packageJson.version !== "string"
    )
      continue;
    const existing = workspaceVersions.get(packageJson.name);
    if (existing !== undefined && existing !== packageJson.version) {
      fail(
        `Portable closure has multiple versions for workspace dependency ${packageJson.name}: ${existing} and ${packageJson.version}`,
      );
    }
    workspaceVersions.set(packageJson.name, packageJson.version);
  }
  for (const path of paths) {
    const packageJson = JSON.parse(await readFile(path, "utf8"));
    if (
      typeof packageJson.name !== "string" ||
      !packageJson.name.startsWith("@heptalogos/")
    )
      continue;
    let changed = false;
    for (const sectionName of packageDependencySections) {
      const section = packageJson[sectionName];
      if (typeof section !== "object" || section === null || Array.isArray(section))
        continue;
      for (const [name, value] of Object.entries(section)) {
        if (typeof value !== "string" || !value.startsWith("workspace:")) continue;
        const version = workspaceVersions.get(name);
        if (version === undefined) {
          fail(`Portable closure has an unresolved workspace dependency ${name}`);
        }
        const protocol = value.slice("workspace:".length);
        if (protocol === "*") section[name] = version;
        else if (protocol === "^") section[name] = `^${version}`;
        else if (protocol === "~") section[name] = `~${version}`;
        else
          fail(`Portable closure has an unsupported workspace range ${name}: ${value}`);
        changed = true;
      }
    }
    if (changed) {
      // pnpm deploy may materialize workspace manifests as hard links to the
      // source checkout. Detach before rewriting so the assembly never mutates
      // the workspace package manifests through a shared inode.
      await unlink(path);
      await writeFile(path, JSON.stringify(packageJson, null, 2) + "\n", {
        encoding: "utf8",
      });
    }
  }
}

async function preserveWorkspaceManifests(operation) {
  const paths = [join(repositoryRoot, "package.json")];
  for (const root of [
    join(repositoryRoot, "packages"),
    join(repositoryRoot, "tools"),
  ]) {
    await visitPackageJson(root, async (path) => {
      paths.push(path);
    });
  }
  const contents = new Map();
  for (const path of paths) contents.set(path, await readFile(path));
  try {
    return await operation();
  } finally {
    for (const [path, content] of contents) {
      await writeFile(path, content);
    }
  }
}

async function writeLauncher(target) {
  await mkdir(join(target, "bin"), { recursive: true });
  await cp(
    resolve(repositoryRoot, "scripts/package/portable-launcher.mjs"),
    join(target, "bin", "portable-launcher.mjs"),
  );
  const launcher = `@echo off\r\nsetlocal\r\nset "ROOT=%~dp0.."\r\nset "NODE=%ROOT%\\runtime\\node\\node.exe"\r\nif not exist "%NODE%" (\r\n  echo Portable Node runtime is missing 1>&2\r\n  exit /b 1\r\n)\r\n"%NODE%" "%ROOT%\\bin\\portable-launcher.mjs" %*\r\nexit /b %ERRORLEVEL%\r\n`;
  await writeFile(join(target, "bin", "heptalogos.cmd"), launcher, {
    encoding: "utf8",
    mode: 0o755,
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  try {
    await access(options.target);
    fail(`Portable Product target must be a new directory: ${options.target}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Portable Product target"))
      throw error;
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      throw error;
  }
  await requireFile(
    join(options.nodeRoot, process.platform === "win32" ? "node.exe" : "bin/node"),
    "Node runtime",
  );
  const nodeExecutable = join(
    options.nodeRoot,
    process.platform === "win32" ? "node.exe" : "bin/node",
  );
  const nodeVersion = probe(nodeExecutable, ["--version"]);
  if (nodeVersion !== "v24.20.0")
    fail(`Expected Node v24.20.0, observed ${nodeVersion}`);
  for (const name of requiredPostgresTools) {
    await requireFile(join(options.postgresRoot, "bin", name), `PostgreSQL ${name}`);
  }
  const postgresVersion = probe(
    join(options.postgresRoot, "bin", requiredPostgresTools[0]),
    ["--version"],
  );
  if (!/18\.6/u.test(postgresVersion))
    fail(`Expected PostgreSQL 18.6, observed ${postgresVersion}`);
  await requireFile(join(productHostPackage, "dist/bin.js"), "built Product Host");
  await requireFile(join(cliPackage, "dist/bin.js"), "built reference CLI");
  const identityText = await readFile(productIdentities, "utf8");
  const productGeneration = /PRODUCT_GENERATION_ID = "([0-9a-f]{64})"/u.exec(
    identityText,
  )?.[1];
  const bootstrapGeneration =
    /BOOTSTRAP_RUNTIME_GENERATION_ID = "([0-9a-f]{64})"/u.exec(identityText)?.[1];
  if (productGeneration === undefined || bootstrapGeneration === undefined) {
    fail("Built Product Host identities are missing or invalid");
  }

  const productRoot = join(options.target, "program", "product", productGeneration);
  const cliRoot = join(productRoot, "cli");
  await mkdir(join(options.target, "program", "product"), { recursive: true });
  await preserveWorkspaceManifests(async () => {
    run(
      pnpmCommand,
      [
        "--filter",
        "@heptalogos/product-host",
        "deploy",
        productRoot,
        "--prod",
        "--legacy",
        "--config.node-linker=hoisted",
        "--ignore-scripts",
      ],
      repositoryRoot,
    );
    run(
      pnpmCommand,
      [
        "--filter",
        "@heptalogos/cli",
        "deploy",
        cliRoot,
        "--prod",
        "--legacy",
        "--config.node-linker=hoisted",
        "--ignore-scripts",
      ],
      repositoryRoot,
    );
  });
  // The legacy deploy implementation prunes the repository's shared
  // node_modules to the production closure as a side effect. Reify the
  // workspace development closure before returning so packaging does not
  // leave the repository's normal verification entrypoint unusable.
  run(pnpmCommand, ["install", "--frozen-lockfile", "--prod=false"], repositoryRoot);
  await rewriteWorkspaceProtocols([productRoot, cliRoot]);
  const hostOpenClawPackage = JSON.parse(
    await readFile(join(productRoot, "node_modules/openclaw/package.json"), "utf8"),
  );
  if (hostOpenClawPackage.version !== exactOpenClawVersion) {
    fail(
      `Product deploy did not contain exact OpenClaw ${exactOpenClawVersion}: ${String(hostOpenClawPackage.version)}`,
    );
  }
  await requireFile(
    join(productRoot, "node_modules/openclaw/openclaw.mjs"),
    "deployed OpenClaw executable",
  );
  const gatewayClientPackagePath = join(
    productRoot,
    "node_modules/@openclaw/gateway-client/package.json",
  );
  const gatewayProtocolPackagePath = join(
    productRoot,
    "node_modules/@openclaw/gateway-protocol/package.json",
  );
  await requireFile(gatewayClientPackagePath, "deployed OpenClaw Gateway client");
  await requireFile(gatewayProtocolPackagePath, "deployed OpenClaw Gateway protocol");
  const gatewayClientPackage = JSON.parse(
    await readFile(gatewayClientPackagePath, "utf8"),
  );
  const gatewayProtocolPackage = JSON.parse(
    await readFile(gatewayProtocolPackagePath, "utf8"),
  );
  for (const [label, packageJson] of [
    ["Gateway client", gatewayClientPackage],
    ["Gateway protocol", gatewayProtocolPackage],
  ]) {
    if (packageJson.version !== exactOpenClawVersion) {
      fail(
        `Product deploy did not contain exact OpenClaw ${label} ${exactOpenClawVersion}: ${String(packageJson.version)}`,
      );
    }
  }
  const wireProtocolVersion = probe(
    nodeExecutable,
    [
      "--input-type=module",
      "--eval",
      'import { PROTOCOL_VERSION } from "@openclaw/gateway-protocol"; console.log(PROTOCOL_VERSION);',
    ],
    productRoot,
  );
  if (wireProtocolVersion !== exactOpenClawWireVersion) {
    fail(
      `Product deploy did not expose exact OpenClaw wire protocol ${exactOpenClawWireVersion}: ${wireProtocolVersion}`,
    );
  }

  await requireFile(join(productRoot, "dist/bin.js"), "deployed Product Host");
  await requireFile(join(cliRoot, "dist/bin.js"), "deployed reference CLI");
  await copyDirectory(options.nodeRoot, join(options.target, "runtime", "node"));
  for (const directory of ["bin", "lib", "share"]) {
    await copyDirectory(
      join(options.postgresRoot, directory),
      join(options.target, "runtime", "postgresql", directory),
    );
  }
  await mkdir(join(options.target, "licenses"), { recursive: true });
  await cp(
    join(options.nodeRoot, "LICENSE"),
    join(options.target, "licenses/node-LICENSE.txt"),
  );
  await cp(
    join(options.postgresRoot, "server_license.txt"),
    join(options.target, "licenses/postgresql-server-license.txt"),
  );
  await cp(
    join(options.postgresRoot, "commandlinetools_3rd_party_licenses.txt"),
    join(options.target, "licenses/postgresql-commandline-third-party.txt"),
  );
  const openclawRoot = await realpath(join(productRoot, "node_modules/openclaw"));
  await cp(
    join(openclawRoot, "LICENSE"),
    join(options.target, "licenses/openclaw-LICENSE.txt"),
  );
  await cp(
    join(openclawRoot, "THIRD_PARTY_NOTICES.md"),
    join(options.target, "licenses/openclaw-THIRD_PARTY_NOTICES.md"),
  );
  await writeFile(
    join(options.target, "licenses/npm-package-license-index.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        packages: await collectPackageLicenses([productRoot, cliRoot]),
      },
      null,
      2,
    ),
    { encoding: "utf8", mode: 0o600 },
  );
  await writeLauncher(options.target);
  // pnpm deploy retains the workspace package's own virtual-store links.
  // They point back to the source checkout and are not needed by the built
  // entrypoints, so remove only those two self-links before the portability
  // check. All transitive workspace packages remain in the deployed closure.
  await rm(
    join(productRoot, "node_modules/.pnpm/node_modules/@heptalogos/product-host"),
    { force: true },
  );
  await rm(join(cliRoot, "node_modules/.pnpm/node_modules/@heptalogos/cli"), {
    force: true,
  });
  await verifyPortableLinks(join(productRoot, "node_modules"));
  await verifyPortableLinks(join(cliRoot, "node_modules"));
  for (const root of [productRoot, cliRoot]) {
    await rm(join(root, "node_modules/.modules.yaml"), { force: true });
    await rm(join(root, "node_modules/.pnpm/lock.yaml"), { force: true });
  }
  const manifest = {
    schemaVersion: 1,
    productGeneration,
    bootstrapGeneration,
    target: { os: process.platform, arch: process.arch },
    initialization: {
      state: "UNINITIALIZED",
      locator: "created-by-bin/heptalogos.cmd-on-first-run",
      port: "allocated-by-the-launcher-on-first-start-and-persisted-in-BootstrapState",
    },
    openclaw: {
      rootPackageVersion: hostOpenClawPackage.version,
      gatewayClientPackageVersion: gatewayClientPackage.version,
      gatewayProtocolPackageVersion: gatewayProtocolPackage.version,
      wireProtocolVersion,
    },
    assembly: {
      packageManager: "pnpm@11.24.0",
      dependencyClosure:
        "pnpm deploy --legacy --config.node-linker=hoisted --prod --ignore-scripts",
    },
    components: [
      {
        name: "node",
        version: nodeVersion.slice(1),
        digest: await digestTree(join(options.target, "runtime/node")),
      },
      {
        name: "postgresql",
        version: "18.6",
        digest: await digestTree(join(options.target, "runtime/postgresql")),
      },
      {
        name: "openclaw",
        version: hostOpenClawPackage.version,
        gatewayClientVersion: gatewayClientPackage.version,
        gatewayProtocolVersion: gatewayProtocolPackage.version,
        wireProtocolVersion,
        digest: await digestTree(openclawRoot),
      },
      {
        name: "product-host",
        generation: productGeneration,
        digest: await digestTree(productRoot),
      },
      { name: "reference-cli", digest: await digestTree(cliRoot) },
      {
        name: "portable-launcher",
        digest: await digestTree(join(options.target, "bin")),
      },
    ],
  };
  await writeFile(
    join(options.target, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    {
      encoding: "utf8",
      mode: 0o600,
    },
  );
  console.log(`PASS portable Product assembled at ${options.target}`);
}

await main();
