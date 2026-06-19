"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Msg = { from: "visitor" | "host"; text: string; ts: number };

const SESSION_KEY = "al_chat_session";

function getSession(): string {
  if (typeof window === "undefined") return "";
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(36))
      .join("")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 12)
      .padEnd(8, "0");
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

export function TelegramChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const sessionRef = useRef<string>("");
  const cursorRef = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      const res = await fetch(`/api/chat/poll?session=${session}&after=${cursorRef.current}`, {
        cache: "no-store",
      });
      if (res.status === 503) {
        setUnavailable(true);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Msg[]; total: number };
      if (data.messages?.length) {
        setMessages((prev) => [...prev, ...data.messages]);
        cursorRef.current = data.total;
      }
    } catch {
      /* network blip — next tick retries */
    }
  }, []);

  // Start session + polling loop while the panel is open.
  useEffect(() => {
    if (!open) return;
    sessionRef.current = getSession();
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [open, poll]);

  // Keep the view pinned to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionRef.current, text }),
      });
      if (res.status === 503) {
        setUnavailable(true);
      } else if (res.ok) {
        await poll(); // pull the stored copy back so ordering matches the server
      }
    } catch {
      /* swallow; visitor can retry */
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-4 z-[60] flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[oklch(0.14_0.01_85)] shadow-2xl transition-all duration-300 md:right-6",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
        style={{ height: "min(70vh, 520px)" }}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-serif text-base text-white">Chat with Anselm</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white" aria-label="Close chat">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div ref={scrollerRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {unavailable ? (
            <p className="mt-6 text-center text-sm text-white/50">
              Live chat is taking a break. Reach me at{" "}
              <a href="mailto:anselmpius@gmail.com" className="underline">
                anselmpius@gmail.com
              </a>
              .
            </p>
          ) : (
            <>
              <div className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/70">
                Hey — leave a message and I&apos;ll reply right here. Keep this tab open to see my response.
              </div>
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.from === "visitor" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                      m.from === "visitor" ? "bg-white text-black" : "bg-white/10 text-white"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {!unavailable && (
          <form onSubmit={send} className="flex items-end gap-2 border-t border-white/10 p-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Write a message…"
              className="max-h-28 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity hover:opacity-90 disabled:opacity-30"
              aria-label="Send"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.27 3.27a.5.5 0 01.67-.6l16.5 8.25a.5.5 0 010 .9L3.94 20.33a.5.5 0 01-.67-.6L6 12zm0 0h6" />
              </svg>
            </button>
          </form>
        )}
      </div>

      {/* Launcher */}
      <div className="fixed bottom-5 right-4 z-[60] md:right-6">
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-white/30" aria-hidden />}
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform duration-300 hover:scale-105 active:scale-95"
          aria-label={open ? "Close chat" : "Open chat"}
        >
        {open ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        </button>
      </div>
    </>
  );
}
