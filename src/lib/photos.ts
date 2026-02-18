/**
 * PHOTO DATA FILE
 * 
 * To add photos:
 * 1. Drop your image into public/photos/{category}/
 * 2. Add an entry below with the path starting from /photos/
 * 
 * Example:
 * {
 *   src: "/photos/portraits/john-doe.jpg",
 *   alt: "Portrait of John",
 *   category: "portraits",
 *   caption: "Studio portrait session"
 * }
 * 
 * Categories: portraits, families, events, lifestyle, kids
 */

export type Category = "portraits" | "families" | "events" | "lifestyle" | "kids";

export interface Photo {
  src: string;
  alt: string;
  category: Category;
  caption?: string;
  featured?: boolean;
}

export const categories: { id: Category; label: string; description: string }[] = [
  { id: "portraits", label: "Portraits", description: "Individual and couple portraits" },
  { id: "families", label: "Families", description: "Family sessions and gatherings" },
  { id: "events", label: "Events", description: "Celebrations and special occasions" },
  { id: "lifestyle", label: "Lifestyle", description: "Candid everyday moments" },
  { id: "kids", label: "Kids", description: "Children's photography" },
];

// ============================================
// ADD YOUR PHOTOS BELOW
// ============================================

export const photos: Photo[] = [
  // === PORTRAITS ===
  // {
  //   src: "/photos/portraits/example.jpg",
  //   alt: "Portrait session",
  //   category: "portraits",
  //   caption: "Natural light portrait",
  //   featured: true,
  // },

  // === FAMILIES ===
  // {
  //   src: "/photos/families/example.jpg",
  //   alt: "Family portrait",
  //   category: "families",
  //   caption: "Beach family session",
  // },

  // === EVENTS ===
  // {
  //   src: "/photos/events/example.jpg",
  //   alt: "Wedding celebration",
  //   category: "events",
  //   caption: "First dance",
  // },

  // === LIFESTYLE ===
  // {
  //   src: "/photos/lifestyle/example.jpg",
  //   alt: "Candid moment",
  //   category: "lifestyle",
  // },

  // === KIDS ===
  // {
  //   src: "/photos/kids/example.jpg",
  //   alt: "Child playing",
  //   category: "kids",
  //   caption: "Joy in the moment",
  // },

  // SAMPLE PHOTOS (replace with your actual photos)
  {
    src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
    alt: "Portrait in natural light",
    category: "portraits",
    caption: "Natural light portrait",
    featured: true,
  },
  {
    src: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&q=80",
    alt: "Family moment",
    category: "families",
    caption: "Candid family moment",
  },
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    alt: "Wedding celebration",
    category: "events",
    caption: "Wedding day joy",
    featured: true,
  },
  {
    src: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&q=80",
    alt: "Lifestyle portrait",
    category: "lifestyle",
    caption: "Everyday beauty",
  },
  {
    src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
    alt: "Child portrait",
    category: "kids",
    caption: "Pure joy",
    featured: true,
  },
  {
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80",
    alt: "Studio portrait",
    category: "portraits",
    caption: "Studio session",
  },
  {
    src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80",
    alt: "Family outdoors",
    category: "families",
    caption: "Golden hour magic",
  },
  {
    src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
    alt: "Birthday party",
    category: "events",
  },
  {
    src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&q=80",
    alt: "Morning coffee",
    category: "lifestyle",
    caption: "Morning rituals",
  },
  {
    src: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&q=80",
    alt: "Kids playing",
    category: "kids",
    caption: "Adventure awaits",
  },
  {
    src: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800&q=80",
    alt: "Editorial portrait",
    category: "portraits",
    featured: true,
  },
  {
    src: "https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=800&q=80",
    alt: "Family walk",
    category: "families",
  },
];
