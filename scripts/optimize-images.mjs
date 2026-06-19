/**
 * Resize raw camera exports in public/images/ into web derivatives in public/gallery/.
 * Emits AVIF + WebP + JPEG at max 2560px wide, plus a tiny blur placeholder, and
 * writes scripts/.image-manifest.json with dimensions for next/image + masonry.
 *
 * Run: bun run scripts/optimize-images.mjs
 */
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "public/images";
const OUT = "public/gallery";
const MAX_W = 2560;
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleize = (slug) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

async function main() {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter((f) =>
    EXTS.has(path.extname(f).toLowerCase())
  );

  const manifest = [];
  const seen = new Set();

  for (const file of files) {
    let slug = slugify(file);
    while (seen.has(slug)) slug += "-2";
    seen.add(slug);

    const srcPath = path.join(SRC, file);
    const img = sharp(srcPath, { failOn: "none" }).rotate(); // respect EXIF orientation
    const meta = await img.metadata();
    const srcW = meta.width ?? MAX_W;
    const srcH = meta.height ?? MAX_W;
    const outW = Math.min(srcW, MAX_W);
    const outH = Math.round((srcH * outW) / srcW);

    const base = sharp(srcPath, { failOn: "none" })
      .rotate()
      .resize({ width: outW, withoutEnlargement: true });

    await base.clone().avif({ quality: 55 }).toFile(path.join(OUT, `${slug}.avif`));
    await base.clone().webp({ quality: 80 }).toFile(path.join(OUT, `${slug}.webp`));
    await base
      .clone()
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(OUT, `${slug}.jpg`));

    const blurBuf = await sharp(srcPath, { failOn: "none" })
      .rotate()
      .resize({ width: 20 })
      .jpeg({ quality: 40 })
      .toBuffer();
    const blurDataURL = `data:image/jpeg;base64,${blurBuf.toString("base64")}`;

    manifest.push({
      slug,
      src: `/gallery/${slug}.jpg`,
      avif: `/gallery/${slug}.avif`,
      webp: `/gallery/${slug}.webp`,
      width: outW,
      height: outH,
      orientation: outW >= outH ? "landscape" : "portrait",
      blurDataURL,
      alt: titleize(slug),
      original: file,
    });
    console.log(`  ✓ ${file} → ${slug} (${outW}x${outH})`);
  }

  await writeFile(
    "scripts/.image-manifest.json",
    JSON.stringify(manifest, null, 2)
  );
  console.log(`\nDone: ${manifest.length} images → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
