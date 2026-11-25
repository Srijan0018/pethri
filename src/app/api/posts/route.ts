import { NextRequest, NextResponse } from "next/server";
import { createCitizenPost, listPosts } from "@/lib/store";
import type { PostCategory, PostFormat, VerificationTier } from "@/types/pethri";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const locality = searchParams.get("locality") ?? undefined;
  const category = (searchParams.get("category") ?? "all") as
    | PostCategory
    | "all";
  const verification = (searchParams.get("verification") ?? "all") as
    | VerificationTier
    | "all";
  const search = searchParams.get("search") ?? undefined;
  const onlyMoments = searchParams.get("moments") === "true";
  const includePending = searchParams.get("includePending") === "true";
  const authorId = searchParams.get("authorId") ?? undefined;

  const result = await listPosts({
    locality,
    category,
    verification,
    search,
    onlyMoments,
    includePending,
    authorId,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.headline || !body.body || !body.localityId || !body.category) {
      return NextResponse.json(
        { error: "Headline, description, locality, and category are required." },
        { status: 400 }
      );
    }

    const media = Array.isArray(body.media) ? body.media : [];
    const format: PostFormat =
      body.format ??
      (body.isMoment
        ? "moment_video"
        : media.length > 1
          ? "carousel"
          : media.length === 1
            ? "photo"
            : "dispatch");

    const post = await createCitizenPost({
      authorId: body.authorId,
      authorName: body.authorName,
      authorUsername: body.authorUsername,
      localityId: body.localityId,
      category: body.category,
      format,
      headline: body.headline,
      body: body.body,
      isMoment: Boolean(body.isMoment),
      sharePreciseLocation: Boolean(body.sharePreciseLocation),
      preciseLat: body.sharePreciseLocation ? body.preciseLat : null,
      preciseLng: body.sharePreciseLocation ? body.preciseLng : null,
      approxLandmark: body.approxLandmark,
      media,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid submission payload." },
      { status: 400 }
    );
  }
}
