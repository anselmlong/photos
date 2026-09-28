import { type Testimonial } from "./feedback-schema";

/**
 * Photography reviews carried over from Carousell (carousell.sg/u/selmm).
 * Only photography jobs belong here — leave out reviews for items sold.
 *
 * Example entry:
 * {
 *   id: "carousell-1",
 *   name: "jamie_t",
 *   shootType: "Graduation",
 *   rating: 5,
 *   message: "Anselm was super patient and the photos came back fast!",
 *   date: "2025-11-02",
 *   source: "carousell",
 * },
 */
export const carousellTestimonials: Testimonial[] = [];

export const CAROUSELL_PROFILE_URL = "https://www.carousell.sg/u/selmm/?tab=reviews";
