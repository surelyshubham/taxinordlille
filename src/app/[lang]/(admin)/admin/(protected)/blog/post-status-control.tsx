"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Pencil } from "lucide-react";

import { adminLabels } from "@/lib/admin/labels";

import { setPostStatusAction } from "./actions";

/** Publish / unpublish / edit controls for one row of the blog table. */
export function PostStatusControl({
  postId,
  status,
  slug,
}: {
  postId: string;
  status: string;
  slug: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    const next = status === "publie" ? "brouillon" : "publie";
    setPending(true);
    await setPostStatusAction(postId, next);
    setPending(false);
    router.refresh();
  }

  return (
    <span className="flex items-center gap-3">
      <Link
        href={`/admin/blog/${postId}`}
        className="inline-flex items-center gap-1.5 text-xs text-gold-300 hover:text-gold-200"
      >
        <Pencil aria-hidden="true" className="size-3.5" />
        {adminLabels.blog.editPost}
      </Link>

      <Link
        href={`/admin/blog/${postId}/apercu`}
        target="_blank"
        className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-gold-200"
      >
        <Eye aria-hidden="true" className="size-3.5" />
        {adminLabels.blog.preview}
      </Link>

      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="text-xs text-content-muted underline underline-offset-4 transition-colors hover:text-gold-200 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        ) : status === "publie" ? (
          adminLabels.blog.unpublish
        ) : (
          adminLabels.blog.publish
        )}
      </button>

      <span className="sr-only">{slug}</span>
    </span>
  );
}