/**
 * Download the photographs used on the site from Wikimedia Commons.
 *
 *   node scripts/fetch-photos.mjs
 *
 * Every file is checked for a free licence before it is saved, and its author,
 * licence and source page are written to `scripts/photo-credits.json` so the
 * credits page and the README can be generated from real metadata rather than
 * hand-typed strings.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const UA =
  "TaxiNordLille-SiteBuilder/1.0 (https://taxinordlille.fr; contact@taxinordlille.fr)";

/**
 * Hand-picked candidates, narrowed by eye in `scripts/contact-sheet.mjs`.
 *
 * The rule is simple and is applied the same way to every slot: use a
 * photograph of the real place, or of the real vehicle, that a passenger would
 * recognise — never borrow an unrelated picture just to fill a frame. Two of
 * the four subjects below therefore keep a photograph of the actual place
 * served (Lille-Flandres, Lille-Lesquin) even though the frame shows the
 * terminal rather than a car; that gap is recorded in the README instead of
 * being papered over.
 */
const WANTED = [
  // The homepage hero. A professional black taxi, matching the executive
  // salons the business drives. There is no free-licensed frame of a black taxi
  // in Lille, so this one is a Paris taxi — see the README for the gap.
  { file: "Lexus ES 300h F Sport AXZH10 Black Taxi (3).jpg", slug: "berline-noire" },
  // The railway-station service: the real Lille-Flandres, the station served.
  { file: "Lille gare lille flandres facade.jpg", slug: "gare-flandres-facade" },
  // The airport service: the access road of the real Lille-Lesquin airport.
  {
    file: "Lille-Lesquin International Airport - Terminal - Outside - 4.jpg",
    slug: "lesquin-acces",
  },
  // Long-distance journeys: the A1 at Lesquin, the motorway out of Lille.
  { file: "Lesquin - Motorway A1 - 1.jpg", slug: "route-a1-lesquin" },
];

/** Licences we are willing to ship, with the page that explains them. */
const ALLOWED = {
  "cc0": { id: "CC0", name: "CC0 1.0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "cc by": { id: "CC-BY", name: "CC BY", url: "https://creativecommons.org/licenses/by/" },
  "cc by-sa": {
    id: "CC-BY-SA",
    name: "CC BY-SA",
    url: "https://creativecommons.org/licenses/by-sa/",
  },
  "public domain": {
    id: "PD",
    name: "Domaine public",
    url: "https://creativecommons.org/publicdomain/mark/1.0/",
  },
  "pd": { id: "PD", name: "Domaine public", url: "https://creativecommons.org/publicdomain/mark/1.0/" },
};

const OUT_DIR = "public/images/sources";

function stripHtml(value) {
  return value ? value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
}

async function api(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status}`);
  return res.json();
}

function normaliseLicence(shortName) {
  const value = (shortName || "").toLowerCase().trim();
  if (value.startsWith("cc by-sa")) return ALLOWED["cc by-sa"];
  if (value.startsWith("cc by")) return ALLOWED["cc by"];
  if (value.startsWith("cc0")) return ALLOWED["cc0"];
  if (value.startsWith("public domain") || value === "pd") return ALLOWED["public domain"];
  return null;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const data = await api({
    action: "query",
    titles: WANTED.map((w) => `File:${w.file}`).join("|"),
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: "2200",
    format: "json",
  });

  const pages = Object.values(data?.query?.pages ?? {});
  const byTitle = new Map(pages.map((p) => [p.title, p]));

  const credits = [];
  const rejected = [];

  for (const want of WANTED) {
    const page = byTitle.get(`File:${want.file}`);
    const info = page?.imageinfo?.[0];

    if (!info) {
      rejected.push({ ...want, reason: "not found on Commons" });
      continue;
    }

    const meta = info.extmetadata ?? {};
    const licence = normaliseLicence(meta.LicenseShortName?.value);

    if (!licence) {
      rejected.push({ ...want, reason: `licence "${meta.LicenseShortName?.value}" not allowed` });
      continue;
    }

    const author = stripHtml(meta.Artist?.value) || "Auteur inconnu";

    const res = await fetch(info.thumburl ?? info.url, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) {
      rejected.push({ ...want, reason: `download HTTP ${res.status}` });
      continue;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(OUT_DIR, `${want.slug}.jpg`), buffer);

    credits.push({
      slug: want.slug,
      title: stripHtml(meta.ObjectName?.value) || page.title.replace(/^File:/, ""),
      description: stripHtml(meta.ImageDescription?.value).slice(0, 300),
      author,
      licence: licence.name,
      licenceUrl: licence.url,
      licenceId: licence.id,
      source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      bytes: buffer.length,
      width: info.thumbwidth ?? info.width,
      height: info.thumbheight ?? info.height,
    });

    console.log(`OK   ${want.slug.padEnd(24)} ${licence.id.padEnd(9)} ${author.slice(0, 40)}`);
  }

  writeFileSync(
    "scripts/photo-credits.json",
    JSON.stringify({ generatedAt: new Date().toISOString(), photos: credits }, null, 2),
  );

  console.log(`\n${credits.length} photo(s) downloaded to ${OUT_DIR}`);
  console.log("metadata written to scripts/photo-credits.json");

  if (rejected.length) {
    console.log("\nRejected:");
    for (const r of rejected) console.log(`  ${r.slug}: ${r.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
