import { getHostPresence, getMessages, getRedis, isValidSession } from "@/lib/chat-store";

export const runtime = "nodejs";

/** Visitor polls for the thread. Returns messages from index `after` onward. */
export async function GET(req: Request) {
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "Live chat isn't configured yet." }, { status: 503 });
  }

  const url = new URL(req.url);
  const session = url.searchParams.get("session");
  const after = Math.max(0, parseInt(url.searchParams.get("after") ?? "0", 10) || 0);

  if (!isValidSession(session)) {
    return Response.json({ error: "Invalid session." }, { status: 400 });
  }

  const messages = await getMessages(redis, session, after);
  const total = after + messages.length;
  const hostSeen = await getHostPresence(redis);

  return Response.json(
    { messages, total, hostSeen },
    { headers: { "Cache-Control": "no-store" } }
  );
}
