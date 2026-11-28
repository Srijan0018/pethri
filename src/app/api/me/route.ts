import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  return NextResponse.json({
    profile: {
      id: actor.profile.id,
      username: actor.profile.username,
      fullName: actor.profile.fullName,
      avatarUrl: actor.profile.avatarUrl,
      bio: actor.profile.bio,
      role: actor.profile.role,
      homeLocalityId: actor.profile.homeLocalityId,
      homeLocalityName: actor.profile.homeLocalityName,
      isVerifiedReporter: actor.profile.isVerifiedReporter,
      isSuspended: actor.profile.isSuspended,
      joinedAt: actor.profile.joinedAt,
      contributionsCount: actor.profile.contributionsCount,
      followersCount: actor.profile.followersCount,
    },
    permissions: actor.permissions,
  });
}
