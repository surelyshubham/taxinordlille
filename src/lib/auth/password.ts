import "server-only";

import { compare, hash } from "bcryptjs";

/**
 * bcrypt cost factor. 12 is a sensible balance on modern serverless hardware —
 * roughly 250ms per hash, which is slow enough to make offline cracking costly
 * and fast enough for an interactive admin login.
 */
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  try {
    return await compare(plain, hashed);
  } catch {
    return false;
  }
}

/**
 * Compare a candidate against a stored hash without leaking whether the user
 * exists. When no user matched, a dummy hash is still verified so the response
 * time stays roughly constant and the login form cannot be used to enumerate
 * accounts.
 */
const DUMMY_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEe.4bJPHR0G4Wf2kY7N0iFhCzHhQ0n3zYy";

export async function verifyPasswordDummy(plain: string): Promise<void> {
  await compare(plain, DUMMY_HASH);
}

/** Minimum viable admin password length. */
export function checkPasswordStrength(password: string): {
  ok: boolean;
  message?: string;
} {
  if (password.length < 12) {
    return { ok: false, message: "Le mot de passe doit contenir au moins 12 caractères." };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return { ok: false, message: "Le mot de passe doit contenir une minuscule et une majuscule." };
  }
  if (!/\d/.test(password)) {
    return { ok: false, message: "Le mot de passe doit contenir au moins un chiffre." };
  }
  return { ok: true };
}