import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const errors = [];
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
  "tmp",
]);
const workQueuePublicSource = readFileSync(
  resolve(root, "packages/work-queue/src/index.ts"),
  "utf8",
);
if (/\bcreateWorkQueueRepository\b/u.test(workQueuePublicSource)) {
  errors.push(
    "packages/work-queue/src/index.ts: concrete WorkQueue repository factory must remain on the restricted Foundation subpath",
  );
}

const hostOwnershipSourcePrefix = "packages/host-ownership/src/";
const hostOwnershipAdapterSourcePaths = new Set([
  "packages/host-ownership/src/bootstrap-admin.ts",
  "packages/host-ownership/src/host-lease-connection.ts",
]);
const hostOwnershipPublicSource = readFileSync(
  resolve(root, "packages/host-ownership/src/index.ts"),
  "utf8",
);
if (/\b(?:Client|Pool|XState|StateMachine)\b/u.test(hostOwnershipPublicSource)) {
  errors.push(
    "packages/host-ownership/src/index.ts: raw PostgreSQL/XState mechanics must not leak through the public Host ownership contract",
  );
}

const bootstrapRuntimePublicSource = readFileSync(
  resolve(root, "packages/bootstrap-runtime/src/index.ts"),
  "utf8",
);
const rawBootstrapAuthorityExports = [
  "acquireBootstrapOwnership",
  "acquireBootstrapRecoveryLease",
  "reclaimAbandonedBootstrapOwnership",
  "recoverAbandonedBootstrapToHost",
  "recoverInterruptedHostMaintenance",
  "openMaintenanceStateAccess",
  "OwnedMaintenanceStateAccess",
  "BOOTSTRAP_RECOVERY_STALE_MS",
  "assertLocalInstallationOwnerFor",
];
const sensitiveBootstrapAuthorityModules = [
  "./bootstrap-ownership.js",
  "./bootstrap-recovery.js",
  "./host-maintenance-recovery.js",
  "./maintenance-state-access.js",
];
if (
  rawBootstrapAuthorityExports.some((name) =>
    new RegExp(`\\b${name}\\b`, "u").test(bootstrapRuntimePublicSource),
  )
) {
  errors.push(
    "packages/bootstrap-runtime/src/index.ts: raw bootstrap/recovery Authority primitive leaked through the public bootstrap-runtime contract",
  );
}

const persistencePublicSourcePath = resolve(root, "packages/persistence/src/index.ts");
const persistencePublicSource = readFileSync(persistencePublicSourcePath, "utf8");
const persistenceMechanicsPattern =
  /\b(?:Pool|PoolClient|Client|Kysely|PostgresDialect|Transaction|CompiledQuery)\b/u;
if (persistenceMechanicsPattern.test(persistencePublicSource)) {
  errors.push(
    "packages/persistence/src/index.ts: concrete pg/Kysely mechanics must not leak through the persistence package root",
  );
}
const executionLineagePublicSourcePath = resolve(
  root,
  "packages/execution-lineage/src/index.ts",
);
const executionLineagePublicSource = readFileSync(
  executionLineagePublicSourcePath,
  "utf8",
);
const executionLineageMechanicsPattern =
  /\b(?:AsyncLocalStorage|OTelContext|SpanContext|TracerProvider|ContextManager|Kysely|Pool|Client|PersistenceInternalTransaction|runWithLineageSuppressed)\b/u;
if (executionLineageMechanicsPattern.test(executionLineagePublicSource)) {
  errors.push(
    "packages/execution-lineage/src/index.ts: ALS/OTel provider/raw persistence/suppression mechanics must not leak through the execution-lineage package root",
  );
}

const evidencePublicSourcePath = resolve(root, "packages/evidence/src/index.ts");
const evidencePublicSource = readFileSync(evidencePublicSourcePath, "utf8");
const evidenceMechanicsPattern =
  /\b(?:Pool|PoolClient|Client|Kysely|PostgresDialect|CompiledQuery|PersistenceInternalTransaction)\b/u;
const evidenceGenericPayloadPattern =
  /\b(?:metadata|payload)\s*[?:]|Record\s*<\s*string\s*,\s*unknown\s*>/u;
if (evidenceMechanicsPattern.test(evidencePublicSource)) {
  errors.push(
    "packages/evidence/src/index.ts: concrete pg/Kysely/persistence mechanics must not leak through the evidence package root",
  );
}
if (evidenceGenericPayloadPattern.test(evidencePublicSource)) {
  errors.push(
    "packages/evidence/src/index.ts: generic evidence payload/metadata must not leak through the evidence package root",
  );
}

const canonicalSchemaPublicSourcePath = resolve(
  root,
  "packages/canonical-schema/src/index.ts",
);
const canonicalSchemaPublicSource = readFileSync(
  canonicalSchemaPublicSourcePath,
  "utf8",
);
const canonicalSchemaMechanicsPattern =
  /\b(?:Pool|PoolClient|Client|Kysely|PostgresDialect|Migrator|MigrationProvider)\b/u;
