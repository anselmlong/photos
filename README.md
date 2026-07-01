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

### Method 1: Edit the data file (recommended)

1. Add your images to `public/photos/{category}/`
2. Edit `src/lib/photos.ts` and add entries to the `photos` array:

```typescript
{
  src: "/photos/portraits/john-doe.jpg",
  alt: "Portrait of John",
  category: "portraits",
  caption: "Studio portrait session",
  featured: true, // optional - shows a badge
}
```

### Photo Categories

- `portraits` - Individual and couple portraits
- `families` - Family sessions and gatherings
- `events` - Celebrations and special occasions
- `lifestyle` - Candid everyday moments
- `kids` - Children's photography

### Image Tips

- Recommended: 1200-2000px on the longest edge for web
- Supported formats: JPG, PNG, WebP
- Use descriptive filenames for SEO

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
