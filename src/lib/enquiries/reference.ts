import "server-only";

import { randomInt } from "node:crypto";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { quoteRequests } from "@/lib/db/schema";

/** Unambiguous alphabet: no O/0, I/1, S/5. */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ23456789";

function randomSuffix(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

/**
 * Human-readable enquiry reference, e.g. `TNL-260311-K7QM`.
 *
 * The date prefix lets the operator see at a glance how recent an enquiry is
 * and gives the customer something short to quote on the phone. Uniqueness is
 * enforced against the database — the `unique` index on `reference` is the real
 * guarantee, and a collision simply triggers a retry.
 */
export async function generateEnquiryReference(
  attempts = 5,
): Promise<string> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const now = new Date();
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const reference = `TNL-${yy}${mm}${dd}-${randomSuffix(4)}`;

    const existing = await getDb()
      .select({ id: quoteRequests.id })
      .from(quoteRequests)
      .where(eq(quoteRequests.reference, reference))
      .limit(1);

    if (existing.length === 0) return reference;
  }

  // Vanishingly unlikely; fall back to a longer suffix rather than failing.
  return `TNL-${Date.now().toString(36).toUpperCase()}`;
}