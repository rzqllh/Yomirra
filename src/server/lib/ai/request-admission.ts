import { NextResponse } from "next/server";
import { readBoundedJson } from "@/server/lib/security/read-bounded-json";

export const AI_IMAGE_BODY_LIMIT = (8 * 1024 + 64) * 1024;
export const AI_TEXT_BODY_LIMIT = 64 * 1024;

const MAX_ACTIVE_AI_REQUESTS = 8;
let activeRequests = 0;

export async function withAiRequest(
  request: Request,
  maxBodyBytes: number,
  handle: (body: unknown) => Promise<Response>,
): Promise<Response> {
  if (activeRequests >= MAX_ACTIVE_AI_REQUESTS) {
    void request.body?.cancel().catch(() => {});
    return NextResponse.json(
      { error: "Layanan AI sedang padat" },
      { status: 503, headers: { "Retry-After": "2", "Cache-Control": "no-store" } },
    );
  }

  activeRequests++;
  try {
    const body = await readBoundedJson(request, maxBodyBytes);
    if (!body.ok) {
      return NextResponse.json(
        { error: body.status === 413 ? "Payload AI terlalu besar" : "Format request tidak valid" },
        { status: body.status },
      );
    }
    return await handle(body.data);
  } finally {
    activeRequests--;
  }
}
