import { cn } from "@/lib/utils";

/**
 * The car, drawn once.
 *
 * Both the page loader and the submission scene need the same vehicle, and
 * drawing it twice is how a scene starts to look assembled from parts. It is
 * built as a `<g>` rather than a standalone `<svg>` so each caller can place it
 * inside its own scene, and its origin sits on the ground under the rear
 * wheel — so a caller positions it with a single `translate`.
 *
 * Everything is a thin gold line on black, matching the medallion in the
 * supplied logo: no fills heavier than a whisper, no glow, no gradient. The
 * proportions follow a long-wheelbase saloon rather than a cartoon hatchback.
 *
 * Nothing here animates; motion belongs to whoever mounts it.
 */
export function Taxi({ className }: { className?: string }) {
  return (
    <g className={cn("taxi", className)}>
      {/* Light spilling forward onto the road. */}
      <ellipse cx="206" cy="-12" rx="84" ry="19" className="fill-gold-300/[0.07]" />
      {/* Contact shadow, so the car sits on the road rather than over it. */}
      <ellipse cx="84" cy="1" rx="86" ry="5.5" className="fill-black/55" />

      {/* Body: boot, rear pillar, roof, screen, bonnet, sill. */}
      <path
        d="M4 -20V-38q0-10 10-11l26-1q7-1 11-5l15-15q6-6 16-6h36q12 0 18 8l12 16h2q5 0 5 6v22q0 3-4 3H8q-4 0-4-3Z"
        className="fill-[#0c0a07] stroke-gold-400/85"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Glass, split by the B-pillar. */}
      <path
        d="M45 -54 62 -69q5-5 13-5h9v20Z"
        className="fill-gold-200/[0.10] stroke-gold-300/40"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M92 -74h26q10 0 14 7l9 13H92Z"
        className="fill-gold-200/[0.10] stroke-gold-300/40"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* The crease that runs the length of a saloon. */}
      <path d="M22 -33h124" className="stroke-gold-400/25" strokeWidth="1" strokeLinecap="round" />

      {/* Wheel arches, cut into the body. */}
      <path d="M26 -18a14 14 0 0 1 28 0" className="stroke-gold-400/30" strokeWidth="1" fill="none" />
      <path d="M110 -18a14 14 0 0 1 28 0" className="stroke-gold-400/30" strokeWidth="1" fill="none" />

      {/* Wheels. */}
      <circle cx="40" cy="-13" r="13" className="fill-[#0a0907] stroke-gold-400/90" strokeWidth="1.5" />
      <circle cx="40" cy="-13" r="4.5" className="stroke-gold-400/45" strokeWidth="1" fill="none" />
      <circle cx="124" cy="-13" r="13" className="fill-[#0a0907] stroke-gold-400/90" strokeWidth="1.5" />
      <circle cx="124" cy="-13" r="4.5" className="stroke-gold-400/45" strokeWidth="1" fill="none" />

      {/* Roof sign: the one piece of colour on the car. */}
      <path
        d="M84 -76v-11q0-3 3-3h26q3 0 3 3v11"
        className="fill-gold-400/[0.14] stroke-gold-300/70"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M93 -84h24" className="stroke-gold-200/55" strokeWidth="1" strokeLinecap="round" />

      {/* Lamps. */}
      <circle cx="154" cy="-33" r="3.2" className="fill-gold-100/90" />
      <path d="M8 -36h8" className="stroke-gold-500/70" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}