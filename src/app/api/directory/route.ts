import { NextRequest, NextResponse } from "next/server";
import {
  createAnnouncement,
  isActorEditorialStaff,
  listAnnouncements,
  listBusinesses,
  listLocalities,
  listNotifications,
  markAllNotificationsRead,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const locality = req.nextUrl.searchParams.get("locality") ?? undefined;
  const localities = await listLocalities();
  return NextResponse.json({
    localities,
    businesses: listBusinesses(locality),
    announcements: listAnnouncements(locality),
    notifications: listNotifications(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "mark_notifications_read") {
      return NextResponse.json({ notifications: markAllNotificationsRead() });
    }
    if (body.action === "create_announcement") {
      const actorId = req.headers.get("x-pethri-actor-id") ?? body.actorId;
      if (!isActorEditorialStaff(actorId)) {
        return NextResponse.json(
          { error: "Unauthorized: only authorised Pethri staff can publish bulletins." },
          { status: 403 }
        );
      }
      if (!body.title || !body.summary || !body.issuer) {
        return NextResponse.json(
          { error: "Title, summary, and issuer are required." },
          { status: 400 }
        );
      }
      const announcement = createAnnouncement({
        localityId: body.localityId,
        title: body.title,
        summary: body.summary,
        issuer: body.issuer,
        urgency: body.urgency ?? "notice",
      });
      return NextResponse.json({ announcement }, { status: 201 });
    }
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
