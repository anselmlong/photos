import { loadQuote } from "@/lib/quote-store";
import { publicError, readPublicJson, reservePublicRequest } from "@/lib/public-request";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const redis = await reservePublicRequest(req, "quote-resolve", 60);
    const body = await readPublicJson(req);
    const token = body && typeof body === "object" && "token" in body ? body.token : null;
    const data = await loadQuote(redis, token);
    return Response.json(data ? { data } : { error: "Quote link is invalid or expired." }, {
      status: data ? 200 : 404, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
    });
  } catch (error) { return publicError(error); }
}
