import type { Transaction } from "kysely";
import type {
  PersistenceExecutionMetadata,
  PersistenceMutationTransactionContext,
  PersistenceReadTransactionContext,
  PersistenceTransactionContext,
} from "./contracts.js";
import { persistenceTransactionContextInvalidProblem } from "./problems.js";

type InternalDatabase = Record<string, Record<string, unknown>>;
export type PersistenceInternalTransaction = Transaction<InternalDatabase>;

const transactions = new WeakMap<
  PersistenceTransactionContext,
  PersistenceInternalTransaction
>();

export function issueTransactionContext(
  mode: "READ",
  transaction: PersistenceInternalTransaction,
  execution?: PersistenceExecutionMetadata,
): PersistenceReadTransactionContext;
export function issueTransactionContext(
  mode: "MUTATION",
  transaction: PersistenceInternalTransaction,
  execution: PersistenceExecutionMetadata,
): PersistenceMutationTransactionContext;
export function issueTransactionContext(
  mode: "READ" | "MUTATION",
  transaction: PersistenceInternalTransaction,
  execution?: PersistenceExecutionMetadata,
): PersistenceTransactionContext {
  const context = Object.freeze({
    mode,
    ...(execution ? { execution } : {}),
  }) as PersistenceTransactionContext;
  transactions.set(context, transaction);
  return context;
}

export function resolveTransactionContext(
  context: unknown,
): PersistenceInternalTransaction {
  if (typeof context !== "object" || context === null) {
    throw persistenceTransactionContextInvalidProblem();
  }
  const transaction = transactions.get(context as PersistenceTransactionContext);
  if (transaction === undefined) {
    throw persistenceTransactionContextInvalidProblem();
  }
  return transaction;
}

export function releaseTransactionContext(
  context: PersistenceTransactionContext,
): void {
  transactions.delete(context);
}
