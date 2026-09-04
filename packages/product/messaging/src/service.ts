/** Implements canonical built-in Subject Chat conversation and MessageFact ownership.
 * @module service
 */

import {
  createCanonicalConversationId,
  createCanonicalMessageId,
  createMessagingAccountId,
  digestCanonicalJson,
  formatInstant,
  parseCanonicalConversationId,
  parseCommunicationCommitId,
  parseInstant,
  parseMessagingPlatformId,
  parseSubjectId,
  parseUuidV7Id,
  snapshotCanonicalJson,
  type CanonicalConversationId,
  type Instant,
} from "@heptalogos/foundation-contracts";
import {
  executeRepositorySql,
  useRepositoryMutationTransaction,
  useRepositoryReadTransaction,
  type PersistenceInternalTransaction,
} from "@heptalogos/persistence/repository";
import type {
  ExecutionContext,
  ExecutionContextRuntime,
  LineageContextRef,
  ExecutionLineageService,
} from "@heptalogos/execution-lineage";
import type { PersistenceMutationTransactionContext } from "@heptalogos/persistence";
import {
  SUBJECT_CHAT_PLATFORM_ID,
  type AcceptInboundInput,
  type EnsureConversationInput,
  type InboundMessageAcceptance,
  type ListMessagesInput,
  type MaterializeOutboundInput,
  type MessageDirection,
  type MessageFact,
  type MessagePage,
  type MessagingActorKind,
  type MessagingConversation,
  type MessagingService,
  type MessagingServiceOptions,
} from "./contracts.js";
import { messagingProblem } from "./problems.js";

interface ConversationRow {
  readonly conversation_id: unknown;
  readonly installation_id: unknown;
  readonly platform_id: unknown;
  readonly administrator_id: unknown;
  readonly administrator_account_id: unknown;
  readonly subject_id: unknown;
  readonly subject_account_id: unknown;
  readonly last_sequence: unknown;
  readonly created_at: unknown;
  readonly lineage_context_ref: unknown;
}

interface MessageRow {
  readonly message_id: unknown;
  readonly conversation_id: unknown;
  readonly sequence: unknown;
  readonly direction: unknown;
  readonly sender_kind: unknown;
  readonly sender_account_id: unknown;
  readonly recipient_kind: unknown;
  readonly recipient_account_id: unknown;
  readonly text: unknown;
  readonly client_message_id: unknown;
  readonly accepted_input_digest: unknown;
  readonly caused_by_communication_commit_id: unknown;
  readonly created_at: unknown;
  readonly lineage_context_ref: unknown;
}

interface AdministratorRow {
  readonly administrator_id: unknown;
}

function jsonValue(value: unknown, field: string): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      `${field} is not valid JSON`,
      "integrity",
      "manual",
    );
  }
}

function object(value: unknown, field: string): Record<string, unknown> {
  const parsed = jsonValue(value, field);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      `${field} must be an object`,
      "integrity",
      "manual",
    );
  }
  return parsed as Record<string, unknown>;
}

function instant(value: unknown, field: string): Instant {
  const parsed = parseInstant(value instanceof Date ? formatInstant(value) : value);
  if (parsed === undefined) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      `${field} is not a canonical Instant`,
      "integrity",
      "manual",
    );
  }
  return parsed;
}

function integer(value: unknown, field: string, minimum: number): number {
  const parsed =
    typeof value === "number" && Number.isSafeInteger(value)
      ? value
      : typeof value === "string" && /^(0|[1-9][0-9]*)$/u.test(value)
        ? Number(value)
        : Number.NaN;
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      `${field} is not a valid bounded integer`,
      "integrity",
      "manual",
    );
  }
  return parsed;
}

function text(value: unknown, field: string, maximum: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      `${field} must be non-empty text`,
      "integrity",
      "manual",
    );
  }
  if (new TextEncoder().encode(value).byteLength > maximum) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      `${field} exceeds its current byte bound`,
      "integrity",
      "manual",
    );
  }
  return value;
}

function uuid<T extends string>(brand: T, value: unknown, field: string) {
  const parsed = parseUuidV7Id(brand, value);
  if (parsed === undefined) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      `${field} is not a UUIDv7 identifier`,
      "integrity",
      "manual",
    );
  }
  return parsed;
}

