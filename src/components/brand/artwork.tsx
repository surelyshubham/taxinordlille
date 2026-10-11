import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Brand artwork                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The site ships no licensed photography, so every image is drawn here as
 * inline SVG. All of it is black-and-gold, fine-line engraved in feel, and
 * built from the same design tokens as the rest of the UI:
 *
 *   canvas   #050404    gold 50→700    line #2c2619 / #453c25
 *
 * Every gradient id is namespaced `artwork-*` so several instances can be
 * rendered on one page without clashing. Nothing here uses hooks or browser
 * APIs — all components are server-renderable.
 */

type ArtProps = {
  className?: string;
};

/* -------------------------------------------------------------------------- */
/* Gare Lille-Flandres                                                         */
/* -------------------------------------------------------------------------- */

/** Station canopy and train front, rails running to a vanishing point. */
export function ArtGare({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={cn("block h-auto w-full", className)}
      role="img"
      fill="none"
    >
      <title>Gare de Lille-Flandres : hall et rails en perspective</title>

      <defs>
        <radialGradient id="artwork-gare-glow">
          <stop offset="0" stopColor="#d4b668" stopOpacity="0.13" />
          <stop offset="0.6" stopColor="#d4b668" stopOpacity="0.04" />
          <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" className="fill-canvas" />
      <ellipse cx="200" cy="212" rx="210" ry="104" fill="url(#artwork-gare-glow)" />

      {/* Horizon and platform edge. */}
      <path
        d="M0 190H400M0 272H400"
        className="stroke-line-strong"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* Canopy: arch, fascia, hangers, columns. */}
      <path
        d="M52 78Q200 44 348 78"
        className="stroke-gold-500/50"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M60 92Q200 60 340 92"
        className="stroke-gold-600/45"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M112 67 116 82M170 62 172 77M200 61V76M230 62 228 77M289 67 284 82"
        className="stroke-gold-600/40"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M74 90V190M326 90V190"
        className="stroke-gold-600/32"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />

      {/* Pantograph — the one silhouette cue that says "rail" instantly. */}
      <path
        d="M178 100 200 74 222 100"
        className="stroke-gold-400/70"
        strokeWidth="1.4"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M170 80H230"
        className="stroke-gold-400/55"
        strokeWidth="1.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Train front silhouette — wide shoulders so the nose reads as a cab. */}
      <path
        d="M150 190v-50c0-12 5-20 14-24l36-16 36 16c9 4 14 12 14 24v50"
        className="fill-gold-400/6 stroke-gold-400"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M162 132c0-9 4-15 11-19l27-14 27 14c7 4 11 10 11 19Z"
        className="fill-gold-200/10 stroke-gold-300/55"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M157 156H243"
        className="stroke-gold-300/32"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="200" cy="144" r="2" className="fill-gold-200/70" />
      <circle cx="172" cy="174" r="8.5" className="fill-gold-400/12" />
      <circle cx="228" cy="174" r="8.5" className="fill-gold-400/12" />
      <circle cx="172" cy="174" r="4" className="fill-gold-300" />
      <circle cx="228" cy="174" r="4" className="fill-gold-300" />
      <path
        d="M156 184H244"
        className="stroke-gold-400/50"
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Rails converging to the vanishing point, with sleepers. */}
      <path
        d="M74 300 194 193M326 300 206 193"
        className="stroke-gold-400/60"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M181.5 206H218.5M159.5 226H240.5M130.8 252H269.2M93.4 286H306.6"
        className="stroke-gold-600/45"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Aéroport                                                                    */
/* -------------------------------------------------------------------------- */

