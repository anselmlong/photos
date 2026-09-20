import { getRedis } from "./chat-store";

export class PublicRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Aggregate ceilings are shared across all instances and cannot be bypassed by
// inventing forwarded IP headers. Separate endpoint buckets avoid cross-route starvation.
export async function reservePublicRequest(req: Request, bucket: string, limit: number) {
  const origin = req.headers.get("origin");
  const expectedOrigin = new URL(process.env.NEXT_PUBLIC_URL ?? req.url).origin;
  if (origin && origin !== expectedOrigin) throw new PublicRequestError(403, "Origin is not allowed.");
  const redis = getRedis();
  if (!redis) throw new PublicRequestError(503, "Service is temporarily unavailable.");
  try {
    const count = await redis.eval<[], number>(
      "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 60) end; return n",
      [`public-limit:${bucket}:${Math.floor(Date.now() / 60000)}`], []);
    if (count > limit) throw new PublicRequestError(429, "Too many requests. Please try again shortly.");
  } catch (error) {
    if (error instanceof PublicRequestError) throw error;
    throw new PublicRequestError(503, "Service is temporarily unavailable.");
  }
  return redis;
}

export async function readPublicJson(req: Request): Promise<unknown> {
  if (!req.body) throw new PublicRequestError(400, "Invalid JSON.");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32 * 1024) {
        await reader.cancel();
        throw new PublicRequestError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new PublicRequestError(400, "Invalid JSON."); }
}

export function publicError(error: unknown) {
  const status = error instanceof PublicRequestError ? error.status : 503;
  return Response.json({ error: error instanceof PublicRequestError ? error.message : "Service is temporarily unavailable." },
    { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? {"Retry-After":"60"} : {}) } });
}
