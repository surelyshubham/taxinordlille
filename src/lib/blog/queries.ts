import "server-only";

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  blogCategories,
  blogPosts,
  type BlogCategory,
  type BlogPost,
} from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";

export type PostWithCategory = BlogPost & { category: BlogCategory | null };

/** Only rows that are published *and* whose date has actually arrived. */
const publicFilter = and(
  eq(blogPosts.status, "publie"),
  sql`${blogPosts.publishedAt} is not null`,
  sql`${blogPosts.publishedAt} <= now()`,
);

export type PostSummary = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "coverImageUrl"
  | "coverImageAlt"
  | "coverImageWidth"
  | "coverImageHeight"
  | "publishedAt"
  | "tags"
> & {
  categoryName: string | null;
  categorySlug: string | null;
};

/**
 * Published posts for a language.
 *
 * If the requested language has no published posts yet we fall back to French
 * rather than showing an empty page — the French content is still useful to an
 * English-speaking visitor, and an empty blog reads as a broken site.
 */
export async function getPublishedPosts(
  locale: Locale,
  options: { limit?: number; offset?: number; categorySlug?: string } = {},
): Promise<{ posts: PostSummary[]; total: number; usedFallback: boolean }> {
  const { limit = 12, offset = 0, categorySlug } = options;

  const build = (language: Locale) =>
    and(
      publicFilter,
      eq(blogPosts.language, language),
      categorySlug
        ? sql`${blogPosts.categoryId} = (select id from ${blogCategories} where ${blogCategories.slug} = ${categorySlug})`
        : undefined,
    );

  let language: Locale = locale;
  let where = build(language);

  const firstCount = await getDb()
    .select({ value: count() })
    .from(blogPosts)
    .where(where);

  if (firstCount[0]?.value === 0 && locale !== "fr") {
    language = "fr";
    where = build("fr");
  }

  const [totalRows, rows] = await Promise.all([
    getDb().select({ value: count() }).from(blogPosts).where(where),
    getDb()
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        coverImageUrl: blogPosts.coverImageUrl,
        coverImageAlt: blogPosts.coverImageAlt,
        coverImageWidth: blogPosts.coverImageWidth,
        coverImageHeight: blogPosts.coverImageHeight,
        publishedAt: blogPosts.publishedAt,
        tags: blogPosts.tags,
        categoryNameFr: blogCategories.nameFr,
        categoryNameEn: blogCategories.nameEn,
        categorySlug: blogCategories.slug,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(where)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  return {
    posts: rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      coverImageUrl: row.coverImageUrl,
      coverImageAlt: row.coverImageAlt,
      coverImageWidth: row.coverImageWidth,
      coverImageHeight: row.coverImageHeight,
      publishedAt: row.publishedAt,
      tags: row.tags,
      categorySlug: row.categorySlug,
      // Category names are translated; fall back to French if one is missing.
      categoryName:
        language === "fr"
          ? row.categoryNameFr
          : (row.categoryNameEn ?? row.categoryNameFr),
    })),
    total: totalRows[0]?.value ?? 0,
    usedFallback: language !== locale,
  };
}

/**
 * Fetch a single published post by slug.
 * Returns null for drafts, so an unpublished article 404s on the public site
 * instead of leaking its content.
 */
export async function getPublishedPostBySlug(
  slug: string,
): Promise<PostWithCategory | null> {
  const rows = await getDb()
    .select({ post: blogPosts, category: blogCategories })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(and(eq(blogPosts.slug, slug), publicFilter))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return { ...row.post, category: row.category };
}

