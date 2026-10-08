import { categories, type Category, type Photo } from "./media";

const categoryLabel = new Map<Category, string>(categories.map((c) => [c.id, c.label]));

/**
 * Alts the image scripts made from the file name ("Copy Of Dscf0630", "Anselm 9 Of 14").
 * A hand-written alt reads as a phrase, so it is kept wherever this says false.
 */
export const isFileNameAlt = (alt: string) => /^[a-z0-9 ]*\d$/i.test(alt.trim());

/**
 * How a photo is named to visitors: its category, and its place among that
 * category's photos in `sequence` (the order the grid shows them).
 */
export function describePhoto(photo: Photo, sequence: Photo[]) {
  const label = categoryLabel.get(photo.category) ?? "Photo";
  const group = sequence.filter((p) => p.category === photo.category);
  const position = `${group.findIndex((p) => p.slug === photo.slug) + 1} of ${group.length}`;
  return {
    /** Short visible caption, e.g. "Street". */
    label,
    /** "3 of 12" within the category. */
    position,
    /** For alt text and announcements, with the real alt after it when there is one. */
    description: `${label} photo ${position}${isFileNameAlt(photo.alt) ? "" : `: ${photo.alt}`}`,
  };
}
