import "server-only";

import { eq, lt, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  used: number;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Database-backed fixed-window rate limiting.
 *
 * Counters live in Postgres rather than in-process memory because the app runs
 * on many short-lived serverless instances that share no state. Every public
 * mutation and the admin login go through here.
 */
export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);

  const rows = await getDb()
    .insert(rateLimits)
    .values({ bucket, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.bucket, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const used = rows[0]?.count ?? 1;

  if (Math.random() < 0.02) {
    // Opportunistic cleanup (~2% of calls) keeps the table small without adding
    // a scheduled job. Windows older than 24h can never be read again.
    const staleBefore = new Date(resetAt.getTime() - 24 * 60 * 60 * 1000);
    void getDb().delete(rateLimits).where(lt(rateLimits.windowStart, staleBefore));
  }

  return {
    ok: used <= limit,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
  };
}

/** Clear a bucket — called after a successful login so regular use never locks out. */
export async function resetRateLimit(bucket: string): Promise<void> {
  await getDb().delete(rateLimits).where(eq(rateLimits.bucket, bucket));
}

/** Preset limits. Tuned to be generous to real users but hostile to scripts. */
export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  quoteRequest: { limit: 6, windowSeconds: 60 * 60 },
  contactMessage: { limit: 6, windowSeconds: 60 * 60 },
  imageUpload: { limit: 30, windowSeconds: 60 * 60 },
} as const;