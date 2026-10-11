import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BlogCard } from "@/components/site/blog-card";
import { EmptyState, Section, SectionHeading } from "@/components/ui/primitives";
import { BookOpen } from "lucide-react";
import { getPublishedPosts } from "@/lib/blog/queries";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedHref, type Locale } from "@/lib/i18n/config";

export async function BlogSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  // A database hiccup must not take the homepage down with it.
  const { posts } = await getPublishedPosts(locale, { limit: 3 }).catch(
    (error) => {
      console.warn("[home] blog preview unavailable:", error);
      return { posts: [], total: 0, usedFallback: false };
    },
  );

  return (
    <Section className="border-t border-line/70">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow={dict.home.blog.eyebrow}
            title={dict.home.blog.title}
            description={dict.home.blog.intro}
          />
          <Link
            href={localizedHref(locale, "/blog")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold-300 transition-colors hover:text-gold-200"
          >
            {dict.common.allPosts}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            className="mt-14"
            icon={<BookOpen aria-hidden="true" className="size-8" />}
            title={dict.blog.emptyTitle}
            description={dict.blog.emptyBody}
          />
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <BlogCard
                key={post.id}
                post={post}
                locale={locale}
                labels={{
                  readMore: dict.common.readMore,
                  minRead: dict.blog.minRead,
                }}
                priority={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}