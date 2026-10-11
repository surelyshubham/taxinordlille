import "server-only";

import { createHash } from "node:crypto";

/**
 * Server-side image uploads for blog covers and inline figures.
 *
 * Two providers are supported and selected purely by environment variables.
 * When neither is configured the admin panel shows an honest "not configured"
 * state and the owner can still paste an external image URL — the CMS never
 * pretends an upload happened.
 *
 * Credentials stay on the server; nothing is exposed to the browser bundle.
 */

export type UploadProvider = "cloudinary" | "vercel-blob" | "none";

export type UploadResult =
  | { ok: true; url: string; width?: number; height?: number }
  | { ok: false; reason: string };

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

export function getUploadProvider(): UploadProvider {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return "cloudinary";
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  return "none";
}

/**
 * Reject anything that is not a plausible image before it reaches a provider.
 * SVG is allowed because the owner may legitimately upload vector artwork, but
 * it is rendered through `next/image`, which serves it as a file rather than
 * inlining it into a page.
 */
function validate(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Format non pris en charge. Utilisez JPG, PNG, WebP, AVIF, GIF ou SVG.";
  }
  if (file.size > MAX_BYTES) {
    return "Fichier trop volumineux (5 Mo maximum).";
  }
  if (file.size === 0) return "Fichier vide.";

  // Filename is used only as a hint; strip anything path-like.
  if (/[\\/]|\.\./.test(file.name)) return "Nom de fichier invalide.";
  return null;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const invalid = validate(file);
  if (invalid) return { ok: false, reason: invalid };

  const provider = getUploadProvider();
  if (provider === "none") {
    return {
      ok: false,
      reason:
        "Aucun stockage d'images n'est configuré. Renseignez CLOUDINARY_* ou BLOB_READ_WRITE_TOKEN, ou collez une URL d'image externe.",
    };
  }

  try {
    return provider === "cloudinary"
      ? await uploadToCloudinary(file)
      : await uploadToVercelBlob(file);
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? `Échec du téléversement : ${error.message}`
          : "Échec du téléversement.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Cloudinary                                                                  */
/* -------------------------------------------------------------------------- */

async function uploadToCloudinary(file: File): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary verifies a SHA-1 over the sorted signed parameters.
  const signature = createHash("sha1")
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const body = new FormData();
  body.set("file", file);
  body.set("api_key", apiKey);
  body.set("timestamp", String(timestamp));
  body.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body, signal: AbortSignal.timeout(30_000) },
  );

  if (!response.ok) {
    return { ok: false, reason: `Cloudinary a répondu ${response.status}.` };
  }

  const payload = (await response.json()) as {
    secure_url?: string;
    width?: number;
    height?: number;
  };

  if (!payload.secure_url) {
    return { ok: false, reason: "Réponse Cloudinary inattendue." };
  }

  return {
    ok: true,
    url: payload.secure_url,
    width: payload.width,
    height: payload.height,
  };
}

/* -------------------------------------------------------------------------- */
/* Vercel Blob                                                                 */
/* -------------------------------------------------------------------------- */

async function uploadToVercelBlob(file: File): Promise<UploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN!;

  const extension = (file.name.split(".").pop() ?? "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);
  const pathname = `blog/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const response = await fetch(
    `https://blob.vercel-storage.com/${pathname}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-content-type": file.type || "application/octet-stream",
      },
      body: await file.arrayBuffer(),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    return { ok: false, reason: `Vercel Blob a répondu ${response.status}.` };
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    return { ok: false, reason: "Réponse Vercel Blob inattendue." };
  }

  return { ok: true, url: payload.url };
}