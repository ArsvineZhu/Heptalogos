import { AsyncLocalStorage } from "node:async_hooks";

const suppression = new AsyncLocalStorage<boolean>();

export function runWithLineageSuppressed<T>(operation: () => T): T {
  return suppression.run(true, operation);
}

export function isLineageSuppressed(): boolean {
  return suppression.getStore() === true;
}
