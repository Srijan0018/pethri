import { NextRequest, NextResponse } from "next/server";
import {
  createCommunityLiveStream,
  getLiveBroadcast,
  listEvents,
  listLiveStreams,
  listPlaylists,
  listProfiles,
  postLiveChatMessage,
  sendLiveReaction,
  toggleEventRsvp,
  toggleFollowLocality,
  toggleFollowProfile,
  togglePlaylistSubscription,
  updateLiveBroadcast,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const locality = req.nextUrl.searchParams.get("locality") ?? undefined;
  return NextResponse.json({
    broadcast: getLiveBroadcast(),
    liveStreams: listLiveStreams(locality),
    playlists: listPlaylists(),
    events: listEvents(locality),
    profiles: listProfiles(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "update_broadcast") {
      const result = updateLiveBroadcast({
        actorId: body.actorId,
        isLive: body.isLive,
        title: body.title,
        summary: body.summary,
        localityId: body.localityId,
      });
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ broadcast: result.broadcast });
    }

    if (body.action === "create_community_stream") {
      if (!body.title?.trim() || !body.localityId) {
        return NextResponse.json(
          { error: "Stream title and locality are required." },
          { status: 400 }
        );
      }
      const stream = createCommunityLiveStream({
        hostId: body.hostId ?? "user-kavitha",
        hostName: body.hostName ?? "Karavali Broadcaster",
        hostUsername: body.hostUsername ?? "karavali_live",
        title: body.title,
        summary: body.summary ?? "",
        localityId: body.localityId,
        category: body.category ?? "celebrations",
      });
      return NextResponse.json({ stream }, { status: 201 });
    }

    if (body.action === "send_live_chat") {
      const stream = postLiveChatMessage(body.streamId, {
        senderName: body.senderName ?? "Viewer",
        senderHandle: body.senderHandle ?? "viewer",
        text: body.text ?? "",
      });
      if (!stream) {
        return NextResponse.json({ error: "Stream not found" }, { status: 404 });
      }
      return NextResponse.json({ stream });
    }

    if (body.action === "send_live_reaction") {
      const stream = sendLiveReaction(body.streamId);
      if (!stream) {
        return NextResponse.json({ error: "Stream not found" }, { status: 404 });
      }
      return NextResponse.json({ stream });
    }

    if (body.action === "toggle_playlist_subscribe") {
      const playlist = togglePlaylistSubscription(body.playlistId);
      if (!playlist) {
        return NextResponse.json(
          { error: "Playlist not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ playlist });
    }

    if (body.action === "toggle_event_rsvp") {
      const event = toggleEventRsvp(body.eventId);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      return NextResponse.json({ event });
    }

    if (body.action === "toggle_follow_profile") {
      const profile = toggleFollowProfile(body.profileId);
      if (!profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ profile });
    }

    if (body.action === "toggle_follow_locality") {
      const locality = toggleFollowLocality(body.localityId);
      if (!locality) {
        return NextResponse.json(
          { error: "Locality not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ locality });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
