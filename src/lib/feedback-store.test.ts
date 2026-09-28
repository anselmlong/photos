import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { APPROVED_KEY, listApproved, loadPending, reviewFeedback, submitFeedback } from "./feedback-store";
import { feedbackSchema, type Testimonial } from "./feedback-schema";

function memoryStore() {
  const records = new Map<string, unknown>();
  return {
    records,
    async set(key: string, value: Testimonial) { records.set(key, value); },
    async get<T>(key: string) { return (records.get(key) ?? null) as T | null; },
    async del(...keys: string[]) { let n = 0; for (const k of keys) if (records.delete(k)) n++; return n; },
    async lpush(key: string, ...values: Testimonial[]) {
      const list = (records.get(key) as Testimonial[] | undefined) ?? [];
      records.set(key, [...values.reverse(), ...list]);
    },
    async lrange<T>(key: string, start: number, stop: number) {
      return ((records.get(key) as T[] | undefined) ?? []).slice(start, stop + 1);
    },
  };
}

const input = feedbackSchema.parse({ name: "Sarah T.", shootType: "Graduation", rating: "5", message: "Lovely photos, so relaxed!" });

describe("moderated feedback", () => {
  it("keeps submissions private until approved", async () => {
    const store = memoryStore();
    const { token, entry } = await submitFeedback(store, input);
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.equal([...store.records.keys()].some((k) => k.includes(token)), false);
    assert.deepEqual(await listApproved(store), []);
    assert.deepEqual(await loadPending(store, token), entry);
    assert.equal(await loadPending(store, "../x"), null);

    assert.deepEqual(await reviewFeedback(store, token, "approve"), entry);
    assert.deepEqual(await listApproved(store), [entry]);
    // A review link works exactly once.
    assert.equal(await reviewFeedback(store, token, "approve"), null);
    assert.equal((await listApproved(store)).length, 1);
    assert.ok(store.records.has(APPROVED_KEY));
  });

  it("discards rejected submissions", async () => {
    const store = memoryStore();
    const { token } = await submitFeedback(store, input);
    assert.ok(await reviewFeedback(store, token, "reject"));
    assert.deepEqual(await listApproved(store), []);
    assert.equal(await loadPending(store, token), null);
  });

  it("validates the public form", () => {
    assert.equal(input.rating, 5);
    assert.equal(feedbackSchema.safeParse({ ...input, rating: 6 }).success, false);
    assert.equal(feedbackSchema.safeParse({ ...input, message: "ok" }).success, false);
    assert.equal(feedbackSchema.safeParse({ ...input, shootType: "Heist" }).success, false);
  });
});
