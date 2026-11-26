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
import { EditorialReveal, ParallaxMediaFrame } from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostItem } from "@/types/pethri";

export default function ArticleReaderPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id;
  const { currentUser, showToast } = usePethri();

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
        <div className="h-6 w-48 animate-pulse bg-slate-200 rounded" />
        <div className="h-14 w-full animate-pulse bg-slate-200 rounded" />
        <div className="h-80 w-full animate-pulse bg-slate-200 rounded-lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-editorial text-3xl text-[#0A2E6E]">
          Dispatch not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This story may still be awaiting editorial review or was moved.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0A2E6E] px-5 py-2.5 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pethri Frontpage
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

  return (
    <article className="bg-white min-h-screen">
      {/* Top Editorial Breadcrumb Strip */}
      <div className="border-b border-slate-200 bg-[#FAFAF9]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 font-bold text-[#0A2E6E] hover:text-[#D91E2A]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to News Feed</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className="font-bold text-[#D91E2A] uppercase">
              {post.localityName}
            </span>
            <span>/</span>
            <span>{CATEGORY_META[post.category].label}</span>
            <span>/</span>
            <span>{readingMinutes} min read</span>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <header className="mx-auto max-w-4xl px-4 pt-8 pb-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {post.isBreaking && isNewsroom && (
            <span className="bg-[#D91E2A] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
              Breaking News
            </span>
          )}
          {isNewsroom ? (
            <span className="inline-flex items-center gap-1 bg-[#0A2E6E] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pethri Newsroom Dispatch
            </span>
          ) : isSponsored ? (
            <span className="bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Sponsored Partner • {post.sponsorInfo?.advertiserName}
            </span>
          ) : (
            <span className="border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Citizen Desk Submission
            </span>
          )}

          {!isSponsored && <VerificationBadge tier={post.verificationTier} />}
        </div>

        <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[54px] leading-[1.08] tracking-tight text-[#0B1426]">
          {post.headline}
        </h1>

        {/* Reporter Byline & Timestamps Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile?user=${post.author.username}`}>
              <img
                src={post.author.avatarUrl}
                alt={post.author.fullName}
                className="h-12 w-12 rounded-full object-cover ring-1 ring-slate-200"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile?user=${post.author.username}`}
                  className="text-sm font-extrabold text-[#0B1426] hover:text-[#0A2E6E]"
                >
                  {post.author.fullName}
                </Link>
                <span className="text-[11px] font-semibold uppercase text-slate-500">
                  • {post.author.role}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-[#D91E2A]">
                  <MapPin className="h-3 w-3" />
                  {post.localityName}
                  {post.approxLandmark ? ` (${post.approxLandmark})` : ""}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Published <RelativeTime iso={post.createdAt} />
                </span>
                {post.reviewedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Reviewed <RelativeTime iso={post.reviewedAt} />
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSponsored && post.author.id !== currentUser.id && (
              <button
                type="button"
                onClick={handleFollow}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                  followingAuthor
                    ? "bg-[#0A2E6E] text-white"
                    : "border border-[#0A2E6E] text-[#0A2E6E] hover:bg-[#0A2E6E] hover:text-white"
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
                  ? "border-[#0A2E6E] bg-[#0A2E6E] text-white"
                  : "border-slate-200 text-slate-600 hover:border-[#0A2E6E]"
              )}
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share article"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-[#0A2E6E]"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Visual Stage with Subtle Parallax */}
      {activeMedia && (
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
            {activeMedia.mediaType === "video" ? (
              <video
                src={activeMedia.url}
                poster={activeMedia.posterUrl}
                controls
                playsInline
                className="w-full max-h-[540px] object-cover"
              />
            ) : (
              <ParallaxMediaFrame
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() =>
                    setSlideIndex((i) => (i + 1) % post.media.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
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

      {/* Longform Editorial Body & Sidebar */}
      <div className="mx-auto max-w-5xl px-4 py-10 grid gap-10 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-6">
          <EditorialReveal>
            <p className="editorial-dropcap text-base sm:text-lg leading-[1.8] text-slate-800 whitespace-pre-line">
              {post.body}
            </p>
          </EditorialReveal>

          {/* Correction History Log */}
          {post.corrections && post.corrections.length > 0 && (
            <div className="border-l-4 border-[#0A2E6E] bg-blue-50/70 p-4 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[#0A2E6E]">
                <FileEdit className="h-4 w-4" />
                <span>Editorial Correction History</span>
              </div>
              <div className="mt-2 space-y-2 text-slate-700">
                {post.corrections.map((c) => (
                  <div key={c.id}>
                    <p className="font-bold text-[#0B1426]">
                      {c.correctedBy} • <RelativeTime iso={c.correctedAt} />
                    </p>
                    <p className="mt-0.5">{c.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement & Fact-Check Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => engage("like")}
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-bold transition-transform active:scale-90",
                  post.likedByMe
                    ? "text-[#D91E2A]"
                    : "text-slate-700 hover:text-[#D91E2A]"
                )}
              >
                <Heart
                  className={cn("h-5 w-5", post.likedByMe && "fill-[#D91E2A]")}
                />
                <span>{post.likesCount} Likes</span>
              </button>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <MessageCircle className="h-5 w-5" />
                <span>{post.commentsCount} Comments</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setReportOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#D91E2A]"
            >
              <Flag className="h-4 w-4" />
              Request Fact-Check / Report
            </button>
          </div>

          {reportOpen && (
            <form
              onSubmit={handleReportSubmit}
              className="rounded-lg border border-red-200 bg-red-50/70 p-4 space-y-2.5"
            >
              <p className="text-xs font-bold text-[#D91E2A]">
                Submit Correction Request or Content Flag
              </p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded border border-red-200 bg-white px-3 py-2 text-xs outline-none"
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
                className="w-full rounded border border-red-200 bg-white px-3 py-2 text-xs outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-[#D91E2A] px-4 py-1.5 text-xs font-bold text-white"
              >
                Send to Newsroom
              </button>
            </form>
          )}

          {/* Reader Discussion */}
          <section className="space-y-4 pt-2">
            <h2 className="font-display text-lg font-extrabold text-[#0A2E6E]">
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
                placeholder={`Add your perspective as ${currentUser.fullName}...`}
                className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#0A2E6E]"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="rounded-full bg-[#0A2E6E] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Comment
              </button>
            </form>

            <div className="space-y-3">
              {post.comments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 border-b border-slate-100 pb-3"
                >
                  <img
                    src={c.authorAvatar}
                    alt={c.authorName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#0A2E6E]">
                      {c.authorName}{" "}
                      <span className="font-normal text-slate-400">
                        • <RelativeTime iso={c.createdAt} />
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Related Stories Rail */}
        <aside className="lg:col-span-4 space-y-5 lg:border-l lg:border-slate-200 lg:pl-6">
          <div className="border-b border-slate-200 pb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#D91E2A]">
              Related Dispatches
            </p>
            <h2 className="font-display text-lg font-extrabold text-[#0A2E6E]">
              More from {post.localityName} &amp; Beat
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {related.length === 0 ? (
              <p className="text-xs text-slate-500">
                Browse the full feed for more updates.
              </p>
            ) : (
              related.map((item) => (
                <Link
                  key={item.id}
                  href={`/article/${item.id}`}
                  className="block py-4 first:pt-0 group"
                >
                  <p className="text-[10px] font-bold uppercase text-[#D91E2A]">
                    {item.localityName} • {CATEGORY_META[item.category].short}
                  </p>
                  <h3 className="mt-1 font-editorial text-xl leading-snug text-[#0B1426] group-hover:text-[#0A2E6E]">
                    {item.headline}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {item.author.fullName} •{" "}
                    <RelativeTime iso={item.createdAt} />
                  </p>
                </Link>
              ))
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
