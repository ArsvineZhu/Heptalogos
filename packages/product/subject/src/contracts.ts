/** Defines the current persistent Subject authority, reaction, and handler contracts.
 * @module contracts
 */

import {
  createContributionId,
  createMicroSystemId,
  createMessagingPlatformId,
  type CanonicalConversationId,
  type CanonicalMessageId,
  type CommunicationCommitId,
  type DecisionCommitId,
  type InstallationId,
  type Instant,
  type PackageGenerationId,
  type ProductGenerationId,
  type ReactionId,
  type SubjectId,
  type WorkItemId,
} from "@heptalogos/foundation-contracts";
import type {
  ExecutionContextRuntime,
  ExecutionLineageService,
  LineageContextRef,
} from "@heptalogos/execution-lineage";
import type { AIRuntimeService } from "@heptalogos/ai-runtime";
import type { EvidenceService } from "@heptalogos/evidence";
import type { MessagingService, MessageFact } from "@heptalogos/messaging";
import type {
  PersistenceMutationTransactionContext,
  PersistenceService,
} from "@heptalogos/persistence";
import type {
  RuntimeWorkHandler,
  WorkHandlerProvisionDescriptor,
  WorkHandlerTarget,
} from "@heptalogos/runtime-kernel";
import type { TimeService } from "@heptalogos/time-service";
import type {
  PreparedWorkCreation,
  WorkErrorClassifier,
  WorkQueueService,
} from "@heptalogos/work-queue";

/** The current logical platform identifier retained for Subject Chat context. */
export const SUBJECT_CHAT_PLATFORM = createMessagingPlatformId(
  "heptalogos-subject-chat",
);
/** The Subject MicroSystem identity. */
export const SUBJECT_SYSTEM_ID = createMicroSystemId("product.subject");
/** The one current Subject Reaction WorkHandler contribution. */
export const SUBJECT_REACTION_CONTRIBUTION_ID = createContributionId(
  "subject.reaction.execute",
);
/** The one current Subject Reaction WorkQueue profile. */
export const SUBJECT_REACTION_QUEUE_PROFILE_ID = createMicroSystemId(
  "work.subject-reaction",
) as never;
/** The one current Subject Reaction resource admission class. */
export const SUBJECT_REACTION_RESOURCE_CLASS = createMicroSystemId(
  "resource.subject-reaction",
) as never;

/** Durable Subject authority; desired state is the only persistent lifecycle intent. */
export interface SubjectAuthorityRecord {
  readonly schemaVersion: 1;
  readonly subjectId: SubjectId;
  readonly installationId: InstallationId;
  readonly desiredState: "STOPPED" | "RUNNING";
  readonly authorityRevision: number;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
  readonly lineageContextRef: LineageContextRef;
}

/** A bounded current dependency blocker in the Subject status projection. */
export interface SubjectBlocker {
  readonly code: string;
  readonly detail: string;
}

/** Subject-owned current status projection derived from intent and live facts. */
export interface SubjectStatus {
  readonly schemaVersion: 1;
  readonly subjectId: SubjectId;
  readonly desiredState: "STOPPED" | "RUNNING";
  readonly actualState:
    | "STOPPED"
    | "STARTING"
    | "READY"
    | "ACTIVE"
    | "DEGRADED"
    | "BLOCKED"
    | "STOPPING"
    | "FAILED";
  readonly authorityRevision: number;
  readonly blockers: readonly SubjectBlocker[];
}

/** Canonical Subject behavior proposal accepted by deterministic Review. */
export type BehaviorIntent =
  | { readonly schemaVersion: 1; readonly kind: "REPLY"; readonly text: string }
  | { readonly schemaVersion: 1; readonly kind: "SILENCE"; readonly reason: string };

/** One current durable Reaction workspace owned by Subject. */
export interface Reaction {
  readonly schemaVersion: 1;
  readonly reactionId: ReactionId;
  readonly conversationId: CanonicalConversationId;
  readonly observedMailboxRevision: number;
  readonly observedThroughSequence: number;
  readonly observedSubjectAuthorityRevision: number;
  readonly state:
    "OPEN" | "SUPERSEDED" | "DECIDED" | "DELIBERATED_SILENT" | "REPLIED" | "FAILED";
  readonly ownerWorkItemId: WorkItemId;
  readonly ownerActivityRef: { readonly schemaVersion: 1; readonly activityId: string };
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
  readonly lineageContextRef: LineageContextRef;
}

/** Immutable accepted primary decision and its generation provenance. */
export interface DecisionCommit {
  readonly schemaVersion: 1;
  readonly decisionCommitId: DecisionCommitId;
  readonly reactionId: ReactionId;
  readonly subjectId: SubjectId;
  readonly subjectAuthorityRevision: number;
  readonly mailboxRevision: number;
  readonly decisionKind: "REPLY" | "SILENCE";
  readonly behaviorIntent: BehaviorIntent;
  readonly behaviorIntentDigest: string;
  readonly primaryInvocationId: string;
  readonly primaryModelBindingId: string;
  readonly primaryBindingRevision: number;
  readonly primaryModelProfileId: string;
  readonly primaryModelProfileGeneration: number;
  readonly primaryGatewayProfileId: string;
  readonly primaryConfigurationRevisionId: string;
  readonly primaryProtocol: "openai-chat" | "openai-responses";
  readonly committedAt: Instant;
  readonly lineageContextRef: LineageContextRef;
}

