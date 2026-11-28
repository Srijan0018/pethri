import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/server-auth";
import { isActorEditorialStaff } from "@/lib/store";
import { listReportsRepository, submitContentFlagRepository } from "@/lib/repositories/reports";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor || !isActorEditorialStaff(actor.profile.id)) {
    return NextResponse.json(
      { error: "Forbidden: only editorial staff can view moderation reports." },
      { status: actor ? 403 : 401 }
    );
  }
  try {
    const result = await listReportsRepository();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list reports." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`reports-post:${ip}`, 10, 60);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many report submissions. Please wait before submitting again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const actor = await resolveRequestActor(req);
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized: sign in to submit a report." },
        { status: 401 }
      );
    }
    if (actor.profile.isSuspended) {
      return NextResponse.json(
        { error: "Forbidden: suspended accounts cannot submit reports." },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.postId || !body.reason) {
      return NextResponse.json(
        { error: "Post ID and reason are required." },
        { status: 400 }
      );
    }

    const result = await submitContentFlagRepository({
      postId: body.postId,
      reason: body.reason,
      details: body.details ?? "",
      reporterUsername: actor.profile.username,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Malformed request" },
      { status: 400 }
    );
  }
}
