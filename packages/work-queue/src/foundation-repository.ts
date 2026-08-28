/**
 * Exposes the restricted Foundation repository factory for WorkItem persistence;
 * general callers must use the WorkQueue package's service boundary instead.
 * @module foundation-repository
 */

export { createWorkQueueRepository } from "./repository.js";
