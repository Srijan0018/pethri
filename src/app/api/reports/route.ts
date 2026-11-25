import { NextRequest, NextResponse } from "next/server";
import { createContentReport, listReports } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ reports: listReports() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.postId || !body.reason) {
      return NextResponse.json(
        { error: "Post ID and reason are required." },
        { status: 400 }
      );
    }
    const report = createContentReport({
      postId: body.postId,
      reason: body.reason,
      details: body.details ?? "",
      reporterUsername: body.reporterUsername,
    });
    if (!report) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
