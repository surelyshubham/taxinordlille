/**
 * Grade the downloaded photographs into the brand palette.
 *
 *   node scripts/process-photos.mjs
 *
 * The source photographs are ordinary daylight shots: grey, flat, with blown
 * skies. Dropped straight onto a black-and-gold page they read as pasted-in
 * stock. Each one is therefore re-mapped so shadows fall to the canvas colour
 * and highlights rise to the brand gold, which ties them to the rest of the
 * site and makes them look deliberate.
 *
 * Every derivative is an adaptation, so the credits page records that the
 * images were cropped, desaturated and tone-mapped — the CC BY-SA attribution
 * requirement to indicate changes.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC_DIR = "public/images/sources";
const OUT_DIR = "public/images/places";

const BRAND = {
  canvas: "#050404", // near-black the page sits on
  gold: "#d4b668", // sampled from the logo medallion
  goldLight: "#f0dfb4",
};

/** Widths emitted per photo. The hero and banners need the large end. */
const WIDTHS = [640, 1024, 1600, 2000];

/**
 * Per-photo crop, as fractions of the source.
 *
 * `top` is generous because several of these shots have a blown-out sky
 * filling the upper third; keeping it would leave a flat bright band sitting
 * behind the page's gold type. Vehicle frames keep a wider band so the car is
 * never clipped, and `gravity: "attention"` then picks the subject within the
 * remaining region.
 */
const CROPS = {
  // A three-quarter view of a black saloon: keep most of the height so the
  // whole car survives the 16:9 fit.
  "berline-noire": { top: 0.12, height: 0.78 },
  "gare-flandres-facade": { top: 0.24, height: 0.56 },
  "lesquin-acces": { top: 0.18, height: 0.66 },
  // A motorway is mostly sky and tarmac; the middle band carries the road.
  "route-a1-lesquin": { top: 0.22, height: 0.62 },
};

/**
 * The grade pipeline.
 *
 * Desaturate to near-grey first, then map luminance onto a ramp ending in the
 * brand gold, then pull the whole thing down so the photographs sit behind
 * gold type instead of competing with it.
 *
 * `tint()` is a no-op on a 1-channel greyscale image, so the desaturation has
 * to come from `modulate` — calling `greyscale()` first silently produces a
 * flat black-and-white picture instead of a duotone.
 */
function grade(image) {
  return image
    .modulate({ saturation: 0.12 })
    .tint(BRAND.gold)
    // The heavy negative offset is the important part: it drops the sky and
    // the flat stonework into shadow so the frame reads as mostly black with
    // gold catching only the highlights. A gentler curve here produces a
    // washed-out sepia that looks pasted onto a dark page.
    .linear(0.9, -40);
}

async function main() {
  // Start from a clean slate: a derivative left behind from a photograph that
  // is no longer in the catalogue would keep shipping to production.
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const credits = JSON.parse(readFileSync("scripts/photo-credits.json", "utf8"));
  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".jpg"));
  /** slug -> the widths actually written to disk. */
  const emitted = new Map();

  console.log(`Grading ${files.length} photographs into the brand palette\n`);

  for (const file of files) {
    const slug = file.replace(/\.jpg$/, "");
    const crop = CROPS[slug] ?? { top: 0.2, height: 0.64 };

    const source = sharp(readFileSync(join(SRC_DIR, file)));
    const meta = await source.metadata();

    // Region to cut, as absolute pixels, then let sharp focus within it.
    const regionTop = Math.round((meta.height ?? 1000) * crop.top);
    const regionHeight = Math.round((meta.height ?? 1000) * crop.height);

    const outWidths = WIDTHS.filter((w) => w <= (meta.width ?? 0)).concat();
    const sizes = outWidths.length ? outWidths : [WIDTHS[WIDTHS.length - 1]];

    for (const width of sizes) {
      const base = grade(
        sharp(readFileSync(join(SRC_DIR, file)))
          .extract({
            left: 0,
            top: regionTop,
            width: meta.width,
            height: Math.min(regionHeight, (meta.height ?? 0) - regionTop),
          })
          .resize({
            width,
            // Wide crops suit a 16:9 hero; tall crops suit a banner.
            height: Math.round(width * (crop.tall ? 0.62 : 0.5625)),
            fit: "cover",
            position: "attention",
          }),
      );

      await base
        .clone()
        .avif({ quality: 52, effort: 6 })
        .toFile(join(OUT_DIR, `${slug}-${width}.avif`));
      await base
        .clone()
        .webp({ quality: 74, effort: 6 })
        .toFile(join(OUT_DIR, `${slug}-${width}.webp`));
      await base
        .clone()
        .jpeg({ quality: 78, progressive: true, mozjpeg: true })
        .toFile(join(OUT_DIR, `${slug}-${width}.jpg`));
    }

    const stat = sizes.map((w) => `${w}px`).join(", ");
    console.log(`  ${slug.padEnd(24)} ${stat}`);

    // Record what was actually written. Not every source is 2000px wide, and
    // a srcset that advertises a size the pipeline never emitted turns into a
    // 404 the moment a browser asks for it.
    emitted.set(slug, sizes);
  }

  // Ship the manifest with the code so the credits page reads real metadata.
  mkdirSync("src/lib/photos", { recursive: true });
  writeFileSync(
    "src/lib/photos/credits.json",
    JSON.stringify(
      {
        note: "Generated by scripts/process-photos.mjs from scripts/photo-credits.json.",
        adaptations:
          "Recadrée, désaturée et étalonnée vers les tons de la marque (noir et or).",
        adaptationsEn:
          "Cropped, desaturated and tone-mapped towards the brand's black and gold palette.",
        photos: credits.photos.map((photo) => ({
          ...photo,
          widths: emitted.get(photo.slug) ?? [],
        })),
      },
      null,
      2,
    ),
  );

  console.log("\nManifest written to src/lib/photos/credits.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
