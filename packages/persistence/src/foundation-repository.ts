import type { PersistenceMutationTransactionContext } from "./contracts.js";
import {
  resolveTransactionContext,
  type PersistenceInternalTransaction,
} from "./transaction-context.js";
import { persistenceTransactionContextInvalidProblem } from "./problems.js";

export async function useFoundationMutationTransaction<T>(
  context: PersistenceMutationTransactionContext,
  operation: (transaction: PersistenceInternalTransaction) => Promise<T>,
): Promise<T> {
  if (context.mode !== "MUTATION") {
    throw persistenceTransactionContextInvalidProblem();
  }
  return operation(resolveTransactionContext(context));
}
