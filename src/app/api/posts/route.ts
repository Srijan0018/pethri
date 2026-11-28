import { NextRequest, NextResponse } from "next/server";
import {
  hasActorPermission,
  resolveRequestActor,
} from "@/lib/server-auth";
import { createPostRepository, getPostsRepository } from "@/lib/repositories/posts";
import { parsePagination, sanitizeText } from "@/lib/repositories/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { PostCategory, PostFormat } from "@/types/pethri";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const locality = searchParams.get("locality") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const verification = searchParams.get("verification") ?? undefined;
    const sourceKind = searchParams.get("sourceKind") ?? undefined;
    const playlistSlug = searchParams.get("playlistSlug") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const onlyMoments = searchParams.get("moments") === "true";
    const requestedPending = searchParams.get("includePending") === "true";
    const authorId = searchParams.get("authorId") ?? undefined;
    const { limit, offset } = parsePagination(searchParams);

    const actor = await resolveRequestActor(req);

    const result = await getPostsRepository({
      locality,
      category,
      verification,
      sourceKind,
      playlistSlug,
      search,
      onlyMoments,
      includePending:
        requestedPending &&
        Boolean(
          actor &&
            (actor.profile.role !== "citizen" ||
              (authorId && authorId === actor.profile.id))
        ),
      authorId,
      viewerId: actor?.profile.id,
      limit,
      offset,
    });

    return NextResponse.json(result, {
      headers: actor
        ? { "Cache-Control": "private, no-store" }
        : { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load articles." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`posts-post:${ip}`, 15, 60);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many submission attempts. Please slow down and try again shortly." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const actor = await resolveRequestActor(req);
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized: sign in to submit news tips or publish stories." },
        { status: 401 }
      );
    }
    if (actor.profile.isSuspended) {
      return NextResponse.json(
        { error: "Forbidden: suspended accounts cannot submit or publish content." },
        { status: 403 }
      );
    }

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

    // Authorised Newsroom Publishing (strictly ignores body.authorId and checks session actor permission)
    if (body.publishMode === "newsroom" || body.publishMode === "sponsored") {
      if (!hasActorPermission(actor, "publish")) {
        return NextResponse.json(
          {
            error:
              "Forbidden: only authorised staff with active publishing permission can publish newsroom or sponsored articles.",
          },
          { status: 403 }
        );
      }
    }
    if (body.isBreaking && !hasActorPermission(actor, "breaking")) {
      return NextResponse.json(
        { error: "Forbidden: breaking news requires explicit editorial permission." },
        { status: 403 }
      );
    }

    const result = await createPostRepository({
      authorId: actor.profile.id,
      authorProfile: actor.profile,
      localityId: body.localityId,
      category: body.category as PostCategory,
      format,
      sourceKind: body.publishMode === "sponsored" ? "sponsored" : body.publishMode === "newsroom" ? "newsroom" : "citizen",
      headline: sanitizeText(body.headline, 300),
      body: sanitizeText(body.body, 10000),
      isBreaking: Boolean(body.isBreaking),
      isMoment: Boolean(body.isMoment),
      media,
      approxLandmark: sanitizeText(body.approxLandmark, 200),
      sharePreciseLocation: Boolean(body.sharePreciseLocation),
      preciseLat: body.sharePreciseLocation ? body.preciseLat : null,
      preciseLng: body.sharePreciseLocation ? body.preciseLng : null,
      publishMode: body.publishMode,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid submission payload." },
      { status: 400 }
    );
  }
}
