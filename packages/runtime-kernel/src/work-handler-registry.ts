import {
  parseContentDigest,
  parseContributionId,
  parseMicroSystemId,
} from "@heptalogos/foundation-contracts";
import { compileSchema, type SchemaValidator } from "@heptalogos/schema-runtime";
import type { RuntimeActivityRunner } from "@heptalogos/execution-lineage/runtime-kernel";
import { GenerationFence } from "./generation-fence.js";
import { runtimeKernelProblem } from "./problems.js";
import {
  type RuntimeWorkHandler,
  type RuntimeWorkHandlerInvocation,
  type RuntimeWorkHandlerLease,
  type RuntimeWorkHandlerResult,
  type WorkHandlerPayloadContract,
  type WorkHandlerProvisionDescriptor,
  type WorkHandlerRegistration,
  type WorkHandlerRegistrationOwner,
  type WorkHandlerTarget,
} from "./work-handler-contracts.js";

const namespacedIdShape = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/u;
const restoreReplayClasses = new Set(["RECONCILE_REQUIRED", "RESTORE_SAFE"]);

interface CompiledWorkHandlerRegistration extends WorkHandlerRegistration {
  readonly payloadValidators: ReadonlyMap<number, SchemaValidator<unknown>>;
  readonly outcomeValidator: SchemaValidator<unknown>;
}

function keyFor(
  owner: WorkHandlerRegistrationOwner,
  contributionId: WorkHandlerProvisionDescriptor["contributionId"],
): string {
  return `${owner.microSystemId}\u0000${contributionId}\u0000${owner.packageGenerationId}`;
}

function isBoundedNamespacedId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 128 &&
    namespacedIdShape.test(value)
  );
}

function descriptorProblem(detail: string): never {
  throw runtimeKernelProblem("runtime.work_handler.invalid_descriptor", detail);
}

function compilePayloadContract(
  contract: WorkHandlerPayloadContract,
): SchemaValidator<unknown> {
  if (!Number.isSafeInteger(contract.version) || contract.version <= 0) {
    descriptorProblem(
      "WorkHandler payload contract versions must be positive integers",
    );
  }
  if (
    typeof contract.schema !== "object" ||
    contract.schema === null ||
    Array.isArray(contract.schema)
  ) {
    descriptorProblem("WorkHandler payload schema must be a JSON Schema object");
  }
  try {
    return compileSchema<unknown>(contract.schema);
  } catch {
    descriptorProblem(
      `WorkHandler payload schema for version ${contract.version} is not a strict JSON Schema`,
    );
  }
}

function compileOutcomeSchema(
  schema: Readonly<Record<string, unknown>>,
): SchemaValidator<unknown> {
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    descriptorProblem("WorkHandler outcome schema must be a JSON Schema object");
  }
  try {
    return compileSchema<unknown>(schema);
  } catch {
    descriptorProblem("WorkHandler outcome schema is not a strict JSON Schema");
  }
}

function validateDescriptor(
  descriptor: WorkHandlerProvisionDescriptor,
): ReadonlyMap<number, SchemaValidator<unknown>> {
  if (parseContributionId(descriptor.contributionId) === undefined) {
    descriptorProblem("WorkHandler contributionId is invalid");
  }
  if (
    typeof descriptor.contractVersion !== "string" ||
    descriptor.contractVersion.length === 0 ||
    descriptor.contractVersion.length > 64 ||
    !/^[a-z0-9][a-z0-9._-]{0,63}$/u.test(descriptor.contractVersion)
  ) {
    descriptorProblem("WorkHandler contractVersion is invalid");
  }
  if (!isBoundedNamespacedId(descriptor.queueProfileId)) {
    descriptorProblem("WorkHandler queueProfileId is invalid");
  }
  if (!isBoundedNamespacedId(descriptor.resourceAdmissionClass)) {
    descriptorProblem("WorkHandler resourceAdmissionClass is invalid");
  }
  if (descriptor.configurationBindingPolicy !== "LATEST_COMPATIBLE_AT_ATTEMPT") {
    throw runtimeKernelProblem(
      "runtime.work-handler.configuration-binding-unavailable",
      "Current WorkHandlers require configuration-free latest-compatible binding",
    );
  }
  if (!restoreReplayClasses.has(descriptor.restoreReplayClass)) {
    descriptorProblem("WorkHandler restoreReplayClass is invalid");
  }
  if (descriptor.payloadContracts.length === 0) {
    descriptorProblem("WorkHandler must declare at least one payload contract");
  }
  const validators = new Map<number, SchemaValidator<unknown>>();
  for (const contract of descriptor.payloadContracts) {
    if (validators.has(contract.version)) {
      descriptorProblem("WorkHandler payload contract versions must be unique");
    }
    validators.set(contract.version, compilePayloadContract(contract));
  }
  return validators;
}

function validationFailure(
  problemCode: string,
  label: string,
  version: number | undefined,
  issues: readonly { readonly instancePath: string; readonly message: string }[],
): never {
  const suffix = version === undefined ? "" : ` for version ${version}`;
  throw runtimeKernelProblem(
    problemCode,
    `${label}${suffix} failed schema validation: ${issues
      .map((issue) => `${issue.instancePath} ${issue.message}`)
      .join("; ")}`,
  );
}

function validateValue(
  validator: SchemaValidator<unknown>,
  value: unknown,
  problemCode: string,
  label: string,
  version?: number,
): unknown {
  const result = validator.validate(value);
  if (!result.ok) {
    validationFailure(problemCode, label, version, result.issues);
  }
  return result.value;
}

