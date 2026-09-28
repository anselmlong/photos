import { randomBytes, createHash } from "node:crypto";
import { type FeedbackFormValues, type Testimonial } from "./feedback-schema";

type FeedbackStore = {
  set: (key: string, data: Testimonial, options: { ex: number }) => Promise<unknown>;
  get: <T>(key: string) => Promise<T | null>;
  del: (...keys: string[]) => Promise<unknown>;
  lpush: (key: string, ...values: Testimonial[]) => Promise<unknown>;
  lrange: <T>(key: string, start: number, stop: number) => Promise<T[]>;
};

// Submissions wait for Anselm's approval behind an unguessable review link,
// so nothing a stranger types reaches the public page on its own.
const pendingKey = (token: string) => `feedback:pending:${createHash("sha256").update(token).digest("hex")}`;
export const APPROVED_KEY = "feedback:approved";
export const PENDING_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MAX_APPROVED = 200;

const isToken = (token: unknown): token is string => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

export async function submitFeedback(redis: FeedbackStore, input: FeedbackFormValues, now = new Date()) {
  const token = randomBytes(32).toString("hex");
  const entry: Testimonial = {
    id: randomBytes(8).toString("hex"),
    name: input.name,
    shootType: input.shootType,
    rating: input.rating,
    message: input.message,
    date: now.toISOString(),
    source: "site",
  };
  await redis.set(pendingKey(token), entry, { ex: PENDING_TTL_SECONDS });
  return { token, entry };
}

export async function loadPending(redis: FeedbackStore, token: unknown) {
  if (!isToken(token)) return null;
  return redis.get<Testimonial>(pendingKey(token));
}

export async function reviewFeedback(redis: FeedbackStore, token: unknown, decision: "approve" | "reject") {
  const entry = await loadPending(redis, token);
  if (!entry || !isToken(token)) return null;
  // Delete first so a double-click can't publish the same note twice.
  const removed = await redis.del(pendingKey(token));
  if (removed === 0) return null;
  if (decision === "approve") await redis.lpush(APPROVED_KEY, entry);
  return entry;
}

export async function listApproved(redis: FeedbackStore): Promise<Testimonial[]> {
  const raw = await redis.lrange<Testimonial>(APPROVED_KEY, 0, MAX_APPROVED - 1);
  return (raw ?? []).filter(
    (t): t is Testimonial => !!t && typeof t.message === "string" && typeof t.name === "string"
  );
}
