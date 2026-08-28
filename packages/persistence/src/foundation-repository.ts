/**
 * Provides the restricted Foundation repository seam over persistence
 * transactions so domain owners cannot bypass the Host fence with direct SQL.
 * @module foundation-repository
 */

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

/** Executes raw SQL only through the restricted Foundation transaction seam. */
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

/** Runs a Foundation read operation after validating its transaction mode. */
export async function useFoundationReadTransaction<T>(
  context: PersistenceReadTransactionContext,
  operation: (transaction: PersistenceInternalTransaction) => Promise<T>,
): Promise<T> {
  if (context.mode !== "READ") {
    throw persistenceTransactionContextInvalidProblem();
  }
  return operation(resolveTransactionContext(context));
}

/** Runs a Foundation mutation operation after validating its transaction mode. */
export async function useFoundationMutationTransaction<T>(
  context: PersistenceMutationTransactionContext,
  operation: (transaction: PersistenceInternalTransaction) => Promise<T>,
): Promise<T> {
  if (context.mode !== "MUTATION") {
    throw persistenceTransactionContextInvalidProblem();
  }
  return operation(resolveTransactionContext(context));
}