function lineage(value: unknown, field: string): LineageContextRef {
  const parsed = object(value, field);
  if (
    parsed.schemaVersion !== 1 ||
    parseUuidV7Id("ActivityId", parsed.sourceActivityId) === undefined ||
    parseUuidV7Id("InstanceId", parsed.sourceInstanceId) === undefined ||
    parseUuidV7Id("ContinuityEpochId", parsed.sourceContinuityEpochId) === undefined
  ) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      `${field} is not a valid LineageContextRef`,
      "integrity",
      "manual",
    );
  }
  return Object.freeze(parsed as unknown as LineageContextRef);
}

function rowConversation(row: ConversationRow): MessagingConversation {
  const platformId = parseMessagingPlatformId(row.platform_id);
  if (platformId !== SUBJECT_CHAT_PLATFORM_ID) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      "The canonical conversation is not the current Subject Chat platform",
      "integrity",
      "manual",
    );
  }
  return Object.freeze({
    schemaVersion: 1 as const,
    conversationId: uuid(
      "CanonicalConversationId",
      row.conversation_id,
      "conversation_id",
    ),
    installationId: uuid("InstallationId", row.installation_id, "installation_id"),
    platformId: SUBJECT_CHAT_PLATFORM_ID,
    administratorId: uuid("AdministratorId", row.administrator_id, "administrator_id"),
    administratorAccountId: uuid(
      "MessagingAccountId",
      row.administrator_account_id,
      "administrator_account_id",
    ),
    subjectId: uuid("SubjectId", row.subject_id, "subject_id"),
    subjectAccountId: uuid(
      "MessagingAccountId",
      row.subject_account_id,
      "subject_account_id",
    ),
    lastSequence: integer(row.last_sequence, "last_sequence", 0),
    createdAt: instant(row.created_at, "created_at"),
    lineageContextRef: lineage(row.lineage_context_ref, "lineage_context_ref"),
  });
}

function rowMessage(row: MessageRow): MessageFact {
  const direction = row.direction;
  const senderKind = row.sender_kind;
  const recipientKind = row.recipient_kind;
  if (
    (direction !== "INBOUND" && direction !== "OUTBOUND") ||
    (senderKind !== "ADMINISTRATOR" && senderKind !== "SUBJECT") ||
    (recipientKind !== "ADMINISTRATOR" && recipientKind !== "SUBJECT")
  ) {
    throw messagingProblem(
      "messaging.repository_invalid",
      "Messaging repository data is invalid",
      "The canonical MessageFact direction or actor kind is invalid",
      "integrity",
      "manual",
    );
  }
  const clientMessageId = row.client_message_id;
  const acceptedInputDigest = row.accepted_input_digest;
  const communicationCommitId = row.caused_by_communication_commit_id;
  return Object.freeze({
    schemaVersion: 1 as const,
    messageId: uuid("CanonicalMessageId", row.message_id, "message_id"),
    conversationId: uuid(
      "CanonicalConversationId",
      row.conversation_id,
      "conversation_id",
    ),
    sequence: integer(row.sequence, "sequence", 1),
    direction: direction as MessageDirection,
    senderKind: senderKind as MessagingActorKind,
    senderAccountId: uuid(
      "MessagingAccountId",
      row.sender_account_id,
      "sender_account_id",
    ),
    recipientKind: recipientKind as MessagingActorKind,
    recipientAccountId: uuid(
      "MessagingAccountId",
      row.recipient_account_id,
      "recipient_account_id",
    ),
    text: text(row.text, "text", 65_536),
    ...(clientMessageId === null || clientMessageId === undefined
      ? {}
      : { clientMessageId: text(clientMessageId, "client_message_id", 256) }),
    ...(acceptedInputDigest === null || acceptedInputDigest === undefined
      ? {}
      : {
          acceptedInputDigest: text(acceptedInputDigest, "accepted_input_digest", 64),
        }),
    ...(communicationCommitId === null || communicationCommitId === undefined
      ? {}
      : {
          causedByCommunicationCommitId: uuid(
            "CommunicationCommitId",
            communicationCommitId,
            "caused_by_communication_commit_id",
          ),
        }),
    createdAt: instant(row.created_at, "created_at"),
    lineageContextRef: lineage(row.lineage_context_ref, "lineage_context_ref"),
  });
}

function inputText(value: string, field: string, maximum: number): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    new TextEncoder().encode(value).byteLength > maximum
  ) {
    throw messagingProblem(
      "messaging.invalid_input",
      "Messaging request is invalid",
      `${field} must be non-empty and within its current byte bound`,
    );
  }
  return value;
}

