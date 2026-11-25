export type UserRole = 'citizen' | 'correspondent' | 'editor' | 'admin';

export type PostCategory =
  | 'news'
  | 'church'
  | 'weddings'
  | 'agriculture'
  | 'sports'
  | 'civic'
  | 'celebrations';

export type PostFormat = 'article' | 'photo' | 'carousel' | 'moment_video' | 'dispatch';

export type VerificationTier = 'community' | 'reviewed' | 'verified';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface Locality {
  id: string;
  slug: string;
  name: string;
  taluk: string;
  district: string;
  pincode: string;
  centerLat: number;
  centerLng: number;
  mapX: number; // Percentage X on bespoke interactive regional map (0-100)
  mapY: number; // Percentage Y on bespoke interactive regional map (0-100)
  description: string;
  activeReporters: number;
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
}

export interface PostMediaItem {
  id: string;
  mediaType: 'image' | 'video';
  url: string;
  posterUrl?: string;
  aspectRatio: '4:5' | '16:9' | '1:1' | '9:16';
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
    'id' | 'username' | 'fullName' | 'avatarUrl' | 'role' | 'isVerifiedReporter'
  >;
  localityId: string;
  localityName: string;
  category: PostCategory;
  format: PostFormat;
  headline: string;
  body: string;
  isBreaking: boolean;
  isMoment: boolean;
  verificationTier: VerificationTier;
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
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

export interface ContentReport {
  id: string;
  postId: string;
  postHeadline: string;
  reporterUsername: string;
  reason: string;
  details: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
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
  urgency: 'notice' | 'advisory' | 'urgent';
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
