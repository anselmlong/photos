import { type Metadata } from "next";

// The booking form is a client component, so its tab title is set here.
export const metadata: Metadata = {
  title: "Book a session — Anselm Long Photography",
  description: "Tell Anselm about your event and get a tailored photography or video quote.",
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
