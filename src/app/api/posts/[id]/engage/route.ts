import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/server-auth";
import { engagePostRepository } from "@/lib/repositories/engagement";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`engage:${ip}`, 30, 60);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const action = body.action as "like" | "bookmark" | "share" | "comment";

    if (!["like", "bookmark", "share", "comment"].includes(action)) {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const actor = await resolveRequestActor(req);
    if (action !== "share") {
      if (!actor) {
        return NextResponse.json(
          { error: "Unauthorized: sign in to react, bookmark, or comment." },
          { status: 401 }
        );
      }
      if (actor.profile.isSuspended) {
        return NextResponse.json(
          { error: "Forbidden: suspended accounts cannot post comments or reactions." },
          { status: 403 }
        );
      }
    }

    const result = await engagePostRepository(id, action, {
      userId: actor?.profile.id,
      content: body.content,
      authorName: actor?.profile.fullName ?? body.authorName,
      authorUsername: actor?.profile.username ?? body.authorUsername,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process engagement." },
      { status: 400 }
    );
  }
}
