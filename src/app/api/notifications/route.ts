import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/server-auth";
import { isDemoModeEnabled } from "@/lib/server-config";
import {
  createSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isServerSupabaseConfigured()) {
    return isDemoModeEnabled()
      ? NextResponse.json({ notifications: [] })
      : NextResponse.json({ error: "Notifications service unavailable." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Notifications service unavailable." }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("notifications")
    .select("id, locality_id, title, message, href, is_read, created_at")
    .eq("user_id", actor.profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const localityIds = [...new Set((data ?? []).flatMap((item) => item.locality_id ? [item.locality_id] : []))];
  const { data: localities, error: localityError } = localityIds.length
    ? await supabase.from("localities").select("id, name").in("id", localityIds)
    : { data: [], error: null };
  if (localityError) {
    return NextResponse.json({ error: localityError.message }, { status: 503 });
  }
  const localityNames = new Map((localities ?? []).map((locality) => [locality.id, locality.name]));

  return NextResponse.json({
    notifications: (data ?? []).map((item) => ({
      id: item.id,
      localityId: item.locality_id,
      localityName: item.locality_id
        ? localityNames.get(item.locality_id) ?? ""
        : "",
      title: item.title,
      message: item.message,
      href: item.href ?? "/",
      isRead: item.is_read,
      createdAt: item.created_at,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  let id: string | null = null;
  try {
    const body = await req.json();
    if (body && typeof body.id === "string") id = body.id;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!isServerSupabaseConfigured()) {
    return isDemoModeEnabled()
      ? NextResponse.json({ updated: true })
      : NextResponse.json({ error: "Notifications service unavailable." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Notifications service unavailable." }, { status: 503 });
  }
  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", actor.profile.id);
  if (id) query = query.eq("id", id);
  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  return NextResponse.json({ updated: true });
}
