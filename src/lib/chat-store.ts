import { Redis } from "@upstash/redis";

export type ChatMessage = {
  from: "visitor" | "host";
  text: string;
  ts: number;
};

const TTL_SECONDS = 60 * 60 * 24 * 7; // keep threads for 7 days

/** Returns a Redis client, or null if the store isn't configured yet. */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const key = (session: string) => `chat:${session}`;

/** Session ids are short alphanumeric tokens generated client-side. */
export const isValidSession = (s: unknown): s is string =>
  typeof s === "string" && /^[a-zA-Z0-9]{6,32}$/.test(s);

export async function appendMessage(redis: Redis, session: string, msg: ChatMessage) {
  await redis.rpush(key(session), msg);
  await redis.expire(key(session), TTL_SECONDS);
}

export async function getMessages(redis: Redis, session: string, from = 0): Promise<ChatMessage[]> {
  const raw = await redis.lrange<ChatMessage>(key(session), from, -1);
  return (raw ?? []).filter(
    (m): m is ChatMessage => !!m && (m.from === "visitor" || m.from === "host") && typeof m.text === "string"
  );
}

export async function countMessages(redis: Redis, session: string): Promise<number> {
  return (await redis.llen(key(session))) ?? 0;
}

const PRESENCE_KEY = "presence:host";

/** Record that Anselm just interacted with the bot (used for the "last active" badge). */
export async function touchHostPresence(redis: Redis) {
  await redis.set(PRESENCE_KEY, Date.now(), { ex: 60 * 60 * 24 * 30 });
}

export async function getHostPresence(redis: Redis): Promise<number | null> {
  const v = await redis.get<number | string>(PRESENCE_KEY);
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
