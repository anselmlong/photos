import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { storeQuote, loadQuote, QUOTE_TTL_SECONDS } from "./quote-store";
import { type BookingEnquiry } from "./types";

describe("private expiring quotes", () => {
  it("stores PII behind an unguessable opaque token with a one-day TTL", async () => {
    const data = { name: "Private Client", email: "private@example.com" } as BookingEnquiry;
    const records = new Map<string, unknown>();
    const store = {
      async set(key: string, value: BookingEnquiry, options: {ex:number}) {
        assert.equal(options.ex, QUOTE_TTL_SECONDS);
        assert.equal(options.ex, 86400);
        records.set(key, value);
      },
      async get<T>(key: string) { return (records.get(key) ?? null) as T | null; },
    };
    const token = await storeQuote(store, data);
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.notEqual(await storeQuote(store, data), token);
    assert.equal([...records.keys()].some(key => key.includes(token)), false);
    assert.deepEqual(await loadQuote(store, token), data);
    assert.equal(await loadQuote(store, "../private"), null);
    assert.equal(await loadQuote(store, "f".repeat(64)), null);
    records.clear(); // The Redis TTL removes the record after expiry.
    assert.equal(await loadQuote(store, token), null);
  });
});
