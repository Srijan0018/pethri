"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileEdit,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import {
  EditorialReveal,
  GsapImageMask,
  MaskedHeadlineReveal,
} from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostItem } from "@/types/pethri";

export default function ArticleReaderPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id;
  const { currentUser, requireAuth, language, showToast } = usePethri();

  const [post, setPost] = useState<PostItem | null>(null);
  const [related, setRelated] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Needs fact-check");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    fetch(`/api/posts/${postId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.post) {
          setPost(data.post);
          setRelated(data.related ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const engage = async (
    action: "like" | "bookmark" | "share" | "comment",
    content?: string
  ) => {
    if (!post) return;
    if (action !== "share") {
      const labelMap = {
        like: "react to this article",
        bookmark: "bookmark this article",
        comment: "comment on this article",
      };
      if (!requireAuth(labelMap[action])) return;
    }

    const res = await fetch(`/api/posts/${post.id}/engage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        content,
        authorName: currentUser.fullName,
        authorUsername: currentUser.username,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPost(data.post);
    }
  };

  const handleFollow = async () => {
    if (!post) return;
    if (!requireAuth("follow Karavali reporters")) return;
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_follow_profile",
        profileId: post.author.id,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setFollowingAuthor(Boolean(data.profile?.followedByMe));
      showToast(
        data.profile?.followedByMe
          ? `Following ${post.author.fullName}`
          : `Unfollowed ${post.author.fullName}`,
        "info"
      );
    }
  };

  const handleShare = async () => {
    await engage("share");
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    showToast("Article link copied to clipboard");
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    if (!requireAuth("flag content")) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        reason: reportReason,
        details: reportDetails,
        reporterUsername: currentUser.username,
      }),
    });
    if (res.ok) {
      setReportOpen(false);
      setReportDetails("");
      showToast("Flagged for Pethri Editorial Review", "info");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-5">
        <div className="h-6 w-48 animate-pulse bg-[#EAF2EE] rounded" />
        <div className="h-14 w-full animate-pulse bg-[#EAF2EE]/60 rounded" />
        <div className="h-80 w-full animate-pulse bg-[#E5E3DC] rounded-2xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-editorial text-3xl text-[#181917]">
          Article not found
        </h1>
        <p className="mt-2 text-sm text-[#5A605C]">
          This submission may still be in private editorial review.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1B5E43] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#398BFF] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pethri Pulse
        </Link>
      </div>
    );
  }

  const activeMedia = post.media[slideIndex] ?? post.media[0];
  const isNewsroom = post.sourceKind === "newsroom";
  const isSponsored = post.sourceKind === "sponsored";
  const readingMinutes = Math.max(
    1,
    Math.ceil(post.body.split(/\s+/).length / 160)
  );
  const title =
    language === "kn" && post.headlineKn ? post.headlineKn : post.headline;
  const bodyText =
    language === "kn" && post.bodyKn ? post.bodyKn : post.body;

  return (
    <article className="bg-[#F8F7F4] min-h-screen">
      <div className="border-b border-[#E5E3DC] bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 font-bold text-[#398BFF] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to News &amp; Discussions</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#5A605C]">
            <span className="font-bold text-[#1B5E43] uppercase">
              {post.localityName}
            </span>
            <span>/</span>
            <span>{CATEGORY_META[post.category].label}</span>
            <span>/</span>
            <span>{readingMinutes} min read</span>
          </div>
        </div>
      </div>

      <header className="mx-auto max-w-4xl px-4 pt-8 pb-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {post.isBreaking && isNewsroom && (
            <span className="rounded-full bg-[#D94E34] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
              Breaking News
            </span>
          )}
          {isNewsroom ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1B5E43] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Editorial Reporting
            </span>
          ) : isSponsored ? (
            <span className="rounded-full bg-[#EAF2EE] border border-[#E5E3DC] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#181917]">
              Sponsored Partner • {post.sponsorInfo?.advertiserName}
            </span>
          ) : (
            <span className="rounded-full bg-[#EAF2EE] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1B5E43]">
              Editorially Reviewed Tip
            </span>
          )}

          {!isSponsored && <VerificationBadge tier={post.verificationTier} />}
        </div>

        <MaskedHeadlineReveal>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[54px] leading-[1.08] tracking-tight text-[#181917]">
            {title}
          </h1>
        </MaskedHeadlineReveal>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-[#E5E3DC] py-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile?user=${post.author.username}`}>
              <img
                src={post.author.avatarUrl}
                alt={post.author.fullName}
                className="h-12 w-12 rounded-full object-cover ring-1 ring-[#E5E3DC]"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile?user=${post.author.username}`}
                  className="text-sm font-extrabold text-[#181917] hover:text-[#398BFF] transition-colors"
                >
                  {post.author.fullName}
                </Link>
                <span className="text-[11px] font-semibold uppercase text-[#5A605C]">
                  • {post.author.role}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#5A605C]">
                <span className="inline-flex items-center gap-1 font-bold text-[#1B5E43]">
                  <MapPin className="h-3 w-3" />
                  {post.localityName}
                  {post.approxLandmark ? ` (${post.approxLandmark})` : ""}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Published <RelativeTime iso={post.createdAt} />
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSponsored && post.author.id !== currentUser.id && (
              <button
                type="button"
                onClick={handleFollow}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors border",
                  followingAuthor
                    ? "bg-[#1B5E43] border-[#1B5E43] text-white"
                    : "border-[#E5E3DC] bg-white text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF]"
                )}
              >
                {followingAuthor ? (
                  <>
                    <UserCheck className="h-3.5 w-3.5" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Follow Reporter
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => engage("bookmark")}
              aria-label="Save article"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                post.bookmarkedByMe
                  ? "border-[#398BFF] bg-[#398BFF] text-white"
                  : "border-[#E5E3DC] bg-white text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF]"
              )}
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share article"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E3DC] bg-white text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF] transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {activeMedia && (
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-3xl border border-[#E5E3DC] bg-[#181917]">
            {activeMedia.mediaType === "video" ? (
              <video
                src={activeMedia.url}
                poster={activeMedia.posterUrl}
                controls
                playsInline
                className="w-full max-h-[540px] object-cover"
              />
            ) : (
              <GsapImageMask
                immediate
                src={activeMedia.url}
                alt={activeMedia.caption ?? post.headline}
                className="h-[300px] sm:h-[460px] w-full"
              />
            )}

            {post.media.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() =>
                    setSlideIndex(
                      (i) => (i - 1 + post.media.length) % post.media.length
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[#181917]/75 text-white hover:bg-[#398BFF]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() =>
                    setSlideIndex((i) => (i + 1) % post.media.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[#181917]/75 text-white hover:bg-[#398BFF]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A605C]">
            <span className="italic">
              {activeMedia.caption ?? "Field photograph from Pethri network"}
            </span>
            <span className="font-mono text-[11px]">
              {post.sharePreciseLocation && post.publicLat
                ? `GPS consented: ${post.publicLat.toFixed(4)}, ${post.publicLng?.toFixed(4)}`
                : "Privacy: Locality-only coordinate masking active"}
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-10 grid gap-10 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-6">
          <EditorialReveal>
            <p className="editorial-dropcap text-base sm:text-lg leading-[1.82] text-[#181917] whitespace-pre-line">
              {bodyText}
            </p>
          </EditorialReveal>

          {post.corrections && post.corrections.length > 0 && (
            <div className="rounded-2xl border border-[#E5E3DC] bg-[#EAF2EE] p-4 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[#1B5E43]">
                <FileEdit className="h-4 w-4" />
                <span>Editorial Correction History</span>
              </div>
              <div className="mt-2 space-y-2 text-[#181917]">
                {post.corrections.map((c) => (
                  <div key={c.id}>
                    <p className="font-bold">
                      {c.correctedBy} • <RelativeTime iso={c.correctedAt} />
                    </p>
                    <p className="mt-0.5 text-[#5A605C]">{c.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#E5E3DC] py-4">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => engage("like")}
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-bold transition-colors",
                  post.likedByMe
                    ? "text-[#398BFF]"
                    : "text-[#5A605C] hover:text-[#398BFF]"
                )}
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    post.likedByMe && "fill-[#398BFF] text-[#398BFF]"
                  )}
                />
                <span>{post.likesCount} Reactions</span>
              </button>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#5A605C]">
                <MessageCircle className="h-5 w-5" />
                <span>{post.commentsCount} Comments</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!requireAuth("request a correction or flag content")) return;
                setReportOpen((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A605C] hover:text-[#D94E34] transition-colors"
            >
              <Flag className="h-4 w-4" />
              Request Fact-Check / Report
            </button>
          </div>

          {reportOpen && (
            <form
              onSubmit={handleReportSubmit}
              className="rounded-2xl border border-[#E5E3DC] bg-white p-4 space-y-2.5"
            >
              <p className="text-xs font-bold text-[#181917]">
                Submit Correction Request or Flag
              </p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-xl border border-[#E5E3DC] bg-[#F8F7F4] px-3 py-2 text-xs outline-none focus:border-[#398BFF]"
              >
                <option>Needs fact-check</option>
                <option>Inaccurate timing or locality</option>
                <option>Privacy concern</option>
                <option>Spam or duplicate</option>
              </select>
              <textarea
                rows={2}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Explain what should be reviewed..."
                className="w-full rounded-xl border border-[#E5E3DC] bg-[#F8F7F4] px-3 py-2 text-xs outline-none focus:border-[#398BFF]"
              />
              <button
                type="submit"
                className="rounded-full bg-[#D94E34] px-4 py-1.5 text-xs font-extrabold text-white"
              >
                Send to Editors
              </button>
            </form>
          )}

          <section className="space-y-4 pt-2">
            <h2 className="font-display text-lg font-extrabold text-[#181917]">
              Community Discussion ({post.comments.length})
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                await engage("comment", commentText.trim());
                setCommentText("");
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Join the discussion (sign in required)..."
                className="flex-1 rounded-full border border-[#E5E3DC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#398BFF]"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="rounded-full bg-[#1B5E43] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#398BFF] disabled:opacity-50 transition-colors"
              >
                Comment
              </button>
            </form>

            <div className="space-y-3">
              {post.comments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-2xl border border-[#E5E3DC] bg-white p-3.5"
                >
                  <img
                    src={c.authorAvatar}
                    alt={c.authorName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#181917]">
                      {c.authorName}{" "}
                      <span className="font-normal text-[#5A605C]">
                        • <RelativeTime iso={c.createdAt} />
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[#5A605C]">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-5 lg:border-l lg:border-[#E5E3DC] lg:pl-6">
          <div className="border-b border-[#E5E3DC] pb-2">
            <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#1B5E43]">
              RELATED DISPATCHES
            </p>
            <h2 className="font-display text-lg font-extrabold text-[#181917]">
              More from {post.localityName}
            </h2>
          </div>

          <div className="divide-y divide-[#E5E3DC]">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/article/${item.id}`}
                className="block py-4 first:pt-0 group"
              >
                <p className="text-[10px] font-bold uppercase text-[#1B5E43]">
                  {item.localityName} • {CATEGORY_META[item.category].short}
                </p>
                <h3 className="mt-1 font-editorial text-xl leading-snug text-[#181917] group-hover:text-[#398BFF] transition-colors">
                  {item.headline}
                </h3>
                <p className="mt-1 text-[11px] text-[#5A605C]">
                  {item.author.fullName} • <RelativeTime iso={item.createdAt} />
                </p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </article>
  );
}
