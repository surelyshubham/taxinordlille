import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { adminLabels } from "@/lib/admin/labels";
import { getAllCategories } from "@/lib/blog/queries";
import { getUploadProvider } from "@/lib/media";
import { getSiteSettings } from "@/lib/settings";

import { PostEditor } from "../post-editor";

export const metadata = { title: adminLabels.blog.newPost };

export default async function NewPostPage() {
  const [categories, settings] = await Promise.all([
    getAllCategories(),
    getSiteSettings(),
  ]);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 text-sm text-content-muted transition-colors hover:text-gold-200"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {adminLabels.blog.heading}
      </Link>

      <h1 className="text-3xl">{adminLabels.blog.newPost}</h1>

      <PostEditor
        uploadAvailable={getUploadProvider() !== "none"}
        categories={categories}
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          language: "fr",
          categoryId: "",
          tags: [],
          coverImageUrl: "",
          coverImageAlt: "",
          coverImageWidth: null,
          coverImageHeight: null,
          seoTitle: "",
          seoDescription: "",
          authorName: settings.businessName,
          status: "brouillon",
        }}
      />
    </div>
  );
}