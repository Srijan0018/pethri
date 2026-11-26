import { NextRequest, NextResponse } from "next/server";
import {
  addPostCorrection,
  listProfiles,
  listReports,
  resolveContentReport,
  reviewRuntimePost,
  updateProfileGovernance,
} from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    reports: listReports(),
    profiles: listProfiles(),
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type === "post_review") {
      const updated = reviewRuntimePost(body.postId, {
        moderationStatus: body.moderationStatus,
        verificationTier: body.verificationTier,
        isBreaking: body.isBreaking,
        moderationNotes: body.moderationNotes,
        reviewerId: body.reviewerId,
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
