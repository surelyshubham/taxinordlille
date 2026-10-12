"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Taxi } from "@/components/brand/taxi";
import { cn } from "@/lib/utils";

/**
 * Branded page transition.
 *
 * The overlay covers three moments, and only those three: the first visit
 * (decided on the server from a cookie, so a return visit never flashes it),
 * a navigation to a different internal page, and a browser back/forward.
 * Everything below exists to keep those three from turning into something
 * intrusive:
 *
 *  1. **It is held long enough to read.** Showing it for the few milliseconds a
 *     prefetched route takes would just flicker, so it stays up for
 *     `MIN_VISIBLE_MS` regardless of how fast the destination arrives.
 *  2. **It can never trap the page.** A hard ceiling dismisses it even if the
 *     navigation never settles, a CSS keyframe dismisses it if JavaScript dies
 *     mid-flight, and a `<noscript>` rule hides it outright without JavaScript.
 *  3. **It does not fire on noise.** Clicks on anchors are filtered: same-page
 *     links, hash links, modified clicks, external hosts, `target="_blank"`,
 *     `download` and anything marked `data-no-loader` are all ignored, as are
 *     form interactions and focus changes.
 *  4. **It respects `prefers-reduced-motion`** through the CSS, which stills
 *     the ambient motion and keeps the fade.
 *
 * This is deliberately separate from the form-submission animation: that one
 * reports on a single request, this one reports on a route change.
 */

const COOKIE = "tnl_intro";
/** The overlay is held for at least this long, so it reads as deliberate. */
const MIN_VISIBLE_MS = 2000;
/** Must match the `loader-dismiss` keyframe duration in `globals.css`. */
const FADE_MS = 700;
/** A navigation that never settles must not strand the visitor. */
const MAX_VISIBLE_MS = 8000;

type Phase = "hidden" | "visible" | "leaving";

export function SiteLoader({
  firstVisit = false,
  labels,
  className,
}: {
  /** Rendered on the server from the `tnl_intro` cookie. */
  firstVisit?: boolean;
  labels: { label: string; sr: string };
  className?: string;
}) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  const [phase, setPhase] = useState<Phase>(firstVisit ? "visible" : "hidden");
  const phaseRef = useRef<Phase>(phase);
  // Bumped on every activation so the element (and its CSS failsafe keyframe)
  // is rebuilt from scratch rather than reusing a finished animation.
  const [runId, setRunId] = useState(0);

  const startedAtRef = useRef(0);
  const startPathRef = useRef<string | null>(null);
  const readyRef = useRef(false);

  const failsafeRef = useRef<number | null>(null);
  const readyTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    for (const timer of [failsafeRef, readyTimerRef, hideTimerRef]) {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const leave = useCallback(() => {
    if (phaseRef.current !== "visible") return;
    clearTimers();
    phaseRef.current = "leaving";
    setPhase("leaving");
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      phaseRef.current = "hidden";
      setPhase("hidden");
    }, FADE_MS);
  }, [clearTimers]);

  /**
   * The destination has rendered (or the first paint is done). Hold the overlay
   * only for whatever remains of the minimum, then fade it out.
   */
  const markReady = useCallback(() => {
    if (phaseRef.current !== "visible" || readyRef.current) return;
    readyRef.current = true;
    const elapsed = Date.now() - startedAtRef.current;
    readyTimerRef.current = window.setTimeout(
      () => {
        readyTimerRef.current = null;
        leave();
      },
      Math.max(0, MIN_VISIBLE_MS - elapsed),
    );
  }, [leave]);

  const show = useCallback(() => {
    // Already up: a second navigation cannot make it more up.
    if (phaseRef.current === "visible") return;
    clearTimers();
    startedAtRef.current = Date.now();
    startPathRef.current = pathnameRef.current;
    readyRef.current = false;
    phaseRef.current = "visible";
    setRunId((id) => id + 1);
    setPhase("visible");
    failsafeRef.current = window.setTimeout(() => {
      failsafeRef.current = null;
      leave();
    }, MAX_VISIBLE_MS);
  }, [clearTimers, leave]);

  // First visit: show immediately, and remember the visit so it does not
  // happen again. The overlay is only dismissed once the document has loaded —
  // or, if that never fires, by the ceiling in `show`.
  useEffect(() => {
    if (!firstVisit) return;
    show();
    document.cookie = `${COOKIE}=1; path=/; max-age=${60 * 60 * 24}; samesite=lax`;

    const onLoad = () => markReady();
    if (document.readyState === "complete") markReady();
    else window.addEventListener("load", onLoad, { once: true });

    return () => window.removeEventListener("load", onLoad);
  }, [firstVisit, markReady, show]);

  // A completed navigation is what a visible overlay is waiting for.
  useEffect(() => {
    pathnameRef.current = pathname;
    if (
      phaseRef.current === "visible" &&
      startPathRef.current !== null &&
      startPathRef.current !== pathname
    ) {
      markReady();
    }
  }, [pathname, markReady]);

  // Where navigations start from: an internal link click that will change the
  // page, or a back/forward press.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.dataset.noLoader !== undefined) return;
      if (anchor.hasAttribute("download")) return;

      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      const raw = anchor.getAttribute("href") ?? "";
      if (!raw || raw.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same document — a hash or query tweak, not a page transition.
      if (url.pathname === window.location.pathname) return;

      show();
    };

    const onPop = () => {
      // `popstate` has already swapped the URL; if the path is unchanged this
      // was a hash or query move, which does not warrant the overlay.
      if (window.location.pathname === pathnameRef.current) return;
      show();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, [show]);

  if (phase === "hidden") return null;

  return (
    <>
      {/*
        No JavaScript means no navigation interception. Rather than risk
        covering a page that will never be dismissed, hide the overlay outright.
      */}
      <noscript>
        <style>{`[data-site-loader]{display:none!important}`}</style>
      </noscript>

      <div
        key={runId}
        data-site-loader
        data-leaving={phase === "leaving" ? "" : undefined}
        role="status"
        className={cn(
          "site-loader fixed inset-0 z-[200] flex flex-col items-center justify-center bg-canvas",
          className,
        )}
      >
        <LoaderScene />

        <p className="mt-7 font-[family-name:var(--font-display)] text-lg tracking-[0.42em] text-gold-200 uppercase sm:text-xl">
          Taxi Nord Lille
        </p>

        <p className="loader-ellipsis mt-4 text-[0.7rem] tracking-[0.34em] text-content-subtle uppercase">
          {labels.label}
        </p>

        <span className="sr-only">{labels.sr}</span>
      </div>
    </>
  );
}

