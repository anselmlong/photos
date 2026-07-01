import Link from "next/link";
import { Navigation } from "@/app/_components/Navigation";

export default function BookingSuccessPage() {
  return (
    <>
      <Navigation variant="solid" />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.4em] text-foreground-muted">Received</p>
        <h1 className="mb-3 font-serif text-3xl md:text-4xl">Enquiry received</h1>
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-foreground-muted">
          Thank you. Anselm will review your brief and reply with a personalised quote.
        </p>
        <Link
          href="/"
          className="rounded-full border border-foreground/20 px-6 py-2.5 text-sm transition-all duration-300 hover:bg-foreground hover:text-background"
        >
          Back to portfolio
        </Link>
      </main>
    </>
  );
}
