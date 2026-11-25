import {
  DEMO_ANNOUNCEMENTS,
  DEMO_BUSINESSES,
  DEMO_LOCALITIES,
  DEMO_NOTIFICATIONS,
  DEMO_POSTS,
  DEMO_PROFILES,
  DEMO_REPORTS,
} from "@/lib/seed-data";
import { createSupabaseServerClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import type {
  CommunityAnnouncement,
  ContentReport,
  LocalBusiness,
  Locality,
  ModerationStatus,
  NotificationItem,
  PostCategory,
  PostFormat,
  PostMediaItem,
  PostItem,
  UserProfile,
  UserRole,
  VerificationTier,
} from "@/types/pethri";

interface PethriRuntimeStore {
  localities: Locality[];
  profiles: UserProfile[];
  posts: PostItem[];
  reports: ContentReport[];
  businesses: LocalBusiness[];
  announcements: CommunityAnnouncement[];
  notifications: NotificationItem[];
}

declare global {
  var __pethriRuntimeStore: PethriRuntimeStore | undefined;
}

function getRuntimeStore(): PethriRuntimeStore {
  if (!globalThis.__pethriRuntimeStore) {
    globalThis.__pethriRuntimeStore = {
      localities: structuredClone(DEMO_LOCALITIES),
      profiles: structuredClone(DEMO_PROFILES),
      posts: structuredClone(DEMO_POSTS),
      reports: structuredClone(DEMO_REPORTS),
      businesses: structuredClone(DEMO_BUSINESSES),
      announcements: structuredClone(DEMO_ANNOUNCEMENTS),
      notifications: structuredClone(DEMO_NOTIFICATIONS),
    };
  }
  return globalThis.__pethriRuntimeStore;
}

export interface ListPostsFilter {
  locality?: string;
  category?: PostCategory | "all";
  verification?: VerificationTier | "all";
  search?: string;
  onlyMoments?: boolean;
  includePending?: boolean;
  authorId?: string;
}

export async function listLocalities(): Promise<Locality[]> {
  if (isServerSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data } = await supabase.from("localities").select("*").order("name");
        if (data && data.length > 0) {
          return data.map((row, idx) => ({
            id: row.id,
            slug: row.slug,
            name: row.name,
            taluk: row.taluk,
            district: row.district,
            pincode: row.pincode ?? "576213",
            centerLat: row.center_lat,
            centerLng: row.center_lng,
            mapX: DEMO_LOCALITIES[idx % DEMO_LOCALITIES.length]?.mapX ?? 50,
            mapY: DEMO_LOCALITIES[idx % DEMO_LOCALITIES.length]?.mapY ?? 50,
            description: row.description ?? "",
            activeReporters: row.active_reporters ?? 0,
            isPrimary: row.slug === "pethri",
          }));
        }
      }
    } catch {
      // Fallback safely to seeded localities
    }
  }
  return getRuntimeStore().localities;
}

