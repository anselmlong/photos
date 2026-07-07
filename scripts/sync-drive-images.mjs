/**
 * Incrementally sync public Google Drive folder images into this portfolio.
 *
 * Requires a Google Drive API key with the Drive API enabled. For public folders,
 * an API key is enough; private folders need OAuth/service-account auth and are
 * intentionally out of scope for this lightweight ingest path.
 *
 * Usage:
 *   GOOGLE_DRIVE_API_KEY=... bun run sync:drive
 *   bun run sync:drive -- --folder=https://drive.google.com/drive/folders/... --category=events
 */
import sharp from "sharp";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_FOLDER_ID = "1NEJ1ePEb41NWw0CAvKXlNEwigsPQ6eKN";
const API_BASE = "https://www.googleapis.com/drive/v3/files";
const MEDIA_TS = "src/lib/media.ts";
const RAW_DIR = "public/images/drive";
const OUT_DIR = "public/gallery";
const MAX_W = 2560;

const CATEGORIES = [
  "portraits",
  "weddings",
  "events",
  "sports",
  "landscape",
  "street",
];

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/tiff": ".tif",
  "image/avif": ".avif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

function parseArgs(argv) {
  const args = {
    category: process.env.DRIVE_SYNC_CATEGORY || "events",
    dryRun: false,
    featured: /^true$/i.test(process.env.DRIVE_SYNC_FEATURED || ""),
    folder: process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID,
    force: false,
    newest: process.env.DRIVE_SYNC_NEWEST || "",
    since: process.env.DRIVE_SYNC_SINCE || "",
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--featured") args.featured = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg.startsWith("--category=")) args.category = arg.slice("--category=".length);
    else if (arg.startsWith("--folder=")) args.folder = arg.slice("--folder=".length);
    else if (arg.startsWith("--newest=")) args.newest = arg.slice("--newest=".length);
    else if (arg.startsWith("--since=")) args.since = arg.slice("--since=".length);
    else if (!arg.startsWith("--")) args.folder = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!CATEGORIES.includes(args.category)) {
    throw new Error(`Invalid category "${args.category}". Expected one of: ${CATEGORIES.join(", ")}`);
  }

  args.folderId = extractFolderId(args.folder);
  args.newest = args.newest === "" ? null : Number(args.newest);
  if (args.newest !== null && (!Number.isInteger(args.newest) || args.newest < 1)) {
    throw new Error("--newest must be a positive integer");
  }
  args.sinceTime = null;
  if (args.since) {
    args.sinceTime = Date.parse(args.since);
    if (Number.isNaN(args.sinceTime)) {
      throw new Error(`Could not parse --since date: ${args.since}`);
    }
  }
  return args;
}

