import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { Type, type TProperties } from "typebox";
import {
  LIFECYCLE_ROOT_IDS,
  parseInstallationId,
  parseInstanceId,
  ProblemError,
  type InstallationId,
  type InstanceId,
  type LifecycleRootId,
} from "@heptalogos/foundation-contracts";

const BOOTSTRAP_LOCATOR_FILENAME = "heptalogos.bootstrap.json";

export interface BootstrapLocatorV1 {
  readonly schemaVersion: 1;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly roots: Readonly<Record<LifecycleRootId, string>>;
}

const rootProperties = Object.fromEntries(
  LIFECYCLE_ROOT_IDS.map((id) => [id, Type.String({ minLength: 1 })]),
) as TProperties;

const locatorSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    installationId: Type.String({ minLength: 1 }),
    instanceId: Type.String({ minLength: 1 }),
    roots: Type.Object(rootProperties, { additionalProperties: false }),
  },
  { additionalProperties: false },
);

const ajv = new Ajv2020({
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
  strict: true,
});
const validateLocator = ajv.compile(locatorSchema);

function locatorProblem(
  problemCode: string,
  title: string,
  detail: string,
  category = "validation",
): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode,
    category,
    retryClass: "manual",
    title,
    detail,
  });
}

function isNodeError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function readLocatorFile(anchorRoot: string): Promise<string> {
  try {
    return await readFile(join(anchorRoot, BOOTSTRAP_LOCATOR_FILENAME), "utf8");
  } catch (error) {
    if (isNodeError(error, "ENOENT")) {
      throw locatorProblem(
        "bootstrap.locator.not_found",
        "Bootstrap locator is not available",
        "The installation anchor does not contain the bootstrap locator",
        "unavailable",
      );
    }
    throw locatorProblem(
      "bootstrap.locator.not_found",
      "Bootstrap locator could not be read",
      "The bootstrap locator could not be read from the installation anchor",
      "unavailable",
    );
  }
}

function parseLocatorText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw locatorProblem(
      "bootstrap.locator.invalid_json",
      "Bootstrap locator is not valid JSON",
      "Bootstrap locator JSON could not be parsed",
    );
  }
}

function requireValidSchema(value: unknown): asserts value is {
  readonly schemaVersion: 1;
  readonly installationId: string;
  readonly instanceId: string;
  readonly roots: Record<LifecycleRootId, string>;
} {
  if (!validateLocator(value)) {
    throw locatorProblem(
      "bootstrap.locator.invalid_schema",
      "Bootstrap locator does not match its schema",
      "Bootstrap locator does not match the supported schema",
    );
  }
}

export async function loadBootstrapLocator(
  anchorRoot: string,
): Promise<BootstrapLocatorV1> {
  const parsed = parseLocatorText(await readLocatorFile(anchorRoot));

  requireValidSchema(parsed);

  const installationId = parseInstallationId(parsed.installationId);
  if (!installationId) {
    throw locatorProblem(
      "bootstrap.locator.invalid_installation_id",
      "Bootstrap locator InstallationId is invalid",
      "Bootstrap locator InstallationId must be a valid RFC 9562 UUIDv7",
    );
  }

  const instanceId = parseInstanceId(parsed.instanceId);
  if (!instanceId) {
    throw locatorProblem(
      "bootstrap.locator.invalid_instance_id",
      "Bootstrap locator InstanceId is invalid",
      "Bootstrap locator InstanceId must be a valid RFC 9562 UUIDv7",
    );
  }

  for (const root of LIFECYCLE_ROOT_IDS) {
    if (!isAbsolute(parsed.roots[root])) {
      throw locatorProblem(
        "bootstrap.locator.relative_root",
        "Bootstrap locator contains a relative lifecycle root",
        "Every configured lifecycle root must be an absolute path",
      );
    }
  }

  let anchorCanonicalPath: string;
  let programCanonicalPath: string;
  try {
    [anchorCanonicalPath, programCanonicalPath] = await Promise.all([
      realpath(anchorRoot),
      realpath(parsed.roots.PROGRAM),
    ]);
  } catch {
    throw locatorProblem(
      "bootstrap.locator.program_root_mismatch",
      "Bootstrap locator PROGRAM root cannot be verified",
      "The configured PROGRAM root could not be resolved to the supplied installation anchor",
    );
  }

  if (anchorCanonicalPath !== programCanonicalPath) {
    throw locatorProblem(
      "bootstrap.locator.program_root_mismatch",
      "Bootstrap locator PROGRAM root does not match the installation anchor",
      "The configured PROGRAM root must resolve to the supplied installation anchor",
    );
  }

  return {
    schemaVersion: 1,
    installationId,
    instanceId,
    roots: parsed.roots,
  };
}