function canonicalCursorValue(
  conversationId: CanonicalConversationId,
  sequence: number,
) {
  return { schemaVersion: 1, conversationId, sequence } as const;
}

/** Encodes the current versioned sequence cursor without a server-side registry. */
export function encodeMessageCursor(
  conversationId: CanonicalConversationId,
  sequence: number,
): string {
  if (
    parseCanonicalConversationId(conversationId) === undefined ||
    !Number.isSafeInteger(sequence) ||
    sequence < 0
  ) {
    throw messagingProblem(
      "messaging.cursor_invalid",
      "Message cursor is invalid",
      "The cursor conversation or sequence is invalid",
    );
  }
  return Buffer.from(
    JSON.stringify(canonicalCursorValue(conversationId, sequence)),
  ).toString("base64url");
}

function decodeMessageCursor(value: string): {
  readonly conversationId: CanonicalConversationId;
  readonly sequence: number;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
  } catch {
    throw messagingProblem(
      "messaging.cursor_invalid",
      "Message cursor is invalid",
      "The cursor is not a valid encoded sequence cursor",
      "validation",
      "manual",
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw messagingProblem(
      "messaging.cursor_invalid",
      "Message cursor is invalid",
      "The cursor payload is not an object",
    );
  }
  const record = parsed as Record<string, unknown>;
  const conversationId = parseCanonicalConversationId(record.conversationId);
  const sequence = record.sequence;
  if (
    record.schemaVersion !== 1 ||
    conversationId === undefined ||
    typeof sequence !== "number" ||
    !Number.isSafeInteger(sequence) ||
    sequence < 0
  ) {
    throw messagingProblem(
      "messaging.cursor_invalid",
      "Message cursor is invalid",
      "The cursor version, conversation, or sequence is invalid",
    );
  }
  return { conversationId, sequence };
}

const MESSAGE_COLUMNS = `
  message_id, conversation_id, sequence, direction, sender_kind,
  sender_account_id, recipient_kind, recipient_account_id, text,
  client_message_id, accepted_input_digest, caused_by_communication_commit_id,
  created_at, lineage_context_ref`;

const CONVERSATION_COLUMNS = `
  conversation_id, installation_id, platform_id, administrator_id,
  administrator_account_id, subject_id, subject_account_id, last_sequence,
  created_at, lineage_context_ref`;

function canonicalLineage(execution: ExecutionContextRuntime): string {
  return JSON.stringify(execution.createLineageContextRef());
}

async function queryConversation(
  transaction: PersistenceInternalTransaction,
  installationId: string,
  administratorId?: string,
  forUpdate = false,
): Promise<MessagingConversation | undefined> {
  const rows = await executeRepositorySql<ConversationRow>(
    transaction,
    `SELECT ${CONVERSATION_COLUMNS}
       FROM "heptalogos"."messaging_conversation"
      WHERE installation_id = $1
        ${administratorId === undefined ? "" : "AND administrator_id = $2"}
      ${forUpdate ? "FOR UPDATE" : ""}`,
    administratorId === undefined
      ? [installationId]
      : [installationId, administratorId],
  );
  const row = rows[0];
  return row === undefined ? undefined : rowConversation(row);
}

async function queryMessages(
  transaction: PersistenceInternalTransaction,
  conversationId: CanonicalConversationId,
  afterSequence: number,
  throughSequence?: number,
): Promise<readonly MessageFact[]> {
  const rows = await executeRepositorySql<MessageRow>(
    transaction,
    `SELECT ${MESSAGE_COLUMNS}
       FROM "heptalogos"."message_fact"
      WHERE conversation_id = $1
        AND direction = 'INBOUND'
        AND sequence > $2
        ${throughSequence === undefined ? "" : "AND sequence <= $3"}
      ORDER BY sequence ASC`,
    throughSequence === undefined
      ? [conversationId, afterSequence]
      : [conversationId, afterSequence, throughSequence],
  );
  return Object.freeze(rows.map(rowMessage));
}

async function activityMutation<T>(
  options: MessagingServiceOptions<unknown>,
  kind: string,
  operation: (activity: ExecutionContext) => Promise<T>,
): Promise<T> {
  const existing = options.execution.current();
  if (existing !== undefined) return operation(existing);
  return options.execution.runActivity(
    {
      kind,
      importance: "significant",
      retentionClass: "operational",
      sensitivity: "operational",
    },
    operation,
  );
}

