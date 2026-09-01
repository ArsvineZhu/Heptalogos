/**
 * Centralizes numeric bounds shared with PostgreSQL-backed contracts so range
 * policy is named once rather than hidden in individual adapters.
 * @module numeric
 */

/** The inclusive upper bound of a PostgreSQL `integer` value. */
export const POSTGRES_INTEGER_MAX = 2_147_483_647;
