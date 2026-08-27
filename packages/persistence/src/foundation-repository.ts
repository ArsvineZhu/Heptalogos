import type {
  PersistenceMutationTransactionContext,
  PersistenceReadTransactionContext,
} from "./contracts.js";
import {
  resolveTransactionContext,
  type PersistenceInternalTransaction,
} from "./transaction-context.js";
import { CompiledQuery } from "kysely";
import { persistenceTransactionContextInvalidProblem } from "./problems.js";

export type { PersistenceInternalTransaction } from "./transaction-context.js";

export async function executeFoundationSql<Row = Record<string, unknown>>(
  transaction: PersistenceInternalTransaction,
  text: string,
  parameters: readonly unknown[] = [],
): Promise<readonly Row[]> {
  const result = await transaction.executeQuery<Row>(
    CompiledQuery.raw(text, [...parameters]),
  );
  return result.rows;
}

export async function useFoundationReadTransaction<T>(
  context: PersistenceReadTransactionContext,
  operation: (transaction: PersistenceInternalTransaction) => Promise<T>,
): Promise<T> {
  if (context.mode !== "READ") {
    throw persistenceTransactionContextInvalidProblem();
  }
  return operation(resolveTransactionContext(context));
}

export async function useFoundationMutationTransaction<T>(
  context: PersistenceMutationTransactionContext,
  operation: (transaction: PersistenceInternalTransaction) => Promise<T>,
): Promise<T> {
  if (context.mode !== "MUTATION") {
    throw persistenceTransactionContextInvalidProblem();
  }
  return operation(resolveTransactionContext(context));
}
