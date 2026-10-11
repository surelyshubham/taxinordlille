"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { createSession, getClientIp, pruneSessions } from "@/lib/auth/session";
import {
  checkPasswordStrength,
  verifyPassword,
  verifyPasswordDummy,
} from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { adminActivity, adminUsers } from "@/lib/db/schema";
import { adminLabels } from "@/lib/admin/labels";
import { consumeRateLimit, resetRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
});

export type LoginResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Admin sign-in.
 *
 * There is no public registration path anywhere in the application — accounts
 * are created exclusively by the `seed:admin` script against the database.
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const ip = await getClientIp();
  const bucket = `login:${ip}`;

  const limit = await consumeRateLimit(
    bucket,
    RATE_LIMITS.login.limit,
    RATE_LIMITS.login.windowSeconds,
  );
  if (!limit.ok) {
    return { status: "error", message: adminLabels.auth.rateLimited };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: adminLabels.auth.invalid };
  }

  const email = parsed.data.email.toLowerCase();
  const rows = await getDb()
    .select({
      id: adminUsers.id,
      passwordHash: adminUsers.passwordHash,
      isActive: adminUsers.isActive,
    })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  const user = rows[0];

  if (!user) {
    // Burn comparable time so a missing account is not distinguishable.
    await verifyPasswordDummy(parsed.data.password);
    return { status: "error", message: adminLabels.auth.invalid };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!valid || !user.isActive) {
    return { status: "error", message: adminLabels.auth.invalid };
  }

  // A successful sign-in clears the throttle so a legitimate user is never
  // locked out by their own successful logins.
  await resetRateLimit(bucket);

  await createSession(user.id);
  await pruneSessions();

  await getDb()
    .update(adminUsers)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  const h = await headers();
  await getDb()
    .insert(adminActivity)
    .values({
      userId: user.id,
      action: "login",
      entityType: "admin_user",
      entityId: user.id,
      detail: h.get("user-agent")?.slice(0, 200) ?? null,
    });

  return { status: "success" };
}

/**
 * Sign out: destroys the server-side session row and clears the cookie.
 */
export async function logoutAction(): Promise<void> {
  "use server";
  const { destroySession } = await import("@/lib/auth/session");
  await destroySession();
}

/**
 * Change the administrator's own password.
 * Requires the current password, so a hijacked session alone cannot lock the
 * owner out permanently.
 */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ ok: boolean; message: string }> {
  const { requireAdminAction } = await import("@/lib/auth/session");
  const user = await requireAdminAction();

  if (newPassword !== confirmPassword) {
    return { ok: false, message: "Les mots de passe ne correspondent pas." };
  }

  const strength = checkPasswordStrength(newPassword);
  if (!strength.ok) {
    return { ok: false, message: strength.message ?? "Mot de passe trop faible." };
  }

  const rows = await getDb()
    .select({ passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.id, user.id))
    .limit(1);

  const current = rows[0];
  if (!current) return { ok: false, message: "Compte introuvable." };

  if (!(await verifyPassword(currentPassword, current.passwordHash))) {
    return { ok: false, message: "Mot de passe actuel incorrect." };
  }

  const { hashPassword } = await import("@/lib/auth/password");
  await getDb()
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  return { ok: true, message: "Mot de passe mis à jour." };
}