if (canonicalSchemaMechanicsPattern.test(canonicalSchemaPublicSource)) {
  errors.push(
    "packages/canonical-schema/src/index.ts: concrete pg/Kysely migration mechanics must not leak through the canonical-schema package root",
  );
}
for (const match of persistencePublicSource.matchAll(
  /export\s+\*\s+from\s+["'](\.\/[^"']+)["']/gu,
)) {
  const specifier = match[1];
  const candidatePaths = [
    resolve(dirname(persistencePublicSourcePath), `${specifier}.ts`),
    resolve(dirname(persistencePublicSourcePath), `${specifier}.tsx`),
  ];
  const targetPath = candidatePaths.find((candidate) => existsSync(candidate));
  if (!targetPath) continue;
  const targetSource = readFileSync(targetPath, "utf8");
  if (/(?:from\s+|import\s*\(\s*)["'](?:pg|kysely)["']/u.test(targetSource)) {
    errors.push(
      `packages/persistence/src/index.ts: package-root star export leaks pg/Kysely mechanics from ${specifier}`,
    );
  }
}
if (
  sensitiveBootstrapAuthorityModules.some((specifier) =>
    new RegExp(`export\\s+\\*\\s+from\\s+["']${specifier}["']`, "u").test(
      bootstrapRuntimePublicSource,
    ),
  )
) {
  errors.push(
    "packages/bootstrap-runtime/src/index.ts: sensitive bootstrap/recovery Authority module exported through a package-root star export",
  );
}

function collect(directory, matcher, files = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) collect(path, matcher, files);
    } else if (entry.isFile() && matcher(path, entry.name)) {
      files.push(path);
    }
  }
  return files;
}

const sourcePaths = collect(root, (sourcePath) => /\.(?:ts|tsx)$/u.test(sourcePath));
for (const path of sourcePaths) {
  const relativePath = relative(root, path).replaceAll("\\", "/");
  const source = readFileSync(path, "utf8");
  const isTestSource = relativePath.includes("/test/");
  if (relativePath.startsWith("packages/runtime-substrate/") && !isTestSource) {
    if (
      /(?:from|import\s*\(|require\s*\()(?:\s*["'])(?:@heptalogos\/(?:persistence|execution-lineage)|\.\.\/)/u.test(
        source,
      )
    ) {
      errors.push(
        `${relativePath}: runtime-substrate must not depend on PersistenceService or execution-lineage`,
      );
    }
  }
  if (relativePath.startsWith("packages/runtime-kernel/")) {
    if (
      /(?:from|import\s*\(|require\s*\()(?:\s*["'])(?:@heptalogos\/(?:bootstrap-state|host-ownership|canonical-schema)|pg|kysely)(?:["'])/u.test(
        source,
      )
    ) {
      errors.push(
        `${relativePath}: runtime-kernel must not import Bootstrap/Host ownership, canonical-schema, pg, or Kysely directly`,
      );
    }
    if (relativePath === "packages/runtime-kernel/src/index.ts") {
      if (
        /\b(?:Cordis|Context|Fiber|Kysely|Pool|Client|PostgresDialect)\b/u.test(source)
      ) {
        errors.push(
          "packages/runtime-kernel/src/index.ts: runtime-kernel package root must not leak framework or database objects",
        );
      }
    }
  }
  if (relativePath.startsWith(hostOwnershipSourcePrefix)) {
    for (const forbidden of ["Kysely", "DBOS", "PersistenceService"]) {
      if (new RegExp(`\\b${forbidden}\\b`, "u").test(source)) {
        errors.push(
          `${relativePath}: Host ownership must not materialize ${forbidden}`,
        );
      }
    }
    if (
      /(?:from|import\s*\()\s*["'](?:kysely|dbos|@dbos-inc\/dbos-sdk)["']/u.test(source)
    ) {
      errors.push(`${relativePath}: Host ownership must not import Kysely or DBOS`);
    }
  }
  if (
    source.includes("createHostOwnershipToken") &&
    !(
      relativePath === "packages/foundation-contracts/src/identity.ts" ||
      relativePath === "packages/foundation-contracts/src/index.ts" ||
      relativePath.startsWith(hostOwnershipSourcePrefix) ||
      relativePath === "packages/bootstrap-runtime/src/host-ownership-handoff.ts" ||
      relativePath.endsWith(".test.ts")
    )
  ) {
    errors.push(
      `${relativePath}: HostOwnershipToken creation is outside the Host acquisition path`,
    );
  }
  if (
    relativePath.startsWith(hostOwnershipSourcePrefix) &&
    !hostOwnershipAdapterSourcePaths.has(relativePath) &&
    !relativePath.endsWith(".test.ts") &&
    /from\s+["']pg["']/u.test(source)
  ) {
    errors.push(
      `${relativePath}: raw pg imports are restricted to the Host ownership adapters or tests`,
    );
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "PASS Heptalogos semantic boundary checks; package tooling identity and public Authority surfaces are valid",
  );
}
