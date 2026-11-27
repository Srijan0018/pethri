import {
  DEMO_ANNOUNCEMENTS,
  DEMO_BROADCAST,
  DEMO_BUSINESSES,
  DEMO_EVENTS,
  DEMO_LIVE_STREAMS,
  DEMO_LOCALITIES,
  DEMO_NOTIFICATIONS,
  DEMO_PLAYLISTS,
  DEMO_POSTS,
  DEMO_PROFILES,
  DEMO_REPORTS,
} from "@/lib/seed-data";
import {
  createSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";
import type {
  ChannelPlaylist,
  CommunityAnnouncement,
  ContentReport,
  LiveBroadcast,
  LocalBusiness,
  LocalEvent,
  Locality,
  ModerationStatus,
  NotificationItem,
  PostCategory,
  PostFormat,
  PostItem,
  PostMediaItem,
  PostSourceKind,
  SponsorInfo,
  UserProfile,
  UserRole,
  VerificationTier,
} from "@/types/pethri";

interface ReporterPermissionState {
  profileId: string;
  canPublishArticles: boolean;
  canUploadOfficialMedia: boolean;
  canStartBroadcasts: boolean;
  grantedBy: string;
  updatedAt: string;
}

interface PermissionHistoryRecord {
  id: string;
  targetProfileId: string;
  changedBy: string;
  previousRole?: UserRole;
  newRole?: UserRole;
  summary: string;
  createdAt: string;
}

interface ArticleRevisionRecord {
  id: string;
  postId: string;
  revisionNumber: number;
  headline: string;
  body: string;
  moderationStatus: ModerationStatus;
  verificationTier: VerificationTier;
  editedBy: string;
  changeSummary: string;
  createdAt: string;
}

interface ModerationLogRecord {
  id: string;
  targetType: "post" | "report";
  targetId: string;
  action: string;
  moderatorId: string;
  notes?: string;
  createdAt: string;
}

interface PethriRuntimeStore {
  localities: Locality[];
  profiles: UserProfile[];
  posts: PostItem[];
  reports: ContentReport[];
  businesses: LocalBusiness[];
  announcements: CommunityAnnouncement[];
  notifications: NotificationItem[];
  broadcast: LiveBroadcast;
  liveStreams: LiveBroadcast[];
  playlists: ChannelPlaylist[];
  events: LocalEvent[];
  reporterPermissions: Record<string, ReporterPermissionState>;
  permissionHistory: PermissionHistoryRecord[];
  articleRevisions: ArticleRevisionRecord[];
  moderationLogs: ModerationLogRecord[];
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
      broadcast: structuredClone(DEMO_BROADCAST),
      liveStreams: structuredClone(DEMO_LIVE_STREAMS),
      playlists: structuredClone(DEMO_PLAYLISTS),
      events: structuredClone(DEMO_EVENTS),
      reporterPermissions: {
        "user-editor": {
          profileId: "user-editor",
          canPublishArticles: true,
          canUploadOfficialMedia: true,
          canStartBroadcasts: true,
          grantedBy: "user-editor",
          updatedAt: new Date().toISOString(),
        },
        "user-ananya": {
          profileId: "user-ananya",
          canPublishArticles: true,
          canUploadOfficialMedia: true,
          canStartBroadcasts: false,
          grantedBy: "user-editor",
          updatedAt: new Date().toISOString(),
        },
        "user-roshan": {
          profileId: "user-roshan",
          canPublishArticles: false,
          canUploadOfficialMedia: false,
          canStartBroadcasts: false,
          grantedBy: "user-editor",
          updatedAt: new Date().toISOString(),
        },
      },
      permissionHistory: [],
      articleRevisions: [],
      moderationLogs: [],
    };
  }
  return globalThis.__pethriRuntimeStore;
}

export function isNewsroomAuthorized(role?: UserRole): boolean {
  return role === "journalist" || role === "editor" || role === "admin";
}