export async function listPosts(filters: ListPostsFilter = {}): Promise<{
  posts: PostItem[];
  source: "supabase" | "demo";
}> {
  if (isServerSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        let query = supabase
          .from("posts")
          .select(
            "*, author:profiles!posts_author_id_fkey(id,username,full_name,avatar_url,role,is_verified_reporter), locality:localities!posts_locality_id_fkey(id,slug,name), media:post_media(*), comments(*, author:profiles!comments_author_id_fkey(id,username,full_name,avatar_url))"
          )
          .order("created_at", { ascending: false });

        if (!filters.includePending) {
          query = query.eq("moderation_status", "approved");
        }
        if (filters.category && filters.category !== "all") {
          query = query.eq("category", filters.category);
        }
        if (filters.verification && filters.verification !== "all") {
          query = query.eq("verification_tier", filters.verification);
        }
        if (filters.onlyMoments) {
          query = query.eq("is_moment", true);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped: PostItem[] = data.map((row: Record<string, unknown>) => {
            const authorObj = (row.author as Record<string, unknown>) ?? {};
            const locObj = (row.locality as Record<string, unknown>) ?? {};
            const mediaRows = Array.isArray(row.media) ? row.media : [];
            const commentRows = Array.isArray(row.comments) ? row.comments : [];
            const sharePrecise = Boolean(row.share_precise_location);

            return {
              id: String(row.id),
              authorId: String(row.author_id),
              author: {
                id: String(authorObj.id ?? row.author_id),
                username: String(authorObj.username ?? "citizen"),
                fullName: String(authorObj.full_name ?? "Local Resident"),
                avatarUrl: String(
                  authorObj.avatar_url ?? "/images/scenes/avatar-roshan.svg"
                ),
                role: (authorObj.role as UserRole) ?? "citizen",
                isVerifiedReporter: Boolean(authorObj.is_verified_reporter),
              },
              localityId: String(row.locality_id),
              localityName: String(locObj.name ?? "Pethri"),
              category: row.category as PostCategory,
              format: row.format as PostFormat,
              headline: String(row.headline),
              body: String(row.body),
              isBreaking: Boolean(row.is_breaking),
              isMoment: Boolean(row.is_moment),
              verificationTier: row.verification_tier as VerificationTier,
              moderationStatus: row.moderation_status as ModerationStatus,
              moderationNotes: row.moderation_notes
                ? String(row.moderation_notes)
                : undefined,
              sharePreciseLocation: sharePrecise,
              publicLat: sharePrecise ? (row.precise_lat as number | null) : null,
              publicLng: sharePrecise ? (row.precise_lng as number | null) : null,
              approxLandmark: row.approx_landmark
                ? String(row.approx_landmark)
                : undefined,
              media: mediaRows.map((m: Record<string, unknown>) => ({
                id: String(m.id),
                mediaType: (m.media_type as "image" | "video") ?? "image",
                url: String(m.public_url),
                posterUrl: m.poster_url ? String(m.poster_url) : undefined,
                aspectRatio:
                  (m.aspect_ratio as PostMediaItem["aspectRatio"]) ?? "4:5",
                durationSeconds: m.duration_seconds
                  ? Number(m.duration_seconds)
                  : undefined,
              })),
              likesCount: Number(row.likes_count ?? 0),
              commentsCount: commentRows.length,
              sharesCount: Number(row.shares_count ?? 0),
              comments: commentRows.map((c: Record<string, unknown>) => {
                const ca = (c.author as Record<string, unknown>) ?? {};
                return {
                  id: String(c.id),
                  postId: String(row.id),
                  authorId: String(c.author_id),
                  authorName: String(ca.full_name ?? "Resident"),
                  authorUsername: String(ca.username ?? "resident"),
                  authorAvatar: String(
                    ca.avatar_url ?? "/images/scenes/avatar-kavitha.svg"
                  ),
                  content: String(c.content),
                  createdAt: String(c.created_at),
                };
              }),
              isDemoData: false,
              createdAt: String(row.created_at),
            };
          });

          return { posts: applyInMemoryFilters(mapped, filters), source: "supabase" };
        }
      }
    } catch {
      // Fall back to demo store
    }
  }

  const store = getRuntimeStore();
  return {
    posts: applyInMemoryFilters(store.posts, filters),
    source: "demo",
  };
}

