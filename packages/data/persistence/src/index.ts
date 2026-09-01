/**
 * Public Host-fenced persistence contracts and service construction; database
 * driver and transaction adapter mechanics remain behind the package root.
 * @packageDocumentation
 */

export type {
  PersistenceRuntimeOptions,
  PersistenceExecutionContextProvider,
  PersistenceExecutionMetadata,
  PersistenceMutationTransactionContext,
  PersistenceReadTransactionContext,
  PersistenceService,
  PersistenceServiceState,
  PersistenceTransactionContext,
  PersistenceTransactionMode,
} from "./contracts.js";
export { createPersistenceService } from "./persistence-service.js";
