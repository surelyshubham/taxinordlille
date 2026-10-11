"use server";

import { headers } from "next/headers";

import { requireAdminAction } from "@/lib/auth/session";
import { getUploadProvider, uploadImage } from "@/lib/media";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { adminLabels } from "@/lib/admin/labels";

/**
 * Upload an image on behalf of the editor.
 *
 * Authorised here rather than in the page: a Server Action is a public POST
 * endpoint, so it performs its own session check.
 */
export async function uploadImageAction(formData: FormData) {
  await requireAdminAction();

  const ip = headers().then(async (h) => {
    const forwarded = h.get("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() ?? "unknown";
  });

  const limit = await consumeRateLimit(
    `upload:${await ip}`,
    RATE_LIMITS.imageUpload.limit,
    RATE_LIMITS.imageUpload.windowSeconds,
  );
  if (!limit.ok) {
    return { ok: false as const, reason: "Trop de téléversements. Réessayez plus tard." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, reason: "Aucun fichier reçu." };
  }

  const result = await uploadImage(file);

  if (!result.ok) return { ok: false as const, reason: result.reason };

  return {
    ok: true as const,
    url: result.url,
    width: result.width,
    height: result.height,
  };
}

/** Tell the editor UI whether any upload provider is available. */
export async function getUploadStatus(): Promise<{
  provider: string;
  available: boolean;
  message: string;
}> {
  await requireAdminAction();
  const provider = getUploadProvider();

  if (provider === "none") {
    return {
      provider,
      available: false,
      message: adminLabels.blog.uploadFailed,
    };
  }

  return { provider, available: true, message: provider };
}