export function isActorEditorialStaff(actorId?: string): boolean {
  if (!actorId) return false;
  const actor = getRuntimeStore().profiles.find((p) => p.id === actorId);
  if (!actor || actor.isSuspended) return false;
  return isNewsroomAuthorized(actor.role) || actor.role === "correspondent";
}

export interface ListPostsFilter {
  locality?: string;
  category?: PostCategory | "all";
  verification?: VerificationTier | "all";
  sourceKind?: PostSourceKind | "all";
  playlistSlug?: string;
  search?: string;
  onlyMoments?: boolean;
  includePending?: boolean;
  authorId?: string;
  viewerId?: string;
}

export async function listLocalities(): Promise<Locality[]> {
  if (isServerSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data } = await supabase
          .from("localities")
          .select("*")
          .order("name");
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
            followersCount: 500,
            isPrimary: row.slug === "pethri",
          }));
        }
      }
    } catch {
      // Fall back safely to seeded localities
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
            "*, author:profiles!posts_author_id_fkey(id,username,full_name,avatar_url,role,is_verified_reporter), locality:localities!posts_locality_id_fkey(id,slug,name), media:post_media(*), corrections:post_corrections(*), comments(*, author:profiles!comments_author_id_fkey(id,username,full_name,avatar_url))"
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
            const corrRows = Array.isArray(row.corrections)
              ? row.corrections
              : [];
            const sharePrecise = Boolean(row.share_precise_location);
            const sourceKind =
              (row.source_kind as PostSourceKind) ?? "citizen";

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
              sourceKind,
              sponsorInfo:
                sourceKind === "sponsored" && row.sponsor_advertiser
                  ? {
                      advertiserName: String(row.sponsor_advertiser),
                      disclosure: String(
                        row.sponsor_disclosure ?? "Sponsored Local Partner"
                      ),
                    }
                  : undefined,
              headline: String(row.headline),
              body: String(row.body),
              isBreaking: Boolean(row.is_breaking),
              isMoment: Boolean(row.is_moment),
              playlistSlug: row.playlist_slug
                ? String(row.playlist_slug)
                : undefined,
              verificationTier: row.verification_tier as VerificationTier,
              moderationStatus: row.moderation_status as ModerationStatus,
              moderationNotes: row.moderation_notes
                ? String(row.moderation_notes)
                : undefined,
              corrections: corrRows.map((c: Record<string, unknown>) => ({
                id: String(c.id),
                summary: String(c.summary),
                correctedBy: "Pethri Newsroom Desk",
                correctedAt: String(c.created_at),
              })),
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

          return {
            posts: applyInMemoryFilters(mapped, filters),
            source: "supabase",
          };
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
  const viewerIsStaff = isActorEditorialStaff(filters.viewerId);

  return posts
    .filter((post) => {
      if (post.moderationStatus !== "approved") {
        // Private tips & unapproved posts remain strictly invisible to public users
        if (!filters.includePending) return false;
        const isOwner = Boolean(filters.viewerId && post.authorId === filters.viewerId);
        if (!viewerIsStaff && !isOwner) {
          return false;
        }
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
      if (
        filters.sourceKind &&
        filters.sourceKind !== "all" &&
        post.sourceKind !== filters.sourceKind
      ) {
        return false;
      }
      if (filters.playlistSlug && post.playlistSlug !== filters.playlistSlug) {
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

  // CRITICAL TRUST INVARIANT: Citizen submissions ALWAYS start as 'citizen', 'community', and 'pending'.
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
    sourceKind: "citizen",
    headline: input.headline.trim(),
    body: input.body.trim(),
    isBreaking: false,
    isMoment: input.isMoment,
    verificationTier: "community",
    moderationStatus: "pending",
    corrections: [],
    sharePreciseLocation: Boolean(input.sharePreciseLocation),
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
    title: "Citizen Report Queued",
    message: `"${newPost.headline.slice(0, 64)}" is awaiting Pethri Editorial Review.`,
    href: "/editorial",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return newPost;
}

export function createNewsroomDispatch(input: {
  authorId: string;
  localityId: string;
  category: PostCategory;
  format: PostFormat;
  sourceKind: "newsroom" | "sponsored";
  sponsorInfo?: SponsorInfo;
  headline: string;
  body: string;
  isBreaking: boolean;
  isMoment: boolean;
  playlistSlug?: string;
  approxLandmark?: string;
  media: Omit<PostMediaItem, "id">[];
}): { post?: PostItem; error?: string } {
  const store = getRuntimeStore();
  const author = store.profiles.find((p) => p.id === input.authorId);

  if (!author || !isNewsroomAuthorized(author.role) || author.isSuspended) {
    return {
      error:
        "Unauthorized: only accredited Newsroom Journalists, Editors, or Admins may publish official dispatches or breaking news.",
    };
  }

  const locality =
    store.localities.find((l) => l.id === input.localityId) ??
    store.localities[0];

  const isSponsored = input.sourceKind === "sponsored";
  const post: PostItem = {
    id: `post-${Date.now()}`,
    authorId: author.id,
    author: {
      id: author.id,
      username: author.username,
      fullName: author.fullName,
      avatarUrl: author.avatarUrl,
      role: author.role,
      isVerifiedReporter: author.isVerifiedReporter,
    },
    localityId: locality.id,
    localityName: locality.name,
    category: input.category,
    format: input.format,
    sourceKind: input.sourceKind,
    sponsorInfo: isSponsored
      ? {
          advertiserName:
            input.sponsorInfo?.advertiserName?.trim() || "Local Partner",
          disclosure:
            input.sponsorInfo?.disclosure?.trim() ||
            "Sponsored Local Partner • Paid Notice",
        }
      : undefined,
    headline: input.headline.trim(),
    body: input.body.trim(),
    isBreaking: isSponsored ? false : Boolean(input.isBreaking),
    isMoment: Boolean(input.isMoment),
    playlistSlug: input.playlistSlug,
    verificationTier: isSponsored ? "reviewed" : "verified",
    moderationStatus: "approved",
    reviewedBy: author.id,
    reviewedAt: new Date().toISOString(),
    corrections: [],
    sharePreciseLocation: false,
    approxLandmark: input.approxLandmark?.trim() || undefined,
    media: input.media.map((m, idx) => ({
      ...m,
      id: `media-${Date.now()}-${idx}`,
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

  store.posts.unshift(post);
  if (post.isBreaking) {
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      localityId: locality.id,
      localityName: locality.name,
      title: `BREAKING • ${locality.name}`,
      message: post.headline,
      href: "/feed",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  return { post };
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

  const revNum =
    store.articleRevisions.filter((r) => r.postId === post.id).length + 1;
  store.articleRevisions.unshift({
    id: `rev-${Date.now()}`,
    postId: post.id,
    revisionNumber: revNum,
    headline: post.headline,
    body: post.body,
    moderationStatus: post.moderationStatus,
    verificationTier: post.verificationTier,
    editedBy: post.reviewedBy,
    changeSummary:
      update.moderationNotes ?? `Editorial status -> ${update.moderationStatus}`,
    createdAt: new Date().toISOString(),
  });
  store.moderationLogs.unshift({
    id: `mod-${Date.now()}`,
    targetType: "post",
    targetId: post.id,
    action: `review_${update.moderationStatus}`,
    moderatorId: post.reviewedBy,
    notes: update.moderationNotes,
    createdAt: new Date().toISOString(),
  });

  if (update.moderationStatus === "approved") {
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      localityId: post.localityId,
      localityName: post.localityName,
      title: `Story ${update.verificationTier === "verified" ? "Verified" : "Published"}`,
      message: `${post.localityName}: "${post.headline.slice(0, 68)}" is now live.`,
      href: "/feed",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  return post;
}

export function addPostCorrection(
  postId: string,
  input: { summary: string; correctedBy: string }
): PostItem | null {
  const store = getRuntimeStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post || !input.summary.trim()) return null;

  post.corrections.unshift({
    id: `corr-${Date.now()}`,
    summary: input.summary.trim(),
    correctedBy: input.correctedBy,
    correctedAt: new Date().toISOString(),
  });
  return post;
}

export function getLiveBroadcast(): LiveBroadcast {
  return getRuntimeStore().liveStreams[0] ?? getRuntimeStore().broadcast;
}

export function listLiveStreams(locality?: string): LiveBroadcast[] {
  const streams = getRuntimeStore().liveStreams;
  if (!locality || locality === "all") return streams;
  return streams.filter((s) => s.localityId === locality);
}

export function createCommunityLiveStream(input: {
  hostId: string;
  hostName: string;
  hostUsername: string;
  title: string;
  summary: string;
  localityId: string;
  category: PostCategory;
}): LiveBroadcast {
  const store = getRuntimeStore();
  const host = store.profiles.find((p) => p.id === input.hostId);
  const loc =
    store.localities.find((l) => l.id === input.localityId) ??
    store.localities[0];
  const isOfficial = host ? isNewsroomAuthorized(host.role) : false;

  const posterByCategory: Record<PostCategory, string> = {
    news: "/images/photos/pethri-town.jpg",
    church: "/images/photos/church-feast.jpg",
    weddings: "/images/photos/coastal-wedding.jpg",
    agriculture: "/images/photos/paddy-harvest.jpg",
    sports: "/images/photos/local-sports.jpg",
    civic: "/images/photos/civic-road.jpg",
    celebrations: "/images/photos/church-feast.jpg",
  };

  const stream: LiveBroadcast = {
    id: `live-${Date.now()}`,
    title: input.title.trim(),
    summary: input.summary.trim(),
    channelName: isOfficial ? "Pethri Newsroom Live" : `${loc.name} Community Live`,
    localityId: loc.id,
    localityName: loc.name,
    category: input.category,
    streamSourceKind: isOfficial ? "official_newsroom" : "community",
    hostName: host?.fullName ?? input.hostName,
    hostUsername: host?.username ?? input.hostUsername,
    isLive: true,
    viewerCount: 1,
    reactionsCount: 0,
    posterUrl: posterByCategory[input.category] ?? "/images/photos/pethri-town.jpg",
    startedAt: new Date().toISOString(),
    chatMessages: [
      {
        id: `lc-${Date.now()}`,
        streamId: `live-${Date.now()}`,
        senderName: host?.fullName ?? input.hostName,
        senderHandle: host?.username ?? input.hostUsername,
        text: `Live stream started from ${loc.name}! Join the conversation below.`,
        sentAt: new Date().toISOString(),
      },
    ],
  };

  store.liveStreams.unshift(stream);
  return stream;
}

export function postLiveChatMessage(
  streamId: string,
  input: { senderName: string; senderHandle: string; text: string }
): LiveBroadcast | null {
  const store = getRuntimeStore();
  const stream = store.liveStreams.find((s) => s.id === streamId);
  if (!stream || !input.text.trim()) return null;

  stream.chatMessages.push({
    id: `lc-${Date.now()}`,
    streamId: stream.id,
    senderName: input.senderName,
    senderHandle: input.senderHandle,
    text: input.text.trim(),
    sentAt: new Date().toISOString(),
  });
  return stream;
}

export function sendLiveReaction(streamId: string): LiveBroadcast | null {
  const store = getRuntimeStore();
  const stream = store.liveStreams.find((s) => s.id === streamId);
  if (!stream) return null;
  stream.reactionsCount += 1;
  return stream;
}

export function updateLiveBroadcast(input: {
  actorId: string;
  isLive?: boolean;
  title?: string;
  summary?: string;
  localityId?: string;
}): { broadcast?: LiveBroadcast; error?: string } {
  const store = getRuntimeStore();
  const actor = store.profiles.find((p) => p.id === input.actorId);
  if (!actor || !isNewsroomAuthorized(actor.role) || actor.isSuspended) {
    return {
      error:
        "Unauthorized: only accredited Newsroom staff can start or update official Live Broadcasts.",
    };
  }
  const loc = store.localities.find((l) => l.id === input.localityId);
  const target = store.liveStreams[0] ?? store.broadcast;
  if (typeof input.isLive === "boolean") target.isLive = input.isLive;
  if (input.title?.trim()) target.title = input.title.trim();
  if (input.summary?.trim()) target.summary = input.summary.trim();
  if (loc) {
    target.localityId = loc.id;
    target.localityName = loc.name;
  }
  target.hostName = actor.fullName;
  if (target.isLive) {
    target.startedAt = new Date().toISOString();
  }
  store.broadcast = target;
  return { broadcast: target };
}

export function listPlaylists(): ChannelPlaylist[] {
  return getRuntimeStore().playlists;
}

export function togglePlaylistSubscription(
  playlistId: string
): ChannelPlaylist | null {
  const store = getRuntimeStore();
  const pl = store.playlists.find((p) => p.id === playlistId);
  if (!pl) return null;
  pl.subscribedByMe = !pl.subscribedByMe;
  pl.subscribersCount = Math.max(
    0,
    pl.subscribersCount + (pl.subscribedByMe ? 1 : -1)
  );
  return pl;
}

export function listEvents(locality?: string): LocalEvent[] {
  const events = getRuntimeStore().events;
  if (!locality || locality === "all") return events;
  return events.filter((e) => e.localityId === locality);
}

export function toggleEventRsvp(eventId: string): LocalEvent | null {
  const store = getRuntimeStore();
  const evt = store.events.find((e) => e.id === eventId);
  if (!evt) return null;
  evt.rsvpedByMe = !evt.rsvpedByMe;
  evt.rsvpCount = Math.max(0, evt.rsvpCount + (evt.rsvpedByMe ? 1 : -1));
  return evt;
}

export function toggleFollowProfile(profileId: string): UserProfile | null {
  const store = getRuntimeStore();
  const prof = store.profiles.find((p) => p.id === profileId);
  if (!prof) return null;
  prof.followedByMe = !prof.followedByMe;
  prof.followersCount = Math.max(
    0,
    prof.followersCount + (prof.followedByMe ? 1 : -1)
  );
  return prof;
}

export function toggleFollowLocality(localityId: string): Locality | null {
  const store = getRuntimeStore();
  const loc = store.localities.find((l) => l.id === localityId);
  if (!loc) return null;
  loc.followedByMe = !loc.followedByMe;
  loc.followersCount = Math.max(
    0,
    (loc.followersCount ?? 0) + (loc.followedByMe ? 1 : -1)
  );
  return loc;
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
  updates: {
    role?: UserRole;
    isVerifiedReporter?: boolean;
    isSuspended?: boolean;
    actorId?: string;
  }
): UserProfile | null {
  const store = getRuntimeStore();
  const profile = store.profiles.find((p) => p.id === userId);
  if (!profile) return null;
  const previousRole = profile.role;
  if (updates.role) profile.role = updates.role;
  if (typeof updates.isVerifiedReporter === "boolean") {
    profile.isVerifiedReporter = updates.isVerifiedReporter;
  }
  if (typeof updates.isSuspended === "boolean") {
    profile.isSuspended = updates.isSuspended;
  }
  store.permissionHistory.unshift({
    id: `permh-${Date.now()}`,
    targetProfileId: profile.id,
    changedBy: updates.actorId ?? "user-editor",
    previousRole,
    newRole: profile.role,
    summary: `Role/governance updated (${previousRole} -> ${profile.role})`,
    createdAt: new Date().toISOString(),
  });
  return profile;
}

export function listEditorialGovernanceLogs() {
  const store = getRuntimeStore();
  return {
    articleRevisions: store.articleRevisions,
    moderationLogs: store.moderationLogs,
    permissionHistory: store.permissionHistory,
  };
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
