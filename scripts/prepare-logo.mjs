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

/**
 * Padding added around the measured emblem, as a fraction of the emblem's own
 * width and height.
 *
 * Horizontal padding is generous so the oval mask below still clears the
 * outermost leaf tips. Vertical padding is deliberately tight: the medallion's
 * inner ring passes only ~11% above the wreath, so a tall crop pulls a faint
 * arc of it into the emblem.
 */
const MARK_PADDING_X = 0.1;
const MARK_PADDING_Y = 0.06;

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

  /**
   * Locate the laurel wreath and measure its bounding box.
   *
   * The medallion is not vertically centred: the wreath sits in the upper part
   * of the seal, with the wordmark below it and a tagline below that, so a
   * centred square crop lands across the lettering and clips the first and
   * last letters of "TAXI NORD LILLE" into the emblem.
   *
   * Rather than hard-code fractions that silently break if the logo is ever
   * replaced, find the horizontal band of gold in the upper half of the image
   * and stop at the first real gap below it. The lettering is white rather
   * than gold, so the colour test excludes it regardless.
   */
  const measureEmblem = () => {
    const { width, height } = info;

    const isGold = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return false;
      const i = (y * width + x) * channels;
      return (
        data[i + 3] > 0 &&
        data[i] - data[i + 2] >= 28 &&
        data[i + 1] - data[i + 2] >= 12
      );
    };

    // Centre of the medallion, from the full extent of the gold (the ring).
    let outerLeft = width;
    let outerRight = 0;
    let outerTop = height;
    let outerBottom = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!isGold(x, y)) continue;
        if (x < outerLeft) outerLeft = x;
        if (x > outerRight) outerRight = x;
        if (y < outerTop) outerTop = y;
        if (y > outerBottom) outerBottom = y;
      }
    }
    const radius = (outerRight - outerLeft) / 2;

    // Label every connected blob of gold. A small tolerance radius absorbs the
    // gaps that keying and anti-aliasing open in the thin gold strokes.
    const TOLERANCE = 3;
    const seen = new Uint8Array(width * height);
    const blobs = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const start = y * width + x;
        if (seen[start] || !isGold(x, y)) continue;

        const queue = [start];
        seen[start] = 1;
        let left = x;
        let right = x;
        let top = y;
        let bottom = y;
        let count = 0;

        while (queue.length) {
          const idx = queue.pop();
          const px = idx % width;
          const py = (idx - px) / width;
          count++;

          if (px < left) left = px;
          if (px > right) right = px;
          if (py < top) top = py;
          if (py > bottom) bottom = py;

          for (let dy = -TOLERANCE; dy <= TOLERANCE; dy++) {
            for (let dx = -TOLERANCE; dx <= TOLERANCE; dx++) {
              const nx = px + dx;
              const ny = py + dy;
              if (!isGold(nx, ny)) continue;
              const n = ny * width + nx;
              if (seen[n]) continue;
              seen[n] = 1;
              queue.push(n);
            }
          }
        }

        blobs.push({ left, right, top, bottom, area: count });
      }
    }

    // The medallion is drawn as two concentric rings, the wreath, the car and
    // its two wheels, then — below the wordmark — a flourish and a diamond.
    // Only the middle group belongs in the emblem.
    //
    // The rings are told apart by scale, the flourish by position: it sits
    // outside the wreath's frame. Taking the largest non-ring blob and then
    // keeping whatever falls inside its bounding box gets exactly the emblem,
    // and does not depend on hard-coded pixel offsets.
    const rings = blobs.filter(
      (b) => Math.max(b.right - b.left, b.bottom - b.top) > radius * 1.4,
    );
    const rest = blobs.filter(
      (b) => Math.max(b.right - b.left, b.bottom - b.top) <= radius * 1.4,
    );

    if (!rest.length) {
      throw new Error("No emblem found — every gold blob looked like a ring.");
    }

    // Rank by area, not by longest side: the flourish under the wordmark is
    // wider (745px) than the wreath is (682px) but two orders of magnitude
    // smaller, so a longest-side comparison would pick the wrong blob.
    const wreath = rest.reduce((a, b) => (b.area > a.area ? b : a));

    const SLOP = 8;
    const emblemBlobs = rest.filter(
      (b) =>
        b.left >= wreath.left - SLOP &&
        b.right <= wreath.right + SLOP &&
        b.top >= wreath.top - SLOP &&
        b.bottom <= wreath.bottom + SLOP,
    );

    console.log(
      `Gold blobs:    ${blobs.length} total — ${rings.length} ring(s) dropped, ` +
        `${emblemBlobs.length} make up the emblem`,
    );

    return {
      top: Math.min(...emblemBlobs.map((b) => b.top)),
      bottom: Math.max(...emblemBlobs.map((b) => b.bottom)),
      left: Math.min(...emblemBlobs.map((b) => b.left)),
      right: Math.max(...emblemBlobs.map((b) => b.right)),
    };
  };

  const emblem = measureEmblem();

  // A laurel wreath is wider than it is tall. Forcing a square crop pads the
  // sides with empty space and — worse — reaches above the wreath into the
  // medallion's ring, dragging an arc of it into the emblem. So the crop keeps
  // the emblem's own proportions and the components size it accordingly.
  const padX = Math.round((emblem.right - emblem.left) * MARK_PADDING_X);
  const padY = Math.round((emblem.bottom - emblem.top) * MARK_PADDING_Y);

  const markRegion = {
    left: Math.max(0, emblem.left - padX),
    top: Math.max(0, emblem.top - padY),
    width: emblem.right - emblem.left + padX * 2,
    height: emblem.bottom - emblem.top + padY * 2,
  };

  // Padding makes the crop square enough to breathe, but its corners then
  // reach the medallion's ring and drag faint arcs into the emblem. The wreath
  // is itself oval, so masking the crop to the inscribed ellipse removes the
  // corners and reads as deliberate rather than as damage. The radii are
  // clamped to the canvas — a larger ellipse would overflow the SVG and sharp
  // refuses a composite larger than its base.
  const mask = Buffer.from(
    `<svg width="${markRegion.width}" height="${markRegion.height}">` +
      `<ellipse cx="${markRegion.width / 2}" cy="${markRegion.height / 2}" ` +
      `rx="${markRegion.width / 2}" ry="${markRegion.height / 2}" fill="#fff"/>` +
      `</svg>`,
  );

  // Two passes on purpose. Sharp applies `composite` after `resize` in its
  // pipeline, so masking and resizing in a single instance would scale the
  // image first and then try to lay the full-size mask over a smaller canvas,
  // which sharp rejects. Both steps are therefore written out to a buffer
  // before the caller gets an instance to resize.
  const cropMark = async (instance) => {
    const cropped = await instance.clone().extract(markRegion).png().toBuffer();
    const masked = await sharp(cropped)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
    return sharp(masked);
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
  await emit("logo-mark.png", await cropMark(keyed), 256);

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