/** Immutable current reply authorization derived from one REPLY DecisionCommit. */
export interface CommunicationCommit {
  readonly schemaVersion: 1;
  readonly communicationCommitId: CommunicationCommitId;
  readonly decisionCommitId: DecisionCommitId;
  readonly conversationId: CanonicalConversationId;
  readonly subjectAuthorityRevision: number;
  readonly purpose: string;
  readonly semanticContent: { readonly schemaVersion: 1; readonly text: string };
  readonly semanticContentDigest: string;
  readonly createdAt: Instant;
  readonly lineageContextRef: LineageContextRef;
}

/** Ephemeral prepared Subject work attached atomically to one accepted message. */
export interface PreparedSubjectInbound {
  readonly subjectId: SubjectId;
  readonly authorityRevision: number;
  readonly work: PreparedWorkCreation;
}

/** Readiness facts supplied by ProductHost's current system owners. */
export interface SubjectDependencyReadiness {
  readonly usable: boolean;
  readonly blockers: readonly SubjectBlocker[];
}

/** Input for normal Management Subject desired-state actions. */
export interface SubjectStateActionInput {
  readonly subjectId: SubjectId | string;
  readonly expectedAuthorityRevision: number;
}

/** Bounded result returned by the Reaction WorkHandler. */
export interface SubjectReactionOutcome {
  readonly accepted: true;
  readonly status: "NOOP" | "SUPERSEDED" | "SILENCE" | "REPLIED";
}

/** Current Subject service surface consumed by ProductHost and Management. */
export interface SubjectService {
  /** Ensures the one persistent Subject authority exists. */
  ensureCurrent(): Promise<SubjectAuthorityRecord>;
  /** Reads the durable Subject authority record. */
  getAuthority(): Promise<SubjectAuthorityRecord>;
  /** Reads the current Subject status projection. */
  getStatus(): Promise<SubjectStatus>;
  /** Commits desired RUNNING state under an authority revision fence. */
  start(input: SubjectStateActionInput): Promise<SubjectStatus>;
  /** Commits desired STOPPED state under an authority revision fence. */
  stop(input: SubjectStateActionInput): Promise<SubjectStatus>;
  /** Prepares a Reaction WorkItem for one accepted inbound fact. */
  prepareAcceptedInbound(input: {
    readonly conversationId: CanonicalConversationId;
    readonly acceptedMessageId: CanonicalMessageId;
  }): Promise<PreparedSubjectInbound>;
  /** Commits mailbox advancement and the prepared Reaction WorkItem atomically. */
  commitAcceptedInbound(
    transaction: PersistenceMutationTransactionContext,
    input: {
      readonly message: MessageFact;
      readonly preparation: PreparedSubjectInbound;
    },
  ): Promise<void>;
  /** Executes one generation-pinned Reaction work item. */
  executeReaction(input: {
    readonly workItemId: WorkItemId;
    readonly payload: unknown;
  }): Promise<SubjectReactionOutcome>;
  /** Creates the Subject-specific WorkItem failure classifier. */
  createWorkErrorClassifier(): WorkErrorClassifier;
  /** Describes the current Subject Reaction contribution. */
  readonly reactionDescriptor: WorkHandlerProvisionDescriptor;
  /** Exposes the current Subject Reaction handler implementation. */
  readonly reactionHandler: RuntimeWorkHandler;
}

/** Composition dependencies for the Subject owner. */
export interface SubjectServiceOptions {
  /** Current Installation identity. */
  readonly installationId: InstallationId;
  /** Host-fenced canonical persistence owner. */
  readonly persistence: PersistenceService;
  /** Current Activity and lineage context owner. */
  readonly execution: ExecutionContextRuntime;
  /** Retained Activity and causation owner. */
  readonly lineage: ExecutionLineageService;
  /** Required retained evidence owner. */
  readonly evidence: EvidenceService;
  /** Current time owner. */
  readonly time: TimeService;
  /** Canonical Messaging semantic owner. */
  readonly messaging: MessagingService;
  /** Narrow WorkQueue creation seam. */
  readonly workQueue: Pick<WorkQueueService, "prepareCreate" | "commitPrepared">;
  /** AIRuntime invocation and commit-fence owner. */
  readonly aiRuntime: AIRuntimeService;
  /** Current hard prerequisite projection supplied by ProductHost. */
  readonly getHardPrerequisites: () => Promise<SubjectDependencyReadiness>;
  /** Generation-pinned target for the Subject Reaction handler. */
  readonly reactionTarget: WorkHandlerTarget;
}

/** Options for registering the Subject-owned Reaction handler in RuntimeKernel. */
export interface SubjectReactionDefinitionOptions {
  readonly productGenerationId: ProductGenerationId;
  readonly packageGenerationId: PackageGenerationId;
  readonly service: SubjectService;
}
