import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Brand artwork                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The one piece of drawn artwork that survives alongside the photography.
 *
 * The site's concrete subjects — the station, the airport, the motorway, the
 * car itself — are real, licensed photographs, so they are not drawn here any
 * more. What remains is the neutral cover for a blog article that has no
 * picture of its own, built from the same design tokens as the rest of the UI:
 *
 *   canvas   #050404    gold 50→700    line #2c2619 / #453c25
 *
 * Every gradient id is namespaced `artwork-*` so several instances can be
 * rendered on one page without clashing. Nothing here uses hooks or browser
 * APIs — the component is server-renderable.
 */

type ArtProps = {
  className?: string;
};

/* -------------------------------------------------------------------------- */
/* Abstract cover                                                              */
/* -------------------------------------------------------------------------- */

/** Neutral cover for articles without an image: arcs, a horizon rule, a diamond. */
export function ArtAbstract({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 800 450"
      className={cn("block h-auto w-full", className)}
      role="img"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <title>Motif géométrique Taxi Nord Lille</title>

      <defs>
        <radialGradient id="artwork-abstract-glow">
          <stop offset="0" stopColor="#d4b668" stopOpacity="0.13" />
          <stop offset="0.6" stopColor="#d4b668" stopOpacity="0.04" />
          <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="800" height="450" className="fill-canvas" />
      <ellipse cx="400" cy="170" rx="330" ry="240" fill="url(#artwork-abstract-glow)" />

      {/* Double frame, as on a printed invitation. */}
      <rect
        x="34"
        y="34"
        width="732"
        height="382"
        className="stroke-gold-700/50"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x="46"
        y="46"
        width="708"
        height="358"
        className="stroke-gold-700/22"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M34 78V34h44M722 34h44v44M766 372v44h-44M78 416H34v-44"
        className="stroke-gold-400/60"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />

      {/* Concentric arcs rising from below the frame. */}
      <path
        d="M280 470a120 120 0 0 1 240 0"
        className="stroke-gold-400/55"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M210 470a190 190 0 0 1 380 0"
        className="stroke-gold-500/38"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M140 470a260 260 0 0 1 520 0"
        className="stroke-gold-600/30"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M70 470a330 330 0 0 1 660 0"
        className="stroke-gold-600/26"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M0 470a400 400 0 0 1 800 0"
        className="stroke-gold-700/30"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* Horizon rule and the diamond it centres on. */}
      <path
        d="M120 140H680"
        className="stroke-gold-400/45"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M400 122 418 140 400 158 382 140Z"
        className="stroke-gold-300"
        strokeWidth="1.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M400 133 407 140 400 147 393 140Z" className="fill-gold-300" />

      {/* Counterweight rule near the base. */}
      <path
        d="M300 386H500"
        className="stroke-gold-700/55"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M400 381 405 386 400 391 395 386Z" className="fill-gold-600" />
    </svg>
  );
}
