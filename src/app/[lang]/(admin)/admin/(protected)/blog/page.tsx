import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { getAllPosts } from "@/lib/blog/queries";
import { adminLabels } from "@/lib/admin/labels";
import { formatDateTime } from "@/lib/utils";

import { PostStatusControl } from "./post-status-control";

export const metadata: Metadata = { title: adminLabels.blog.heading };

const STATUS_TONES: Record<string, "gold" | "success" | "neutral"> = {
  brouillon: "neutral",
  publie: "success",
  archive: "neutral",
};

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const one = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };

  const search = one("q");
  const status = one("status") || "all";

  const { posts, total } = await getAllPosts({ search, status, limit: 100 });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">{adminLabels.blog.heading}</h1>
          <p className="mt-2 text-sm text-content-muted">
            {total} article{total > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/blog/nouveau"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gold-400 px-5 text-[0.95rem] font-semibold text-canvas transition-colors hover:bg-gold-300"
        >
          <Plus aria-hidden="true" className="size-[1.05rem]" />
          {adminLabels.blog.newPost}
        </Link>
      </header>

      <form className="surface-card rounded-2xl p-5" action="/admin/blog">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-content-subtle"
            />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder={adminLabels.blog.searchPlaceholder}
              aria-label={adminLabels.blog.search}
              className="h-12 w-full rounded-xl border border-line-strong bg-surface-2/70 pl-11 pr-4 text-[0.95rem] text-content placeholder:text-content-subtle focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/25"
            />
          </div>

          <select
            name="status"
            defaultValue={status}
            aria-label={adminLabels.blog.allStatuses}
            className="h-12 rounded-xl border border-line-strong bg-surface-2/70 px-4 text-[0.95rem] text-content focus:border-gold-400 focus:outline-none"
          >
            <option value="all">{adminLabels.blog.allStatuses}</option>
            <option value="brouillon">{adminLabels.blog.statuses.brouillon}</option>
            <option value="publie">{adminLabels.blog.statuses.publie}</option>
            <option value="archive">{adminLabels.blog.statuses.archive}</option>
          </select>

          <button
            type="submit"
            className="h-12 rounded-xl border border-line-strong px-5 text-sm text-content transition-colors hover:border-gold-600 hover:text-gold-200"
          >
            {adminLabels.blog.search}
          </button>
        </div>
      </form>

      {posts.length === 0 ? (
        <EmptyState
          icon={<FileText aria-hidden="true" className="size-8" />}
          title={adminLabels.blog.empty}
          description={adminLabels.blog.emptyHint}
          action={
            <Link
              href="/admin/blog/nouveau"
              className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-gold-300"
            >
              <Plus aria-hidden="true" className="size-4" />
              {adminLabels.blog.newPost}
            </Link>
          }
        />
      ) : (
        <div className="surface-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong text-xs uppercase tracking-wider text-content-subtle">
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.blog.title}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.blog.slug}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.blog.status}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.blog.updatedAt}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {posts.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-surface-2/60">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-content hover:text-gold-200"
                      >
                        {post.title}
                      </Link>
                      <span className="mt-1 block text-xs text-content-subtle">
                        {post.category
                          ? post.category.nameFr
                          : adminLabels.blog.noCategory}
                        {post.language === "en" ? " · EN" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-content-muted">
                      {post.slug}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONES[post.status] ?? "neutral"}>
                        {adminLabels.blog.statuses[
                          post.status as "brouillon" | "publie" | "archive"
                        ]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-content-subtle">
                      {formatDateTime(post.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <PostStatusControl
                        postId={post.id}
                        status={post.status}
                        slug={post.slug}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}