"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminAction } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { adminActivity, blogCategories, blogPosts } from "@/lib/db/schema";
import { slugExists } from "@/lib/blog/queries";
import {
  htmlToText,
  injectHeadingIds,
  makeExcerpt,
  sanitizeArticleHtml,
} from "@/lib/sanitize";
import { slugify } from "@/lib/utils";
import { adminLabels } from "@/lib/admin/labels";

const STATUSES = ["brouillon", "publie", "archive"] as const;
type Status = (typeof STATUSES)[number];

/**
 * Blog post form schema.
 *
 * The article body is sanitised here — the allow-list is enforced on write as
 * well as on render, so a stored post is already safe.
 */
const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, adminLabels.blog.titleRequired).max(200),
  slug: z.string().trim().max(120, ""),
  excerpt: z.string().trim().max(400, ""),
  content: z.string().min(1, adminLabels.blog.contentRequired),
  language: z.enum(["fr", "en"]),
  categoryId: z.string().optional(),
  tags: z.string().trim().max(400, ""),
  coverImageUrl: z.union([z.url(), z.literal("")]).optional(),
  coverImageAlt: z.string().trim().max(250, ""),
  coverImageWidth: z.coerce.number().int().positive().optional(),
  coverImageHeight: z.coerce.number().int().positive().optional(),
  seoTitle: z.string().trim().max(80, ""),
  seoDescription: z.string().trim().max(200, ""),
  authorName: z.string().trim().max(120, ""),
  status: z.enum(STATUSES),
  /** `true` re-stamps `publishedAt` on the next save. */
  publishNow: z.boolean().default(false),
});

export type PostFormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  postId?: string;
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseForm(formData: FormData) {
  const raw = {
    id: text(formData, "id") || undefined,
    title: text(formData, "title"),
    // Fall back to a slug derived from the title when the field is blank.
    slug: text(formData, "slug") || slugify(text(formData, "title")),
    excerpt: text(formData, "excerpt"),
    content: text(formData, "content"),
    language: (text(formData, "language") || "fr") as "fr" | "en",
    categoryId: text(formData, "categoryId") || undefined,
    tags: text(formData, "tags"),
    coverImageUrl: text(formData, "coverImageUrl"),
    coverImageAlt: text(formData, "coverImageAlt"),
    coverImageWidth: text(formData, "coverImageWidth") || undefined,
    coverImageHeight: text(formData, "coverImageHeight") || undefined,
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    authorName: text(formData, "authorName"),
    status: (text(formData, "status") || "brouillon") as Status,
    publishNow: text(formData, "publishNow") === "true",
  };

  return { raw, parsed: postSchema.safeParse(raw) };
}

/** Create or update a post. */
export async function savePostAction(
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireAdminAction();
  const { parsed } = parseForm(formData);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message || adminLabels.common.error;
      }
    }
    return { status: "error", message: adminLabels.common.error, fieldErrors };
  }

  const values = parsed.data;

  // Slug must be unique; the database index is the real guarantee.
  const slug = slugify(values.slug || values.title);
  if (!slug) {
    return {
      status: "error",
      message: adminLabels.blog.titleRequired,
      fieldErrors: { slug: adminLabels.blog.slugError },
    };
  }

  if (await slugExists(slug, values.id)) {
    return {
      status: "error",
      message: adminLabels.blog.slugError,
      fieldErrors: { slug: adminLabels.blog.slugError },
    };
  }

  // Sanitise, then anchor every heading so the table of contents matches.
  const sanitised = injectHeadingIds(sanitizeArticleHtml(values.content));
  const plain = htmlToText(sanitised);
  if (!plain) {
    return {
      status: "error",
      message: adminLabels.blog.contentRequired,
      fieldErrors: { content: adminLabels.blog.contentRequired },
    };
  }

  const excerpt =
    values.excerpt || makeExcerpt(sanitised, 180);

  const row = {
    title: values.title,
    slug,
    excerpt,
    content: sanitised,
    language: values.language,
    status: values.status,
    coverImageUrl: values.coverImageUrl || null,
    coverImageAlt: values.coverImageAlt || null,
    coverImageWidth: values.coverImageWidth ?? null,
    coverImageHeight: values.coverImageHeight ?? null,
    categoryId: values.categoryId || null,
    tags: values.tags
      ? Array.from(
          new Set(
            values.tags
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
              .filter(Boolean),
          ),
        )
      : [],
    seoTitle: values.seoTitle || null,
    seoDescription: values.seoDescription || null,
    authorName: values.authorName || null,
    updatedAt: new Date(),
  };

  let postId = values.id;

  if (values.id) {
    const existing = await getDb()
      .select({ id: blogPosts.id, publishedAt: blogPosts.publishedAt })
      .from(blogPosts)
      .where(eq(blogPosts.id, values.id))
      .limit(1);

    const current = existing[0];
    if (!current) {
      return { status: "error", message: "Article introuvable." };
    }

    // Going live stamps the publication date; unpublishing keeps it for history.
    const publishedAt =
      values.status === "publie"
        ? values.publishNow || !current.publishedAt
          ? new Date()
          : current.publishedAt
        : current.publishedAt;

    await getDb()
      .update(blogPosts)
      .set({ ...row, publishedAt })
      .where(eq(blogPosts.id, values.id));
  } else {
    const [created] = await getDb()
      .insert(blogPosts)
      .values({
        ...row,
        publishedAt: values.status === "publie" ? new Date() : null,
      })
      .returning({ id: blogPosts.id });

    postId = created?.id;
  }

  await getDb()
    .insert(adminActivity)
    .values({
      userId: user.id,
      action: values.id ? "post_update" : "post_create",
      entityType: "blog_post",
      entityId: postId ?? null,
      detail: values.status,
    });

  // The public blog reads directly from the database on every request, so a
  // re-render is enough; this additionally clears any route cache.
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");

  return { status: "saved", postId, message: adminLabels.blog.saved };
}

/** Quick status toggle from the list view. */
export async function setPostStatusAction(
  id: string,
  status: string,
): Promise<{ ok: boolean }> {
  await requireAdminAction();

  if (!STATUSES.includes(status as Status)) return { ok: false };

  const existing = await getDb()
    .select({ publishedAt: blogPosts.publishedAt })
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  const current = existing[0];
  if (!current) return { ok: false };

  await getDb()
    .update(blogPosts)
    .set({
      status: status as Status,
      publishedAt:
        status === "publie"
          ? current.publishedAt ?? new Date()
          : current.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");

  return { ok: true };
}

export async function deletePostAction(id: string): Promise<{ ok: boolean }> {
  await requireAdminAction();

  await getDb().delete(blogPosts).where(eq(blogPosts.id, id));

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");

  return { ok: true };
}

/** Create a category from the editor. */
export async function createCategoryAction(
  nameFr: string,
  nameEn: string,
): Promise<{ ok: boolean; id?: string; message?: string }> {
  await requireAdminAction();

  const trimmed = nameFr.trim();
  if (!trimmed) return { ok: false, message: "Nom manquant." };

  const slug = slugify(trimmed);
  const existing = await getDb()
    .select({ id: blogCategories.id })
    .from(blogCategories)
    .where(eq(blogCategories.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, message: "Cette catégorie existe déjà." };
  }

  const [created] = await getDb()
    .insert(blogCategories)
    .values({
      slug,
      nameFr: trimmed,
      nameEn: nameEn.trim() || trimmed,
      sortOrder: 100,
    })
    .returning({ id: blogCategories.id });

  revalidatePath("/admin/blog");
  return { ok: true, id: created?.id };
}

export { STATUSES };