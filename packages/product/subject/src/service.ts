/** Implements the persistent Subject authority and the bounded L4 reaction path.
 * @module service
 */

import {
  UUID_V7_PATTERN,
  createCommunicationCommitId,
  createReactionId,
  createUuidV7Id,
  digestCanonicalJson,
  formatInstant,
  parseCanonicalConversationId,
  parseCanonicalMessageId,
  parseSubjectId,
  parseUuidV7Id,
  snapshotCanonicalJson,
  type CanonicalConversationId,
  type CanonicalJsonValue,
  type CanonicalMessageId,
  type Instant,
  type WorkItemId,
} from "@heptalogos/foundation-contracts";
import type {
  ExecutionContext,
  ExecutionContextRuntime,
  LineageContextRef,
} from "@heptalogos/execution-lineage";
import type { GenerationResult, InvocationSpec } from "@heptalogos/ai-runtime";
import type { MessageFact } from "@heptalogos/messaging";
import type { PersistenceMutationTransactionContext } from "@heptalogos/persistence";
import {
  executeRepositorySql,
  useRepositoryMutationTransaction,
  useRepositoryReadTransaction,
  type PersistenceInternalTransaction,
} from "@heptalogos/persistence/repository";
import {
  createContractVersion,
  type MicroSystemDefinition,
  type RuntimeWorkHandler,
  type RuntimeContractData,
  type RuntimeWorkHandlerInvocation,
  type WorkHandlerPayloadContract,
  type WorkHandlerProvisionDescriptor,
} from "@heptalogos/runtime-kernel";
import type { TimeService } from "@heptalogos/time-service";
import type { WorkErrorClassifier } from "@heptalogos/work-queue";
import {
  SUBJECT_REACTION_CONTRIBUTION_ID,
  SUBJECT_REACTION_QUEUE_PROFILE_ID,
  SUBJECT_REACTION_RESOURCE_CLASS,
  SUBJECT_SYSTEM_ID,
  type CommunicationCommit,
  type ConversationReactionProposal,
  type PreparedSubjectInbound,
  type Reaction,
  type SubjectAuthorityRecord,
  type SubjectDependencyReadiness,
  type SubjectReactionDefinitionOptions,
  type SubjectReactionOutcome,
  type SubjectService,
  type SubjectServiceOptions,
  type SubjectStateActionInput,
  type SubjectStatus,
} from "./contracts.js";
import { subjectProblem } from "./problems.js";

/** Current bounded conversation proposal schema; the model does not commit it. */
export const conversationReactionProposalSchema: CanonicalJsonValue = Object.freeze({
  oneOf: [
    {
      type: "object",
      properties: {
        schemaVersion: { const: 1 },
        kind: { const: "COMMUNICATE" },
        semanticContent: {
          type: "object",
          properties: {
            schemaVersion: { const: 1 },
            content: { type: "string", minLength: 1, maxLength: 65_536 },
          },
          required: ["schemaVersion", "content"],
          additionalProperties: false,
        },
      },
      required: ["schemaVersion", "kind", "semanticContent"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        schemaVersion: { const: 1 },
        kind: { const: "NO_COMMUNICATION" },
      },
      required: ["schemaVersion", "kind"],
      additionalProperties: false,
    },
  ],
}) as unknown as CanonicalJsonValue;

/** Current expression output schema; expression cannot introduce authority. */
export const expressionOutputSchema: CanonicalJsonValue = Object.freeze({
  type: "object",
  properties: {
    schemaVersion: { const: 1 },
    text: { type: "string", minLength: 1, maxLength: 65_536 },
  },
  required: ["schemaVersion", "text"],
  additionalProperties: false,
});

const SUBJECT_REACTION_PAYLOAD_SCHEMA: WorkHandlerPayloadContract = Object.freeze({
  version: 1,
  schema: Object.freeze({
    type: "object",
    properties: {
      schemaVersion: { const: 1 },
      conversationId: { type: "string", pattern: UUID_V7_PATTERN },
      acceptedMessageId: { type: "string", pattern: UUID_V7_PATTERN },
    },
    required: ["schemaVersion", "conversationId", "acceptedMessageId"],
    additionalProperties: false,
  }),
});

const SUBJECT_REACTION_OUTCOME_SCHEMA = Object.freeze({
  type: "object",
  properties: {
    accepted: { const: true },
    status: { enum: ["NOOP", "SUPERSEDED", "NO_COMMUNICATION", "REPLIED"] },
  },
  required: ["accepted", "status"],
  additionalProperties: false,
});

interface AuthorityRow {
  readonly subject_id: unknown;
  readonly installation_id: unknown;
  readonly desired_state: unknown;
  readonly authority_revision: unknown;
  readonly created_at: unknown;
  readonly updated_at: unknown;
  readonly lineage_context_ref: unknown;
}

interface MailboxRow {
  readonly conversation_id: unknown;
  readonly mailbox_revision: unknown;
  readonly consumed_through_sequence: unknown;
  readonly open_reaction_id: unknown;
  readonly updated_at: unknown;
  readonly lineage_context_ref: unknown;
}

interface ReactionRow {
  readonly reaction_id: unknown;
  readonly conversation_id: unknown;
  readonly observed_mailbox_revision: unknown;
  readonly observed_through_sequence: unknown;
  readonly observed_subject_authority_revision: unknown;
  readonly state: unknown;
  readonly owner_work_item_id: unknown;
  readonly owner_activity_ref: unknown;
  readonly created_at: unknown;
  readonly updated_at: unknown;
  readonly lineage_context_ref: unknown;
}

interface CommunicationRow {
  readonly communication_commit_id: unknown;
  readonly reaction_id: unknown;
  readonly subject_id: unknown;
  readonly subject_authority_revision: unknown;
  readonly mailbox_revision: unknown;
  readonly conversation_id: unknown;
  readonly purpose: unknown;
  readonly semantic_content: unknown;
  readonly semantic_content_digest: unknown;
  readonly primary_invocation_id: unknown;
  readonly primary_model_binding_id: unknown;
  readonly primary_binding_revision: unknown;
  readonly primary_model_profile_id: unknown;
  readonly primary_model_profile_generation: unknown;
  readonly primary_gateway_profile_id: unknown;
  readonly primary_configuration_revision_id: unknown;
  readonly primary_protocol: unknown;
  readonly committed_at: unknown;
  readonly lineage_context_ref: unknown;
}

const AUTHORITY_COLUMNS = `
  subject_id, installation_id, desired_state, authority_revision,
  created_at, updated_at, lineage_context_ref`;
const MAILBOX_COLUMNS = `
  conversation_id, mailbox_revision, consumed_through_sequence,
  open_reaction_id, updated_at, lineage_context_ref`;
const REACTION_COLUMNS = `
  reaction_id, conversation_id, observed_mailbox_revision,
  observed_through_sequence, observed_subject_authority_revision, state,
  owner_work_item_id, owner_activity_ref, created_at, updated_at,
  lineage_context_ref`;
const COMMUNICATION_COLUMNS = `
  communication_commit_id, reaction_id, subject_id, subject_authority_revision,
  mailbox_revision, conversation_id, purpose, semantic_content,
  semantic_content_digest, primary_invocation_id, primary_model_binding_id,
  primary_binding_revision, primary_model_profile_id,
  primary_model_profile_generation, primary_gateway_profile_id,
  primary_configuration_revision_id, primary_protocol, committed_at,
  lineage_context_ref`;

function parseJson(value: unknown, field: string): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      `${field} is not valid JSON`,
      "integrity",
    );
  }
}

