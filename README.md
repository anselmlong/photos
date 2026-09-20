# Anselm Long Photography Portfolio

A clean, editorial-style photography portfolio built with Next.js 15, featuring:

- 📸 Masonry grid gallery with smooth animations
- 🔍 Full-screen lightbox with keyboard navigation
- 🏷️ Category filtering (portraits, families, events, lifestyle, kids)
- 🌓 Dark/light mode support
- 📱 Fully responsive design
- ✨ GSAP animations

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS v4
- **Animations:** GSAP
- **Fonts:** Playfair Display (serif) + Source Sans 3
- **Package Manager:** Bun

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build

# Start production server
bun start
```

## Booking Quote Emails

The `/booking` form posts to `/api/enquiry`. That route sends Anselm an editable quote-builder link; opening the link lets you revise the quote and download a client-ready PDF.

Create environment variables from `.env.example`:

```bash
RESEND_API_KEY=...
ADMIN_EMAIL=anselmpius@gmail.com
RESEND_FROM_EMAIL="Anselm Long Bookings <bookings@anselmlong.com>"
NEXT_PUBLIC_URL=https://photos.anselmlong.com
```

For production email delivery, `RESEND_FROM_EMAIL` should use a sender on a domain verified in Resend. If Resend is missing or fails and `TELEGRAM_BOT_TOKEN` plus `TELEGRAM_CHAT_ID` are configured, the enquiry falls back to a Telegram notification with the same editable quote link.

## Adding Photos

The site reads gallery data from `src/lib/media.ts` and optimized image files from
`public/gallery/`.

### Google Drive Sync

Recommended for ongoing portfolio updates:

1. Share the Drive folder as "Anyone with the link can view".
2. Enable the Google Drive API in Google Cloud.
3. Create an API key and add it to `.env.local`:

```bash
GOOGLE_DRIVE_API_KEY=...
GOOGLE_DRIVE_FOLDER_ID=1NEJ1ePEb41NWw0CAvKXlNEwigsPQ6eKN
DRIVE_SYNC_CATEGORY=events
DRIVE_SYNC_SINCE=2026-07-01
```

4. Preview the sync:

```bash
bun run sync:drive -- --dry-run
```

Use `--since=YYYY-MM-DD` or `--newest=3` when a Drive folder contains older
source photos that should not be imported into the current gallery.

5. Download new Drive images, generate AVIF/WebP/JPG derivatives, and merge them
   into `src/lib/media.ts`:

```bash
bun run sync:drive
```

The sync is incremental. It appends new Drive files and refreshes changed Drive
files, while preserving existing `alt`, `category`, and `featured` values for
photos that were already imported.

### Automatic Sync

`.github/workflows/sync-drive-photos.yml` can check the Drive folder every six
hours, commit generated gallery changes, and let Vercel redeploy from GitHub.

Configure the repository secret:

```bash
GOOGLE_DRIVE_API_KEY=...
```

Then trigger the workflow manually once from GitHub Actions, or wait for the
scheduled run.

### Local Raw Export

For full local regeneration, place originals in `public/images/` and run:

```bash
bun run optimize:images
bun run optimize:media
```

`public/images/` is intentionally ignored because raw camera exports are large.

### Photo Categories

- `portraits`
- `weddings`
- `events`
- `sports`
- `landscape`
- `street`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel Dashboard
3. Set up custom domain: `photos.anselmlong.com`

### Custom Domain Setup

1. In Vercel Dashboard → Settings → Domains
2. Add `photos.anselmlong.com`
3. In your DNS provider, add:
   - CNAME: `photos` → `cname.vercel-dns.com`

## Customization

### Colors

Edit the CSS variables in `src/styles/globals.css`:

```css
:root {
  --background: oklch(0.98 0.002 90);
  --foreground: oklch(0.12 0.01 85);
  /* ... */
}
```

### Fonts

Update fonts in `src/app/layout.tsx` using Google Fonts.

## License

© Anselm Long. All rights reserved.
# Booking privacy and public request limits

Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` before deploying.
Enquiries now require the same Redis store as live chat. Missing/unavailable Redis
returns 503 before notifications or paid calls. Keep `NEXT_PUBLIC_URL` set to the
canonical site origin. Requests with another browser Origin are rejected.

Quote notifications contain a random 256-bit capability in a URL fragment.
Names, email, phone and venue are stored only in Redis with a 24-hour TTL; the
fragment is removed from browser history immediately and exchanged via a POST
body. The quote response is not cacheable. Anyone with the notification link can
view the quote within its expiry, so treat the link like a password. Reopen the
notification to reload a quote. Existing personal-data query links are no longer
supported; this change cannot erase links already sent or historical logs.

Shared Redis counters permit five enquiries, thirty visitor chat sends and sixty
quote resolutions per minute across all instances. The JSON body cap is 32 KiB.
These aggregate ceilings bound notification spam without trusting spoofable IP
headers, but a determined visitor can exhaust a bucket; authenticated/per-visitor
quotas and chat-session ownership are follow-ups. Email/Telegram notification
content still contains enquiry details for the intended recipient.

Run the focused parser tests with `bun test src/lib/public-request.test.ts` and
verify TypeScript with `bunx tsc --noEmit`.
