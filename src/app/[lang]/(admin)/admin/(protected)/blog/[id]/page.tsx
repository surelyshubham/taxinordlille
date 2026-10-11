import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { adminLabels } from "@/lib/admin/labels";
import { getAllCategories, getPostById } from "@/lib/blog/queries";
import { getUploadProvider } from "@/lib/media";

import { PostEditor } from "../post-editor";

export const metadata = { title: adminLabels.blog.editPost };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, categories] = await Promise.all([
    getPostById(id).catch(() => null),
    getAllCategories(),
  ]);

  if (!post) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 text-sm text-content-muted transition-colors hover:text-gold-200"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {adminLabels.blog.heading}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">{adminLabels.blog.editPost}</h1>
        <Link
          href={`/admin/blog/${post.id}/apercu`}
          target="_blank"
          className="text-sm text-gold-300 hover:text-gold-200"
        >
          {adminLabels.blog.preview} →
        </Link>
      </div>

      <PostEditor
        uploadAvailable={getUploadProvider() !== "none"}
        categories={categories}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          language: post.language,
          categoryId: post.categoryId ?? "",
          tags: post.tags ?? [],
          coverImageUrl: post.coverImageUrl ?? "",
          coverImageAlt: post.coverImageAlt ?? "",
          coverImageWidth: post.coverImageWidth,
          coverImageHeight: post.coverImageHeight,
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          authorName: post.authorName ?? "",
          status: post.status,
        }}
      />
    </div>
  );
}