function record(value: unknown, field: string): Record<string, unknown> {
  const parsed = parseJson(value, field);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      `${field} must be an object`,
      "integrity",
    );
  }
  return parsed as Record<string, unknown>;
}

function asInstant(value: unknown, field: string): Instant {
  const text = value instanceof Date ? formatInstant(value) : value;
  const parsed =
    typeof text === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(text)
      ? (text as Instant)
      : undefined;
  if (parsed === undefined) {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      `${field} is not a canonical Instant`,
      "integrity",
    );
  }
  return parsed;
}

function asInteger(value: unknown, field: string, minimum: number): number {
  const parsed =
    typeof value === "string"
      ? /^(0|[1-9][0-9]*)$/u.test(value)
        ? Number(value)
        : Number.NaN
      : value;
  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < minimum) {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      `${field} is not a valid bounded integer`,
      "integrity",
    );
  }
  return parsed;
}

function asUuid<T extends string>(brand: T, value: unknown, field: string) {
  const parsed = parseUuidV7Id(brand, value);
  if (parsed === undefined) {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      `${field} is not a UUIDv7 identifier`,
      "integrity",
    );
  }
  return parsed;
}

function asLineage(value: unknown, field: string): LineageContextRef {
  const parsed = record(value, field);
  if (
    parsed.schemaVersion !== 1 ||
    parseUuidV7Id("ActivityId", parsed.sourceActivityId) === undefined ||
    parseUuidV7Id("InstanceId", parsed.sourceInstanceId) === undefined ||
    parseUuidV7Id("ContinuityEpochId", parsed.sourceContinuityEpochId) === undefined
  ) {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      `${field} is not a valid LineageContextRef`,
      "integrity",
    );
  }
  return Object.freeze(parsed as unknown as LineageContextRef);
}

function authorityFromRow(row: AuthorityRow): SubjectAuthorityRecord {
  const desiredState = row.desired_state;
  if (desiredState !== "STOPPED" && desiredState !== "RUNNING") {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      "desired_state is not a current Subject state",
      "integrity",
    );
  }
  return Object.freeze({
    schemaVersion: 1 as const,
    subjectId: asUuid("SubjectId", row.subject_id, "subject_id"),
    installationId: asUuid("InstallationId", row.installation_id, "installation_id"),
    desiredState,
    authorityRevision: asInteger(row.authority_revision, "authority_revision", 1),
    createdAt: asInstant(row.created_at, "created_at"),
    updatedAt: asInstant(row.updated_at, "updated_at"),
    lineageContextRef: asLineage(row.lineage_context_ref, "lineage_context_ref"),
  });
}

function mailboxRevision(row: MailboxRow): {
  readonly conversationId: CanonicalConversationId;
  readonly mailboxRevision: number;
  readonly consumedThroughSequence: number;
  readonly openReactionId?: string;
} {
  const openReactionId =
    row.open_reaction_id === null || row.open_reaction_id === undefined
      ? undefined
      : asUuid("ReactionId", row.open_reaction_id, "open_reaction_id");
  return Object.freeze({
    conversationId: asUuid(
      "CanonicalConversationId",
      row.conversation_id,
      "conversation_id",
    ),
    mailboxRevision: asInteger(row.mailbox_revision, "mailbox_revision", 0),
    consumedThroughSequence: asInteger(
      row.consumed_through_sequence,
      "consumed_through_sequence",
      0,
    ),
    ...(openReactionId === undefined ? {} : { openReactionId }),
  });
}

function reactionFromRow(row: ReactionRow): Reaction {
  const state = row.state;
  if (
    state !== "OPEN" &&
    state !== "SUPERSEDED" &&
    state !== "NO_COMMUNICATION" &&
    state !== "COMMUNICATION_COMMITTED" &&
    state !== "REPLIED" &&
    state !== "FAILED"
  ) {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      "reaction state is invalid",
      "integrity",
    );
  }
  const owner = record(row.owner_activity_ref, "owner_activity_ref");
  if (
    owner.schemaVersion !== 1 ||
    parseUuidV7Id("ActivityId", owner.activityId) === undefined
  ) {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      "owner_activity_ref is invalid",
      "integrity",
    );
  }
  return Object.freeze({
    schemaVersion: 1 as const,
    reactionId: asUuid("ReactionId", row.reaction_id, "reaction_id"),
    conversationId: asUuid(
      "CanonicalConversationId",
      row.conversation_id,
      "conversation_id",
    ),
    observedMailboxRevision: asInteger(
      row.observed_mailbox_revision,
      "observed_mailbox_revision",
      0,
    ),
    observedThroughSequence: asInteger(
      row.observed_through_sequence,
      "observed_through_sequence",
      0,
    ),
    observedSubjectAuthorityRevision: asInteger(
      row.observed_subject_authority_revision,
      "observed_subject_authority_revision",
      1,
    ),
    state,
    ownerWorkItemId: asUuid("WorkItemId", row.owner_work_item_id, "owner_work_item_id"),
    ownerActivityRef: Object.freeze({
      schemaVersion: 1 as const,
      activityId: owner.activityId as string,
    }),
    createdAt: asInstant(row.created_at, "created_at"),
    updatedAt: asInstant(row.updated_at, "updated_at"),
    lineageContextRef: asLineage(row.lineage_context_ref, "lineage_context_ref"),
  });
}

function invalidConversationProposal(detail: string): never {
  throw subjectProblem(
    "subject.reaction_proposal_invalid",
    "Subject conversation proposal is invalid",
    detail,
    "validation",
  );
}

function conversationReactionProposal(value: unknown): ConversationReactionProposal {
  const parsed = record(value, "conversation_reaction_proposal");
  if (parsed.schemaVersion !== 1) {
    return invalidConversationProposal(
      "ConversationReactionProposal schemaVersion is not current",
    );
  }
  if (parsed.kind === "NO_COMMUNICATION" && Object.keys(parsed).length === 2) {
    return Object.freeze({
      schemaVersion: 1 as const,
      kind: "NO_COMMUNICATION" as const,
    });
  }
  if (parsed.kind === "COMMUNICATE") {
    if (
      typeof parsed.semanticContent !== "object" ||
      parsed.semanticContent === null ||
      Array.isArray(parsed.semanticContent)
    ) {
      return invalidConversationProposal("COMMUNICATE requires semanticContent object");
    }
    const content = parsed.semanticContent as Record<string, unknown>;
    if (
      content.schemaVersion !== 1 ||
      typeof content.content !== "string" ||
      content.content.trim() === "" ||
      new TextEncoder().encode(content.content).byteLength > 65_536 ||
      Object.keys(content).length !== 2 ||
      Object.keys(parsed).length !== 3
    ) {
      return invalidConversationProposal(
        "COMMUNICATE semanticContent is not the current bounded shape",
      );
    }
    return Object.freeze({
      schemaVersion: 1 as const,
      kind: "COMMUNICATE" as const,
      semanticContent: Object.freeze({
        schemaVersion: 1 as const,
        content: content.content,
      }),
    });
  }
  return invalidConversationProposal(
    "ConversationReactionProposal must be COMMUNICATE or NO_COMMUNICATION",
  );
}

