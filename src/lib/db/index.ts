import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

/**
 * Neon is reached over its serverless driver.
 *
 * The pool is created lazily rather than at module load. That matters because
 * build-time route metadata collection (robots, sitemap) imports modules that
 * transitively reference the database; throwing on a missing `DATABASE_URL`
 * at import time would fail the build with a confusing stack instead of a
 * clear "database unreachable" at request time.
 */
const globalForDb = globalThis as unknown as {
  neonPool?: Pool;
};

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | undefined;

export function getDb(): Database {
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }

  const pool =
    globalForDb.neonPool ??
    new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.neonPool = pool;
  }

  cached = drizzle({ client: pool, schema, casing: "snake_case" });
  return cached;
}

/** The shared pool, for callers that need to close it (scripts, tests). */
export function getPool(): Pool {
  getDb();
  if (!globalForDb.neonPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set.");
    }
    globalForDb.neonPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalForDb.neonPool;
}

export type { Database };
export { schema };