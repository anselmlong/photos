import { type Metadata } from "next";

// The note form is a client component, so its tab title is set here.
export const metadata: Metadata = {
  title: "Leave a note — Anselm Long Photography",
  description: "Worked with Anselm? Share how the shoot went.",
};

export default function NewFeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