function communicationFromRow(row: CommunicationRow): CommunicationCommit {
  const purpose = row.purpose;
  const protocol = row.primary_protocol;
  const content = record(row.semantic_content, "semantic_content");
  if (
    purpose !== "reply" ||
    (protocol !== "openai-chat" && protocol !== "openai-responses") ||
    content.schemaVersion !== 1 ||
    typeof content.content !== "string" ||
    content.content.trim() === "" ||
    Object.keys(content).length !== 2
  ) {
    throw subjectProblem(
      "subject.repository_invalid",
      "Subject repository data is invalid",
      "CommunicationCommit domain values are invalid",
      "integrity",
    );
  }
  return Object.freeze({
    schemaVersion: 1 as const,
    communicationCommitId: asUuid(
      "CommunicationCommitId",
      row.communication_commit_id,
      "communication_commit_id",
    ),
    reactionId: asUuid("ReactionId", row.reaction_id, "reaction_id"),
    subjectId: asUuid("SubjectId", row.subject_id, "subject_id"),
    subjectAuthorityRevision: asInteger(
      row.subject_authority_revision,
      "subject_authority_revision",
      1,
    ),
    mailboxRevision: asInteger(row.mailbox_revision, "mailbox_revision", 0),
    conversationId: asUuid(
      "CanonicalConversationId",
      row.conversation_id,
      "conversation_id",
    ),
    purpose: "reply" as const,
    semanticContent: Object.freeze({
      schemaVersion: 1 as const,
      content: content.content,
    }),
    semanticContentDigest: String(row.semantic_content_digest),
    primaryInvocationId: asUuid(
      "InvocationId",
      row.primary_invocation_id,
      "primary_invocation_id",
    ),
    primaryModelBindingId: asUuid(
      "ModelBindingId",
      row.primary_model_binding_id,
      "primary_model_binding_id",
    ),
    primaryBindingRevision: asInteger(
      row.primary_binding_revision,
      "primary_binding_revision",
      1,
    ),
    primaryModelProfileId: asUuid(
      "ModelProfileId",
      row.primary_model_profile_id,
      "primary_model_profile_id",
    ),
    primaryModelProfileGeneration: asInteger(
      row.primary_model_profile_generation,
      "primary_model_profile_generation",
      1,
    ),
    primaryGatewayProfileId: asUuid(
      "GatewayProfileId",
      row.primary_gateway_profile_id,
      "primary_gateway_profile_id",
    ),
    primaryConfigurationRevisionId: asUuid(
      "ConfigurationRevisionId",
      row.primary_configuration_revision_id,
      "primary_configuration_revision_id",
    ),
    primaryProtocol: protocol,
    committedAt: asInstant(row.committed_at, "committed_at"),
    lineageContextRef: asLineage(row.lineage_context_ref, "lineage_context_ref"),
  });
}

function lineageJson(execution: ExecutionContextRuntime): string {
  return JSON.stringify(execution.createLineageContextRef());
}

function currentActivity(execution: ExecutionContextRuntime): ExecutionContext {
  const activity = execution.current();
  if (activity === undefined) {
    throw subjectProblem(
      "subject.activity_required",
      "Subject operation requires an Activity",
      "The current Subject operation must be attributed to Execution Lineage",
      "conflict",
      "after-change",
    );
  }
  return activity;
}

async function readAuthority(
  transaction: PersistenceInternalTransaction,
  installationId: string,
  forUpdate = false,
): Promise<SubjectAuthorityRecord | undefined> {
  const rows = await executeRepositorySql<AuthorityRow>(
    transaction,
    `SELECT ${AUTHORITY_COLUMNS}
       FROM "heptalogos"."subject_authority"
      WHERE installation_id = $1
      ${forUpdate ? "FOR UPDATE" : ""}`,
    [installationId],
  );
  return rows[0] === undefined ? undefined : authorityFromRow(rows[0]);
}

async function readMailbox(
  transaction: PersistenceInternalTransaction,
  conversationId: CanonicalConversationId,
  forUpdate = false,
) {
  const rows = await executeRepositorySql<MailboxRow>(
    transaction,
    `SELECT ${MAILBOX_COLUMNS}
       FROM "heptalogos"."conversation_mailbox"
      WHERE conversation_id = $1
      ${forUpdate ? "FOR UPDATE" : ""}`,
    [conversationId],
  );
  return rows[0] === undefined ? undefined : mailboxRevision(rows[0]);
}

async function readReaction(
  transaction: PersistenceInternalTransaction,
  reactionId: string,
  forUpdate = false,
): Promise<Reaction | undefined> {
  const rows = await executeRepositorySql<ReactionRow>(
    transaction,
    `SELECT ${REACTION_COLUMNS}
       FROM "heptalogos"."reaction"
      WHERE reaction_id = $1
      ${forUpdate ? "FOR UPDATE" : ""}`,
    [reactionId],
  );
  return rows[0] === undefined ? undefined : reactionFromRow(rows[0]);
}

async function readCommunication(
  transaction: PersistenceInternalTransaction,
  reactionId: string,
): Promise<CommunicationCommit | undefined> {
  const rows = await executeRepositorySql<CommunicationRow>(
    transaction,
    `SELECT ${COMMUNICATION_COLUMNS}
       FROM "heptalogos"."communication_commit"
      WHERE reaction_id = $1`,
    [reactionId],
  );
  return rows[0] === undefined ? undefined : communicationFromRow(rows[0]);
}

async function outboundExists(
  transaction: PersistenceInternalTransaction,
  communicationCommitId: string,
): Promise<boolean> {
  const rows = await executeRepositorySql<{ readonly message_id: unknown }>(
    transaction,
    `SELECT message_id
       FROM "heptalogos"."message_fact"
      WHERE caused_by_communication_commit_id = $1
      LIMIT 1`,
    [communicationCommitId],
  );
  return rows[0] !== undefined;
}

function futureRetryTime(time: TimeService): Instant {
  return formatInstant(new Date(Date.parse(time.now()) + 1_000));
}

