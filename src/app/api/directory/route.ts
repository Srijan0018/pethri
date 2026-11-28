import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/server-auth";
import {
  createAnnouncement,
  listAnnouncements,
  listBusinesses,
  listLocalities,
} from "@/lib/store";
import {
  createSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";
import { isDemoModeEnabled } from "@/lib/server-config";
import { sanitizeText } from "@/lib/repositories/validation";

async function getDemoDirectoryResponse(locality?: string) {
  const localities = await listLocalities();
  return NextResponse.json({
    localities,
    businesses: listBusinesses(locality),
    announcements: listAnnouncements(locality),
    isDatabaseConnected: false,
    isDemoFallback: true,
  });
}

export async function GET(req: NextRequest) {
  const locality = req.nextUrl.searchParams.get("locality") ?? undefined;
  if (isServerSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      if (isDemoModeEnabled()) return getDemoDirectoryResponse(locality);
      return NextResponse.json({ error: "Directory service unavailable." }, { status: 503 });
    }
    const localityQuery = supabase
      .from("localities")
      .select("id, slug, name, name_kn, taluk, district, pincode, center_lat, center_lng, description, active_reporters, is_primary")
      .order("name");
    let businessQuery = supabase
      .from("businesses")
      .select("id, locality_id, name, category, description, phone, address, hours, is_verified, featured_image_url")
      .order("name");
    let announcementQuery = supabase
      .from("announcements")
      .select("id, locality_id, title, summary, issuer, urgency, valid_until, created_at")
      .order("created_at", { ascending: false });
    announcementQuery = announcementQuery.or(
      `valid_until.is.null,valid_until.gte.${new Date().toISOString()}`
    );
    if (locality && locality !== "all") {
      businessQuery = businessQuery.eq("locality_id", locality);
      announcementQuery = announcementQuery.eq("locality_id", locality);
    }
    const [localityResult, businessResult, announcementResult] =
      await Promise.all([localityQuery, businessQuery, announcementQuery]);
    const error =
      localityResult.error ?? businessResult.error ?? announcementResult.error;
    if (error) {
      if (isDemoModeEnabled()) return getDemoDirectoryResponse(locality);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const localityNames = new Map(
      (localityResult.data ?? []).map((item) => [item.id, item.name])
    );
    return NextResponse.json({
      localities: (localityResult.data ?? []).map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        nameKn: item.name_kn,
        taluk: item.taluk,
        district: item.district,
        pincode: item.pincode ?? "",
        centerLat: item.center_lat,
        centerLng: item.center_lng,
        mapX: 50,
        mapY: 50,
        description: item.description ?? "",
        activeReporters: item.active_reporters,
        isPrimary: item.is_primary,
      })),
      businesses: (businessResult.data ?? []).map((item) => ({
        id: item.id,
        localityId: item.locality_id,
        localityName: localityNames.get(item.locality_id) ?? "",
        name: item.name,
        category: item.category,
        description: item.description,
        phone: item.phone ?? "",
        address: item.address,
        hours: item.hours ?? "",
        isVerified: item.is_verified,
        imageUrl: item.featured_image_url,
      })),
      announcements: (announcementResult.data ?? []).map((item) => ({
        id: item.id,
        localityId: item.locality_id ?? undefined,
        localityName: item.locality_id
          ? localityNames.get(item.locality_id) ?? "Karavali"
          : "Karavali",
        title: item.title,
        summary: item.summary,
        issuer: item.issuer,
        urgency: item.urgency,
        validUntil: item.valid_until ?? "",
        createdAt: item.created_at,
      })),
    });
  }
  if (!isDemoModeEnabled()) {
    return NextResponse.json({ error: "Directory service unavailable." }, { status: 503 });
  }
  return getDemoDirectoryResponse(locality);
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveRequestActor(req);
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized: sign in to perform this action." },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (body.action === "create_announcement") {
      if (actor.profile.role === "citizen" || actor.profile.isSuspended) {
        return NextResponse.json(
          { error: "Forbidden: only authorised Pethri staff can publish bulletins." },
          { status: 403 }
        );
      }
      const title = sanitizeText(body.title, 200);
      const summary = sanitizeText(body.summary, 3000);
      const issuer = sanitizeText(body.issuer, 200);
      if (!title || !summary || !issuer) {
        return NextResponse.json(
          { error: "Title, summary, and issuer are required." },
          { status: 400 }
        );
      }
      if (isServerSupabaseConfigured()) {
        const supabase = await createSupabaseServerClient();
        if (!supabase) {
          return NextResponse.json({ error: "Directory service unavailable." }, { status: 503 });
        }
        const urgency =
          body.urgency === "advisory" || body.urgency === "urgent"
            ? body.urgency
            : "notice";
        const { data, error } = await supabase
          .from("announcements")
          .insert({
            locality_id: typeof body.localityId === "string" ? body.localityId : null,
            title,
            summary,
            issuer,
            urgency,
            created_by: actor.profile.id,
          })
          .select()
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 503 });
        }
        return NextResponse.json({ announcement: data }, { status: 201 });
      }
      if (!isDemoModeEnabled()) {
        return NextResponse.json({ error: "Directory service unavailable." }, { status: 503 });
      }
      const announcement = createAnnouncement({
        localityId: body.localityId,
        title,
        summary,
        issuer,
        urgency: body.urgency ?? "notice",
      });
      return NextResponse.json({ announcement }, { status: 201 });
    }
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