function applyInMemoryFilters(
  posts: PostItem[],
  filters: ListPostsFilter
): PostItem[] {
  return posts
    .filter((post) => {
      if (!filters.includePending && post.moderationStatus !== "approved") {
        return false;
      }
      if (
        filters.locality &&
        filters.locality !== "all" &&
        post.localityId !== filters.locality &&
        post.localityName.toLowerCase() !== filters.locality.toLowerCase()
      ) {
        return false;
      }
      if (
        filters.category &&
        filters.category !== "all" &&
        post.category !== filters.category
      ) {
        return false;
      }
      if (
        filters.verification &&
        filters.verification !== "all" &&
        post.verificationTier !== filters.verification
      ) {
        return false;
      }
      if (filters.onlyMoments && !post.isMoment) {
        return false;
      }
      if (filters.authorId && post.authorId !== filters.authorId) {
        return false;
      }
      if (filters.search && filters.search.trim().length > 0) {
        const q = filters.search.trim().toLowerCase();
        const hay = `${post.headline} ${post.body} ${post.localityName} ${post.author.fullName} ${post.approxLandmark ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export interface CreatePostInput {
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  localityId: string;
  category: PostCategory;
  format: PostFormat;
  headline: string;
  body: string;
  isMoment: boolean;
  sharePreciseLocation: boolean;
  preciseLat?: number | null;
  preciseLng?: number | null;
  approxLandmark?: string;
  media: Omit<PostMediaItem, "id">[];
}

export async function createCitizenPost(
  input: CreatePostInput
): Promise<PostItem> {
  const store = getRuntimeStore();
  const locality =
    store.localities.find(
      (l) => l.id === input.localityId || l.slug === input.localityId
    ) ?? store.localities[0];

  const profile =
    store.profiles.find((p) => p.id === input.authorId) ?? {
      id: input.authorId ?? "user-kavitha",
      username: input.authorUsername ?? "kavitha_agri",
      fullName: input.authorName ?? "Kavitha Shetty",
      avatarUrl: "/images/scenes/avatar-kavitha.svg",
      role: "citizen" as UserRole,
      isVerifiedReporter: false,
    };

  // CRITICAL TRUST INVARIANT: Citizen submissions NEVER start as verified or approved.
  const newPost: PostItem = {
    id: `post-${Date.now()}`,
    authorId: profile.id,
    author: {
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
      isVerifiedReporter: profile.isVerifiedReporter,
    },
    localityId: locality.id,
    localityName: locality.name,
    category: input.category,
    format: input.format,
    headline: input.headline.trim(),
    body: input.body.trim(),
    isBreaking: false,
    isMoment: input.isMoment,
    verificationTier: "community",
    moderationStatus: "pending",
    sharePreciseLocation: Boolean(input.sharePreciseLocation),
    // Privacy guard: strip coordinates unless explicitly consented
    publicLat: input.sharePreciseLocation ? (input.preciseLat ?? null) : null,
    publicLng: input.sharePreciseLocation ? (input.preciseLng ?? null) : null,
    approxLandmark: input.approxLandmark?.trim() || undefined,
    media: input.media.map((m, index) => ({
      ...m,
      id: `media-${Date.now()}-${index}`,
    })),
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    likedByMe: false,
    bookmarkedByMe: false,
    comments: [],
    isDemoData: true,
    createdAt: new Date().toISOString(),
  };

  store.posts.unshift(newPost);
  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    localityId: locality.id,
    localityName: locality.name,
    title: "Submission Received",
    message: `"${newPost.headline.slice(0, 64)}" is queued for Pethri Editorial Review.`,
    href: "/editorial",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return newPost;
}

export function engageRuntimePost(
  postId: string,
  action: "like" | "bookmark" | "share" | "comment",
  payload?: { content?: string; authorName?: string; authorUsername?: string }
): PostItem | null {
  const store = getRuntimeStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post) return null;

  if (action === "like") {
    post.likedByMe = !post.likedByMe;
    post.likesCount = Math.max(0, post.likesCount + (post.likedByMe ? 1 : -1));
  } else if (action === "bookmark") {
    post.bookmarkedByMe = !post.bookmarkedByMe;
  } else if (action === "share") {
    post.sharesCount += 1;
  } else if (action === "comment" && payload?.content?.trim()) {
    post.comments.push({
      id: `comment-${Date.now()}`,
      postId: post.id,
      authorId: "user-current",
      authorName: payload.authorName ?? "Community Member",
      authorUsername: payload.authorUsername ?? "pethri_member",
      authorAvatar: "/images/scenes/avatar-roshan.svg",
      content: payload.content.trim(),
      createdAt: new Date().toISOString(),
    });
    post.commentsCount = post.comments.length;
  }

  return post;
}

export function reviewRuntimePost(
  postId: string,
  update: {
    moderationStatus: ModerationStatus;
    verificationTier: VerificationTier;
    isBreaking?: boolean;
    moderationNotes?: string;
    reviewerId?: string;
  }
): PostItem | null {
  const store = getRuntimeStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post) return null;

  post.moderationStatus = update.moderationStatus;
  post.verificationTier = update.verificationTier;
  if (typeof update.isBreaking === "boolean") {
    post.isBreaking = update.isBreaking;
  }
  if (update.moderationNotes !== undefined) {
    post.moderationNotes = update.moderationNotes;
  }
  post.reviewedBy = update.reviewerId ?? "user-editor";
  post.reviewedAt = new Date().toISOString();

  if (update.moderationStatus === "approved") {
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      localityId: post.localityId,
      localityName: post.localityName,
      title: `Story ${update.verificationTier === "verified" ? "Verified" : "Published"}`,
      message: `${post.localityName}: "${post.headline.slice(0, 68)}" is now live in the feed.`,
      href: "/feed",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  return post;
}

export function listReports(): ContentReport[] {
  return getRuntimeStore().reports;
}

export function createContentReport(input: {
  postId: string;
  reason: string;
  details: string;
  reporterUsername?: string;
}): ContentReport | null {
  const store = getRuntimeStore();
  const post = store.posts.find((p) => p.id === input.postId);
  if (!post) return null;

  const report: ContentReport = {
    id: `rep-${Date.now()}`,
    postId: post.id,
    postHeadline: post.headline,
    reporterUsername: input.reporterUsername ?? "pethri_member",
    reason: input.reason,
    details: input.details,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  store.reports.unshift(report);
  return report;
}

export function resolveContentReport(
  reportId: string,
  status: ContentReport["status"]
): ContentReport | null {
  const store = getRuntimeStore();
  const report = store.reports.find((r) => r.id === reportId);
  if (!report) return null;
  report.status = status;
  return report;
}

export function listProfiles(): UserProfile[] {
  return getRuntimeStore().profiles;
}

export function updateProfileGovernance(
  userId: string,
  updates: { role?: UserRole; isVerifiedReporter?: boolean; isSuspended?: boolean }
): UserProfile | null {
  const store = getRuntimeStore();
  const profile = store.profiles.find((p) => p.id === userId);
  if (!profile) return null;
  if (updates.role) profile.role = updates.role;
  if (typeof updates.isVerifiedReporter === "boolean") {
    profile.isVerifiedReporter = updates.isVerifiedReporter;
  }
  if (typeof updates.isSuspended === "boolean") {
    profile.isSuspended = updates.isSuspended;
  }
  return profile;
}

export function listBusinesses(locality?: string): LocalBusiness[] {
  const list = getRuntimeStore().businesses;
  if (!locality || locality === "all") return list;
  return list.filter(
    (b) =>
      b.localityId === locality ||
      b.localityName.toLowerCase() === locality.toLowerCase()
  );
}

export function listAnnouncements(locality?: string): CommunityAnnouncement[] {
  const list = getRuntimeStore().announcements;
  if (!locality || locality === "all") return list;
  return list.filter(
    (a) =>
      !a.localityId ||
      a.localityId === locality ||
      a.localityName.toLowerCase() === locality.toLowerCase()
  );
}

export function createAnnouncement(input: {
  localityId?: string;
  title: string;
  summary: string;
  issuer: string;
  urgency: CommunityAnnouncement["urgency"];
}): CommunityAnnouncement {
  const store = getRuntimeStore();
  const locality = store.localities.find((l) => l.id === input.localityId);
  const ann: CommunityAnnouncement = {
    id: `ann-${Date.now()}`,
    localityId: locality?.id,
    localityName: locality?.name ?? "All Localities",
    title: input.title,
    summary: input.summary,
    issuer: input.issuer,
    urgency: input.urgency,
    validUntil: new Date(Date.now() + 72 * 3600_000).toISOString(),
    createdAt: new Date().toISOString(),
    isDemoData: true,
  };
  store.announcements.unshift(ann);
  return ann;
}

export function listNotifications(): NotificationItem[] {
  return getRuntimeStore().notifications;
}

export function markAllNotificationsRead(): NotificationItem[] {
  const store = getRuntimeStore();
  store.notifications.forEach((n) => {
    n.isRead = true;
  });
  return store.notifications;
}