async function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    let text;
    try {
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function extractFolderId(value) {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/\/folders\/([^/?#]+)/);
  const id = match?.[1] || trimmed;

  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error(`Could not parse a Google Drive folder ID from: ${value}`);
  }

  return id;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleize(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function slugForDriveFile(file) {
  const base = slugify(file.name) || "drive-image";
  const suffix = file.id.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  return base.endsWith(suffix) ? base : `${base}-${suffix}`;
}

function sourceExt(file) {
  const byName = path.extname(file.name).toLowerCase();
  return byName || EXT_BY_MIME[file.mimeType] || ".jpg";
}

function driveOriginal(file) {
  const version = file.md5Checksum || file.modifiedTime || "unknown-version";
  return `drive:${file.id}:${version}:${file.name}`;
}

function existingDriveId(original) {
  const match = String(original || "").match(/^drive:([^:]+):/);
  return match?.[1] || null;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function listDriveImages(folderId, apiKey) {
  const files = [];
  let pageToken;

  do {
    const params = new URLSearchParams({
      key: apiKey,
      q: `'${folderId}' in parents and trashed=false and mimeType contains 'image/'`,
      fields:
        "nextPageToken,files(id,name,mimeType,modifiedTime,md5Checksum,size,imageMediaMetadata(width,height))",
      includeItemsFromAllDrives: "true",
      orderBy: "name_natural",
      pageSize: "100",
      supportsAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${API_BASE}?${params}`);
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`Drive list failed (${res.status}): ${body}`);
    }

    const data = JSON.parse(body);
    files.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files.filter((file) => file.mimeType?.startsWith("image/"));
}

async function downloadDriveFile(file, apiKey, outPath) {
  const params = new URLSearchParams({ alt: "media", key: apiKey });
  const res = await fetch(`${API_BASE}/${file.id}?${params}`);
  if (!res.ok) {
    throw new Error(`Drive download failed for ${file.name} (${res.status}): ${await res.text()}`);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  const bytes = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, bytes);
}

async function optimizeImage(srcPath, slug) {
  await mkdir(OUT_DIR, { recursive: true });

  const img = sharp(srcPath, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const srcW = meta.width ?? MAX_W;
  const srcH = meta.height ?? MAX_W;
  const outW = Math.min(srcW, MAX_W);
  const outH = Math.round((srcH * outW) / srcW);

  const base = sharp(srcPath, { failOn: "none" })
    .rotate()
    .resize({ width: outW, withoutEnlargement: true });

  await base.clone().avif({ quality: 55 }).toFile(path.join(OUT_DIR, `${slug}.avif`));
  await base.clone().webp({ quality: 80 }).toFile(path.join(OUT_DIR, `${slug}.webp`));
  await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT_DIR, `${slug}.jpg`));

  const blurBuf = await sharp(srcPath, { failOn: "none" })
    .rotate()
    .resize({ width: 20 })
    .jpeg({ quality: 40 })
    .toBuffer();

  return {
    src: `/gallery/${slug}.jpg`,
    avif: `/gallery/${slug}.avif`,
    webp: `/gallery/${slug}.webp`,
    width: outW,
    height: outH,
    orientation: outW >= outH ? "landscape" : "portrait",
    blurDataURL: `data:image/jpeg;base64,${blurBuf.toString("base64")}`,
  };
}

function parseExportedJsonArray(text, exportName, nextExportName) {
  const startMarker = `export const ${exportName}`;
  const start = text.indexOf(startMarker);
  if (start === -1) throw new Error(`Could not find ${startMarker} in ${MEDIA_TS}`);

  const equals = text.indexOf("= ", start);
  const endMarker = `;\n\nexport const ${nextExportName}`;
  const end = text.indexOf(endMarker, equals);
  if (equals === -1 || end === -1) {
    throw new Error(`Could not parse ${exportName} from ${MEDIA_TS}`);
  }

  return JSON.parse(text.slice(equals + 2, end));
}

async function readMedia() {
  const text = await readFile(MEDIA_TS, "utf8");
  return {
    photos: parseExportedJsonArray(text, "photos", "videos"),
    videos: parseExportedJsonArray(text, "videos", "featuredPhotos"),
  };
}

async function writeMedia({ photos, videos }) {
  const ts = `// AUTO-GENERATED by scripts/generate-media.mjs or scripts/sync-drive-images.mjs - do not edit by hand.
// Drive sync preserves existing category, featured, and alt fields when refreshing a Drive file.

export type Category =
  | "portraits"
  | "weddings"
  | "events"
  | "sports"
  | "landscape"
  | "street";

export interface Photo {
  slug: string;
  src: string;
  avif: string;
  webp: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
  blurDataURL: string;
  alt: string;
  category: Category;
  featured: boolean;
  original: string;
}

export interface VideoClip {
  slug: string;
  title: string;
  clip: string;
  poster: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
  original: string;
}

export const categories: { id: Category; label: string }[] = [
  { id: "portraits", label: "Portraits" },
  { id: "weddings", label: "Weddings" },
  { id: "events", label: "Events" },
  { id: "sports", label: "Sports" },
  { id: "landscape", label: "Landscape" },
  { id: "street", label: "Street" },
];

export const photos: Photo[] = ${JSON.stringify(photos, null, 2)};

export const videos: VideoClip[] = ${JSON.stringify(videos, null, 2)};

export const featuredPhotos = photos.filter((p) => p.featured);
`;

  await writeFile(MEDIA_TS, ts);
}

async function derivativesExist(slug) {
  const files = [`${slug}.jpg`, `${slug}.webp`, `${slug}.avif`].map((file) => path.join(OUT_DIR, file));
  return (await Promise.all(files.map(exists))).every(Boolean);
}

function printHelp() {
  console.log(`Usage: bun run sync:drive -- [options] [folder-url-or-id]

Options:
  --folder=<url-or-id>   Google Drive folder URL or ID
  --category=<category>  Default category for new photos (${CATEGORIES.join(", ")})
  --featured            Mark newly imported photos as featured
  --force               Re-download and re-optimize matched Drive photos
  --newest=<count>      Sync only the newest N images by Drive modified time
  --since=<date>        Sync only images modified on or after this date
  --dry-run             List changes without writing files
  --help                Show this help

Environment:
  GOOGLE_DRIVE_API_KEY   Required Drive API key
  GOOGLE_DRIVE_FOLDER_ID Optional default folder ID
  DRIVE_SYNC_CATEGORY    Optional default category for new photos
  DRIVE_SYNC_FEATURED    Optional true/false for new photos
  DRIVE_SYNC_NEWEST      Optional newest-image limit
  DRIVE_SYNC_SINCE       Optional modified-time cutoff
`);
}

async function main() {
  await loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_DRIVE_API_KEY is required. Create a Google Cloud API key with the Drive API enabled, then add it to .env.local or your shell."
    );
  }

  const { photos, videos } = await readMedia();
  let driveFiles = await listDriveImages(args.folderId, apiKey);
  driveFiles.sort((a, b) => Date.parse(b.modifiedTime || 0) - Date.parse(a.modifiedTime || 0));

  if (args.sinceTime !== null) {
    driveFiles = driveFiles.filter((file) => Date.parse(file.modifiedTime || 0) >= args.sinceTime);
  }
  if (args.newest !== null) {
    driveFiles = driveFiles.slice(0, args.newest);
  }

  let added = 0;
  let changed = 0;
  let unchanged = 0;
  const nextPhotos = [...photos];

  for (const file of driveFiles) {
    const generatedSlug = slugForDriveFile(file);
    const original = driveOriginal(file);
    const existingIndex = nextPhotos.findIndex(
      (photo) => photo.slug === generatedSlug || existingDriveId(photo.original) === file.id
    );
    const existing = existingIndex === -1 ? null : nextPhotos[existingIndex];
    const slug = existing?.slug || generatedSlug;

    const isCurrent = existing?.original === original && (await derivativesExist(existing.slug));
    if (isCurrent && !args.force) {
      unchanged += 1;
      continue;
    }

    if (args.dryRun) {
      if (existing) changed += 1;
      else added += 1;
      console.log(`${existing ? "update" : "add"} ${file.name} -> ${slug}`);
      continue;
    }

    const rawPath = path.join(RAW_DIR, `${slug}${sourceExt(file)}`);
    await downloadDriveFile(file, apiKey, rawPath);
    const optimized = await optimizeImage(rawPath, slug);
    const entry = {
      slug,
      ...optimized,
      alt: existing?.alt || titleize(slug.replace(/-[a-z0-9]{8}$/, "")),
      category: existing?.category || args.category,
      featured: existing?.featured ?? args.featured,
      original,
    };

    if (existingIndex === -1) {
      nextPhotos.push(entry);
      added += 1;
    } else {
      nextPhotos[existingIndex] = entry;
      changed += 1;
    }

    console.log(`${existing ? "Updated" : "Added"} ${file.name} -> ${slug}`);
  }

  if (!args.dryRun && (added > 0 || changed > 0)) {
    await writeMedia({ photos: nextPhotos, videos });
  }

  console.log(
    `Drive sync complete: ${driveFiles.length} remote images, ${added} added, ${changed} updated, ${unchanged} unchanged`
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