/** Other published posts, preferring ones sharing a category or tag. */
export async function getRelatedPosts(
  post: Pick<BlogPost, "id" | "categoryId" | "tags" | "language">,
  limit = 3,
): Promise<PostSummary[]> {
  const rows = await getDb()
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      coverImageAlt: blogPosts.coverImageAlt,
      coverImageWidth: blogPosts.coverImageWidth,
      coverImageHeight: blogPosts.coverImageHeight,
      publishedAt: blogPosts.publishedAt,
      tags: blogPosts.tags,
      categoryNameFr: blogCategories.nameFr,
      categoryNameEn: blogCategories.nameEn,
      categorySlug: blogCategories.slug,
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(and(publicFilter, sql`${blogPosts.id} <> ${post.id}`))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit * 3);

  // Rank in memory: same category beats a shared tag beats recency.
  const tags = new Set(post.tags ?? []);
  return rows
    .map((row) => {
      let score = 0;
      if (post.categoryId && row.categorySlug) score += 2;
      if (row.tags.some((tag) => tags.has(tag))) score += 1;
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        coverImageUrl: row.coverImageUrl,
        coverImageAlt: row.coverImageAlt,
        coverImageWidth: row.coverImageWidth,
        coverImageHeight: row.coverImageHeight,
        publishedAt: row.publishedAt,
        tags: row.tags,
        categorySlug: row.categorySlug,
        categoryName: post.language === "fr" ? row.categoryNameFr : (row.categoryNameEn ?? row.categoryNameFr),
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function getCategoriesWithCounts(): Promise<
  { slug: string; name: string; count: number }[]
> {
  const rows = await getDb()
    .select({
      slug: blogCategories.slug,
      name: blogCategories.nameFr,
      count: count(blogPosts.id),
    })
    .from(blogCategories)
    .leftJoin(blogPosts, and(eq(blogPosts.categoryId, blogCategories.id), publicFilter))
    .groupBy(blogCategories.slug, blogCategories.nameFr)
    .orderBy(blogCategories.sortOrder);

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    count: Number(row.count),
  }));
}

/* -------------------------------------------------------------------------- */
/* Admin-side queries (no publication filter)                                  */
/* -------------------------------------------------------------------------- */

export type AdminPostRow = PostWithCategory;

/** Every post, any status — admin only. */
export async function getAllPosts(options: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ posts: AdminPostRow[]; total: number }> {
  const { search, status, limit = 25, offset = 0 } = options;

  const where = and(
    status && status !== "all" ? eq(blogPosts.status, status as never) : undefined,
    search
      ? or(
          ilike(blogPosts.title, `%${search}%`),
          ilike(blogPosts.slug, `%${search}%`),
          ilike(blogPosts.excerpt, `%${search}%`),
        )
      : undefined,
  );

  const [totalRows, rows] = await Promise.all([
    getDb().select({ value: count() }).from(blogPosts).where(where),
    getDb()
      .select({ post: blogPosts, category: blogCategories })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(where)
      .orderBy(desc(blogPosts.updatedAt))
      .limit(limit)
      .offset(offset),
  ]);

  return {
    posts: rows.map((row) => ({ ...row.post, category: row.category })),
    total: totalRows[0]?.value ?? 0,
  };
}

/** Admin lookup by id — returns drafts too. */
export async function getPostById(id: string): Promise<AdminPostRow | null> {
  const rows = await getDb()
    .select({ post: blogPosts, category: blogCategories })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(eq(blogPosts.id, id))
    .limit(1);

  const row = rows[0];
  return row ? { ...row.post, category: row.category } : null;
}

export async function slugExists(
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const rows = await getDb()
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(
      exceptId
        ? and(eq(blogPosts.slug, slug), sql`${blogPosts.id} <> ${exceptId}`)
        : eq(blogPosts.slug, slug),
    )
    .limit(1);

  return rows.length > 0;
}

export async function getAllCategories(): Promise<BlogCategory[]> {
  return getDb()
    .select()
    .from(blogCategories)
    .orderBy(blogCategories.sortOrder, blogCategories.nameFr);
}

/**
 * Slugs for the XML sitemap. Failures are swallowed on purpose: a sitemap must
 * never be the reason a build or a crawl fails.
 */
export async function getPublishedSlugsForSitemap(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  try {
    return await getDb()
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(publicFilter)
      .orderBy(desc(blogPosts.publishedAt));
  } catch (error) {
    console.warn("[sitemap] could not read published posts:", error);
    return [];
  }
}