export type UserRole =
  | "citizen"
  | "correspondent"
  | "journalist"
  | "editor"
  | "admin";

export type PostCategory =
  | "news"
  | "church"
  | "weddings"
  | "agriculture"
  | "sports"
  | "civic"
  | "celebrations";

export type PostFormat =
  | "article"
  | "photo"
  | "carousel"
  | "moment_video"
  | "dispatch";

export type VerificationTier = "community" | "reviewed" | "verified";

export type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";

export type PostSourceKind = "newsroom" | "citizen" | "sponsored";

export interface CorrectionEntry {
  id: string;
  summary: string;
  correctedBy: string;
  correctedAt: string;
}

export interface SponsorInfo {
  advertiserName: string;
  disclosure: string;
}

export interface Locality {
  id: string;
  slug: string;
  name: string;
  nameKn?: string;
  taluk: string;
  district: string;
  pincode: string;
  centerLat: number;
  centerLng: number;
  mapX: number;
  mapY: number;
  description: string;
  activeReporters: number;
  followersCount?: number;
  followedByMe?: boolean;
  isPrimary?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  role: UserRole;
  homeLocalityId: string;
  homeLocalityName: string;
  isVerifiedReporter: boolean;
  isSuspended?: boolean;
  joinedAt: string;
  contributionsCount: number;
  followersCount: number;
  followedByMe?: boolean;
}

export interface PostMediaItem {
  id: string;
  mediaType: "image" | "video";
  url: string;
  posterUrl?: string;
  aspectRatio: "4:5" | "16:9" | "1:1" | "9:16";
  caption?: string;
  durationSeconds?: number;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface PostItem {
  id: string;
  authorId: string;
  author: Pick<
    UserProfile,
    "id" | "username" | "fullName" | "avatarUrl" | "role" | "isVerifiedReporter"
  >;
  localityId: string;
  localityName: string;
  category: PostCategory;
  format: PostFormat;
  sourceKind: PostSourceKind;
  sponsorInfo?: SponsorInfo;
  headline: string;
  headlineKn?: string;
  body: string;
  bodyKn?: string;
  isBreaking: boolean;
  isMoment: boolean;
  playlistSlug?: string;
  verificationTier: VerificationTier;
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  corrections: CorrectionEntry[];
  reviewedBy?: string;
  reviewedAt?: string;
  sharePreciseLocation: boolean;
  publicLat?: number | null;
  publicLng?: number | null;
  approxLandmark?: string;
  media: PostMediaItem[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  comments: CommentItem[];
  isDemoData?: boolean;
  createdAt: string;
}

export interface LiveChatMessage {
  id: string;
  streamId: string;
  senderName: string;
  senderHandle: string;
  text: string;
  sentAt: string;
}

export interface LiveBroadcast {
  id: string;
  title: string;
  summary: string;
  channelName: string;
  localityId: string;
  localityName: string;
  category: PostCategory;
  streamSourceKind: "official_newsroom" | "community";
  hostName: string;
  hostUsername: string;
  isLive: boolean;
  viewerCount: number;
  reactionsCount: number;
  posterUrl: string;
  startedAt: string;
  chatMessages: LiveChatMessage[];
}

export interface ChannelPlaylist {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: PostCategory;
  episodeCount: number;
  coverUrl: string;
  subscribersCount: number;
  subscribedByMe?: boolean;
}

export interface LocalEvent {
  id: string;
  localityId: string;
  localityName: string;
  title: string;
  description?: string;
  category: PostCategory;
  startsAt: string;
  endsAt?: string | null;
  venue: string;
  organizer: string;
  imageUrl?: string | null;
  status?: "draft" | "published" | "cancelled";
  rsvpCount: number;
  rsvpedByMe?: boolean;
  isDemoData?: boolean;
}

export interface ContentReport {
  id: string;
  postId: string;
  postHeadline: string;
  reporterUsername: string;
  reason: string;
  details: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  createdAt: string;
}

export interface LocalBusiness {
  id: string;
  localityId: string;
  localityName: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  hours: string;
  isVerified: boolean;
  imageUrl?: string;
  isDemoData?: boolean;
}

export interface CommunityAnnouncement {
  id: string;
  localityId?: string;
  localityName: string;
  title: string;
  summary: string;
  issuer: string;
  urgency: "notice" | "advisory" | "urgent";
  validUntil: string;
  createdAt: string;
  isDemoData?: boolean;
}

export interface NotificationItem {
  id: string;
  localityId?: string;
  localityName: string;
  title: string;
  message: string;
  href: string;
  isRead: boolean;
  createdAt: string;
}
