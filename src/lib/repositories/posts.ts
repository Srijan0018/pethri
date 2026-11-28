import { createSupabaseServerClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { isDemoModeEnabled } from "@/lib/server-config";
import {
  createCitizenPost,
  createNewsroomDispatch,
  listPosts as listStorePosts,
} from "@/lib/store";
import {
  isValidCategory,
  isValidFormat,
  isValidSourceKind,
  isValidVerification,
  matchesMomentFilter,
  parsePagination,
  sanitizeText,
} from "@/lib/repositories/validation";
import type {
  PostCategory,
  PostFormat,
  PostItem,
  PostMediaItem,
  PostSourceKind,
  VerificationTier,
} from "@/types/pethri";

export interface ListPostsQuery {
  postId?: string;
  locality?: string;
  category?: string;
  verification?: string;
  sourceKind?: string;
  playlistSlug?: string;
  search?: string;
  onlyMoments?: boolean;
  includePending?: boolean;
  authorId?: string;
  viewerId?: string;
  limit?: number;
  offset?: number;
}

export async function getPostsRepository(query: ListPostsQuery) {
  // Validate enums
  const validCat = query.category && isValidCategory(query.category) ? query.category : undefined;
  const validVer = query.verification && isValidVerification(query.verification) ? query.verification : undefined;
  const validSrc = query.sourceKind && isValidSourceKind(query.sourceKind) ? query.sourceKind : undefined;

  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient) {
    try {
      let req = supabaseClient
        .from("posts")
        .select(
          `
          id,
          author_id,
          locality_id,
          category,
          format,
          source_kind,
          sponsor_advertiser,
          sponsor_disclosure,
          headline,
          headline_kn,
          body,
          body_kn,
          is_breaking,
          is_moment,
          playlist_slug,
          verification_tier,
          moderation_status,
          moderation_notes,
          share_precise_location,
          precise_lat,
          precise_lng,
          approx_landmark,
          likes_count,
          comments_count,
          shares_count,
          created_at,
          author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, role, is_verified_reporter),
          locality:localities!posts_locality_id_fkey(id, name),
          media:post_media(id, media_type, storage_path, public_url, poster_url, aspect_ratio, duration_seconds, sort_order),
          corrections:post_corrections(id, summary, corrected_by, created_at),
          comments:comments(id, post_id, author_id, content, created_at, author:profiles!comments_author_id_fkey(username, full_name, avatar_url))
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (query.locality && query.locality !== "all") {
        req = req.eq("locality_id", query.locality);
      }
      if (query.postId) {
        req = req.eq("id", query.postId);
      }
      if (validCat) {
        req = req.eq("category", validCat);
      }
      if (validVer) {
        req = req.eq("verification_tier", validVer);
      }
      if (validSrc) {
        req = req.eq("source_kind", validSrc);
      }
      req = req.eq("is_moment", Boolean(query.onlyMoments));
      if (!query.includePending) {
        req = req.eq("moderation_status", "approved");
      }
      if (query.authorId) {
        req = req.eq("author_id", query.authorId);
      }
      if (query.search?.trim()) {
        const s = sanitizeText(query.search, 100)
          .replace(/[,%_()\\"']/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (s) {
          req = req.or(`headline.ilike.%${s}%,body.ilike.%${s}%`);
        }
      }

      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;
      req = req.range(offset, offset + limit - 1);

      const { data, error, count } = await req;

      if (!error && Array.isArray(data)) {
        const postIds = data.map((row: any) => row.id);
        const likedPostIds = new Set<string>();
        const bookmarkedPostIds = new Set<string>();
        if (query.viewerId && postIds.length > 0) {
          const [likesResult, bookmarksResult] = await Promise.all([
            supabaseClient
              .from("post_likes")
              .select("post_id")
              .eq("user_id", query.viewerId)
              .in("post_id", postIds),
            supabaseClient
              .from("bookmarks")
              .select("post_id")
              .eq("user_id", query.viewerId)
              .in("post_id", postIds),
          ]);
          if (likesResult.error) throw new Error(likesResult.error.message);
          if (bookmarksResult.error) throw new Error(bookmarksResult.error.message);
          likesResult.data?.forEach((row) => likedPostIds.add(row.post_id));
          bookmarksResult.data?.forEach((row) =>
            bookmarkedPostIds.add(row.post_id)
          );
        }
        const posts: PostItem[] = data.map((row: any) => ({
          id: row.id,
          authorId: row.author_id,
          author: {
            id: row.author?.id ?? row.author_id,
            username: row.author?.username ?? "reporter",
            fullName: row.author?.full_name ?? "Pethri Reporter",
            avatarUrl: row.author?.avatar_url ?? "/images/photos/pethri-town.jpg",
            role: row.author?.role ?? "citizen",
            isVerifiedReporter: Boolean(row.author?.is_verified_reporter),
          },
          localityId: row.locality_id,
          localityName: row.locality?.name ?? "Karavali",
          category: row.category as PostCategory,
          format: row.format as PostFormat,
          sourceKind: row.source_kind as PostSourceKind,
          sponsorInfo: row.sponsor_advertiser
            ? { advertiserName: row.sponsor_advertiser, disclosure: row.sponsor_disclosure ?? "Sponsored" }
            : undefined,
          headline: row.headline,
          headlineKn: row.headline_kn,
          body: row.body,
          bodyKn: row.body_kn,
          isBreaking: Boolean(row.is_breaking),
          isMoment: Boolean(row.is_moment),
          playlistSlug: row.playlist_slug,
          verificationTier: row.verification_tier as VerificationTier,
          moderationStatus: row.moderation_status,
          moderationNotes: row.moderation_notes,
          corrections: (row.corrections ?? []).map((c: any) => ({
            id: c.id,
            summary: c.summary,
            correctedBy: c.corrected_by,
            correctedAt: c.created_at,
          })),
          sharePreciseLocation: Boolean(row.share_precise_location),
          publicLat: row.precise_lat,
          publicLng: row.precise_lng,
          approxLandmark: row.approx_landmark,
          media: (row.media ?? []).map((m: any) => ({
            id: m.id,
            mediaType: m.media_type,
            url: m.public_url,
            posterUrl: m.poster_url,
            aspectRatio: m.aspect_ratio ?? "4:5",
            durationSeconds: m.duration_seconds,
          })),
          likesCount: row.likes_count ?? 0,
          commentsCount: row.comments_count ?? 0,
          sharesCount: row.shares_count ?? 0,
          comments: (row.comments ?? []).map((comment: any) => ({
            id: comment.id,
            postId: comment.post_id,
            authorId: comment.author_id,
            authorName: comment.author?.full_name ?? "Pethri Reader",
            authorUsername: comment.author?.username ?? "reader",
            authorAvatar:
              comment.author?.avatar_url ?? "/images/photos/pethri-town.jpg",
            content: comment.content,
            createdAt: comment.created_at,
          })),
          likedByMe: likedPostIds.has(row.id),
          bookmarkedByMe: bookmarkedPostIds.has(row.id),
          isDemoData: false,
          createdAt: row.created_at,
        }));

        return { posts, total: count ?? posts.length, isDatabaseConnected: true };
      }
    } catch (error) {
      if (!isDemoModeEnabled()) {
        throw error;
      }
    }
  }

  // If Supabase query failed or is not available:
  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  // Fallback ONLY allowed when DEMO_MODE is enabled in local preview / test environment
  const storeResult = await listStorePosts({
    locality: query.locality,
    category: validCat ?? "all",
    verification: validVer ?? "all",
    sourceKind: validSrc ?? "all",
    playlistSlug: query.playlistSlug,
    search: query.search,
    onlyMoments: query.onlyMoments,
    includePending: query.includePending,
    authorId: query.authorId,
    viewerId: query.viewerId,
  });

  const filteredPosts = storeResult.posts.filter(
    (post) =>
      matchesMomentFilter(post.isMoment, Boolean(query.onlyMoments)) &&
      (!query.postId || post.id === query.postId)
  );
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 20;
  const pagedPosts = filteredPosts.slice(offset, offset + limit);

  return {
    posts: pagedPosts,
    total: filteredPosts.length,
    isDatabaseConnected: false,
    isDemoFallback: true,
  };
}

export async function createPostRepository(params: {
  authorId: string;
  authorProfile: any;
  localityId: string;
  category: PostCategory;
  headline: string;
  body: string;
  format?: PostFormat;
  sourceKind?: PostSourceKind;
  isBreaking?: boolean;
  isMoment?: boolean;
  media?: any[];
  approxLandmark?: string;
  sharePreciseLocation?: boolean;
  preciseLat?: number;
  preciseLng?: number;
  publishMode?: "newsroom" | "citizen" | "sponsored";
}) {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient) {
    try {
      const isNewsroom = params.publishMode === "newsroom" || params.publishMode === "sponsored";
      const { data, error } = await supabaseClient
        .from("posts")
        .insert({
          author_id: params.authorId,
          locality_id: params.localityId,
          category: params.category,
          format: params.format ?? "photo",
          source_kind: isNewsroom ? (params.publishMode === "sponsored" ? "sponsored" : "newsroom") : "citizen",
          headline: sanitizeText(params.headline, 300),
          body: sanitizeText(params.body, 10000),
          is_breaking: Boolean(params.isBreaking),
          is_moment: Boolean(params.isMoment),
          verification_tier: isNewsroom ? "verified" : "community",
          moderation_status: isNewsroom ? "approved" : "pending",
          approx_landmark: sanitizeText(params.approxLandmark, 200),
          share_precise_location: Boolean(params.sharePreciseLocation),
          precise_lat: params.sharePreciseLocation ? params.preciseLat : null,
          precise_lng: params.sharePreciseLocation ? params.preciseLng : null,
        })
        .select()
        .single();

      if (!error && data) {
        return { post: data, isDatabaseConnected: true };
      }
    } catch {
      // Supabase insert failed
    }
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database insert failed and DEMO_MODE is disabled in this environment."
    );
  }

  // Fallback in demo mode
  if (params.publishMode === "newsroom" || params.publishMode === "sponsored") {
    const post = createNewsroomDispatch({
      authorId: params.authorId,
      localityId: params.localityId,
      category: params.category,
      format: params.format ?? "dispatch",
      sourceKind: params.publishMode === "sponsored" ? "sponsored" : "newsroom",
      headline: params.headline,
      body: params.body,
      isBreaking: Boolean(params.isBreaking),
      isMoment: Boolean(params.isMoment),
      media: params.media ?? [],
      approxLandmark: params.approxLandmark,
    });
    return { post, isDatabaseConnected: false, isDemoFallback: true };
  } else {
    const post = createCitizenPost({
      authorId: params.authorId,
      localityId: params.localityId,
      category: params.category,
      format: params.format ?? "photo",
      headline: params.headline,
      body: params.body,
      isMoment: Boolean(params.isMoment),
      media: params.media ?? [],
      approxLandmark: params.approxLandmark,
      sharePreciseLocation: Boolean(params.sharePreciseLocation),
      preciseLat: params.preciseLat,
      preciseLng: params.preciseLng,
    });
    return { post, isDatabaseConnected: false, isDemoFallback: true };
  }
}
