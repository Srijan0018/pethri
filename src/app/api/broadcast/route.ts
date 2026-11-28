import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/server-auth";
import {
  getLiveBroadcast,
  hasReporterPermission,
  listEvents,
  listLiveStreams,
  listPlaylists,
  listProfiles,
  postLiveChatMessage,
  sendLiveReaction,
  togglePlaylistSubscription,
  updateLiveBroadcast,
} from "@/lib/store";
import { getEventsRepository, toggleEventRsvpRepository } from "@/lib/repositories/events";
import {
  toggleFollowLocalityRepository,
  toggleFollowReporterRepository,
  toggleFollowTopicRepository,
} from "@/lib/repositories/engagement";
import { isValidCategory } from "@/lib/repositories/validation";

export async function GET(req: NextRequest) {
  const locality = req.nextUrl.searchParams.get("locality") ?? undefined;
  const eventsResult = await getEventsRepository({ locality });

  return NextResponse.json({
    broadcast: getLiveBroadcast(),
    liveStreams: listLiveStreams(locality),
    playlists: listPlaylists(),
    events: eventsResult.events,
    profiles: listProfiles().map((p) => ({
      ...p,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveRequestActor(req);
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized: sign in to interact." },
        { status: 401 }
      );
    }
    if (actor.profile.isSuspended) {
      return NextResponse.json(
        { error: "Forbidden: suspended accounts cannot perform this action." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (body.action === "update_broadcast") {
      if (!hasReporterPermission(actor.profile.id, "live")) {
        return NextResponse.json(
          {
            error:
              "Forbidden: only authorised staff with active live broadcast permission can operate Live Broadcasts.",
          },
          { status: 403 }
        );
      }

      const result = updateLiveBroadcast({
        actorId: actor.profile.id,
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
      return NextResponse.json(
        {
          error:
            "Forbidden: public users cannot start public live broadcasts. Only authorised Pethri newsroom staff can operate live broadcasts.",
        },
        { status: 403 }
      );
    }

    if (body.action === "send_live_chat") {
      const stream = postLiveChatMessage(body.streamId, {
        senderName: actor.profile.fullName,
        senderHandle: actor.profile.username,
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

    if (body.action === "toggle_event_rsvp") {
      const result = await toggleEventRsvpRepository(body.eventId, actor.profile.id);
      return NextResponse.json(result);
    }

    if (body.action === "toggle_playlist_subscription") {
      const playlist = togglePlaylistSubscription(body.playlistId);
      if (!playlist) {
        return NextResponse.json(
          { error: "Playlist not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ playlist });
    }

    if (body.action === "toggle_follow_locality") {
      const result = await toggleFollowLocalityRepository(body.localityId, actor.profile.id);
      return NextResponse.json(result);
    }

    if (body.action === "toggle_follow_profile") {
      const result = await toggleFollowReporterRepository(body.profileId, actor.profile.id);
      return NextResponse.json(result);
    }

    if (body.action === "toggle_follow_topic") {
      if (typeof body.categorySlug !== "string" || !isValidCategory(body.categorySlug)) {
        return NextResponse.json({ error: "Invalid topic." }, { status: 400 });
      }
      const result = await toggleFollowTopicRepository(
        body.categorySlug,
        actor.profile.id
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Malformed request" }, { status: 400 });
  }
}
