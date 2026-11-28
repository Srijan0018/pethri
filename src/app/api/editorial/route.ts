import { NextRequest, NextResponse } from "next/server";
import {
  hasActorPermission,
  resolveRequestActor,
} from "@/lib/server-auth";
import {
  createSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";
import { listReportsRepository } from "@/lib/repositories/reports";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  addPostCorrection,
  getReporterPermissionsMap,
  listEditorialGovernanceLogs,
  listProfiles,
  listReports,
  resolveContentReport,
  reviewRuntimePost,
  setReporterPermission,
  updateProfileGovernance,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  const isStaff = Boolean(
    actor &&
      !actor.profile.isSuspended &&
      actor.profile.role !== "citizen"
  );

  if (!isStaff) {
    return NextResponse.json(
      { error: "Unauthorized: accredited editorial staff access required." },
      { status: actor ? 403 : 401 }
    );
  }

  if (isServerSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Editorial data unavailable." }, { status: 503 });
    }
    const [profileResult, permissionResult, reportsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, role, home_locality_id, is_verified_reporter, is_suspended, followers_count, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("reporter_permissions")
        .select("profile_id, can_publish_articles, can_upload_official_media, can_start_broadcasts, can_publish_breaking, can_moderate_comments, can_manage_events, can_review_tips"),
      listReportsRepository(),
    ]);
    if (profileResult.error) {
      return NextResponse.json({ error: profileResult.error.message }, { status: 503 });
    }
    if (permissionResult.error) {
      return NextResponse.json({ error: permissionResult.error.message }, { status: 503 });
    }
    const localityIds = [...new Set((profileResult.data ?? []).flatMap((profile) => profile.home_locality_id ? [profile.home_locality_id] : []))];
    const { data: localities, error: localityError } = localityIds.length
      ? await supabase.from("localities").select("id, name").in("id", localityIds)
      : { data: [], error: null };
    if (localityError) {
      return NextResponse.json({ error: localityError.message }, { status: 503 });
    }
    const localityNames = new Map((localities ?? []).map((locality) => [locality.id, locality.name]));
    const reporterPermissions = Object.fromEntries(
      (permissionResult.data ?? []).map((permission) => [
        permission.profile_id,
        {
          profileId: permission.profile_id,
          canPublishArticles: permission.can_publish_articles,
          canUploadOfficialMedia: permission.can_upload_official_media,
          canStartBroadcasts: permission.can_start_broadcasts,
          canPublishBreaking: permission.can_publish_breaking,
          canModerateComments: permission.can_moderate_comments,
          canManageEvents: permission.can_manage_events,
          canReviewTips: permission.can_review_tips,
        },
      ])
    );
    return NextResponse.json({
      reports: reportsResult.reports,
      profiles: (profileResult.data ?? []).map((profile) => ({
        id: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url ?? "/images/photos/pethri-town.jpg",
        bio: profile.bio ?? "",
        role: profile.role,
        homeLocalityId: profile.home_locality_id ?? "",
        homeLocalityName: profile.home_locality_id
          ? localityNames.get(profile.home_locality_id) ?? ""
          : "",
        isVerifiedReporter: profile.is_verified_reporter,
        isSuspended: profile.is_suspended,
        joinedAt: profile.created_at,
        contributionsCount: 0,
        followersCount: profile.followers_count,
      })),
      reporterPermissions,
      ...listEditorialGovernanceLogs(),
    });
  }
  return NextResponse.json({
    reports: listReports(),
    profiles: listProfiles(),
    reporterPermissions: getReporterPermissionsMap(),
    ...listEditorialGovernanceLogs(),
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`editorial-patch:${ip}`, 30, 60);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const actor = await resolveRequestActor(req);
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized: sign in to perform editorial actions." },
        { status: 401 }
      );
    }

    const actorId = actor.profile.id;
    if (actor.profile.role === "citizen" || actor.profile.isSuspended) {
      return NextResponse.json(
        {
          error:
            "Forbidden: editorial desk operations require accredited staff authorization.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (body.type === "post_review") {
      if (!hasActorPermission(actor, "tip_review")) {
        return NextResponse.json({ error: "Editorial review permission required." }, { status: 403 });
      }
      const updated = reviewRuntimePost(body.postId, {
        moderationStatus: body.moderationStatus,
        verificationTier: body.verificationTier,
        isBreaking: body.isBreaking,
        moderationNotes: body.moderationNotes,
        reviewerId: actorId,
      });
      if (!updated) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json({ post: updated });
    }

    if (body.type === "post_correction") {
      if (!hasActorPermission(actor, "tip_review")) {
        return NextResponse.json({ error: "Editorial review permission required." }, { status: 403 });
      }
      if (!body.summary?.trim()) {
        return NextResponse.json(
          { error: "Correction summary is required." },
          { status: 400 }
        );
      }
      const updated = addPostCorrection(body.postId, {
        summary: body.summary,
        correctedBy: actor.profile.fullName,
      });
      if (!updated) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json({ post: updated });
    }

    if (body.type === "report_resolve") {
      if (!hasActorPermission(actor, "moderate_comments")) {
        return NextResponse.json({ error: "Moderation permission required." }, { status: 403 });
      }
      const updated = resolveContentReport(body.reportId, body.status);
      if (!updated) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      return NextResponse.json({ report: updated });
    }

    if (body.type === "profile_governance") {
      if (actor.profile.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden: only Website Managers can change user roles." },
          { status: 403 }
        );
      }
      if (
        typeof body.userId !== "string" ||
        !["citizen", "correspondent", "journalist", "editor", "admin"].includes(body.role) ||
        typeof body.isVerifiedReporter !== "boolean" ||
        (body.isSuspended !== undefined && typeof body.isSuspended !== "boolean")
      ) {
        return NextResponse.json({ error: "Valid profile ID, role, and verification state are required." }, { status: 400 });
      }
      if (body.userId === actorId && body.role !== "admin") {
        return NextResponse.json({ error: "You cannot remove your own manager role." }, { status: 400 });
      }
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data: updated, error } = await supabase
          .from("profiles")
          .update({
            role: body.role,
            is_verified_reporter: body.isVerifiedReporter,
            ...(body.isSuspended !== undefined
              ? { is_suspended: body.isSuspended }
              : {}),
          })
          .eq("id", body.userId)
          .select("id, username, full_name, avatar_url, bio, role, home_locality_id, is_verified_reporter, is_suspended, followers_count, created_at")
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!updated) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
        const { data: locality, error: localityError } = updated.home_locality_id
          ? await supabase.from("localities").select("name").eq("id", updated.home_locality_id).maybeSingle()
          : { data: null, error: null };
        if (localityError) throw new Error(localityError.message);
        return NextResponse.json({
          profile: {
            id: updated.id,
            username: updated.username,
            fullName: updated.full_name,
            avatarUrl: updated.avatar_url ?? "/images/photos/pethri-town.jpg",
            bio: updated.bio ?? "",
            role: updated.role,
            homeLocalityId: updated.home_locality_id ?? "",
            homeLocalityName: locality?.name ?? "",
            isVerifiedReporter: updated.is_verified_reporter,
            isSuspended: updated.is_suspended,
            joinedAt: updated.created_at,
            contributionsCount: 0,
            followersCount: updated.followers_count,
          },
        });
      }
      if (isServerSupabaseConfigured()) {
        return NextResponse.json({ error: "Profile service unavailable." }, { status: 503 });
      }
      const result = updateProfileGovernance(body.userId, {
        role: body.role,
        isVerifiedReporter: body.isVerifiedReporter,
        isSuspended: body.isSuspended,
        actorId,
      });
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ profile: result.profile });
    }

    if (body.type === "reporter_permissions") {
      if (actor.profile.role !== "admin") {
        return NextResponse.json(
          {
            error:
              "Forbidden: only Website Managers can grant or revoke reporter permissions.",
          },
          { status: 403 }
        );
      }
      if (body.userId === actorId) {
        return NextResponse.json(
          { error: "Managers cannot modify their own permission record." },
          { status: 403 }
        );
      }
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data: target, error: targetError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", body.userId)
          .maybeSingle();
        if (targetError) throw new Error(targetError.message);
        if (!target) return NextResponse.json({ error: "Target profile not found." }, { status: 404 });
        if (target.role !== "correspondent" && target.role !== "journalist") {
          return NextResponse.json({ error: "Individual permissions apply only to Reporter accounts." }, { status: 400 });
        }

        const permissionFields: Record<string, string> = {
          canPublishArticles: "can_publish_articles",
          canUploadOfficialMedia: "can_upload_official_media",
          canStartBroadcasts: "can_start_broadcasts",
          canPublishBreaking: "can_publish_breaking",
          canModerateComments: "can_moderate_comments",
          canManageEvents: "can_manage_events",
          canReviewTips: "can_review_tips",
        };
        const updates: Record<string, boolean | string> = {
          profile_id: target.id,
          granted_by: actorId,
        };
        for (const [bodyKey, column] of Object.entries(permissionFields)) {
          if (body[bodyKey] !== undefined) {
            if (typeof body[bodyKey] !== "boolean") {
              return NextResponse.json(
                { error: `${bodyKey} must be a boolean.` },
                { status: 400 }
              );
            }
            updates[column] = body[bodyKey];
          }
        }
        if (Object.keys(updates).length === 2) {
          return NextResponse.json({ error: "At least one permission is required." }, { status: 400 });
        }
        const { error: updateError } = await supabase
          .from("reporter_permissions")
          .upsert(
            updates,
            { onConflict: "profile_id" }
          );
        if (updateError) throw new Error(updateError.message);
        const { data: allPermissions, error: listError } = await supabase
          .from("reporter_permissions")
          .select("profile_id, can_publish_articles, can_upload_official_media, can_start_broadcasts, can_publish_breaking, can_moderate_comments, can_manage_events, can_review_tips");
        if (listError) throw new Error(listError.message);
        const reporterPermissions = Object.fromEntries(
          (allPermissions ?? []).map((permission) => [
            permission.profile_id,
            {
              profileId: permission.profile_id,
              canPublishArticles: permission.can_publish_articles,
              canUploadOfficialMedia: permission.can_upload_official_media,
              canStartBroadcasts: permission.can_start_broadcasts,
              canPublishBreaking: permission.can_publish_breaking,
              canModerateComments: permission.can_moderate_comments,
              canManageEvents: permission.can_manage_events,
              canReviewTips: permission.can_review_tips,
            },
          ])
        );
        return NextResponse.json({
          permissions: reporterPermissions[target.id],
          reporterPermissions,
        });
      }
      if (isServerSupabaseConfigured()) {
        return NextResponse.json({ error: "Permissions service unavailable." }, { status: 503 });
      }
      const result = setReporterPermission({
        actorId,
        targetUserId: body.userId,
        canPublishArticles: body.canPublishArticles,
        canUploadOfficialMedia: body.canUploadOfficialMedia,
        canStartBroadcasts: body.canStartBroadcasts,
        canReviewTips: body.canReviewTips,
        canManageEvents: body.canManageEvents,
        canModerateComments: body.canModerateComments,
      });
      if (result.error) return NextResponse.json({ error: result.error }, { status: 403 });
      return NextResponse.json({
        permissions: result.permissions,
        reporterPermissions: getReporterPermissionsMap(),
      });
    }

    return NextResponse.json(
      { error: "Invalid editorial operation" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Editorial operation failed:", error);
    return NextResponse.json(
      { error: "Editorial operation failed. Please try again." },
      { status: 500 }
    );
  }
}
