import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/server-auth";
import { isDemoModeEnabled } from "@/lib/server-config";
import {
  createSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isServerSupabaseConfigured()) {
    return isDemoModeEnabled()
      ? NextResponse.json({ language: "en", localityId: null })
      : NextResponse.json({ error: "Preferences service unavailable." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Preferences service unavailable." }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("user_locality_preferences")
    .select("preferred_language, primary_locality_id")
    .eq("user_id", actor.profile.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  const [localityFollowsResult, topicFollowsResult] = await Promise.all([
    supabase
      .from("locality_follows")
      .select("locality_id")
      .eq("user_id", actor.profile.id),
    supabase
      .from("topic_follows")
      .select("category_slug")
      .eq("user_id", actor.profile.id),
  ]);
  if (localityFollowsResult.error) {
    return NextResponse.json(
      { error: localityFollowsResult.error.message },
      { status: 503 }
    );
  }
  if (topicFollowsResult.error) {
    return NextResponse.json(
      { error: topicFollowsResult.error.message },
      { status: 503 }
    );
  }

  return NextResponse.json({
    language: data?.preferred_language ?? "en",
    localityId: data?.primary_locality_id ?? null,
    followedLocalities: (localityFollowsResult.data ?? []).map(
      (row) => row.locality_id
    ),
    followedTopics: (topicFollowsResult.data ?? []).map(
      (row) => row.category_slug
    ),
  });
}

export async function PUT(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (actor.profile.isSuspended) {
    return NextResponse.json({ error: "Suspended accounts cannot update preferences." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });
  }
  const input = body as {
    language?: unknown;
    localityId?: unknown;
  };
  if (input.language !== "en" && input.language !== "kn") {
    return NextResponse.json({ error: "Language must be 'en' or 'kn'." }, { status: 400 });
  }
  if (
    input.localityId !== null &&
    input.localityId !== undefined &&
    (typeof input.localityId !== "string" ||
      !UUID_PATTERN.test(input.localityId))
  ) {
    return NextResponse.json({ error: "Invalid locality identifier." }, { status: 400 });
  }
  if (!isServerSupabaseConfigured()) {
    return isDemoModeEnabled()
      ? NextResponse.json({ language: input.language, localityId: input.localityId ?? null })
      : NextResponse.json({ error: "Preferences service unavailable." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Preferences service unavailable." }, { status: 503 });
  }
  const { error } = await supabase.from("user_locality_preferences").upsert(
    {
      user_id: actor.profile.id,
      preferred_language: input.language,
      primary_locality_id: input.localityId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({
    language: input.language,
    localityId: input.localityId ?? null,
  });
}
