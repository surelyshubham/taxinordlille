import sanitizeHtml from "sanitize-html";

import { cn } from "@/lib/utils";

/**
 * Article body renderer.
 *
 * The HTML has already been sanitised on write (see `lib/sanitize.ts`); it is
 * sanitised again here on the way out, so a row that was edited directly in the
 * database still cannot inject anything into a visitor's browser.
 */
export function Prose({
  html,
  className,
  dropcap = false,
}: {
  html: string;
  className?: string;
  dropcap?: boolean;
}) {
  return (
    <div
      className={cn("article-prose", dropcap && "prose-dropcap", className)}
      // Re-sanitised on render — see the note above.
      dangerouslySetInnerHTML={{ __html: sanitizeOnRender(html) }}
    />
  );
}

/**
 * Client-side-safe subset of the server allow-list, applied at render time.
 * Mirrors `lib/sanitize.ts` without pulling the Node-only dependency into the
 * server component graph twice.
 */
function sanitizeOnRender(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "em", "u", "s", "blockquote",
      "ul", "ol", "li", "a", "figure", "figcaption", "img", "hr", "code",
      "pre", "sup", "sub",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => {
        const next = { ...attribs };
        if (next.target === "_blank") next.rel = "noopener noreferrer";
        if (next.href && /^\s*javascript:/i.test(next.href)) delete next.href;
        return { tagName, attribs: next };
      },
    },
  });
}