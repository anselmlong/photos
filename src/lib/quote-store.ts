import { randomBytes, createHash } from "node:crypto";
import { type BookingEnquiry } from "./types";

type QuoteStore = {
  set: (key: string, data: BookingEnquiry, options: { ex: number }) => Promise<unknown>;
  get: <T>(key: string) => Promise<T | null>;
};

const key = (token: string) => `quote:${createHash("sha256").update(token).digest("hex")}`;
export const QUOTE_TTL_SECONDS = 24 * 60 * 60;

export async function storeQuote(redis: QuoteStore, data: BookingEnquiry) {
  const token = randomBytes(32).toString("hex");
  await redis.set(key(token), data, { ex: QUOTE_TTL_SECONDS });
  return token;
}

export async function loadQuote(redis: QuoteStore, token: unknown) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  return redis.get<BookingEnquiry>(key(token));
}
