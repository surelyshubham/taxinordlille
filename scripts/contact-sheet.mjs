/**
 * Contact sheet of the graded photographs, for review.
 *
 *   node scripts/contact-sheet.mjs [outfile]
 *
 * Tiles every processed image onto one canvas over a black field, which is how
 * the brand actually uses them — so what you judge here is what ships.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const DIR = "public/images/places";
const OUT = process.argv[2] ?? "contact-sheet.jpg";

const COLS = 3;
const TILE_W = 520;
const TILE_H = Math.round(TILE_W * 0.5625);
const GAP = 12;
const PAD = 24;

async function main() {
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith("-1024.webp"))
    .sort();

  if (!files.length) {
    console.error("No processed images found. Run scripts/process-photos.mjs first.");
    process.exit(1);
  }

  const rows = Math.ceil(files.length / COLS);
  const width = PAD * 2 + COLS * TILE_W + (COLS - 1) * GAP;
  const height = PAD * 2 + rows * (TILE_H + GAP) - GAP + 26;

  const composites = [];

  for (const [i, file] of files.entries()) {
    const tile = await sharp(join(DIR, file))
      .resize(TILE_W, TILE_H, { fit: "cover" })
      .toBuffer();

    composites.push({
      input: tile,
      left: PAD + (i % COLS) * (TILE_W + GAP),
      top: PAD + Math.floor(i / COLS) * (TILE_H + GAP),
    });

    const label = Buffer.from(
      `<svg width="${TILE_W}" height="26"><text x="4" y="18" font-family="monospace" font-size="15" fill="#d4b668">${file.replace("-1024.webp", "")}</text></svg>`,
    );
    composites.push({
      input: label,
      left: PAD + (i % COLS) * (TILE_W + GAP),
      top: PAD + Math.floor(i / COLS) * (TILE_H + GAP) + TILE_H,
    });
  }

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 5, g: 4, b: 4 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(OUT);

  console.log(`Contact sheet written to ${OUT} (${files.length} images)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
