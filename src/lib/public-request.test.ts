import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readPublicJson, reservePublicRequest } from "./public-request";

describe("bounded public JSON", () => {
  it("accepts a small payload", async () => {
    const request = new Request("https://photos.example", { method: "POST", body: JSON.stringify({ text: "hello" }) });
    assert.deepEqual(await readPublicJson(request), {text:"hello"});
  });
  it("rejects actual oversized bytes without trusting Content-Length", async () => {
    const request = new Request("https://photos.example", { method: "POST", body: "x".repeat(33000) });
    await assert.rejects(readPublicJson(request), {status: 413});
  });
  it("rejects malformed JSON", async () => {
    const request = new Request("https://photos.example", { method: "POST", body: "{" });
    await assert.rejects(readPublicJson(request), {status: 400});
  });
});

describe("shared public quotas", () => {
  it("rejects an unrelated browser origin before Redis access", async () => {
    const request = new Request("https://photos.example/api/enquiry", {headers:{Origin:"https://evil.example"}});
    await assert.rejects(reservePublicRequest(request, "enquiry", 5), {status:403});
  });
  it("fails closed when Redis is unconfigured", async () => {
    const previous = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    try { await assert.rejects(reservePublicRequest(new Request("https://photos.example"), "enquiry", 5), {status:503}); }
    finally { if (previous !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = previous; }
  });
  it("returns 429 for an exhausted shared counter", async () => {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-only";
    // Stubbed by hand rather than with mock.method, which Bun's node:test shim doesn't provide.
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: unknown, options?: RequestInit) => {
      const payload = JSON.parse(String(options?.body)) as unknown[];
      const pipeline = Array.isArray(payload[0]);
      return Response.json(pipeline ? [{result:6}] : {result:6});
    }) as typeof fetch;
    try { await assert.rejects(reservePublicRequest(new Request("https://photos.example"), "enquiry", 5), {status:429}); }
    finally {
      globalThis.fetch = realFetch;
      if (url === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = url;
      if (token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = token;
    }
  });
});