/**
 * The emblem above a night street, with the car crossing it.
 *
 * The road recedes to a vanishing point so the car reads as being *somewhere*
 * rather than sliding along a stripe. There is no progress bar: a bar that
 * cannot report a real percentage is decoration pretending to be information,
 * and the moving car is already the honest signal that something is happening.
 */
function LoaderScene() {
  return (
    <div className="w-full" aria-hidden="true">
      <div className="relative mx-auto w-24 sm:w-28">
        {/*
          A plain <img>, deliberately. This emblem is the loader's focal point
          and sits above the fold of the very first paint; routing it through
          next/image would queue it behind the optimiser and delay the one
          moment the visitor is guaranteed to be looking.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-mark.png"
          alt=""
          width={256}
          height={215}
          className="relative w-full"
        />
      </div>

      <svg
        viewBox="0 0 640 200"
        className="mt-10 block w-full max-w-2xl"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="loader-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#d4b668" stopOpacity="0.14" />
            <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="loader-vignette" cx="0.5" cy="0.5" r="0.62">
            <stop offset="0.5" stopColor="#050404" stopOpacity="0" />
            <stop offset="1" stopColor="#050404" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* Far bank: rooftops, barely separated from the sky. */}
        <g className="fill-[#0a0908]">
          <path d="M0 118h70v-26h34v-16h26v42h58v-34h40v-20h30v54h64v-30h44v-22h32v52h72v-38h40v-18h30v56h70v46H0z" />
        </g>

        {/* Warm air above the street. */}
        <ellipse cx="320" cy="150" rx="300" ry="110" fill="url(#loader-glow)" />

        {/* Road, receding. */}
        <path d="M0 164h640v36H0z" className="fill-[#0c0a07]" />
        <path d="M0 164h640" className="stroke-gold-700/30" strokeWidth="1" />
        <path d="M120 200 268 164M520 200 372 164" className="stroke-gold-600/18" strokeWidth="1" />

        {/* The car, crossing left to right. It fades in and out at the kerb so
            the loop never shows its seam. */}
        <g className="loader-taxi">
          <g transform="translate(-190 198) scale(0.62)">
            <Taxi />
          </g>
        </g>

        <rect width="640" height="200" fill="url(#loader-vignette)" />
      </svg>
    </div>
  );
}
