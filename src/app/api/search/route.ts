import { NextRequest, NextResponse } from "next/server";
import { getPostsRepository } from "@/lib/repositories/posts";
import { sanitizeText } from "@/lib/repositories/validation";
import {
  createSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";
import { isDemoModeEnabled } from "@/lib/server-config";
import { listLocalities, listProfiles } from "@/lib/store";

export async function GET(req: NextRequest) {
  const query = sanitizeText(req.nextUrl.searchParams.get("q"), 100);
  const locality = sanitizeText(req.nextUrl.searchParams.get("locality"), 100);
  const category = sanitizeText(req.nextUrl.searchParams.get("category"), 40);
  const limitValue = Number.parseInt(
    req.nextUrl.searchParams.get("limit") ?? "20",
    10
  );
  const limit = Number.isFinite(limitValue)
    ? Math.max(1, Math.min(limitValue, 50))
    : 20;

  try {
    const [postResult, localities, profiles] = await Promise.all([
      getPostsRepository({
        search: query || undefined,
        locality: locality || undefined,
        category: category || undefined,
        limit,
      }),
      listLocalities(),
      Promise.resolve(listProfiles()),
    ]);

    let matchingLocalities = localities.filter((item) => {
      const match = `${item.name} ${item.nameKn ?? ""} ${item.taluk} ${item.district}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return !query || match;
    });
    let matchingReporters = profiles
      .filter((profile) => profile.isVerifiedReporter)
      .filter((profile) =>
        !query ||
        `${profile.fullName} ${profile.username} ${profile.homeLocalityName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .slice(0, 10);

    if (isServerSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const searchTerm = query.replace(/[,%_()\\"']/g, " ");
        let localityRequest = supabase
          .from("localities")
          .select("id, slug, name, name_kn, taluk, district, pincode")
          .limit(10);
        let reporterRequest = supabase
          .from("profiles")
          .select(
            "id, username, full_name, avatar_url, bio, role, home_locality_id, is_verified_reporter, followers_count"
          )
          .eq("is_verified_reporter", true)
          .limit(10);
        if (query) {
          localityRequest = localityRequest.or(
            `name.ilike.%${searchTerm}%,name_kn.ilike.%${searchTerm}%,taluk.ilike.%${searchTerm}%`
          );
          reporterRequest = reporterRequest.or(
            `full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`
          );
        }
        const [localityResult, reporterResult] = await Promise.all([
          localityRequest,
          reporterRequest,
        ]);
        if (localityResult.error) throw new Error(localityResult.error.message);
        if (reporterResult.error) throw new Error(reporterResult.error.message);
        matchingLocalities = (localityResult.data ?? []).map((item) => ({
          ...item,
          centerLat: 0,
          centerLng: 0,
          mapX: 50,
          mapY: 50,
          description: "",
          activeReporters: 0,
        }));
        matchingReporters = (reporterResult.data ?? []).map((item) => ({
          id: item.id,
          username: item.username,
          fullName: item.full_name,
          avatarUrl: item.avatar_url ?? "/images/photos/pethri-town.jpg",
          bio: item.bio ?? "",
          role: item.role,
          homeLocalityId: item.home_locality_id ?? "",
          homeLocalityName:
            localities.find((locality) => locality.id === item.home_locality_id)
              ?.name ?? "",
          isVerifiedReporter: item.is_verified_reporter,
          joinedAt: "",
          contributionsCount: 0,
          followersCount: item.followers_count ?? 0,
        }));
      }
    } else if (!isDemoModeEnabled()) {
      return NextResponse.json(
        { error: "Search service is unavailable." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      posts: postResult.posts,
      total: postResult.total,
      localities: matchingLocalities,
      reporters: matchingReporters,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to search Pethri.",
      },
      { status: 503 }
    );
  }
}
