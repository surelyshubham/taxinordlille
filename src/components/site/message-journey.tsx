"use client";

import { Taxi } from "@/components/brand/taxi";
import { cn } from "@/lib/utils";

/**
 * The scene that tells the visitor their message actually arrived.
 *
 * A car is parked at the kerb under a street lamp; the office is lit across the
 * road. The taxi never moves — the envelope does. It lifts off the roof, flies
 * the road, and is only allowed inside once the server has confirmed the
 * record is stored.
 *
 * That distinction is the whole point. The animation is driven by a
 * `data-state` attribute set from the form's real request lifecycle, never by a
 * clock, so there is no code path in which the office looks occupied before
 * `state.status === "success"`. The four states are:
 *
 *   idle      envelope on the roof, street empty
 *   sending   envelope lifts and flies, stopping at the kerb of the office
 *   success   envelope goes in, a single restrained check appears
 *   error     envelope returns to the roof; nothing is ever delivered
 *
 * The artwork is decorative (`aria-hidden`); the sentence a screen reader needs
 * is rendered as text by the form. No customer data is drawn, so a screenshot
 * of this component leaks nothing.
 */

export type MessageJourneyState = "idle" | "sending" | "success" | "error";

export function MessageJourney({
  state,
  className,
}: {
  state: MessageJourneyState;
  className?: string;
}) {
  return (
    <div
      className={cn("journey", className)}
      data-state={state}
      aria-hidden="true"
    >
      <svg viewBox="0 0 720 300" className="block w-full" fill="none">
        <defs>
          <radialGradient id="journey-lamp" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#d4b668" stopOpacity="0.26" />
            <stop offset="0.55" stopColor="#d4b668" stopOpacity="0.06" />
            <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="journey-office" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#d4b668" stopOpacity="0.2" />
            <stop offset="1" stopColor="#d4b668" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="journey-vignette" cx="0.5" cy="0.5" r="0.62">
            <stop offset="0.55" stopColor="#050404" stopOpacity="0" />
            <stop offset="1" stopColor="#050404" stopOpacity="0.92" />
          </radialGradient>
          <linearGradient id="journey-road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141109" />
            <stop offset="1" stopColor="#0a0908" />
          </linearGradient>
        </defs>

        {/* Night sky and the horizon the street sits on. */}
        <rect width="720" height="300" className="fill-[#070606]" />
        <path d="M0 214h720" className="stroke-gold-700/25" strokeWidth="1" />
        <ellipse cx="120" cy="196" rx="240" ry="150" fill="url(#journey-lamp)" />
        <ellipse cx="596" cy="186" rx="190" ry="140" fill="url(#journey-office)" />

        {/* --- Office, right ------------------------------------------------ */}
        <g>
          {/* Facade. */}
          <path
            d="M486 118h150v96H486z"
            className="fill-[#0d0b08] stroke-gold-600/55"
            strokeWidth="1.2"
          />
          {/* Cornice. */}
          <path d="M478 110h166v9H478z" className="fill-[#100d09] stroke-gold-600/50" strokeWidth="1" />
          <path d="M470 106h182" className="stroke-gold-500/45" strokeWidth="1.2" strokeLinecap="round" />

          {/* The sign, spelled exactly as the business is named. */}
          <rect x="506" y="132" width="110" height="24" rx="2" className="fill-[#15120c] stroke-gold-500/70" strokeWidth="1.1" />
          <text
            x="561"
            y="149"
            textAnchor="middle"
            fontSize="12.5"
            letterSpacing="1.6"
            className="fill-gold-200 font-[family-name:var(--font-display)]"
          >
            Taxi Nord Lille
          </text>

          {/* Lit windows — this is an office with someone in it. */}
          <g>
            {[
              [500, 166],
              [538, 166],
              [576, 166],
              [614, 166],
              [500, 190],
              [538, 190],
              [614, 190],
            ].map(([x, y]) => (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="24"
                height="16"
                className="fill-gold-300/[0.14] stroke-gold-500/45"
                strokeWidth="0.8"
              />
            ))}
            <rect x="576" y="190" width="24" height="16" className="fill-gold-200/25" />
          </g>

          {/* Doorway, and the light that falls out of it onto the pavement. */}
          <path d="M556 214v-24h22v24" className="fill-gold-200/[0.16] stroke-gold-400/60" strokeWidth="1" />
          <path d="M552 214h30" className="stroke-gold-300/50" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="567" cy="219" rx="26" ry="5" className="fill-gold-300/[0.13]" />
        </g>

        {/* --- Road, in slight perspective ----------------------------------- */}
        <path d="M0 214h720v86H0z" fill="url(#journey-road)" />
        <path d="M0 214h720" className="stroke-gold-700/30" strokeWidth="1" />
        {/* Kerb running away from the viewer. */}
        <path d="M56 300 150 214M664 300 570 214" className="stroke-gold-600/22" strokeWidth="1" />
        {/* Centre line, dashes shortening as the road recedes. */}
        <g>
          {[
            [10, 26],
            [56, 26],
            [102, 26],
            [148, 26],
            [194, 26],
            [240, 26],
            [286, 26],
          ].map(([y, len]) => (
            <path
              key={y}
              d={`M360 ${y}h0`}
              className="stroke-gold-500/40"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${len} ${y - 200}`}
            />
          ))}
        </g>
        <path d="M56 300 150 214" className="stroke-gold-600/22" strokeWidth="1" />

        {/* --- Street lamp, left -------------------------------------------- */}
        <g className="stroke-gold-500/40" strokeWidth="1.2" fill="none">
          <path d="M118 214V96" />
          <path d="M118 96c0-6 5-10 12-10h10c7 0 12 4 12 10" />
        </g>
        <circle cx="146" cy="104" r="3.4" className="fill-gold-200/85" />
        <ellipse cx="146" cy="106" rx="13" ry="10" className="fill-gold-300/20" />

        {/* --- The car, parked for the whole scene --------------------------- */}
        <g transform="translate(96 258) scale(0.92)">
          <Taxi />
        </g>

        {/* --- The envelope --------------------------------------------------- */}
        <g className="journey-envelope">
          {/* Position is driven entirely by CSS; this sits at the roof. */}
          <g transform="translate(232 222)">
            <path
              d="M-15 -11h30a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2h-30a2 2 0 0 1-2-2V-9a2 2 0 0 1 2-2Z"
              className="fill-[#14110b] stroke-gold-300"
              strokeWidth="1.3"
            />
            <path d="M-15 -9 0 2 15 -9" className="stroke-gold-200/80" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M-15 11l10-8M15 11l-10-8" className="stroke-gold-400/45" strokeWidth="1" />
          </g>
        </g>

        {/* --- Arrival indicator, at the door --------------------------------- */}
        <g transform="translate(614 168)">
          <g className="journey-check">
            <circle r="14" className="fill-[#0b0907] stroke-gold-400" strokeWidth="1.5" />
            <path
              d="M-6 0.5 4.5 5 6.5-5"
              className="stroke-gold-200"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* Pull the edges back so the scene never reads as a pasted-on panel. */}
        <rect width="720" height="300" fill="url(#journey-vignette)" />
      </svg>
    </div>
  );
}