/** Aeroplane climbing away over the runway, contrails drawn behind the wings. */
export function ArtAeroport({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={cn("block h-auto w-full", className)}
      role="img"
      fill="none"
    >
      <title>Aéroport de Lille : avion au-dessus de la piste</title>

      <defs>
        <radialGradient id="artwork-aeroport-glow">
          <stop offset="0" stopColor="#d4b668" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#d4b668" stopOpacity="0.05" />
          <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" className="fill-canvas" />
      <ellipse cx="200" cy="194" rx="250" ry="112" fill="url(#artwork-aeroport-glow)" />

      {/* Horizon and distant terminal furniture. */}
      <path
        d="M0 196H400"
        className="stroke-gold-500/32"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M28 196v-30h104v30M242 196v-22h84v22M326 196v-42h22v42"
        className="stroke-gold-600/32"
        strokeWidth="1.1"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M318 154h38"
        className="stroke-gold-600/45"
        strokeWidth="1.3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Runway in perspective. */}
      <path
        d="M198 197 28 292M202 197 372 292"
        className="stroke-gold-500/50"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M36 286H364"
        className="stroke-gold-700/40"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M196.5 208h7M192 226h16M186 250h28M176 282h48"
        className="stroke-gold-300/40"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />

      {/* Contrails. */}
      <path
        d="M148 133c-24 13-45 32-60 56"
        className="stroke-gold-300/40"
        strokeWidth="1.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M146 141c-24 14-45 31-59 55"
        className="stroke-gold-300/19"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M252 112c26 12 50 30 69 53"
        className="stroke-gold-300/34"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M254 120c26 13 50 31 68 53"
        className="stroke-gold-300/16"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* Aeroplane, seen from below. */}
      <g transform="translate(196 100) rotate(-12)">
        <path
          d="M0-44c5 2 7 12 7 30v38c0 7-2.5 12-7 15-4.5-3-7-8-7-15v-38c0-18 2-28 7-30Z"
          className="fill-gold-200/20 stroke-gold-300"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M-7-6-48 15c-4 2.5-4 7 0 7L-7 15ZM7-6l41 21c4 2.5 4 7 0 7L7 15Z"
          className="fill-gold-200/16 stroke-gold-300/90"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M-7 22-23 34c-3 2-3 5.5 0 5.5L-7 36ZM7 22l16 12c3 2 3 5.5 0 5.5L7 36Z"
          className="fill-gold-200/14 stroke-gold-300/75"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <ellipse
          cx="-24"
          cy="6"
          rx="4"
          ry="7.5"
          className="fill-gold-300/70"
          transform="rotate(-8 -24 6)"
        />
        <ellipse
          cx="24"
          cy="6"
          rx="4"
          ry="7.5"
          className="fill-gold-300/70"
          transform="rotate(8 24 6)"
        />
        <ellipse cx="0" cy="-33" rx="2.6" ry="4" className="fill-gold-100/70" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Route                                                                       */
/* -------------------------------------------------------------------------- */

/** Open road at night, receding to a lit vanishing point. */
export function ArtRoute({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={cn("block h-auto w-full", className)}
      role="img"
      fill="none"
    >
      <title>Route de nuit en perspective</title>

      <defs>
        <radialGradient id="artwork-route-glow">
          <stop offset="0" stopColor="#d4b668" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#d4b668" stopOpacity="0.05" />
          <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="artwork-route-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4b668" stopOpacity="0.09" />
          <stop offset="0.5" stopColor="#d4b668" stopOpacity="0.035" />
          <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="artwork-route-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0dfb4" stopOpacity="0.11" />
          <stop offset="1" stopColor="#f0dfb4" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" className="fill-canvas" />
      <ellipse cx="200" cy="132" rx="200" ry="120" fill="url(#artwork-route-glow)" />

      {/* Star field. */}
      <g className="fill-gold-200/22">
        <circle cx="58" cy="44" r="1.1" />
        <circle cx="134" cy="26" r="0.9" />
        <circle cx="212" cy="52" r="1.2" />
        <circle cx="286" cy="30" r="0.9" />
        <circle cx="352" cy="62" r="1.1" />
        <circle cx="96" cy="86" r="0.8" />
        <circle cx="310" cy="96" r="0.8" />
      </g>

      <path
        d="M0 124H400"
        className="stroke-gold-500/26"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* Carriageway and headlight wash. */}
      <path
        d="M186 124h28L370 300H30Z"
        fill="url(#artwork-route-road)"
      />
      <path d="M194 128 120 300h160Z" fill="url(#artwork-route-beam)" />
      <path
        d="M186 124 30 300M214 124 370 300"
        className="stroke-gold-500/55"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M191 126 80 300M209 126 320 300"
        className="stroke-gold-500/38"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M197.5 132h5M195.5 158h9M192 196h16M187 248h26"
        className="stroke-gold-200/45"
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Roadside posts, spaced by perspective. */}
      <path
        d="M163 141v9M138 166v12M108 197v15M70.8 235v19M33.6 274v22M237 141v9M261.9 166v12M292 197v15M329.2 235v19M366.4 274v22"
        className="stroke-gold-600/38"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />

      {/* Long-exposure light trails. */}
      <path
        d="M18 296c46-34 102-84 142-136 16-19 26-30 32-34"
        className="stroke-gold-300/45"
        strokeWidth="1.8"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M382 296c-46-34-102-84-142-136-16-19-26-30-32-34"
        className="stroke-gold-300/30"
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M120 298c30-48 56-100 70-150"
        className="stroke-gold-200/20"
        strokeWidth="1.1"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Lille at night: three layers of skyline over a haze band, a sparse star
 * field, and long-exposure traffic light trails. A vignette pulls the edges
 * back into the canvas so the panel never reads as a pasted-on image.
 */
export function ArtHero({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 1200 700"
      className={cn("block h-auto w-full", className)}
      role="img"
      fill="none"
      preserveAspectRatio="xMidYMax slice"
    >
      <title>Lille de nuit, lignes de lumière</title>

      <defs>
        <radialGradient id="artwork-hero-glow">
          <stop offset="0" stopColor="#d4b668" stopOpacity="0.15" />
          <stop offset="0.55" stopColor="#d4b668" stopOpacity="0.05" />
          <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="artwork-hero-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4b668" stopOpacity="0" />
          <stop offset="0.07" stopColor="#d4b668" stopOpacity="0.14" />
          <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="artwork-hero-vignette" cx="0.5" cy="0.52" r="0.72">
          <stop offset="0.52" stopColor="#050404" stopOpacity="0" />
          <stop offset="1" stopColor="#050404" stopOpacity="0.88" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" className="fill-canvas" />
      <ellipse cx="600" cy="470" rx="640" ry="250" fill="url(#artwork-hero-glow)" />

      {/* Star field. */}
      <g className="fill-gold-200/22">
        <circle cx="96" cy="84" r="1.2" />
        <circle cx="188" cy="148" r="1" />
        <circle cx="268" cy="62" r="1.4" />
        <circle cx="352" cy="212" r="1" />
        <circle cx="438" cy="110" r="1.2" />
        <circle cx="520" cy="176" r="0.9" />
        <circle cx="612" cy="88" r="1.5" />
        <circle cx="700" cy="148" r="1" />
        <circle cx="786" cy="58" r="1.2" />
        <circle cx="876" cy="190" r="0.9" />
        <circle cx="960" cy="104" r="1.3" />
        <circle cx="1044" cy="164" r="1" />
        <circle cx="1128" cy="86" r="1.2" />
        <circle cx="58" cy="248" r="0.9" />
        <circle cx="1150" cy="272" r="1" />
      </g>

      {/* Skyline. Depth reads by haze, so the far layer is the lightest and the
          near layer the darkest — nearer roofs fall into silhouette. */}

      {/* Far skyline, carrying the belfry spire. */}
      <path
        d="M0 430v-130h64v-32h44v32h48v-56h48v56h44v-86h44v86h52v-24h48v24h48v-68h52v68h56v-16h52v16h52v-44h52v44h56v-64h24v-22h12v-18h12v18h12v22h24v64h56v-28h52v28h52v-38h56v38h52v-20h48v20h40V430Z"
        className="fill-gold-500/20"
      />

      {/* Middle skyline — hairline catches the city glow along the roofs. */}
      <path
        d="M0 478v-126h92v-34h58v34h64v-56h68v56h56v-22h58v22h56v-42h68v42h66v-16h54v16h60v-30h70v30h58v-12h62v12h58v-44h62v44h60v-18h130V478Z"
        className="fill-gold-700/24 stroke-gold-600/18"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* Near skyline — the darkest layer, almost a silhouette. */}
      <path
        d="M0 540v-136h120v-38h86v38h80v-60h86v60h78v-24h78v24h72v-46h82v46h72v-20h82v20h72v-32h78v32h76v-18h138V540Z"
        className="fill-gold-700/13 stroke-gold-500/26"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* A handful of lit windows — sparse on purpose. */}
      <g className="fill-gold-300/45">
        <circle cx="330" cy="392" r="2" />
        <circle cx="352" cy="416" r="1.6" />
        <circle cx="640" cy="384" r="1.8" />
        <circle cx="962" cy="400" r="2" />
        <circle cx="1090" cy="424" r="1.6" />
      </g>

      {/* Light haze sitting on the ground line. */}
      <rect x="0" y="536" width="1200" height="150" fill="url(#artwork-hero-haze)" />
      <path
        d="M0 540H1200M0 604H1200"
        className="stroke-gold-500/30"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* Long-exposure traffic trails. */}
      <path
        d="M-30 648c280-82 650-30 1260-128"
        className="stroke-gold-300/40"
        strokeWidth="2.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M-30 616c310-64 690-22 1260-116"
        className="stroke-gold-200/26"
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M-30 684c350-58 730-22 1260-110"
        className="stroke-gold-400/22"
        strokeWidth="1.1"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M300 632c120-26 220-36 310-42"
        className="stroke-gold-200/55"
        strokeWidth="2.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M840 656c90-18 170-30 240-38"
        className="stroke-gold-200/45"
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Vignette — fade the composition back into the canvas. */}
      <rect width="1200" height="700" fill="url(#artwork-hero-vignette)" />
    </svg>
  );
}

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