/** Creates the current Messaging semantic owner over one Host-fenced database. */
export function createMessagingService<TPrepared>(
  options: MessagingServiceOptions<TPrepared>,
): MessagingService {
  const execution = options.execution;
  const lineageService: ExecutionLineageService = options.lineage;

  const withRequiredLineage = async (
    transaction: PersistenceMutationTransactionContext,
    activity: ExecutionContext,
    complete: boolean,
    outcome: "SUCCEEDED" | "FAILED" = "SUCCEEDED",
  ): Promise<void> => {
    if (lineageService === undefined) return;
    if (complete) {
      await lineageService.completeCurrent(transaction, activity, {
        endedAt: options.time.now(),
        outcome,
      });
    } else {
      await lineageService.retainCurrent(transaction, activity);
    }
  };

  const getConversationForAdministrator = async (
    administratorId: string,
  ): Promise<MessagingConversation | undefined> => {
    const parsedAdministrator = parseUuidV7Id("AdministratorId", administratorId);
    if (parsedAdministrator === undefined) return undefined;
    return options.persistence.read((context) =>
      useRepositoryReadTransaction(context, (transaction) =>
        queryConversation(transaction, options.installationId, parsedAdministrator),
      ),
    );
  };

  const ensureCurrentConversation = async (
    input: EnsureConversationInput,
  ): Promise<MessagingConversation | undefined> => {
    const subjectId = parseSubjectId(input.subjectId);
    if (subjectId === undefined) {
      throw messagingProblem(
        "messaging.invalid_input",
        "Messaging request is invalid",
        "subjectId must be a UUIDv7 SubjectId",
      );
    }
    return activityMutation(
      options as unknown as MessagingServiceOptions<unknown>,
      "messaging.conversation.ensure",
      async (activity) =>
        options.persistence.mutate((context) =>
          useRepositoryMutationTransaction(context, async (transaction) => {
            await withRequiredLineage(context, activity, false);
            const administrators = await executeRepositorySql<AdministratorRow>(
              transaction,
              'SELECT administrator_id FROM "heptalogos"."administrator" WHERE singleton = true',
            );
            const administratorId = parseUuidV7Id(
              "AdministratorId",
              administrators[0]?.administrator_id,
            );
            if (administratorId === undefined) {
              if (lineageService !== undefined) {
                await withRequiredLineage(context, activity, true);
              }
              return undefined;
            }
            const administratorAccountId = createMessagingAccountId();
            const subjectAccountId = createMessagingAccountId();
            const conversationId = createCanonicalConversationId();
            const createdAt = options.time.now();
            const lineageRef = canonicalLineage(execution);
            await executeRepositorySql(
              transaction,
              `INSERT INTO "heptalogos"."messaging_conversation" (
                 conversation_id, installation_id, platform_id, administrator_id,
                 administrator_account_id, subject_id, subject_account_id,
                 last_sequence, created_at, lineage_context_ref
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9)
               ON CONFLICT (installation_id) DO NOTHING`,
              [
                conversationId,
                options.installationId,
                SUBJECT_CHAT_PLATFORM_ID,
                administratorId,
                administratorAccountId,
                subjectId,
                subjectAccountId,
                createdAt,
                lineageRef,
              ],
            );
            const conversation = await queryConversation(
              transaction,
              options.installationId,
            );
            if (conversation === undefined) {
              throw messagingProblem(
                "messaging.repository_invalid",
                "Messaging conversation was not materialized",
                "The current built-in conversation could not be read after insertion",
                "integrity",
                "manual",
              );
            }
            if (
              conversation.subjectId !== subjectId ||
              conversation.administratorId !== administratorId
            ) {
              throw messagingProblem(
                "messaging.conversation_conflict",
                "Built-in conversation conflicts with the current installation",
                "The persisted Subject Chat conversation does not match the current Subject or Administrator",
                "conflict",
              );
            }
            await executeRepositorySql(
              transaction,
              `INSERT INTO "heptalogos"."conversation_mailbox" (
                 conversation_id, mailbox_revision, consumed_through_sequence,
                 open_reaction_id, updated_at, lineage_context_ref
               ) VALUES ($1, 0, 0, NULL, $2, $3)
               ON CONFLICT (conversation_id) DO NOTHING`,
              [conversation.conversationId, createdAt, lineageRef],
            );
            if (lineageService !== undefined)
              await withRequiredLineage(context, activity, true);
            return conversation;
          }),
        ),
    );
  };

  const acceptInbound = async (
    input: AcceptInboundInput,
  ): Promise<InboundMessageAcceptance> => {
    const administratorId = parseUuidV7Id("AdministratorId", input.administratorId);
    if (administratorId === undefined) {
      throw messagingProblem(
        "messaging.authentication_invalid",
        "Messaging Administrator is invalid",
        "The authenticated Administrator identity is not current",
        "conflict",
      );
    }
    const clientMessageId = inputText(input.clientMessageId, "clientMessageId", 256);
    const messageText = inputText(input.text, "text", 65_536);
    const digest = digestCanonicalJson(
      "messaging.accepted-input.v1",
      snapshotCanonicalJson({
        schemaVersion: 1,
        clientMessageId,
        text: messageText,
      }).value,
    ).hex;
    const candidateMessageId = createCanonicalMessageId();
    return activityMutation(
      options as unknown as MessagingServiceOptions<unknown>,
      "messaging.inbound.accept",
      async (activity) => {
        const conversation = await getConversationForAdministrator(administratorId);
        if (conversation === undefined) {
          throw messagingProblem(
            "messaging.conversation_not_ready",
            "Subject Chat is not initialized",
            "The current Administrator has no built-in Subject Chat conversation",
            "unavailable",
            "after-change",
          );
        }
        const preparation = await options.inboundConsumer.prepare({
          conversationId: conversation.conversationId,
          acceptedMessageId: candidateMessageId,
        });
        return options.persistence.mutate((context) =>
          useRepositoryMutationTransaction(context, async (transaction) => {
            if (lineageService !== undefined)
              await withRequiredLineage(context, activity, false);
            const current = await queryConversation(
              transaction,
              options.installationId,
              administratorId,
              true,
            );
            if (
              current === undefined ||
              current.conversationId !== conversation.conversationId
            ) {
              throw messagingProblem(
                "messaging.conversation_not_ready",
                "Subject Chat is not initialized",
                "The current built-in conversation changed before message acceptance",
                "conflict",
              );
            }
            const existingRows = await executeRepositorySql<MessageRow>(
              transaction,
              `SELECT ${MESSAGE_COLUMNS}
                 FROM "heptalogos"."message_fact"
                WHERE conversation_id = $1
                  AND sender_account_id = $2
                  AND client_message_id = $3
                  AND direction = 'INBOUND'`,
              [current.conversationId, current.administratorAccountId, clientMessageId],
            );
            const existing = existingRows[0];
            if (existing !== undefined) {
              const existingMessage = rowMessage(existing);
              if (existingMessage.acceptedInputDigest !== digest) {
                throw messagingProblem(
                  "messaging.idempotency_conflict",
                  "Inbound client message conflicts with an accepted fact",
                  "The clientMessageId is already bound to different canonical input",
                  "conflict",
                );
              }
              if (lineageService !== undefined)
                await withRequiredLineage(context, activity, true);
              return Object.freeze({
                schemaVersion: 1 as const,
                status: "EXISTING" as const,
                message: existingMessage,
              });
            }
            const sequence = current.lastSequence + 1;
            const createdAt = options.time.now();
            const lineageRef = canonicalLineage(execution);
            await executeRepositorySql(
              transaction,
              `INSERT INTO "heptalogos"."message_fact" (
                 message_id, conversation_id, sequence, direction, sender_kind,
                 sender_account_id, recipient_kind, recipient_account_id, text,
                 client_message_id, accepted_input_digest,
                 caused_by_communication_commit_id, created_at, lineage_context_ref
               ) VALUES ($1, $2, $3, 'INBOUND', 'ADMINISTRATOR', $4, 'SUBJECT', $5,
                         $6, $7, $8, NULL, $9, $10)`,
              [
                candidateMessageId,
                current.conversationId,
                sequence,
                current.administratorAccountId,
                current.subjectAccountId,
                messageText,
                clientMessageId,
                digest,
                createdAt,
                lineageRef,
              ],
            );
            await executeRepositorySql(
              transaction,
              `UPDATE "heptalogos"."messaging_conversation"
                  SET last_sequence = $2
                WHERE conversation_id = $1`,
              [current.conversationId, sequence],
            );
            const message = rowMessage(
              (
                await executeRepositorySql<MessageRow>(
                  transaction,
                  `SELECT ${MESSAGE_COLUMNS}
                     FROM "heptalogos"."message_fact"
                    WHERE message_id = $1`,
                  [candidateMessageId],
                )
              )[0]!,
            );
            await options.inboundConsumer.commit(context, { message, preparation });
            await options.evidence.recordRequired(context, {
              evidenceKind: "messaging.inbound.accepted",
              evidenceContractVersion: "messaging.v1",
              subjectRef: message.messageId,
              objectRef: message.conversationId,
              factRef: digest,
              retentionClass: "retained",
              sensitivity: "operational",
            });
            if (lineageService !== undefined)
              await withRequiredLineage(context, activity, true);
            return Object.freeze({
              schemaVersion: 1 as const,
              status: "ACCEPTED" as const,
              message,
            });
          }),
        );
      },
    );
  };

  const listMessages = async (input: ListMessagesInput): Promise<MessagePage> => {
    const conversation = await getConversationForAdministrator(input.administratorId);
    if (conversation === undefined) {
      throw messagingProblem(
        "messaging.conversation_not_ready",
        "Subject Chat is not initialized",
        "The current Administrator has no built-in Subject Chat conversation",
        "unavailable",
        "after-change",
      );
    }
    const limit = input.limit ?? 100;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw messagingProblem(
        "messaging.invalid_input",
        "Messaging request is invalid",
        "limit must be an integer from 1 through 100",
      );
    }
    let afterSequence = 0;
    if (input.cursor !== undefined) {
      const cursor = decodeMessageCursor(input.cursor);
      if (cursor.conversationId !== conversation.conversationId) {
        throw messagingProblem(
          "messaging.cursor_invalid",
          "Message cursor is invalid",
          "The cursor belongs to another current conversation",
          "conflict",
        );
      }
      afterSequence = cursor.sequence;
    }
    const messages = await options.persistence.read((context) =>
      useRepositoryReadTransaction(context, (transaction) =>
        executeRepositorySql<MessageRow>(
          transaction,
          `SELECT ${MESSAGE_COLUMNS}
             FROM "heptalogos"."message_fact"
            WHERE conversation_id = $1 AND sequence > $2
            ORDER BY sequence ASC
            LIMIT $3`,
          [conversation.conversationId, afterSequence, limit],
        ),
      ),
    );
    const parsed = Object.freeze(messages.map(rowMessage));
    return Object.freeze({
      schemaVersion: 1 as const,
      conversationId: conversation.conversationId,
      messages: parsed,
      ...(parsed.length === limit
        ? {
            nextCursor: encodeMessageCursor(
              conversation.conversationId,
              parsed[parsed.length - 1]!.sequence,
            ),
          }
        : {}),
    });
  };

  const listPendingInboundWithinTransaction = async (
    transaction: PersistenceMutationTransactionContext,
    input: {
      readonly conversationId: CanonicalConversationId;
      readonly afterSequence: number;
      readonly throughSequence?: number;
    },
  ): Promise<readonly MessageFact[]> =>
    useRepositoryMutationTransaction(transaction, (databaseTransaction) =>
      queryMessages(
        databaseTransaction,
        input.conversationId,
        input.afterSequence,
        input.throughSequence,
      ),
    );

  const listInboundMessages = async (input: {
    readonly conversationId: CanonicalConversationId;
    readonly afterSequence: number;
    readonly throughSequence?: number;
  }): Promise<readonly MessageFact[]> => {
    if (
      parseCanonicalConversationId(input.conversationId) === undefined ||
      !Number.isSafeInteger(input.afterSequence) ||
      input.afterSequence < 0 ||
      (input.throughSequence !== undefined &&
        (!Number.isSafeInteger(input.throughSequence) || input.throughSequence < 0))
    ) {
      throw messagingProblem(
        "messaging.invalid_input",
        "Messaging request is invalid",
        "The inbound message sequence range is invalid",
      );
    }
    return options.persistence.read((context) =>
      useRepositoryReadTransaction(context, (databaseTransaction) =>
        queryMessages(
          databaseTransaction,
          input.conversationId,
          input.afterSequence,
          input.throughSequence,
        ),
      ),
    );
  };

  const materializeOutboundWithinTransaction = async (
    transaction: PersistenceMutationTransactionContext,
    input: MaterializeOutboundInput,
  ): Promise<MessageFact> => {
    const communicationCommitId = parseCommunicationCommitId(
      input.communicationCommitId,
    );
    if (communicationCommitId === undefined) {
      throw messagingProblem(
        "messaging.invalid_input",
        "Messaging request is invalid",
        "communicationCommitId must be a UUIDv7 CommunicationCommitId",
      );
    }
    const outboundText = inputText(input.text, "text", 65_536);
    return useRepositoryMutationTransaction(
      transaction,
      async (databaseTransaction) => {
        const communicationRows = await executeRepositorySql<{
          readonly conversation_id: unknown;
        }>(
          databaseTransaction,
          `SELECT conversation_id
           FROM "heptalogos"."communication_commit"
          WHERE communication_commit_id = $1
          `,
          [communicationCommitId],
        );
        const communication = communicationRows[0];
        const conversationId = parseCanonicalConversationId(
          communication?.conversation_id,
        );
        if (conversationId === undefined) {
          throw messagingProblem(
            "messaging.communication_not_found",
            "CommunicationCommit was not found",
            "The local outbound fact requires a current CommunicationCommit",
            "conflict",
          );
        }
        const existingRows = await executeRepositorySql<MessageRow>(
          databaseTransaction,
          `SELECT ${MESSAGE_COLUMNS}
           FROM "heptalogos"."message_fact"
          WHERE caused_by_communication_commit_id = $1
          `,
          [communicationCommitId],
        );
        if (existingRows[0] !== undefined) return rowMessage(existingRows[0]);
        const conversationRows = await executeRepositorySql<ConversationRow>(
          databaseTransaction,
          `SELECT ${CONVERSATION_COLUMNS}
           FROM "heptalogos"."messaging_conversation"
          WHERE conversation_id = $1
          FOR UPDATE`,
          [conversationId],
        );
        const conversation =
          conversationRows[0] === undefined
            ? undefined
            : rowConversation(conversationRows[0]);
        if (conversation === undefined) {
          throw messagingProblem(
            "messaging.conversation_not_ready",
            "Subject Chat is not initialized",
            "The CommunicationCommit target conversation is not current",
            "conflict",
          );
        }
        const sequence = conversation.lastSequence + 1;
        const messageId = createCanonicalMessageId();
        const createdAt = options.time.now();
        await executeRepositorySql(
          databaseTransaction,
          `INSERT INTO "heptalogos"."message_fact" (
           message_id, conversation_id, sequence, direction, sender_kind,
           sender_account_id, recipient_kind, recipient_account_id, text,
           client_message_id, accepted_input_digest,
           caused_by_communication_commit_id, created_at, lineage_context_ref
         ) VALUES ($1, $2, $3, 'OUTBOUND', 'SUBJECT', $4, 'ADMINISTRATOR', $5,
                   $6, NULL, NULL, $7, $8, $9)`,
          [
            messageId,
            conversation.conversationId,
            sequence,
            conversation.subjectAccountId,
            conversation.administratorAccountId,
            outboundText,
            communicationCommitId,
            createdAt,
            canonicalLineage(execution),
          ],
        );
        await executeRepositorySql(
          databaseTransaction,
          `UPDATE "heptalogos"."messaging_conversation"
            SET last_sequence = $2
          WHERE conversation_id = $1`,
          [conversation.conversationId, sequence],
        );
        const written = (
          await executeRepositorySql<MessageRow>(
            databaseTransaction,
            `SELECT ${MESSAGE_COLUMNS}
             FROM "heptalogos"."message_fact"
            WHERE message_id = $1`,
            [messageId],
          )
        )[0];
        if (written === undefined) {
          throw messagingProblem(
            "messaging.repository_invalid",
            "Outbound MessageFact was not materialized",
            "The current outbound insert could not be read back",
            "integrity",
            "manual",
          );
        }
        return rowMessage(written);
      },
    );
  };

  const materializeOutbound = async (
    input: MaterializeOutboundInput,
  ): Promise<MessageFact> =>
    activityMutation(
      options as unknown as MessagingServiceOptions<unknown>,
      "messaging.outbound.materialize",
      () =>
        options.persistence.mutate((transaction) =>
          materializeOutboundWithinTransaction(transaction, input),
        ),
    );

  return Object.freeze({
    ensureCurrentConversation,
    getConversationForAdministrator,
    acceptInbound,
    listMessages,
    listInboundMessages,
    listPendingInboundWithinTransaction,
    materializeOutboundWithinTransaction,
    materializeOutbound,
  });
}
