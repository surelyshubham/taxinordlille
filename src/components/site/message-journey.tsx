"use client";

import { cn } from "@/lib/utils";

/**
 * The taxi-to-office scene used by the enquiry and contact forms.
 *
 * It is a single small SVG driven by a `data-state` attribute, not by a timer:
 * the form decides whether the car is parked (`idle`), driving (`sending`) or
 * delivered (`success`), and the stylesheet only styles those three states.
 * That keeps the animation honest — it cannot show a delivered message before
 * the server has actually stored one — and keeps it tiny, since there is no
 * animation library involved.
 *
 * The scene is decorative; the form renders the sentence a screen reader
 * needs. Nothing here carries customer data, so a screenshot of it leaks
 * nothing.
 */

export type MessageJourneyState = "idle" | "sending" | "success";

export function MessageJourney({
  state,
  className,
}: {
  state: MessageJourneyState;
  className?: string;
}) {
  return (
    <div
      className={cn("journey relative mx-auto w-full max-w-lg", className)}
      data-state={state}
      aria-hidden="true"
    >
      <svg viewBox="0 0 640 200" className="block w-full" fill="none">
        {/* A frame around the scene, so it reads as a plate rather than a
            floating doodle. */}
        <rect
          x="6"
          y="6"
          width="628"
          height="188"
          rx="14"
          className="fill-[#0a0907] stroke-gold-700/35"
          strokeWidth="1"
        />

        {/* --- Office, right ------------------------------------------------ */}
        <rect
          x="500"
          y="44"
          width="120"
          height="118"
          rx="4"
          className="fill-[#0e0c09] stroke-gold-700/45"
          strokeWidth="1.2"
        />
        <rect
          x="546"
          y="114"
          width="28"
          height="48"
          className="fill-canvas stroke-gold-500/45"
          strokeWidth="1"
        />
        <g className="stroke-gold-500/35" strokeWidth="1">
          <rect x="514" y="64" width="20" height="18" />
          <rect x="550" y="64" width="20" height="18" />
          <rect x="586" y="64" width="20" height="18" />
          <rect x="514" y="92" width="20" height="14" />
          <rect x="586" y="92" width="20" height="14" />
        </g>
        {/* The sign, spelled exactly as the business is named. */}
        <rect
          x="488"
          y="16"
          width="144"
          height="24"
          rx="3"
          className="fill-[#12100b] stroke-gold-600/70"
          strokeWidth="1.2"
        />
        <text
          x="560"
          y="32"
          textAnchor="middle"
          fontSize="11"
          letterSpacing="1"
          className="fill-gold-300 font-[family-name:var(--font-display)]"
        >
          Taxi Nord Lille
        </text>

        {/* --- Road, left to the door --------------------------------------- */}
        <path
          d="M22 158C180 150 320 134 606 122"
          stroke="#221d13"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M22 158C180 150 320 134 606 122"
          className="stroke-gold-600/40"
          strokeWidth="1.4"
          strokeDasharray="14 12"
        />
        {/* Scrolling centre line, only while the message is on its way. */}
        <path
          d="M40 157C190 149 330 135 596 123"
          className="journey-road-dash stroke-gold-400/55"
          strokeWidth="1.6"
          strokeDasharray="10 16"
        />

        {/* --- Taxi, parked at the left ------------------------------------- */}
        <g transform="translate(58 160)">
          <g className="journey-taxi">
            <g transform="translate(-6 -85)">
              {/* Body and roof, echoing the car in the medallion. */}
              <path
                d="M6 74V64c0-5 3-8 8-9l14-3 11-11c2-2 5-3 8-3h20c4 0 7 1 10 4l9 9 12 3c5 1 8 4 8 9v11Z"
                className="fill-gold-400/14 stroke-gold-400"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M41 43l9-9c2-2 4-3 7-3h17c3 0 6 1 8 3l7 8Z"
                className="fill-gold-200/14 stroke-gold-300/60"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <circle cx="112" cy="66" r="2.6" className="fill-gold-100" />
              <rect x="2" y="62" width="7" height="5" rx="2" className="fill-gold-200/70" />
              <circle
                cx="30"
                cy="75"
                r="8"
                className="fill-canvas stroke-gold-400"
                strokeWidth="1.7"
              />
              <circle cx="30" cy="75" r="3" className="fill-gold-400/55" />
              <circle
                cx="92"
                cy="75"
                r="8"
                className="fill-canvas stroke-gold-400"
                strokeWidth="1.7"
              />
              <circle cx="92" cy="75" r="3" className="fill-gold-400/55" />

              {/* The message itself, riding on the roof. */}
              <g className="journey-envelope">
                <rect
                  x="30"
                  y="2"
                  width="22"
                  height="15"
                  rx="2"
                  className="fill-[#171307] stroke-gold-300"
                  strokeWidth="1.2"
                />
                <path d="M30 3.5l11 7 11-7" className="stroke-gold-300/80" strokeWidth="1.1" />
              </g>
            </g>
          </g>
        </g>

        {/* --- Arrival indicator, at the office door ------------------------ */}
        <g transform="translate(560 92)">
          <g className="journey-check">
            <circle
              r="13"
              className="fill-canvas stroke-gold-400"
              strokeWidth="1.6"
            />
            <path
              d="M-6 0.5l4.5 4.5L6.5-5"
              className="stroke-gold-200"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
