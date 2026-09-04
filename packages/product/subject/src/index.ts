/** Public current Subject authority, reaction contracts, and service.
 * @packageDocumentation
 */

export {
  SUBJECT_CHAT_PLATFORM,
  SUBJECT_REACTION_CONTRIBUTION_ID,
  SUBJECT_REACTION_QUEUE_PROFILE_ID,
  SUBJECT_REACTION_RESOURCE_CLASS,
  SUBJECT_SYSTEM_ID,
} from "./contracts.js";
export {
  conversationReactionProposalSchema,
  expressionOutputSchema,
  createSubjectReactionDefinition,
  createSubjectService,
} from "./service.js";
export type {
  CommunicationCommit,
  ConversationReactionProposal,
  ConversationSemanticContent,
  PreparedSubjectInbound,
  Reaction,
  SubjectAuthorityRecord,
  SubjectBlocker,
  SubjectDependencyReadiness,
  SubjectReactionDefinitionOptions,
  SubjectReactionOutcome,
  SubjectService,
  SubjectServiceOptions,
  SubjectStateActionInput,
  SubjectStatus,
} from "./contracts.js";
export { subjectProblem } from "./problems.js";
