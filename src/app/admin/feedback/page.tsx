"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Testimonial } from "@/lib/feedback-schema";
import { TestimonialCard } from "@/app/_components/TestimonialCard";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; entry: Testimonial }
  | { kind: "done"; action: "approve" | "reject"; entry: Testimonial };

async function call(token: string, action?: "approve" | "reject") {
  const res = await fetch("/api/feedback/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action }),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: Testimonial; error?: string };
  if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
  return body;
}

export default function ReviewFeedbackPage() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The token lives in the fragment so it never reaches server logs or referrers.
    const t = new URLSearchParams(window.location.hash.slice(1)).get("token");
    setToken(t);
    if (!t) { setState({ kind: "error", message: "This review link is missing its token." }); return; }
    call(t)
      .then((body) => body.data ? setState({ kind: "ready", entry: body.data }) : setState({ kind: "error", message: "Not found." }))
      .catch((error: Error) => setState({ kind: "error", message: error.message }));
  }, []);

  async function decide(action: "approve" | "reject") {
    if (!token || state.kind !== "ready") return;
    setBusy(true);
    try {
      await call(token, action);
      setState({ kind: "done", action, entry: state.entry });
    } catch (error) {
      setState({ kind: "error", message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <p className="mb-3 text-xs uppercase tracking-[0.4em] text-foreground-muted">Review feedback</p>
      {state.kind === "loading" && <p className="text-sm text-foreground-muted">Loading…</p>}
      {state.kind === "error" && (
        <>
          <h1 className="mb-2 font-serif text-3xl">Nothing to review</h1>
          <p className="text-sm text-foreground-muted">{state.message}</p>
        </>
      )}
      {state.kind === "ready" && (
        <>
          <h1 className="mb-6 font-serif text-3xl">Publish this note?</h1>
          <TestimonialCard testimonial={state.entry} />
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide("approve")}
              className="flex-1 rounded-full bg-foreground px-6 py-3 text-sm text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              Approve &amp; publish
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide("reject")}
              className="flex-1 rounded-full border border-foreground/20 px-6 py-3 text-sm transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        </>
      )}
      {state.kind === "done" && (
        <>
          <h1 className="mb-2 font-serif text-3xl">{state.action === "approve" ? "Published." : "Discarded."}</h1>
          <p className="mb-6 text-sm text-foreground-muted">
            {state.action === "approve"
              ? `${state.entry.name}'s note is now on the kind words page.`
              : "It won't appear anywhere on the site."}
          </p>
          <Link href="/feedback" className="w-fit rounded-full border border-foreground/20 px-6 py-2.5 text-sm transition-all hover:bg-foreground hover:text-background">
            View kind words
          </Link>
        </>
      )}
    </main>
  );
}