function isWorkHandlerResult(value: unknown): value is RuntimeWorkHandlerResult {
  return typeof value === "object" && value !== null && "outcome" in value;
}

function createLease(
  registration: CompiledWorkHandlerRegistration,
  requestedTarget: WorkHandlerTarget,
): RuntimeWorkHandlerLease {
  const validatePayloadValue = (version: number, value: unknown): unknown => {
    const validator = registration.payloadValidators.get(version);
    if (validator === undefined) {
      throw runtimeKernelProblem(
        "runtime.work_handler.payload_version_unavailable",
        `WorkHandler does not accept payload version ${version}`,
      );
    }
    return validateValue(
      validator,
      value,
      "runtime.work_handler.payload_invalid",
      "WorkHandler payload",
      version,
    );
  };
  const validateOutcomeValue = (value: unknown): unknown =>
    validateValue(
      registration.outcomeValidator,
      value,
      "runtime.work_handler.outcome_invalid",
      "WorkHandler outcome",
    );

  return Object.freeze({
    target: requestedTarget,
    descriptor: registration.descriptor,
    validatePayload(version: number, value: unknown) {
      registration.fence.assertActive();
      return validatePayloadValue(version, value) as never;
    },
    validateOutcome(value: unknown) {
      registration.fence.assertActive();
      return validateOutcomeValue(value) as never;
    },
    async execute(
      input: RuntimeWorkHandlerInvocation,
    ): Promise<RuntimeWorkHandlerResult> {
      registration.fence.assertActive();
      const invoke = async (): Promise<RuntimeWorkHandlerResult> => {
        const result = await registration.fence.invoke(
          `work-handler.${registration.descriptor.contributionId}`,
          async () => {
            const handlerResult = await registration.implementation.execute(input);
            if (!isWorkHandlerResult(handlerResult)) {
              throw runtimeKernelProblem(
                "runtime.work_handler.invalid_result",
                "WorkHandler returned a value without an outcome field",
              );
            }
            const outcome = validateOutcomeValue(handlerResult.outcome);
            return Object.freeze({ outcome: outcome as never });
          },
        );
        return result;
      };

      if (registration.runtimeActivity === undefined) return invoke();
      return registration.runtimeActivity.runActivity(
        {
          kind: "contribution.invoke",
          importance: "routine",
          retentionClass: "ephemeral",
          sensitivity: "operational",
          semantic: {
            operationId: `work-handler.${registration.descriptor.contributionId}`,
            contractVersion: registration.descriptor.contractVersion,
          },
        },
        async () => invoke(),
      );
    },
  });
}

export class WorkHandlerRegistry {
  private readonly registrations = new Map<string, CompiledWorkHandlerRegistration>();

  register(
    owner: WorkHandlerRegistrationOwner,
    descriptor: WorkHandlerProvisionDescriptor,
    implementation: RuntimeWorkHandler,
    fence = new GenerationFence(),
    runtimeActivity?: RuntimeActivityRunner,
  ): GenerationFence {
    if (
      parseContentDigest("ProductGenerationId", owner.productGenerationId) ===
        undefined ||
      parseContentDigest("PackageGenerationId", owner.packageGenerationId) ===
        undefined ||
      parseMicroSystemId(owner.microSystemId) === undefined
    ) {
      descriptorProblem(
        "WorkHandler registration owner has an invalid generation identity",
      );
    }
    if (typeof implementation !== "object" || implementation === null) {
      descriptorProblem("WorkHandler implementation must be an object");
    }
    if (typeof implementation.execute !== "function") {
      descriptorProblem("WorkHandler implementation must expose execute");
    }
    const payloadValidators = validateDescriptor(descriptor);
    const outcomeValidator = compileOutcomeSchema(descriptor.outcomeSchema);
    const key = keyFor(owner, descriptor.contributionId);
    if (this.registrations.has(key)) {
      throw runtimeKernelProblem(
        "runtime.work_handler.duplicate_registration",
        `WorkHandler '${descriptor.contributionId}' is already registered for MicroSystem '${owner.microSystemId}' and PackageGeneration '${owner.packageGenerationId}'`,
      );
    }
    this.registrations.set(key, {
      owner,
      descriptor: Object.freeze({
        ...descriptor,
        payloadContracts: Object.freeze(
          descriptor.payloadContracts.map((contract) => Object.freeze({ ...contract })),
        ),
      }),
      implementation,
      fence,
      runtimeActivity,
      payloadValidators,
      outcomeValidator,
    });
    return fence;
  }

  resolve(target: WorkHandlerTarget): RuntimeWorkHandlerLease | undefined {
    const key = `${target.microSystemId}\u0000${target.contributionId}\u0000${target.packageGenerationId}`;
    const registration = this.registrations.get(key);
    if (
      registration === undefined ||
      registration.owner.productGenerationId !== target.productGenerationId ||
      registration.fence.state !== "ACTIVE"
    ) {
      return undefined;
    }
    return createLease(registration, target);
  }

  async retireGeneration(
    fence: GenerationFence,
    settleTimeoutMs: number,
  ): Promise<void> {
    const owned = [...this.registrations.entries()].filter(
      ([, registration]) => registration.fence === fence,
    );
    if (owned.length === 0) return;
    for (const [key] of owned) this.registrations.delete(key);
    await fence.retire(settleTimeoutMs);
  }

  size(): number {
    return this.registrations.size;
  }
}
