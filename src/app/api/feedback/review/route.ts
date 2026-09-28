import { loadPending, reviewFeedback } from "@/lib/feedback-store";
import { publicError, readPublicJson, reservePublicRequest } from "@/lib/public-request";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

export async function POST(req: Request) {
  try {
    const redis = await reservePublicRequest(req, "feedback-review", 60);
    const body = (await readPublicJson(req)) as { token?: unknown; action?: unknown } | null;
    const token = body?.token;
    const action = body?.action;

    if (action === "approve" || action === "reject") {
      const entry = await reviewFeedback(redis, token, action);
      if (!entry) return Response.json({ error: "This link was already used or has expired." }, { status: 404, headers });
      if (action === "approve") revalidatePath("/feedback");
      return Response.json({ ok: true, action }, { headers });
    }

    const data = await loadPending(redis, token);
    return Response.json(data ? { data } : { error: "This link was already used or has expired." }, {
      status: data ? 200 : 404, headers,
    });
  } catch (error) { return publicError(error); }
}