/** Creates the Subject semantic owner over current Product foundations. */
export function createSubjectService(options: SubjectServiceOptions): SubjectService {
  const reactionDescriptor: WorkHandlerProvisionDescriptor = Object.freeze({
    contributionId: SUBJECT_REACTION_CONTRIBUTION_ID,
    contractVersion: createContractVersion("subject.reaction.v1"),
    payloadContracts: Object.freeze([SUBJECT_REACTION_PAYLOAD_SCHEMA]),
    outcomeSchema: SUBJECT_REACTION_OUTCOME_SCHEMA,
    queueProfileId: SUBJECT_REACTION_QUEUE_PROFILE_ID,
    resourceAdmissionClass: SUBJECT_REACTION_RESOURCE_CLASS,
    configurationBindingPolicy: "LATEST_COMPATIBLE_AT_ATTEMPT",
    restoreReplayClass: "RECONCILE_REQUIRED",
  });

  const ownedActivityMutation = async <T>(
    kind: string,
    operation: (activity: ExecutionContext, owned: boolean) => Promise<T>,
  ): Promise<T> => {
    const existing = options.execution.current();
    if (existing !== undefined) return operation(existing, false);
    return options.execution.runActivity(
      {
        kind,
        importance: "significant",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      (activity) => operation(activity, true),
    );
  };

  const ensureCurrent = async (): Promise<SubjectAuthorityRecord> =>
    ownedActivityMutation("subject.authority.initialized", async (activity, owned) =>
      options.persistence.mutate((context) =>
        useRepositoryMutationTransaction(context, async (transaction) => {
          if (owned) await options.lineage.retainCurrent(context, activity);
          const existing = await readAuthority(
            transaction,
            options.installationId,
            true,
          );
          if (existing !== undefined) {
            if (owned) {
              await options.evidence.recordRequired(context, {
                evidenceKind: "subject.authority.read",
                evidenceContractVersion: "subject.v1",
                subjectRef: existing.subjectId,
                retentionClass: "retained",
                sensitivity: "operational",
              });
              await options.lineage.completeCurrent(context, activity, {
                endedAt: options.time.now(),
                outcome: "SUCCEEDED",
              });
            }
            return existing;
          }
          const subjectId = createUuidV7Id("SubjectId");
          const now = options.time.now();
          await executeRepositorySql(
            transaction,
            `INSERT INTO "heptalogos"."subject_authority" (
               subject_id, installation_id, desired_state, authority_revision,
               created_at, updated_at, lineage_context_ref
             ) VALUES ($1, $2, 'STOPPED', 1, $3, $3, $4)
             ON CONFLICT (installation_id) DO NOTHING`,
            [subjectId, options.installationId, now, lineageJson(options.execution)],
          );
          const current = await readAuthority(
            transaction,
            options.installationId,
            true,
          );
          if (current === undefined) {
            throw subjectProblem(
              "subject.authority_missing",
              "Subject authority was not initialized",
              "The current Subject authority could not be read after initialization",
              "integrity",
            );
          }
          if (owned) {
            await options.evidence.recordRequired(context, {
              evidenceKind: "subject.authority.created",
              evidenceContractVersion: "subject.v1",
              subjectRef: current.subjectId,
              retentionClass: "retained",
              sensitivity: "operational",
            });
            await options.lineage.completeCurrent(context, activity, {
              endedAt: options.time.now(),
              outcome: "SUCCEEDED",
            });
          }
          return current;
        }),
      ),
    );

  const getAuthority = async (): Promise<SubjectAuthorityRecord> => {
    const authority = await options.persistence.read((context) =>
      useRepositoryReadTransaction(context, (transaction) =>
        readAuthority(transaction, options.installationId),
      ),
    );
    if (authority === undefined) {
      throw subjectProblem(
        "subject.authority_missing",
        "Subject authority is unavailable",
        "The current Product Host has not initialized Subject authority",
        "unavailable",
        "after-change",
      );
    }
    return authority;
  };

  const getStatus = async (): Promise<SubjectStatus> => {
    const authority = await getAuthority();
    const dependencies: SubjectDependencyReadiness =
      await options.getHardPrerequisites();
    const hasOpenReaction = await options.persistence.read((context) =>
      useRepositoryReadTransaction(context, async (transaction) => {
        const rows = await executeRepositorySql<{ readonly open_reaction_id: unknown }>(
          transaction,
          `SELECT open_reaction_id
             FROM "heptalogos"."conversation_mailbox"
            WHERE conversation_id IN (
              SELECT conversation_id FROM "heptalogos"."messaging_conversation"
               WHERE installation_id = $1
            )`,
          [options.installationId],
        );
        return rows.some(
          (row) => row.open_reaction_id !== null && row.open_reaction_id !== undefined,
        );
      }),
    );
    let actualState: SubjectStatus["actualState"];
    const blockers = authority.desiredState === "RUNNING" ? dependencies.blockers : [];
    if (authority.desiredState === "STOPPED") {
      actualState = hasOpenReaction ? "STOPPING" : "STOPPED";
    } else if (!dependencies.usable) {
      actualState = "BLOCKED";
    } else {
      actualState = hasOpenReaction ? "ACTIVE" : "READY";
    }
    return Object.freeze({
      schemaVersion: 1 as const,
      subjectId: authority.subjectId,
      desiredState: authority.desiredState,
      actualState,
      authorityRevision: authority.authorityRevision,
      blockers: Object.freeze([...blockers]),
    });
  };

  const setDesiredState = async (
    desiredState: "STOPPED" | "RUNNING",
    input: SubjectStateActionInput,
  ): Promise<SubjectStatus> => {
    const subjectId = parseSubjectId(input.subjectId);
    if (
      subjectId === undefined ||
      !Number.isSafeInteger(input.expectedAuthorityRevision) ||
      input.expectedAuthorityRevision < 1
    ) {
      throw subjectProblem(
        "subject.invalid_action",
        "Subject state action is invalid",
        "subjectId and expectedAuthorityRevision are invalid",
        "validation",
      );
    }
    await ownedActivityMutation(
      `subject.${desiredState.toLowerCase()}`,
      async (activity, owned) =>
        options.persistence.mutate((context) =>
          useRepositoryMutationTransaction(context, async (transaction) => {
            if (owned) await options.lineage.retainCurrent(context, activity);
            const authority = await readAuthority(
              transaction,
              options.installationId,
              true,
            );
            if (authority === undefined || authority.subjectId !== subjectId) {
              throw subjectProblem(
                "subject.not_found",
                "Subject was not found",
                "The requested SubjectId is not current for this Installation",
                "conflict",
              );
            }
            if (authority.authorityRevision !== input.expectedAuthorityRevision) {
              throw subjectProblem(
                "subject.authority_stale",
                "Subject authority is stale",
                "The requested Subject authorityRevision is no longer current",
                "conflict",
                "after-change",
              );
            }
            if (authority.desiredState !== desiredState) {
              const now = options.time.now();
              await executeRepositorySql(
                transaction,
                `UPDATE "heptalogos"."subject_authority"
                  SET desired_state = $2, authority_revision = authority_revision + 1,
                      updated_at = $3, lineage_context_ref = $4
                WHERE subject_id = $1`,
                [subjectId, desiredState, now, lineageJson(options.execution)],
              );
            }
            if (owned) {
              await options.evidence.recordRequired(context, {
                evidenceKind: "subject.authority.changed",
                evidenceContractVersion: "subject.v1",
                subjectRef: subjectId,
                factRef: desiredState,
                retentionClass: "retained",
                sensitivity: "operational",
              });
              await options.lineage.completeCurrent(context, activity, {
                endedAt: options.time.now(),
                outcome: "SUCCEEDED",
              });
            }
          }),
        ),
    );
    return getStatus();
  };

  const prepareAcceptedInbound = async (input: {
    readonly conversationId: CanonicalConversationId;
    readonly acceptedMessageId: CanonicalMessageId;
  }): Promise<PreparedSubjectInbound> => {
    if (
      parseCanonicalConversationId(input.conversationId) === undefined ||
      parseCanonicalMessageId(input.acceptedMessageId) === undefined
    ) {
      throw subjectProblem(
        "subject.invalid_input",
        "Subject Chat input is invalid",
        "conversationId and acceptedMessageId must be canonical UUIDv7 identities",
        "validation",
      );
    }
    const status = await getStatus();
    if (status.desiredState !== "RUNNING") {
      throw subjectProblem(
        "subject.not_running",
        "Subject is stopped",
        "Subject Chat cognition admission requires desiredState RUNNING",
        "conflict",
        "after-change",
      );
    }
    if (
      status.actualState === "READY" ||
      status.actualState === "ACTIVE" ||
      status.actualState === "DEGRADED"
    ) {
      const work = await options.workQueue.prepareCreate({
        target: options.reactionTarget,
        payload: Object.freeze({
          schemaVersion: 1,
          conversationId: input.conversationId,
          acceptedMessageId: input.acceptedMessageId,
        }),
        queueProfileId: SUBJECT_REACTION_QUEUE_PROFILE_ID,
        resourceAdmissionClass: SUBJECT_REACTION_RESOURCE_CLASS,
        partitionKey: input.conversationId,
        priority: 100,
      });
      return Object.freeze({
        subjectId: status.subjectId,
        authorityRevision: status.authorityRevision,
        work,
      });
    }
    throw subjectProblem(
      "subject.dependencies_unavailable",
      "Subject dependencies are unavailable",
      status.blockers.map((blocker) => blocker.code).join(", "),
      "unavailable",
      "after-change",
    );
  };

  const commitAcceptedInbound = async (
    transaction: PersistenceMutationTransactionContext,
    input: {
      readonly message: MessageFact;
      readonly preparation: PreparedSubjectInbound;
    },
  ): Promise<void> => {
    await useRepositoryMutationTransaction(transaction, async (databaseTransaction) => {
      const authority = await readAuthority(
        databaseTransaction,
        options.installationId,
        true,
      );
      if (
        authority === undefined ||
        authority.subjectId !== input.preparation.subjectId
      ) {
        throw subjectProblem(
          "subject.authority_missing",
          "Subject authority changed",
          "The accepted inbound fact no longer has the prepared Subject authority",
          "conflict",
          "after-change",
        );
      }
      if (authority.authorityRevision !== input.preparation.authorityRevision) {
        throw subjectProblem(
          "subject.stale_authority_revision",
          "Subject authority is stale",
          "The accepted inbound preparation was made under an older authorityRevision",
          "conflict",
          "after-change",
        );
      }
      if (authority.desiredState !== "RUNNING") {
        throw subjectProblem(
          "subject.not_running",
          "Subject is stopped",
          "The Subject stop fence closed cognition admission before commit",
          "conflict",
          "after-change",
        );
      }
      const mailbox = await readMailbox(
        databaseTransaction,
        input.message.conversationId,
        true,
      );
      if (mailbox === undefined) {
        throw subjectProblem(
          "subject.mailbox_missing",
          "Subject mailbox is unavailable",
          "The built-in conversation has no current ConversationMailbox",
          "integrity",
        );
      }
      const now = options.time.now();
      await executeRepositorySql(
        databaseTransaction,
        `UPDATE "heptalogos"."conversation_mailbox"
            SET mailbox_revision = mailbox_revision + 1,
                updated_at = $2, lineage_context_ref = $3
          WHERE conversation_id = $1`,
        [input.message.conversationId, now, lineageJson(options.execution)],
      );
      await options.workQueue.commitPrepared(transaction, input.preparation.work);
      await options.evidence.recordRequired(transaction, {
        evidenceKind: "subject.mailbox.accepted",
        evidenceContractVersion: "subject.v1",
        subjectRef: authority.subjectId,
        objectRef: input.message.messageId,
        factRef: input.message.conversationId,
        retentionClass: "retained",
        sensitivity: "operational",
      });
    });
  };

  const acquireReaction = async (
    workItemId: WorkItemId,
    conversationId: CanonicalConversationId,
    acceptedMessageId: CanonicalMessageId,
  ): Promise<Reaction | undefined> => {
    const activity = currentActivity(options.execution);
    return options.persistence.mutate((context) =>
      useRepositoryMutationTransaction(context, async (transaction) => {
        const authority = await readAuthority(
          transaction,
          options.installationId,
          true,
        );
        if (authority === undefined) return undefined;
        const ownedRows = await executeRepositorySql<ReactionRow>(
          transaction,
          `SELECT ${REACTION_COLUMNS}
             FROM "heptalogos"."reaction"
            WHERE owner_work_item_id = $1
            FOR UPDATE`,
          [workItemId],
        );
        const owned =
          ownedRows[0] === undefined ? undefined : reactionFromRow(ownedRows[0]);
        if (owned !== undefined) {
          if (
            owned.state === "OPEN" &&
            (authority.desiredState !== "RUNNING" ||
              authority.authorityRevision !== owned.observedSubjectAuthorityRevision)
          ) {
            const now = options.time.now();
            await executeRepositorySql(
              transaction,
              `UPDATE "heptalogos"."reaction"
                  SET state = 'SUPERSEDED', updated_at = $2,
                      lineage_context_ref = $3
                WHERE reaction_id = $1 AND state = 'OPEN'`,
              [owned.reactionId, now, lineageJson(options.execution)],
            );
            await executeRepositorySql(
              transaction,
              `UPDATE "heptalogos"."conversation_mailbox"
                  SET open_reaction_id = NULL, updated_at = $2,
                      lineage_context_ref = $3
                WHERE conversation_id = $1 AND open_reaction_id = $4`,
              [
                owned.conversationId,
                now,
                lineageJson(options.execution),
                owned.reactionId,
              ],
            );
            return readReaction(transaction, owned.reactionId);
          }
          return owned;
        }
        if (authority.desiredState !== "RUNNING") return undefined;
        const mailbox = await readMailbox(transaction, conversationId, true);
        if (mailbox === undefined) return undefined;
        if (mailbox.openReactionId !== undefined) {
          const current = await readReaction(transaction, mailbox.openReactionId);
          if (
            current !== undefined &&
            (current.state === "OPEN" || current.state === "COMMUNICATION_COMMITTED")
          )
            return current;
          await executeRepositorySql(
            transaction,
            `UPDATE "heptalogos"."conversation_mailbox"
                SET open_reaction_id = NULL, updated_at = $2,
                    lineage_context_ref = $3
              WHERE conversation_id = $1 AND open_reaction_id = $4`,
            [
              conversationId,
              options.time.now(),
              lineageJson(options.execution),
              mailbox.openReactionId,
            ],
          );
        }
        const pending = await options.messaging.listPendingInboundWithinTransaction(
          context,
          {
            conversationId,
            afterSequence: mailbox.consumedThroughSequence,
          },
        );
        if (
          !pending.some((message) => message.messageId === acceptedMessageId) ||
          pending.length === 0
        ) {
          return undefined;
        }
        const observedThroughSequence = pending[pending.length - 1]!.sequence;
        const reactionId = createReactionId();
        const now = options.time.now();
        await executeRepositorySql(
          transaction,
          `INSERT INTO "heptalogos"."reaction" (
             reaction_id, conversation_id, observed_mailbox_revision,
             observed_through_sequence, observed_subject_authority_revision,
             state, owner_work_item_id, owner_activity_ref, created_at,
             updated_at, lineage_context_ref
           ) VALUES ($1, $2, $3, $4, $5, 'OPEN', $6, $7, $8, $8, $9)`,
          [
            reactionId,
            conversationId,
            mailbox.mailboxRevision,
            observedThroughSequence,
            authority.authorityRevision,
            workItemId,
            JSON.stringify({ schemaVersion: 1, activityId: activity.activityId }),
            now,
            lineageJson(options.execution),
          ],
        );
        await executeRepositorySql(
          transaction,
          `UPDATE "heptalogos"."conversation_mailbox"
              SET open_reaction_id = $2, updated_at = $3,
                  lineage_context_ref = $4
            WHERE conversation_id = $1 AND open_reaction_id IS NULL`,
          [conversationId, reactionId, now, lineageJson(options.execution)],
        );
        return readReaction(transaction, reactionId);
      }),
    );
  };

  interface ReactionProgress {
    readonly reaction: Reaction;
    readonly communication?: CommunicationCommit;
    readonly outbound: boolean;
  }

  const readProgress = async (reaction: Reaction): Promise<ReactionProgress> =>
    options.persistence.read((context) =>
      useRepositoryReadTransaction(context, async (transaction) => {
        const communication = await readCommunication(transaction, reaction.reactionId);
        const outbound =
          communication === undefined
            ? false
            : await outboundExists(transaction, communication.communicationCommitId);
        return Object.freeze({
          reaction,
          ...(communication === undefined ? {} : { communication }),
          outbound,
        });
      }),
    );

  function subjectContextMessages(messages: readonly MessageFact[]) {
    return Object.freeze([
      Object.freeze({
        role: "system" as const,
        text: "You are the current Heptalogos Subject. Return only the requested bounded conversation proposal.",
      }),
      ...messages.map((message) =>
        Object.freeze({ role: "user" as const, text: message.text }),
      ),
    ]);
  }

  const contextProjection = async (
    reaction: Reaction,
  ): Promise<{
    readonly value: CanonicalJsonValue;
    readonly messages: readonly MessageFact[];
  }> => {
    const authority = await getAuthority();
    const mailbox = await options.persistence.read((context) =>
      useRepositoryReadTransaction(context, (transaction) =>
        readMailbox(transaction, reaction.conversationId),
      ),
    );
    if (mailbox === undefined) {
      throw subjectProblem(
        "subject.mailbox_missing",
        "Subject mailbox is unavailable",
        "The current Reaction has no ConversationMailbox",
        "integrity",
      );
    }
    const messages = await options.messaging.listInboundMessages({
      conversationId: reaction.conversationId,
      afterSequence: mailbox.consumedThroughSequence,
      throughSequence: reaction.observedThroughSequence,
    });
    const selected = messages.filter(
      (message) =>
        message.sequence > mailbox.consumedThroughSequence &&
        message.sequence <= reaction.observedThroughSequence,
    );
    const value = snapshotCanonicalJson({
      schemaVersion: 1,
      subjectId: authority.subjectId,
      desiredState: authority.desiredState,
      authorityRevision: authority.authorityRevision,
      conversationId: reaction.conversationId,
      mailboxRevision: reaction.observedMailboxRevision,
      messages: selected.map((message) => ({
        sequence: message.sequence,
        messageId: message.messageId,
        text: message.text,
      })),
    }).value;
    return Object.freeze({ value, messages: Object.freeze(selected) });
  };

  const primaryGeneration = async (reaction: Reaction): Promise<GenerationResult> => {
    const activity = currentActivity(options.execution);
    const binding = await options.aiRuntime.getModelBinding("subject.primary");
    if (binding === undefined || !binding.enabled) {
      throw subjectProblem(
        "subject.primary_unavailable",
        "Subject primary binding is unavailable",
        "The current subject.primary ModelBinding is not usable",
        "unavailable",
        "after-change",
      );
    }
    const context = await contextProjection(reaction);
    const spec: InvocationSpec = {
      schemaVersion: 1,
      invocationId: createUuidV7Id("InvocationId"),
      ownerActivityRef: activity.activityId,
      modelBindingId: binding.modelBindingId,
      expectedBindingRevision: binding.revision,
      contextProjection: context.value,
      messages: subjectContextMessages(context.messages),
      objective:
        "Return exactly one current conversation proposal: NO_COMMUNICATION or COMMUNICATE with semantic content.",
      outputSchema: conversationReactionProposalSchema,
      budget: { maxOutputTokens: 256 },
      lineageContextRef: options.execution.createLineageContextRef(),
    };
    return options.aiRuntime.invoke(spec);
  };

  const expressionGeneration = async (
    communication: CommunicationCommit,
  ): Promise<GenerationResult> => {
    const activity = currentActivity(options.execution);
    const binding = await options.aiRuntime.getModelBinding("subject.expression");
    if (binding === undefined || !binding.enabled) {
      throw subjectProblem(
        "subject.expression_unavailable",
        "Subject expression binding is unavailable",
        "The current subject.expression ModelBinding is not usable",
        "unavailable",
        "after-change",
      );
    }
    const contextProjection = snapshotCanonicalJson({
      schemaVersion: 1,
      communicationCommitId: communication.communicationCommitId,
      conversationId: communication.conversationId,
      semanticContent: communication.semanticContent as unknown as CanonicalJsonValue,
    }).value;
    const spec: InvocationSpec = {
      schemaVersion: 1,
      invocationId: createUuidV7Id("InvocationId"),
      ownerActivityRef: activity.activityId,
      modelBindingId: binding.modelBindingId,
      expectedBindingRevision: binding.revision,
      contextProjection,
      messages: Object.freeze([
        Object.freeze({
          role: "system" as const,
          text: "Express the committed Subject reply as bounded text. Do not add actions.",
        }),
        Object.freeze({
          role: "user" as const,
          text: communication.semanticContent.content,
        }),
      ]),
      objective: "Express the already committed semantic reply.",
      outputSchema: expressionOutputSchema,
      budget: { maxOutputTokens: 256 },
      lineageContextRef: options.execution.createLineageContextRef(),
    };
    return options.aiRuntime.invoke(spec);
  };

  type AcceptedProposalCommitResult =
    | { readonly kind: "SUPERSEDED" }
    | { readonly kind: "NO_COMMUNICATION" }
    | {
        readonly kind: "COMMUNICATION_COMMITTED";
        readonly communication: CommunicationCommit;
      };

  const commitAcceptedProposal = async (
    reaction: Reaction,
    generation: GenerationResult,
    proposal: ConversationReactionProposal,
  ): Promise<AcceptedProposalCommitResult> =>
    options.persistence.mutate((context) =>
      useRepositoryMutationTransaction(context, async (transaction) => {
        const currentReaction = await readReaction(
          transaction,
          reaction.reactionId,
          true,
        );
        const authority = await readAuthority(
          transaction,
          options.installationId,
          true,
        );
        const mailbox = await readMailbox(transaction, reaction.conversationId, true);
        if (
          currentReaction === undefined ||
          authority === undefined ||
          mailbox === undefined
        ) {
          throw subjectProblem(
            "subject.commit_context_missing",
            "Subject commit context is unavailable",
            "The current Reaction, Subject authority, or mailbox could not be read",
            "integrity",
          );
        }
        if (currentReaction.state !== "OPEN") {
          if (currentReaction.state === "SUPERSEDED")
            return { kind: "SUPERSEDED" as const };
          if (currentReaction.state === "NO_COMMUNICATION")
            return { kind: "NO_COMMUNICATION" as const };
          const existing = await readCommunication(transaction, reaction.reactionId);
          if (existing !== undefined)
            return {
              kind: "COMMUNICATION_COMMITTED" as const,
              communication: existing,
            };
          throw subjectProblem(
            "subject.communication_missing",
            "Subject communication commit is unavailable",
            "The current Reaction state has no CommunicationCommit",
            "integrity",
          );
        }
        if (
          authority.desiredState !== "RUNNING" ||
          authority.authorityRevision !== reaction.observedSubjectAuthorityRevision ||
          mailbox.mailboxRevision !== reaction.observedMailboxRevision ||
          mailbox.openReactionId !== reaction.reactionId
        ) {
          const now = options.time.now();
          await executeRepositorySql(
            transaction,
            `UPDATE "heptalogos"."reaction"
                SET state = 'SUPERSEDED', updated_at = $2,
                    lineage_context_ref = $3
              WHERE reaction_id = $1 AND state = 'OPEN'`,
            [reaction.reactionId, now, lineageJson(options.execution)],
          );
          await executeRepositorySql(
            transaction,
            `UPDATE "heptalogos"."conversation_mailbox"
                SET open_reaction_id = NULL, updated_at = $2,
                    lineage_context_ref = $3
              WHERE conversation_id = $1 AND open_reaction_id = $4`,
            [
              reaction.conversationId,
              now,
              lineageJson(options.execution),
              reaction.reactionId,
            ],
          );
          await options.evidence.recordRequired(context, {
            evidenceKind: "subject.reaction.superseded",
            evidenceContractVersion: "subject.v1",
            subjectRef: authority.subjectId,
            objectRef: reaction.reactionId,
            factRef: generation.invocationId,
            retentionClass: "retained",
            sensitivity: "operational",
          });
          return { kind: "SUPERSEDED" as const };
        }
        await options.aiRuntime.assertGenerationAdmissibleForCommit(
          context,
          generation,
        );
        const now = options.time.now();
        if (proposal.kind === "NO_COMMUNICATION") {
          await executeRepositorySql(
            transaction,
            `UPDATE "heptalogos"."conversation_mailbox"
                SET consumed_through_sequence = GREATEST(consumed_through_sequence, $2),
                    open_reaction_id = CASE WHEN open_reaction_id = $3 THEN NULL ELSE open_reaction_id END,
                    updated_at = $4, lineage_context_ref = $5
              WHERE conversation_id = $1`,
            [
              reaction.conversationId,
              reaction.observedThroughSequence,
              reaction.reactionId,
              now,
              lineageJson(options.execution),
            ],
          );
          await executeRepositorySql(
            transaction,
            `UPDATE "heptalogos"."reaction"
                SET state = 'NO_COMMUNICATION', updated_at = $2,
                    lineage_context_ref = $3
              WHERE reaction_id = $1 AND state = 'OPEN'`,
            [reaction.reactionId, now, lineageJson(options.execution)],
          );
          await options.evidence.recordRequired(context, {
            evidenceKind: "subject.reaction.no-communication.accepted",
            evidenceContractVersion: "subject.v1",
            subjectRef: authority.subjectId,
            objectRef: reaction.reactionId,
            factRef: generation.invocationId,
            retentionClass: "retained",
            sensitivity: "operational",
          });
          return { kind: "NO_COMMUNICATION" as const };
        }

        const semanticContent = proposal.semanticContent;
        const semanticContentDigest = digestCanonicalJson(
          "subject.semantic-content.v1",
          snapshotCanonicalJson(semanticContent as unknown as CanonicalJsonValue).value,
        ).hex;
        const communicationCommitId = createCommunicationCommitId();
        await executeRepositorySql(
          transaction,
          `INSERT INTO "heptalogos"."communication_commit" (
             communication_commit_id, reaction_id, subject_id,
             subject_authority_revision, mailbox_revision, conversation_id,
             purpose, semantic_content, semantic_content_digest,
             primary_invocation_id, primary_model_binding_id, primary_binding_revision,
             primary_model_profile_id, primary_model_profile_generation,
             primary_gateway_profile_id, primary_configuration_revision_id,
             primary_protocol, committed_at, lineage_context_ref
           ) VALUES ($1, $2, $3, $4, $5, $6, 'reply', $7, $8, $9, $10,
                     $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (reaction_id) DO NOTHING`,
          [
            communicationCommitId,
            reaction.reactionId,
            authority.subjectId,
            authority.authorityRevision,
            mailbox.mailboxRevision,
            reaction.conversationId,
            JSON.stringify(semanticContent),
            semanticContentDigest,
            generation.invocationId,
            generation.modelBindingId,
            generation.bindingRevision,
            generation.modelProfileId,
            generation.modelProfileGeneration,
            generation.gatewayProfileId,
            generation.configurationRevisionId,
            generation.protocol,
            now,
            lineageJson(options.execution),
          ],
        );
        const written = await readCommunication(transaction, reaction.reactionId);
        if (written === undefined) {
          throw subjectProblem(
            "subject.communication_missing",
            "CommunicationCommit was not materialized",
            "The current communication acceptance could not be read after insertion",
            "integrity",
          );
        }
        await executeRepositorySql(
          transaction,
          `UPDATE "heptalogos"."reaction"
              SET state = 'COMMUNICATION_COMMITTED', updated_at = $2,
                  lineage_context_ref = $3
            WHERE reaction_id = $1 AND state = 'OPEN'`,
          [reaction.reactionId, now, lineageJson(options.execution)],
        );
        await options.evidence.recordRequired(context, {
          evidenceKind: "subject.communication.commit",
          evidenceContractVersion: "subject.v1",
          subjectRef: authority.subjectId,
          objectRef: reaction.reactionId,
          factRef: written.communicationCommitId,
          retentionClass: "retained",
          sensitivity: "operational",
        });
        return {
          kind: "COMMUNICATION_COMMITTED" as const,
          communication: written,
        };
      }),
    );

  const finalizeCommittedReaction = async (
    transaction: PersistenceInternalTransaction,
    context: PersistenceMutationTransactionContext,
    reaction: Reaction,
    communication: CommunicationCommit,
  ): Promise<void> => {
    const now = options.time.now();
    await executeRepositorySql(
      transaction,
      `UPDATE "heptalogos"."conversation_mailbox"
          SET consumed_through_sequence = GREATEST(consumed_through_sequence, $2),
              open_reaction_id = CASE WHEN open_reaction_id = $3 THEN NULL ELSE open_reaction_id END,
              updated_at = $4, lineage_context_ref = $5
        WHERE conversation_id = $1`,
      [
        reaction.conversationId,
        reaction.observedThroughSequence,
        reaction.reactionId,
        now,
        lineageJson(options.execution),
      ],
    );
    await executeRepositorySql(
      transaction,
      `UPDATE "heptalogos"."reaction"
          SET state = 'REPLIED', updated_at = $2,
              lineage_context_ref = $3
        WHERE reaction_id = $1 AND state = 'COMMUNICATION_COMMITTED'`,
      [reaction.reactionId, now, lineageJson(options.execution)],
    );
    await options.evidence.recordRequired(context, {
      evidenceKind: "subject.outbound.materialized",
      evidenceContractVersion: "subject.v1",
      subjectRef: reaction.reactionId,
      objectRef: communication.communicationCommitId,
      retentionClass: "retained",
      sensitivity: "operational",
    });
  };

  const finalizeReplied = async (reaction: Reaction): Promise<void> =>
    options.persistence.mutate((context) =>
      useRepositoryMutationTransaction(context, async (transaction) => {
        const current = await readReaction(transaction, reaction.reactionId, true);
        if (current === undefined) return;
        if (current.state === "REPLIED") return;
        if (current.state !== "COMMUNICATION_COMMITTED") {
          throw subjectProblem(
            "subject.reaction_state_invalid",
            "Subject Reaction cannot be finalized as replied",
            "Only a CommunicationCommit-backed Reaction can become REPLIED",
            "integrity",
          );
        }
        const communication = await readCommunication(transaction, reaction.reactionId);
        if (communication === undefined) {
          throw subjectProblem(
            "subject.communication_missing",
            "Subject communication commit is unavailable",
            "A COMMUNICATION_COMMITTED Reaction has no CommunicationCommit",
            "integrity",
          );
        }
        await finalizeCommittedReaction(transaction, context, reaction, communication);
      }),
    );

  const materializeExpression = async (
    reaction: Reaction,
    communication: CommunicationCommit,
    generation: GenerationResult,
  ): Promise<"REPLIED"> =>
    options.persistence.mutate((context) =>
      useRepositoryMutationTransaction(context, async (transaction) => {
        const hasOutbound = await outboundExists(
          transaction,
          communication.communicationCommitId,
        );
        const current = await readReaction(transaction, reaction.reactionId, true);
        if (current === undefined) {
          throw subjectProblem(
            "subject.reaction_missing",
            "Subject Reaction is unavailable",
            "The committed communication Reaction could not be read",
            "integrity",
          );
        }
        if (current.state === "REPLIED") return "REPLIED";
        if (current.state !== "COMMUNICATION_COMMITTED") {
          throw subjectProblem(
            "subject.reaction_state_invalid",
            "Subject Reaction cannot materialize communication",
            "Only a COMMUNICATION_COMMITTED Reaction may materialize outbound text",
            "integrity",
          );
        }
        if (!hasOutbound) {
          await options.aiRuntime.assertGenerationAdmissibleForCommit(
            context,
            generation,
          );
          await options.messaging.materializeOutboundWithinTransaction(context, {
            communicationCommitId: communication.communicationCommitId,
            text: parseExpressionText(generation.candidate),
          });
        }
        await finalizeCommittedReaction(transaction, context, reaction, communication);
        return "REPLIED" as const;
      }),
    );

  function parseExpressionText(value: CanonicalJsonValue): string {
    const parsed = record(value, "expression output");
    if (
      parsed.schemaVersion !== 1 ||
      typeof parsed.text !== "string" ||
      parsed.text.trim() === ""
    ) {
      throw subjectProblem(
        "subject.expression_invalid",
        "Subject expression is invalid",
        "The current expression output is not bounded non-empty text",
        "validation",
      );
    }
    return parsed.text;
  }

  const completeCommunication = async (
    reaction: Reaction,
    communication: CommunicationCommit,
  ): Promise<SubjectReactionOutcome> => {
    const expression = await expressionGeneration(communication);
    await materializeExpression(reaction, communication, expression);
    return Object.freeze({ accepted: true, status: "REPLIED" });
  };

  const processReaction = async (
    workItemId: WorkItemId,
    payload: unknown,
  ): Promise<SubjectReactionOutcome> => {
    const parsed = record(payload, "reaction payload");
    const conversationId = parseCanonicalConversationId(parsed.conversationId);
    const acceptedMessageId = parseCanonicalMessageId(parsed.acceptedMessageId);
    if (
      parsed.schemaVersion !== 1 ||
      conversationId === undefined ||
      acceptedMessageId === undefined
    ) {
      throw subjectProblem(
        "subject.reaction_payload_invalid",
        "Subject Reaction payload is invalid",
        "The current Reaction trigger requires one conversationId and acceptedMessageId",
        "validation",
      );
    }
    const reaction = await acquireReaction(
      workItemId,
      conversationId,
      acceptedMessageId,
    );
    if (reaction === undefined)
      return Object.freeze({ accepted: true, status: "NOOP" });

    const progress = await readProgress(reaction);
    if (progress.outbound) {
      await finalizeReplied(reaction);
      return Object.freeze({ accepted: true, status: "REPLIED" });
    }
    if (reaction.state === "NO_COMMUNICATION")
      return Object.freeze({ accepted: true, status: "NO_COMMUNICATION" });
    if (reaction.state === "SUPERSEDED")
      return Object.freeze({ accepted: true, status: "SUPERSEDED" });
    if (progress.communication !== undefined)
      return completeCommunication(reaction, progress.communication);
    if (reaction.state !== "OPEN") {
      throw subjectProblem(
        "subject.reaction_state_invalid",
        "Subject Reaction cannot progress",
        "The current Reaction has no admissible open or committed communication state",
        "integrity",
      );
    }

    const primary = await primaryGeneration(reaction);
    const proposal = conversationReactionProposal(primary.candidate);
    const accepted = await commitAcceptedProposal(reaction, primary, proposal);
    if (accepted.kind === "SUPERSEDED")
      return Object.freeze({ accepted: true, status: "SUPERSEDED" });
    if (accepted.kind === "NO_COMMUNICATION")
      return Object.freeze({ accepted: true, status: "NO_COMMUNICATION" });
    return completeCommunication(reaction, accepted.communication);
  };

  const executeReaction = async (input: {
    readonly workItemId: WorkItemId;
    readonly payload: unknown;
  }): Promise<SubjectReactionOutcome> => {
    return options.execution.runActivity(
      {
        kind: "subject.reaction.execute",
        importance: "significant",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      async (activity) => {
        await options.persistence.mutate((context) =>
          options.lineage.retainCurrent(context, activity),
        );
        try {
          const result = await processReaction(input.workItemId, input.payload);
          await options.persistence.mutate((context) =>
            options.lineage.completeCurrent(context, activity, {
              endedAt: options.time.now(),
              outcome: "SUCCEEDED",
            }),
          );
          return result;
        } catch (error) {
          await options.persistence
            .mutate((context) =>
              options.lineage.completeCurrent(context, activity, {
                endedAt: options.time.now(),
                outcome: "FAILED",
              }),
            )
            .catch(() => undefined);
          throw error;
        }
      },
    );
  };

  const createWorkErrorClassifier = (): WorkErrorClassifier => ({
    classify(input) {
      const reasonCode = input.failure.reasonCode;
      if (
        reasonCode === "subject.primary_unavailable" ||
        reasonCode === "subject.expression_unavailable" ||
        reasonCode === "ai.gateway_unavailable" ||
        reasonCode === "ai.model_binding_unavailable" ||
        reasonCode === "ai.model_binding_stale" ||
        reasonCode === "ai.generation_mismatch"
      ) {
        return {
          kind: "RETRY",
          retryClass: "dependency-unavailable",
          reasonCode,
          notBefore: futureRetryTime(options.time),
        };
      }
      return {
        kind: "TERMINAL",
        retryClass:
          reasonCode === "subject.expression_invalid" ||
          reasonCode === "subject.reaction_proposal_invalid"
            ? "invalid"
            : "permanent",
        reasonCode,
      };
    },
  });

  const reactionHandler: RuntimeWorkHandler = Object.freeze({
    async execute(input: RuntimeWorkHandlerInvocation) {
      return {
        outcome: (await executeReaction({
          workItemId: input.workItemId,
          payload: input.payload,
        })) as unknown as RuntimeContractData,
      };
    },
  });

  const start = (input: SubjectStateActionInput): Promise<SubjectStatus> =>
    setDesiredState("RUNNING", input);
  const stop = (input: SubjectStateActionInput): Promise<SubjectStatus> =>
    setDesiredState("STOPPED", input);

  const service: SubjectService = Object.freeze({
    ensureCurrent,
    getAuthority,
    getStatus,
    start,
    stop,
    prepareAcceptedInbound,
    commitAcceptedInbound,
    executeReaction,
    createWorkErrorClassifier,
    reactionDescriptor,
    reactionHandler,
  });
  return service;
}

/** Registers the one current Subject Reaction handler with RuntimeKernel. */
export function createSubjectReactionDefinition(
  options: SubjectReactionDefinitionOptions,
): MicroSystemDefinition {
  const definition: MicroSystemDefinition = {
    microSystemId: SUBJECT_SYSTEM_ID,
    role: "system-service",
    generation: {
      productGenerationId: options.productGenerationId,
      packageGenerationId: options.packageGenerationId,
    },
    operatingModes: ["NORMAL", "SAFE", "MAINTENANCE", "EMERGENCY_READ_ONLY"] as const,
    serviceRequirements: [],
    capabilityRequirements: [],
    serviceProvisions: [],
    capabilityProvisions: [],
    workHandlerProvisions: [options.service.reactionDescriptor],
    activate: async (context) => {
      context.publishWorkHandler(
        options.service.reactionDescriptor,
        options.service.reactionHandler,
      );
    },
  };
  return Object.freeze(definition);
}
