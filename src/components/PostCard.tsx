"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostItem } from "@/types/pethri";

interface PostCardProps {
  post: PostItem;
  onPostUpdated?: (updated: PostItem) => void;
  onOpenMoment?: (post: PostItem) => void;
}

export function PostCard({
  post,
  onPostUpdated,
  onOpenMoment,
}: PostCardProps) {
  const { currentUser, showToast } = usePethri();
  const [slideIndex, setSlideIndex] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Needs fact-check");
  const [reportDetails, setReportDetails] = useState("");

  const category = CATEGORY_META[post.category];
  const activeMedia = post.media[slideIndex] ?? post.media[0];

  const triggerEngage = async (
    action: "like" | "bookmark" | "share" | "comment",
    payload?: { content?: string }
  ) => {
    try {
      const res = await fetch(`/api/posts/${post.id}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          content: payload?.content,
          authorName: currentUser.fullName,
          authorUsername: currentUser.username,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.post && onPostUpdated) {
          onPostUpdated(data.post);
        }
      }
    } catch {
      showToast("Could not sync engagement right now", "error");
    }
  };

  const handleDoubleTap = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 700);
    if (!post.likedByMe) {
      triggerEngage("like");
    }
  };

  const handleShare = async () => {
    await triggerEngage("share");
    const shareUrl = `${window.location.origin}/feed?post=${post.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    showToast("Story link copied to clipboard");
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    await triggerEngage("comment", { content: commentText.trim() });
    setCommentText("");
    setSubmittingComment(false);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      showToast("Report sent to Pethri Editorial Desk", "info");
    } else {
      showToast("Unable to submit report", "error");
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/profile?user=${post.author.username}`}>
            <img
              src={post.author.avatarUrl}
              alt={post.author.fullName}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-[#0A2E6E]/10"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile?user=${post.author.username}`}
                className="text-sm font-bold text-[#0B1426] hover:text-[#0A2E6E] truncate"
              >
                {post.author.fullName}
              </Link>
              {post.author.isVerifiedReporter && (
                <span
                  title="Verified Local Correspondent"
                  className="inline-flex items-center gap-0.5 rounded-full bg-[#0A2E6E]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0A2E6E]"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Correspondent
                </span>
              )}
              {post.isDemoData && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                  Demo
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-[#D91E2A]">
                <MapPin className="h-3 w-3" />
                {post.localityName}
              </span>
              {post.approxLandmark && (
                <span className="hidden sm:inline truncate max-w-44">
                  • {post.approxLandmark}
                </span>
              )}
              <span>• <RelativeTime iso={post.createdAt} /></span>
            </div>
          </div>
        </div>

        <VerificationBadge tier={post.verificationTier} compact />
      </div>

      {/* Category & Breaking Strip */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
        {post.isBreaking && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#D91E2A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Breaking
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            category.pill
          )}
        >
          {category.label}
        </span>
        {post.format === "carousel" && (
          <span className="text-[11px] font-mono font-medium text-slate-400">
            {slideIndex + 1}/{post.media.length} slides
          </span>
        )}
        {post.isMoment && (
          <button
            type="button"
            onClick={() => onOpenMoment?.(post)}
            className="inline-flex items-center gap-1 rounded-full bg-[#0A2E6E] px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-[#08245B]"
          >
            <Sparkles className="h-3 w-3" />
            Pethri Moment
          </button>
        )}
      </div>

      {/* Headline & Editorial Body */}
      <div className="px-4 pb-3">
        <h2 className="font-editorial text-2xl leading-snug text-[#0B1426]">
          {post.headline}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {post.body}
        </p>
      </div>

      {/* Interactive Media Carousel / Video / Photo */}
      {activeMedia && (
        <div
          onDoubleClick={handleDoubleTap}
          className="relative bg-slate-950 select-none overflow-hidden"
        >
          {activeMedia.mediaType === "video" ? (
            <video
              src={activeMedia.url}
              poster={activeMedia.posterUrl}
              controls
              playsInline
              className="w-full max-h-[480px] object-cover"
            />
          ) : (
            <img
              src={activeMedia.url}
              alt={activeMedia.caption ?? post.headline}
              className={cn(
                "w-full object-cover transition-transform duration-300",
                activeMedia.aspectRatio === "4:5"
                  ? "max-h-[480px]"
                  : "aspect-video max-h-[420px]"
              )}
            />
          )}

          {/* Moment Video Play Overlay */}
          {post.format === "moment_video" &&
            activeMedia.mediaType === "image" && (
              <button
                type="button"
                onClick={() => onOpenMoment?.(post)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-[#D91E2A] transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  Watch Moment{" "}
                  {activeMedia.durationSeconds
                    ? `(${activeMedia.durationSeconds}s)`
                    : ""}
                </span>
              </button>
            )}

          {/* Carousel Controls */}
          {post.media.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous media slide"
                onClick={() =>
                  setSlideIndex(
                    (i) => (i - 1 + post.media.length) % post.media.length
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next media slide"
                onClick={() =>
                  setSlideIndex((i) => (i + 1) % post.media.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
                {post.media.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setSlideIndex(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === slideIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Double-tap heart animation */}
          {showHeartBurst && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
              <Heart className="h-20 w-20 fill-[#D91E2A] text-white drop-shadow-2xl animate-ping" />
            </div>
          )}
        </div>
      )}

      {/* Privacy & GPS Disclosure Footnote */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
        <span>
          {post.sharePreciseLocation && post.publicLat
            ? `GPS verified with consent (${post.publicLat.toFixed(3)}, ${post.publicLng?.toFixed(3)})`
            : "Locality-only location (exact GPS kept private)"}
        </span>
        {activeMedia?.caption && (
          <span className="hidden sm:inline truncate max-w-64 italic">
            {activeMedia.caption}
          </span>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => triggerEngage("like")}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-90",
              post.likedByMe
                ? "text-[#D91E2A]"
                : "text-slate-600 hover:text-[#D91E2A]"
            )}
          >
            <Heart
              className={cn("h-5 w-5", post.likedByMe && "fill-[#D91E2A]")}
            />
            <span>{post.likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0A2E6E]"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentsCount}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0A2E6E]"
          >
            <Share2 className="h-5 w-5" />
            <span>{post.sharesCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReportOpen((v) => !v)}
            aria-label="Report post"
            title="Flag or request editorial fact-check"
            className="text-slate-400 hover:text-[#D91E2A] transition-colors"
          >
            <Flag className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => triggerEngage("bookmark")}
            aria-label="Bookmark story"
            className={cn(
              "transition-transform active:scale-90",
              post.bookmarkedByMe
                ? "text-[#0A2E6E]"
                : "text-slate-500 hover:text-[#0A2E6E]"
            )}
          >
            <Bookmark
              className={cn("h-5 w-5", post.bookmarkedByMe && "fill-[#0A2E6E]")}
            />
          </button>
        </div>
      </div>

      {/* Inline Comments Drawer */}
      {commentsOpen && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 space-y-3">
          {post.comments.length === 0 ? (
            <p className="text-xs text-slate-500">
              No comments yet — start the conversation for {post.localityName}.
            </p>
          ) : (
            <div className="space-y-2.5">
              {post.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <img
                    src={c.authorAvatar}
                    alt={c.authorName}
                    className="h-6 w-6 rounded-full object-cover mt-0.5"
                  />
                  <div className="flex-1 rounded-2xl bg-white px-3 py-2 text-xs shadow-2xs ring-1 ring-slate-200/70">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#0A2E6E]">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        <RelativeTime iso={c.createdAt} />
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-700">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Comment as ${currentUser.fullName}...`}
              className="flex-1 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-[#0A2E6E]"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submittingComment}
              className="rounded-full bg-[#0A2E6E] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}

      {/* Report Content Form */}
      {reportOpen && (
        <form
          onSubmit={handleReportSubmit}
          className="border-t border-red-100 bg-red-50/60 px-4 py-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D91E2A]">
              Flag for Pethri Editorial Desk
            </span>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs outline-none"
          >
            <option>Needs fact-check</option>
            <option>Misleading locality / date</option>
            <option>Privacy concern (personal data or location)</option>
            <option>Spam or duplicate</option>
          </select>
          <textarea
            rows={2}
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Share context for our editors..."
            className="w-full rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-[#D91E2A] px-4 py-1.5 text-xs font-bold text-white"
          >
            Submit Report
          </button>
        </form>
      )}
    </article>
  );
}
