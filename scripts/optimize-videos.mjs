/**
 * Transcode raw videos in public/videos/ into short, web-optimized highlight clips
 * in public/clips/. Trims to a highlight window, downscales to 1080p, caps bitrate,
 * adds faststart, and extracts a poster frame. Writes scripts/.video-manifest.json.
 *
 * Requires ffmpeg/ffprobe on PATH. Run: bun run scripts/optimize-videos.mjs
 */
import { execFileSync } from "node:child_process";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "public/videos";
const OUT = "public/clips";

// Per-file highlight window {start, duration} in seconds. Defaults applied otherwise.
// Tuned tomorrow with Anselm; for now grab a representative 20-30s from each.
const CLIPS = {
  "008.mp4": { start: 20, duration: 25, title: "Reel 008" },
  "012.mp4": { start: 10, duration: 25, title: "Reel 012" },
  "015.mp4": { start: 5, duration: 22, title: "Reel 015" },
  "016.mp4": { start: 15, duration: 25, title: "Reel 016" },
  "018.mp4": { start: 30, duration: 25, title: "Reel 018" }, // 4K source
  "019.mp4": { start: 30, duration: 25, title: "Reel 019" },
  "UKC 2022 Video D2.mp4": { start: 10, duration: 28, title: "UKC 2022" },
  "legacy_cropped.mp4": { start: 0, duration: 45, title: "Legacy" }, // already web-sized
};
const DEFAULT = { start: 0, duration: 25 };

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ffprobeWxH = (file) => {
  const out = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=p=0",
      file,
    ],
    { encoding: "utf8" }
  ).trim();
  const [w, h] = out.split(",").map(Number);
  return { w, h };
};

async function main() {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".mp4"));

  const manifest = [];
  for (const file of files) {
    const slug = slugify(file);
    const cfg = { ...DEFAULT, ...(CLIPS[file] || {}) };
    const srcPath = path.join(SRC, file);
    const outMp4 = path.join(OUT, `${slug}.mp4`);
    const outPoster = path.join(OUT, `${slug}-poster.jpg`);

    console.log(`Transcoding ${file} (start ${cfg.start}s, ${cfg.duration}s)...`);
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-ss", String(cfg.start),
        "-i", srcPath,
        "-t", String(cfg.duration),
        "-vf", "scale='min(1920,iw)':-2:flags=lanczos",
        "-c:v", "libx264",
        "-profile:v", "high",
        "-preset", "slow",
        "-crf", "23",
        "-maxrate", "6M",
        "-bufsize", "12M",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ac", "2",
        outMp4,
      ],
      { stdio: ["ignore", "ignore", "inherit"] }
    );

    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-ss", "1",
        "-i", outMp4,
        "-frames:v", "1",
        "-q:v", "3",
        outPoster,
      ],
      { stdio: ["ignore", "ignore", "inherit"] }
    );

    const { w, h } = ffprobeWxH(outMp4);
    manifest.push({
      slug,
      title: cfg.title || slug,
      clip: `/clips/${slug}.mp4`,
      poster: `/clips/${slug}-poster.jpg`,
      width: w,
      height: h,
      orientation: w >= h ? "landscape" : "portrait",
      original: file,
    });
    console.log(`  ✓ ${slug} (${w}x${h})`);
  }

  await writeFile("scripts/.video-manifest.json", JSON.stringify(manifest, null, 2));
  console.log(`\nDone: ${manifest.length} clips → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
