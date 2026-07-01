import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().optional()
);

const optionalGuestCount = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return Number(value);
}, z.number().int().min(0, "Guest count cannot be negative").optional());

const optionalBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const requiredText = (message: string) => z.string().trim().min(1, message);

export const bookingSchema = z.object({
  name: requiredText("Name is required"),
  email: z.string().trim().email("Valid email required"),
  phone: optionalText,
  referral: optionalText,

  eventTitle: requiredText("Event title is required"),
  eventType: requiredText("Event type is required"),
  eventDate: requiredText("Event date is required"),
  startTime: requiredText("Start time is required"),
  endTime: requiredText("End time is required"),
  venue: requiredText("Venue name is required"),
  venueAddress: optionalText,

  services: z.enum(["photography", "videography", "both"]),
  duration: requiredText("Duration is required"),
  guestCount: optionalGuestCount,
  budget: optionalText,
  deliverables: z.preprocess(emptyToUndefined, z.enum(["photos", "reel", "both", "raw"]).optional()),
  turnaround: z.preprocess(emptyToUndefined, z.enum(["standard", "rush"]).optional()),

  specialRequests: optionalText,
  returningClient: optionalBoolean,
  preferredContact: z.preprocess(emptyToUndefined, z.enum(["email", "whatsapp"]).optional()),
});

export type BookingFormInput = z.input<typeof bookingSchema>;
export type BookingFormValues = z.output<typeof bookingSchema>;
