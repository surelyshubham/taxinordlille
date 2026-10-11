"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * First-visit loader: a taxi running along a road, in the brand's black and
 * gold.
 *
 * Design constraints, in priority order:
 *
 *  1. **It can never trap the page.** Three independent mechanisms dismiss it:
 *     the cookie check below, a CSS keyframe that fades and hides the overlay
 *     after a fixed time, and a `<noscript>` rule. If JavaScript is slow,
 *     blocked or broken, the visitor still gets the site.
 *  2. **It never flashes on a return visit.** The decision to render is made on
 *     the server from a cookie, not in an effect — so a repeat page load has no
 *     loader in the HTML at all rather than appearing and vanishing.
 *  3. **It respects `prefers-reduced-motion`**, falling back to a static frame
 *     that still dismisses itself promptly.
 */

const COOKIE = "tnl_intro";
const DISMISS_AFTER_MS = 2600;

export function SiteLoader({ className }: { className?: string }) {
  // `leaving` starts the fade; `gone` unmounts once it has finished, so the
  // overlay does not linger in the DOM for the rest of the session.
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Remember the choice for the rest of the browsing session.
    document.cookie = `${COOKIE}=1; path=/; max-age=${60 * 60 * 24}; samesite=lax`;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setLeaving(true);
      // Slightly longer than the fade itself, so the element is only removed
      // once it is fully transparent.
      window.setTimeout(() => setGone(true), 800);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    // Hard ceiling: a resource that never fires `load` must not hold the page.
    const ceiling = window.setTimeout(finish, DISMISS_AFTER_MS);

    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(ceiling);
    };
  }, []);

  if (gone) return null;

  return (
    <>
      {/*
        No JavaScript means no `load` listener. Hide it outright rather than
        risk covering a page that will never be dismissed.
      */}
      <noscript>
        <style>{`[data-site-loader]{display:none!important}`}</style>
      </noscript>

      <div
        data-site-loader
        aria-hidden="true"
        data-leaving={leaving ? "" : undefined}
        className={cn(
          "site-loader fixed inset-0 z-[200] flex flex-col items-center justify-center bg-canvas",
          className,
        )}
      >
        <LoaderScene />

        <p className="mt-9 font-[family-name:var(--font-display)] text-xl tracking-[0.34em] text-gold-200 uppercase sm:text-2xl">
          Taxi Nord Lille
        </p>

        <p className="loader-ellipsis mt-3 text-sm tracking-[0.2em] text-content-subtle uppercase">
          Chargement
        </p>

        {/* Indeterminate sweep — a fake determinate percentage would be a lie. */}
        <div className="mt-8 h-px w-40 overflow-hidden bg-line sm:w-56">
          <div className="loader-sweep h-full w-1/3 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        </div>
      </div>
    </>
  );
}

/** The medallion over a road with a taxi running along it. */
function LoaderScene() {
  return (
    <div className="relative w-full max-w-sm px-8">
      <div className="relative mx-auto w-32 sm:w-40">
        <div className="loader-glow" />
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
        viewBox="0 0 320 104"
        className="mt-8 w-full overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="loader-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d4b668" stopOpacity="0" />
            <stop offset="1" stopColor="#d4b668" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="loader-road" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d4b668" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#d4b668" stopOpacity="0.3" />
            <stop offset="1" stopColor="#d4b668" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Headlight wash trailing the car. */}
        <path d="M0 78h320" stroke="url(#loader-beam)" strokeWidth="26" strokeLinecap="round" />

        <g className="loader-taxi">
          {/* Side profile, matching the car in the medallion. */}
          <path
            d="M6 74V64c0-5 3-8 8-9l14-3 11-11c2-2 5-3 8-3h20c4 0 7 1 10 4l9 9 12 3c5 1 8 4 8 9v11Z"
            className="fill-gold-400/12 stroke-gold-400"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M41 43l9-9c2-2 4-3 7-3h17c3 0 6 1 8 3l7 8Z"
            className="fill-gold-200/14 stroke-gold-300/60"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M49 43h38"
            className="stroke-gold-300/45"
            strokeWidth="1.1"
          />
          {/* Headlight. */}
          <circle cx="112" cy="66" r="2.6" className="fill-gold-100" />
          <rect x="2" y="62" width="7" height="5" rx="2" className="fill-gold-200/70" />
          {/* Wheels. */}
          <circle cx="30" cy="75" r="8" className="fill-canvas stroke-gold-400" strokeWidth="1.7" />
          <circle cx="30" cy="75" r="3" className="fill-gold-400/55" />
          <circle cx="92" cy="75" r="8" className="fill-canvas stroke-gold-400" strokeWidth="1.7" />
          <circle cx="92" cy="75" r="3" className="fill-gold-400/55" />
          {/* Ground shadow. */}
          <ellipse cx="61" cy="85" rx="44" ry="3" className="fill-gold-500/12" />
        </g>

        {/* Road surface and centre line. */}
        <path d="M0 86h320" stroke="url(#loader-road)" strokeWidth="1.4" />
        <g className="loader-dashes">
          {[0, 40, 80, 120, 160, 200, 240, 280].map((x) => (
            <path
              key={x}
              d={`M${x} 86h20`}
              className="stroke-gold-500/45"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
