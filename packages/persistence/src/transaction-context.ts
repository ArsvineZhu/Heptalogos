import type { Transaction } from "kysely";
import type {
  PersistenceTransactionContext,
  PersistenceTransactionMode,
} from "./contracts.js";
import { persistenceTransactionContextInvalidProblem } from "./problems.js";

type InternalDatabase = Record<string, Record<string, unknown>>;
export type PersistenceInternalTransaction = Transaction<InternalDatabase>;

const transactions = new WeakMap<
  PersistenceTransactionContext,
  PersistenceInternalTransaction
>();

export function issueTransactionContext(
  mode: PersistenceTransactionMode,
  transaction: PersistenceInternalTransaction,
): PersistenceTransactionContext {
  const context = Object.freeze({ mode });
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
