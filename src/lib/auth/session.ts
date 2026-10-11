import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { adminSessions, adminUsers, type AdminUser } from "@/lib/db/schema";

export const SESSION_COOKIE = "tnl_session";

/** Absolute session lifetime. */
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
/** Refresh the expiry once fewer than this many seconds remain. */
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 6; // 6 hours

export type SessionUser = Pick<AdminUser, "id" | "email" | "fullName" | "role">;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Best-effort client IP, used only for rate-limiting and audit records. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() ?? "unknown";
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Create a session and set the cookie. Returns the raw token (never stored). */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const h = await headers();
  const userAgent = h.get("user-agent")?.slice(0, 300) ?? null;
  const ip = await getClientIp();

  await getDb().insert(adminSessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent,
    ip,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));

  return token;
}

/** Delete the current session server-side and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await getDb()
      .delete(adminSessions)
      .where(eq(adminSessions.tokenHash, hashToken(token)));
  }

  store.delete(SESSION_COOKIE);
}

/** Remove expired and orphaned sessions. Safe to call opportunistically. */
export async function pruneSessions(): Promise<void> {
  await getDb().delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
}

/**
 * Resolve the signed-in administrator from the session cookie.
 *
 * Returns null when there is no valid, unexpired session or the owning
 * account has since been deactivated. Every admin page and every Server Action
 * calls this — nothing relies on the UI simply not rendering the link.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await getDb()
    .select({
      sessionId: adminSessions.id,
      expiresAt: adminSessions.expiresAt,
      id: adminUsers.id,
      email: adminUsers.email,
      fullName: adminUsers.fullName,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.tokenHash, hashToken(token)),
        gt(adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const session = row[0];
  if (!session || !session.isActive) return null;

  // Sliding expiry: only write when we are past the halfway mark.
  const remaining = session.expiresAt.getTime() - Date.now();
  if (remaining < SESSION_REFRESH_THRESHOLD * 1000) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
    await getDb()
      .update(adminSessions)
      .set({ expiresAt, lastUsedAt: new Date() })
      .where(eq(adminSessions.id, session.sessionId));
    (await cookies()).set(
      SESSION_COOKIE,
      token,
      cookieOptions(SESSION_TTL_SECONDS),
    );
  }

  return {
    id: session.id,
    email: session.email,
    fullName: session.fullName,
    role: session.role,
  };
}

/**
 * Require an administrator for a page. Redirects to the login screen when
 * unauthenticated.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/connexion");
  return user;
}

/**
 * Require an administrator inside a Server Action or Route Handler.
 * Throws rather than redirecting so it can never be swallowed as a normal
 * control-flow redirect on a mutation endpoint.
 */
export async function requireAdminAction(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORISED");
  }
  return user;
}