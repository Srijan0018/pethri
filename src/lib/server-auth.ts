import { NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";
import { isDemoModeEnabled, isProductionEnvironment } from "@/lib/server-config";
import {
  getProfileById,
  hasReporterPermission,
  registerSupabaseActorProfile,
} from "@/lib/store";
import type { UserProfile, UserRole } from "@/types/pethri";

export const DEMO_SESSION_COOKIE = "pethri_demo_uid";

export type EditorialPermission =
  | "publish"
  | "media"
  | "live"
  | "breaking"
  | "moderate_comments"
  | "events"
  | "tip_review";

interface ActorPermissions {
  publish: boolean;
  media: boolean;
  live: boolean;
  breaking: boolean;
  moderate_comments: boolean;
  events: boolean;
  tip_review: boolean;
}

export interface ResolvedActor {
  profile: UserProfile;
  authSource: "supabase" | "demo";
  permissions: ActorPermissions;
}

function noPermissions(): ActorPermissions {
  return {
    publish: false,
    media: false,
    live: false,
    breaking: false,
    moderate_comments: false,
    events: false,
    tip_review: false,
  };
}

export function hasActorPermission(
  actor: ResolvedActor,
  permission: EditorialPermission
): boolean {
  if (actor.profile.isSuspended) return false;
  if (actor.profile.role === "admin" || actor.profile.role === "editor") {
    return true;
  }
  return actor.permissions[permission];
}

/**
 * Resolves identity and grants from a server-verified Supabase session. Demo
 * identities are accepted only in the explicitly enabled development sandbox.
 */
export async function resolveRequestActor(
  req: NextRequest
): Promise<ResolvedActor | null> {
  if (isServerSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!error && user) {
          let role: UserRole = "citizen";
          let isVerifiedReporter = false;
          let isSuspended = false;
          const permissions = noPermissions();
          let fullName =
            (user.user_metadata?.full_name as string | undefined)?.trim() ||
            user.email?.split("@")[0] ||
            "Member";
          let username =
            (user.user_metadata?.username as string | undefined)?.trim() ||
            (user.email?.split("@")[0] ?? "member")
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "_");

          try {
            const { data: dbProf, error: profileError } = await supabase
              .from("profiles")
              .select("id,username,full_name,role,is_verified_reporter,is_suspended")
              .eq("id", user.id)
              .maybeSingle();
            if (profileError) throw new Error(profileError.message);

            if (dbProf) {
              role = (dbProf.role as UserRole) ?? "citizen";
              isVerifiedReporter = Boolean(dbProf.is_verified_reporter);
              isSuspended = Boolean(dbProf.is_suspended);
              fullName = dbProf.full_name || fullName;
              username = dbProf.username || username;

              if (role === "correspondent" || role === "journalist") {
                try {
                  const { data: grants, error: grantsError } = await supabase
                    .from("reporter_permissions")
                    .select(
                      "can_publish_articles,can_upload_official_media,can_start_broadcasts,can_publish_breaking,can_moderate_comments,can_manage_events,can_review_tips"
                    )
                    .eq("profile_id", user.id)
                    .maybeSingle();
                  if (grantsError) throw new Error(grantsError.message);
                  if (grants) {
                    permissions.publish = Boolean(grants.can_publish_articles);
                    permissions.media = Boolean(grants.can_upload_official_media);
                    permissions.live = Boolean(grants.can_start_broadcasts);
                    permissions.breaking = Boolean(grants.can_publish_breaking);
                    permissions.moderate_comments = Boolean(
                      grants.can_moderate_comments
                    );
                    permissions.events = Boolean(grants.can_manage_events);
                    permissions.tip_review = Boolean(grants.can_review_tips);
                  }
                } catch {
                  permissions.publish = false;
                  permissions.media = false;
                  permissions.live = false;
                  permissions.breaking = false;
                  permissions.moderate_comments = false;
                  permissions.events = false;
                  permissions.tip_review = false;
                }
              }
            }
          } catch {
            // Missing profile/permission data fails closed to a public-member role.
            role = "citizen";
            isVerifiedReporter = false;
            isSuspended = false;
          }

          const profile = registerSupabaseActorProfile({
            id: user.id,
            username,
            fullName,
            role,
            isVerifiedReporter,
            isSuspended,
          });
          return {
            profile,
            authSource: "supabase",
            permissions:
              role === "editor" || role === "admin"
                ? {
                    publish: true,
                    media: true,
                    live: true,
                    breaking: true,
                    moderate_comments: true,
                    events: true,
                    tip_review: true,
                  }
                : permissions,
          };
        }
      }
    } catch {
      // Do not escalate or leak fallback privileges on Supabase failure
    }
  }

  // Only permit demo sessions when DEMO_MODE is explicitly enabled
  if (isDemoModeEnabled() && !isProductionEnvironment()) {
    const demoUid = req.cookies.get(DEMO_SESSION_COOKIE)?.value;
    if (demoUid) {
      const profile = getProfileById(demoUid);
      if (profile) {
        // Safety: in production environments, demo identities are strictly citizens
        if (isProductionEnvironment() && profile.role !== "citizen") {
          return {
            profile: {
              ...profile,
              role: "citizen",
              isVerifiedReporter: false,
            },
            authSource: "demo",
            permissions: noPermissions(),
          };
        }
        const permissions = noPermissions();
        if (profile.role === "editor" || profile.role === "admin") {
          Object.keys(permissions).forEach((key) => {
            permissions[key as EditorialPermission] = true;
          });
        } else {
          permissions.publish = hasReporterPermission(profile.id, "publish");
          permissions.media = hasReporterPermission(profile.id, "media");
          permissions.live = hasReporterPermission(profile.id, "live");
        }
        return { profile, authSource: "demo", permissions };
      }
    }
  }

  return null;
}
