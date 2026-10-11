import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Allow-list based HTML sanitiser for admin-authored article bodies.
 *
 * The editor produces a constrained subset of HTML (headings, paragraphs,
 * lists, links, emphasis, figures). Anything not on this list — scripts,
 * styles, event handlers, iframes, form controls — is stripped. Images are
 * allowed because inline figures are part of the article model, but only
 * `src`/`alt`/`title`/`width`/`height` survive and only from safe sources.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "h2",
    "h3",
    "h4",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "figure",
    "figcaption",
    "img",
    "hr",
    "code",
    "pre",
    "sup",
    "sub",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    p: [],
    "*": ["id"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["https", "http"],
  },
  allowProtocolRelative: false,
  // Drop the contents of anything dangerous, not just the tags themselves.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  transformTags: {
    // Any link that opens a new tab must not leak the opener or referrer.
    a: (tagName, attribs) => {
      const next: Record<string, string> = { ...attribs };
      if (next.target === "_blank") {
        next.rel = "noopener noreferrer";
      }
      // Strip javascript: URLs that may have slipped through.
      if (next.href && /^\s*javascript:/i.test(next.href)) {
        delete next.href;
      }
      return { tagName, attribs: next };
    },
    img: (tagName, attribs) => {
      const next: Record<string, string> = { ...attribs };
      next.loading = "lazy";
      next.decoding = "async";
      return { tagName, attribs: next };
    },
  },
};

export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, options);
}

/** Strip all markup — used for excerpts, meta descriptions and reading time. */
export function htmlToText(dirty: string): string {
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a short, plain-text excerpt from an HTML body. */
export function makeExcerpt(dirty: string, maxLength = 180): string {
  const text = htmlToText(dirty);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Pull the heading outline out of an article body so the table of contents
 * matches exactly what is rendered below it.
 */
export function extractHeadings(html: string): {
  id: string;
  text: string;
  level: 2 | 3;
}[] {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  const seen = new Map<string, number>();

  const pattern = /<h([23])\s([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const text = htmlToText(match[3] ?? "");
    if (!text) continue;

    const idMatch = /\bid="([^"]+)"/i.exec(match[2] ?? "");
    let id = idMatch?.[1] ?? slugFragment(text);

    // Guarantee unique anchors even when two headings share a title.
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;

    headings.push({ id, text, level });
  }

  return headings;
}

function slugFragment(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Ensure every heading in the stored HTML carries a stable anchor id matching
 * what `extractHeadings` will later produce.
 */
export function injectHeadingIds(html: string): string {
  const used = new Set<string>();

  return html.replace(
    /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (full, level: string, attrs: string | undefined, inner: string) => {
      const existing = /\bid="([^"]+)"/i.exec(attrs ?? "")?.[1];

      let id = existing ?? slugFragment(htmlToText(inner));
      if (!id) return full;

      const base = id;
      let suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);

      const cleaned = (attrs ?? "")
        .replace(/\sid="[^"]*"/i, "")
        .trim();

      return `<h${level}${cleaned ? ` ${cleaned}` : ""} id="${id}">${inner}</h${level}>`;
    },
  );
}