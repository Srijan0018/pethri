import { NextRequest, NextResponse } from "next/server";
import {
  addPostCorrection,
  isActorEditorialStaff,
  listEditorialGovernanceLogs,
  listProfiles,
  listReports,
  resolveContentReport,
  reviewRuntimePost,
  updateProfileGovernance,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const actorId = req.headers.get("x-pethri-actor-id") ?? undefined;
  const logs = isActorEditorialStaff(actorId)
    ? listEditorialGovernanceLogs()
    : { articleRevisions: [], moderationLogs: [], permissionHistory: [] };

  return NextResponse.json({
    reports: isActorEditorialStaff(actorId) ? listReports() : [],
    profiles: listProfiles(),
    ...logs,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const actorId =
      req.headers.get("x-pethri-actor-id") ?? body.reviewerId ?? body.actorId;

    if (!isActorEditorialStaff(actorId)) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: editorial desk operations require accredited staff authorization.",
        },
        { status: 403 }
      );
    }

    if (body.type === "post_review") {
      const updated = reviewRuntimePost(body.postId, {
        moderationStatus: body.moderationStatus,
        verificationTier: body.verificationTier,
        isBreaking: body.isBreaking,
        moderationNotes: body.moderationNotes,
        reviewerId: actorId,
      });
      if (!updated) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json({ post: updated });
    }

    if (body.type === "post_correction") {
      if (!body.summary?.trim()) {
        return NextResponse.json(
          { error: "Correction summary is required." },
          { status: 400 }
        );
      }
      const updated = addPostCorrection(body.postId, {
        summary: body.summary,
        correctedBy: body.correctedBy ?? "Pethri Newsroom Desk",
      });
      if (!updated) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json({ post: updated });
    }

    if (body.type === "report_resolve") {
      const updated = resolveContentReport(body.reportId, body.status);
      if (!updated) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      return NextResponse.json({ report: updated });
    }

    if (body.type === "profile_governance") {
      const updated = updateProfileGovernance(body.userId, {
        role: body.role,
        isVerifiedReporter: body.isVerifiedReporter,
        isSuspended: body.isSuspended,
        actorId,
      });
      if (!updated) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ profile: updated });
    }

    return NextResponse.json(
      { error: "Invalid editorial operation" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
