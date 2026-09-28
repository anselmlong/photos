import { z } from "zod";

export const SHOOT_TYPES = [
  "Portraits",
  "Graduation",
  "Birthday",
  "Event",
  "Corporate",
  "Wedding",
  "Family",
  "Sports",
  "Videography",
  "Other",
] as const;

export const feedbackSchema = z.object({
  name: z.string().trim().min(1, "Tell us who you are").max(60, "Keep it under 60 characters"),
  shootType: z.enum(SHOOT_TYPES, { message: "Pick the kind of shoot" }),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  message: z
    .string()
    .trim()
    .min(10, "A sentence or two, please")
    .max(1000, "Keep it under 1,000 characters"),
  // Honeypot: a hidden field real people never fill in.
  website: z.string().max(0).optional(),
});

export type FeedbackFormInput = z.input<typeof feedbackSchema>;
export type FeedbackFormValues = z.output<typeof feedbackSchema>;

export type Testimonial = {
  id: string;
  name: string;
  shootType: string;
  rating: number;
  message: string;
  /** ISO timestamp, or just a year (YYYY) when only that is known. */
  date: string;
  source: "site" | "carousell";
};
