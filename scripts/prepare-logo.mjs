/**
 * Brand asset preparation.
 *
 * The supplied logo is a gold medallion on a near-black ground, containing
 * white serif lettering. The site canvas is the same near-black, so instead of
 * fighting the mismatch we key the black away to produce transparent PNGs — the
 * emblem then composites seamlessly onto any surface in the design system.
 *
 * Outputs
 *   logo-seal.png     full medallion, transparent  (footer, social card)
 *   logo-mark.png     laurel + car only            (header, compact)
 *   logo-seal.webp    lossy variant for the web
 *   icon.png / favicon
 *   og-default.png    1200x630 social sharing card
 *
 *   node scripts/prepare-logo.mjs
 *
 * Re-run after replacing public/brand/source-logo.jpg.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = join(root, "public", "brand");
const SOURCE = join(brandDir, "source-logo.jpg");

/** Gold sits far above the black ground; these separate them. */
const BLACK_CEILING = 26;
const GOLD_FLOOR = 88;

/** Fraction of the source (centred) that forms the header "mark". */
const MARK_CROP = 0.52;

const hex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

const mean = (points) => {
  const n = points.length || 1;
  return {
    r: points.reduce((s, p) => s + p.r, 0) / n,
    g: points.reduce((s, p) => s + p.g, 0) / n,
    b: points.reduce((s, p) => s + p.b, 0) / n,
  };
};

async function main() {
  await mkdir(brandDir, { recursive: true });

  const { data, info } = await sharp(await readFile(SOURCE), {
    failOn: "none",
  })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;

  /** Gold-only pixels (red-dominant), bucketed by brightness. */
  const goldByLuma = [];

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    let alpha;
    if (luma <= BLACK_CEILING) alpha = 0;
    else if (luma >= GOLD_FLOOR) alpha = 255;
    else alpha = Math.round(((luma - BLACK_CEILING) / (GOLD_FLOOR - BLACK_CEILING)) * 255);

    data[i + 3] = alpha;

    // The medallion lettering is white, so require a real red-over-blue gap to
    // classify a pixel as gold.
    if (alpha === 255 && r - b >= 28 && g - b >= 12) {
      goldByLuma.push({ luma, r, g, b });
    }
  }

  goldByLuma.sort((a, b) => a.luma - b.luma);
  const at = (p) => mean(goldByLuma.slice(Math.floor(goldByLuma.length * p)));

  console.log(`Source:        ${info.width} x ${info.height}`);
  console.log(`Gold pixels:   ${goldByLuma.length}`);
  console.log(`Gold deep:     ${hex(at(0.2))}`);
  console.log(`Gold mid:      ${hex(at(0.55))}`);
  console.log(`Gold bright:   ${hex(at(0.85))}`);
  console.log(`Gold peak:     ${hex(at(0.98))}\n`);

  const keyed = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });

  const cropMark = (instance) => {
    const side = Math.round(info.width * MARK_CROP);
    return instance
      .clone()
      .extract({
        left: Math.round((info.width - side) / 2),
        top: Math.round((info.height - side) / 2),
        width: side,
        height: side,
      });
  };

  const emit = async (name, instance, width) => {
    const out = await instance
      .clone()
      .resize({ width, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(join(brandDir, name), out);
    console.log(
      `wrote ${name.padEnd(22)} ${(out.length / 1024).toFixed(1)} kB`,
    );
  };

  await emit("logo-seal.png", keyed, 512);
  await emit("logo-mark.png", cropMark(keyed), 256);

  const icon = await keyed
    .clone()
    .resize({ width: 256, height: 256, fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(brandDir, "icon.png"), icon);
  console.log(`wrote icon.png               ${(icon.length / 1024).toFixed(1)} kB`);

  const favicon = await sharp(icon)
    .resize({ width: 48, height: 48 })
    .png()
    .toBuffer();
  await writeFile(join(root, "src", "app", "favicon.ico"), favicon);
  console.log(`wrote src/app/favicon.ico`);

  const og = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 5, g: 4, b: 4, alpha: 1 },
    },
  })
    .composite([
      {
        input: await keyed.clone().resize({ width: 340 }).png().toBuffer(),
        left: 430,
        top: 60,
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(brandDir, "og-default.png"), og);
  console.log(`wrote og-default.png         ${(og.length / 1024).toFixed(1)} kB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});