import type { Locale } from "@/lib/i18n/config";

import manifest from "./credits.json";

/**
 * Catalogue of the licensed photographs on the site.
 *
 * The files themselves are produced by `scripts/process-photos.mjs`, which
 * downloads them from Wikimedia Commons, checks the licence, crops the blown
 * sky off, and tone-maps each one into the black-and-gold palette. This module
 * records which crops exist and what each one actually shows, so a component
 * can never reference a photo that was not generated.
 *
 * Alt text describes the photograph and nothing else — no marketing claims, no
 * invented detail. Every frame is a real place the business serves.
 */

/** Natural aspect ratio of every processed crop (16:9). */
export const PHOTO_RATIO = 9 / 16;

export type PhotoName =
  | "gare-flandres-facade"
  | "gare-flandres-hall"
  | "gare-europe"
  | "lesquin-tour"
  | "lesquin-interieur"
  | "lesquin-acces"
  | "lille-beffroi"
  | "lille-vieille-bourse";

export type PhotoEntry = {
  /** What the frame shows, per language. */
  alt: Record<Locale, string>;
  /** The place, for captions and the credits page. */
  place: Record<Locale, string>;
};

export const PHOTOS: Record<PhotoName, PhotoEntry> = {
  "gare-flandres-facade": {
    alt: {
      fr: "Façade en pierre de la gare Lille-Flandres, avec son horloge et sa nef vitrée",
      en: "Stone facade of Lille-Flandres station, with its clock and glazed train shed",
    },
    place: { fr: "Gare Lille-Flandres", en: "Lille-Flandres station" },
  },
  "gare-flandres-hall": {
    alt: {
      fr: "Nef ferroviaire de la gare Lille-Flandres, arcs de verre et quais sous la verrière",
      en: "Train shed at Lille-Flandres station, glass arches and platforms beneath the roof",
    },
    place: { fr: "Gare Lille-Flandres", en: "Lille-Flandres station" },
  },
  "gare-europe": {
    alt: {
      fr: "Passerelle vitrée au-dessus de la place de la gare Lille-Europe",
      en: "Glazed footbridge above the forecourt of Lille-Europe station",
    },
    place: { fr: "Gare Lille-Europe", en: "Lille-Europe station" },
  },
  "lesquin-tour": {
    alt: {
      fr: "Tour de contrôle de l'aéroport de Lille-Lesquin",
      en: "Control tower at Lille-Lesquin airport",
    },
    place: {
      fr: "Aéroport Lille-Lesquin",
      en: "Lille-Lesquin airport",
    },
  },
  "lesquin-interieur": {
    alt: {
      fr: "Hall d'enregistrement de l'aéroport de Lille-Lesquin, barrières d'attente",
      en: "Check-in hall at Lille-Lesquin airport, with queue barriers",
    },
    place: {
      fr: "Aéroport Lille-Lesquin",
      en: "Lille-Lesquin airport",
    },
  },
  "lesquin-acces": {
    alt: {
      fr: "Voie d'accès à l'aéroport de Lille-Lesquin, voitures en partance",
      en: "Access road to Lille-Lesquin airport, with cars setting off",
    },
    place: {
      fr: "Aéroport Lille-Lesquin",
      en: "Lille-Lesquin airport",
    },
  },
  "lille-beffroi": {
    alt: {
      fr: "Beffroi de Lille illuminé, aperçu depuis la place aux Oignons",
      en: "Lille's belfry lit up at night, seen from Place aux Oignons",
    },
    place: { fr: "Lille — beffroi", en: "Lille — belfry" },
  },
  "lille-vieille-bourse": {
    alt: {
      fr: "Place de la Vieille Bourse et ses façades ornées, à Lille",
      en: "Place de la Vieille Bourse and its ornate facades, Lille",
    },
    place: { fr: "Lille — Vieille Bourse", en: "Lille — Vieille Bourse" },
  },
};

export function isPhotoName(value: string): value is PhotoName {
  return value in PHOTOS;
}

type ManifestPhoto = {
  slug: string;
  widths?: unknown;
};

type PhotoManifest = {
  photos: ManifestPhoto[];
};

/**
 * Widths actually emitted for one photograph. The pipeline records these in
 * `credits.json`, and the component reads them back, so a narrow source can
 * never produce a `srcset` entry pointing at a file that was never written.
 */
const manifestWidths = new Map<string, readonly number[]>(
  (manifest as PhotoManifest).photos.map((photo) => [
    photo.slug,
    Array.isArray(photo.widths)
      ? [
          ...new Set(
            photo.widths.filter(
              (width): width is number =>
                Number.isInteger(width) && width > 0,
            ),
          ),
        ].sort((a, b) => a - b)
      : [],
  ]),
);

export function photoWidths(name: PhotoName): readonly number[] {
  const widths = manifestWidths.get(name);
  if (!widths?.length) {
    throw new Error(
      `No generated widths are recorded for "${name}". Run scripts/process-photos.mjs.`,
    );
  }
  return widths;
}

/**
 * Fallback width closest to the requested size without exceeding it. If every
 * generated crop is larger, the smallest available file is used.
 */
export function photoFallbackWidth(name: PhotoName, preferred = 1600): number {
  const widths = photoWidths(name);
  let fallback = widths[0];
  for (const width of widths) {
    if (width <= preferred) fallback = width;
    else break;
  }
  return fallback;
}
