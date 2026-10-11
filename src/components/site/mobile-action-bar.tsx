"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, PhoneCall } from "lucide-react";

import { useSiteContact } from "@/components/site/contact-context";
import { whatsappHref, telHref } from "@/lib/settings/schema";
import { cn } from "@/lib/utils";

/**
 * Persistent mobile action bar.
 *
 * Three of the four goals on a taxi site are "call us", "message us" and
 * "get a price" — on a phone those should never require scrolling back to the
 * header. The bar hides itself whenever focus enters a form so it can never
 * sit on top of a keyboard, and it is suppressed entirely on desktop where the
 * header already carries both actions.
 */
export function MobileActionBar({
  quoteHref,
  labels,
}: {
  quoteHref: string;
  labels: { call: string; whatsapp: string; quote: string };
}) {
  const { phone, whatsappNumber } = useSiteContact();
  const [overForm, setOverForm] = React.useState(false);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      setOverForm(target instanceof Element && Boolean(target.closest("form")));
    };
    const onFocusOut = (event: FocusEvent) => {
      // Ignore focus moving within the same form.
      const next = event.relatedTarget;
      if (next instanceof Element && next.closest("form")) return;
      setOverForm(false);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Only appear once the visitor has started reading — never over the hero CTA.
  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = [
    {
      key: "call",
      label: labels.call,
      href: telHref(phone),
      icon: PhoneCall,
      external: false,
    },
    ...(whatsappNumber
      ? [
          {
            key: "whatsapp",
            label: labels.whatsapp,
            href: whatsappHref(whatsappNumber),
            icon: WhatsAppIcon,
            external: true,
          },
        ]
      : []),
    {
      key: "quote",
      label: labels.quote,
      href: quoteHref,
      icon: FileText,
      external: false,
    },
  ];

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-xl transition-transform duration-300 lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        overForm || !visible ? "translate-y-full" : "translate-y-0",
      )}
    >
      <ul className="grid grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isQuote = item.key === "quote";
          const content = (
            <>
              <Icon aria-hidden="true" className="size-[1.15rem]" />
              <span className="text-[0.7rem] font-semibold">{item.label}</span>
            </>
          );

          return (
            <li key={item.key} className="border-r border-line last:border-r-0">
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                    isQuote
                      ? "bg-gold-400 text-canvas"
                      : "text-content-muted active:bg-gold-400/10",
                  )}
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                    isQuote
                      ? "bg-gold-400 text-canvas"
                      : "text-content-muted active:bg-gold-400/10",
                  )}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.13.17 1.74 2.65 4.21 3.72.59.25 1.05.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}