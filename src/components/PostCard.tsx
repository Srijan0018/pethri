"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  Flag,
  Heart,
  MapPin,
  Megaphone,
  MessageCircle,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
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
  const { currentUser, language, dict, showToast } = usePethri();
  const [slideIndex, setSlideIndex] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [correctionsOpen, setCorrectionsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Needs fact-check");
  const [reportDetails, setReportDetails] = useState("");
  const [followingAuthor, setFollowingAuthor] = useState(false);

  const category = CATEGORY_META[post.category];
  const activeMedia = post.media[slideIndex] ?? post.media[0];
  const isSponsored = post.sourceKind === "sponsored";
  const isNewsroom = post.sourceKind === "newsroom";

  const displayHeadline =
    language === "kn" && post.headlineKn ? post.headlineKn : post.headline;
  const displayBody =
    language === "kn" && post.bodyKn ? post.bodyKn : post.body;

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

  const handleFollowToggle = async () => {
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

  const handleDoubleTap = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 700);
    if (!post.likedByMe) {
      triggerEngage("like");
    }
  };

  const handleShare = async () => {
    await triggerEngage("share");
    const shareUrl = `${window.location.origin}/article/${post.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    showToast("Article link copied to clipboard");
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
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md",
        isSponsored
          ? "border-amber-300 bg-[#F7F6EF]"
          : isNewsroom
            ? "border-[#202820]/15 border-t-[3px] border-t-[#202820]"
            : "border-[#202820]/10"
      )}
    >
      {isSponsored && (
        <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-[11px] font-semibold text-amber-900">
          <span className="inline-flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5 text-amber-700" />
            <span>
              SPONSORED •{" "}
              {post.sponsorInfo?.advertiserName ?? "Local Business Partner"}
            </span>
          </span>
          <span className="text-[10px] text-amber-700">
            {post.sponsorInfo?.disclosure ?? "Paid Local Notice"}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/profile?user=${post.author.username}`}>
            <img
              src={post.author.avatarUrl}
              alt={post.author.fullName}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-[#202820]/15"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile?user=${post.author.username}`}
                className="text-sm font-bold text-[#202820] hover:underline truncate"
              >
                {post.author.fullName}
              </Link>
              {isNewsroom ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#202820] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#B7F36B]">
                  <ShieldCheck className="h-3 w-3" />
                  Newsroom
                </span>
              ) : !isSponsored ? (
                <span className="inline-flex items-center rounded-full bg-[#DCEBCB]/70 px-2 py-0.5 text-[10px] font-bold text-[#202820]">
                  Community
                </span>
              ) : null}
              {!isSponsored && post.author.id !== currentUser.id && (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors",
                    followingAuthor
                      ? "bg-[#DCEBCB] text-[#202820]"
                      : "bg-[#F7F6EF] text-[#202820] border border-[#202820]/15 hover:bg-[#202820] hover:text-[#B7F36B]"
                  )}
                >
                  {followingAuthor ? (
                    <>
                      <UserCheck className="h-2.5 w-2.5" />
                      {dict.actions.following}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-2.5 w-2.5" />
                      {dict.actions.follow}
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[#525F52]">
              <span className="inline-flex items-center gap-1 font-bold text-[#202820]">
                <MapPin className="h-3 w-3" />
                {post.localityName}
              </span>
              {post.approxLandmark && (
                <span className="hidden sm:inline truncate max-w-44">
                  • {post.approxLandmark}
                </span>
              )}
              <span>
                • <RelativeTime iso={post.createdAt} />
              </span>
            </div>
          </div>
        </div>

        {!isSponsored && (
          <VerificationBadge tier={post.verificationTier} compact />
        )}
      </div>

      {/* Category & Breaking Strip */}
      <div className="px-5 pb-2.5 flex flex-wrap items-center gap-2">
        {post.isBreaking && isNewsroom && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#B7F36B] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#202820]">
            {dict.sections.breakingNews}
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            category.pill
          )}
        >
          {language === "kn" ? category.labelKn : category.label}
        </span>
        {post.format === "carousel" && (
          <span className="text-[11px] font-mono font-medium text-[#525F52]">
            {slideIndex + 1}/{post.media.length}
          </span>
        )}
        {post.isMoment && (
          <button
            type="button"
            onClick={() => onOpenMoment?.(post)}
            className="inline-flex items-center gap-1 rounded-full bg-[#202820] px-2.5 py-0.5 text-[10px] font-bold text-[#B7F36B]"
          >
            <Sparkles className="h-3 w-3" />
            Moment
          </button>
        )}
      </div>

      {/* Headline & Editorial Body */}
      <div className="px-5 pb-3.5">
        <Link href={`/article/${post.id}`} className="group block">
          <h2 className="font-editorial text-2xl sm:text-[28px] leading-snug text-[#202820] group-hover:underline">
            {displayHeadline}
          </h2>
        </Link>
        <p className="mt-1.5 text-sm leading-relaxed text-[#525F52]">
          {displayBody}
        </p>

        <Link
          href={`/article/${post.id}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#202820] hover:underline"
        >
          <span>{dict.sections.readFullReport}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        {post.corrections && post.corrections.length > 0 && (
          <div className="mt-3 rounded-xl border border-[#202820]/15 bg-[#C9E8D5]/45 px-3 py-2 text-xs">
            <button
              type="button"
              onClick={() => setCorrectionsOpen((v) => !v)}
              className="flex w-full items-center justify-between font-bold text-[#202820]"
            >
              <span className="inline-flex items-center gap-1.5">
                <FileEdit className="h-3.5 w-3.5" />
                Correction History ({post.corrections.length})
              </span>
              <span className="text-[11px] underline">
                {correctionsOpen ? "Hide" : "View log"}
              </span>
            </button>
            {correctionsOpen && (
              <div className="mt-2 space-y-1.5 border-t border-[#202820]/10 pt-2 text-[11px] text-[#202820]/85">
                {post.corrections.map((c) => (
                  <div key={c.id}>
                    <p className="font-bold">
                      {c.correctedBy} • <RelativeTime iso={c.correctedAt} />
                    </p>
                    <p>{c.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media Carousel / Video / Photo */}
      {activeMedia && (
        <div
          onDoubleClick={handleDoubleTap}
          className="relative bg-[#202820] select-none overflow-hidden group"
        >
          <AnimatePresence mode="wait">
            {activeMedia.mediaType === "video" ? (
              <motion.video
                key={activeMedia.id}
                src={activeMedia.url}
                poster={activeMedia.posterUrl}
                controls
                playsInline
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.7 }}
                className="w-full max-h-[480px] object-cover"
              />
            ) : (
              <motion.img
                key={activeMedia.id}
                src={activeMedia.url}
                alt={activeMedia.caption ?? post.headline}
                initial={{ opacity: 0.85, scale: 1.01 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.85 }}
                transition={{ duration: 0.28 }}
                className={cn(
                  "w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]",
                  activeMedia.aspectRatio === "4:5"
                    ? "max-h-[460px]"
                    : "aspect-video max-h-[410px]"
                )}
              />
            )}
          </AnimatePresence>

          {post.format === "moment_video" &&
            activeMedia.mediaType === "image" && (
              <button
                type="button"
                onClick={() => onOpenMoment?.(post)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[#202820]/85 px-3.5 py-1.5 text-xs font-bold text-[#B7F36B] hover:bg-[#202820]"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-[#202820]/70 text-white hover:bg-[#202820]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next media slide"
                onClick={() =>
                  setSlideIndex((i) => (i + 1) % post.media.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-[#202820]/70 text-white hover:bg-[#202820]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-[#202820]/60 px-2.5 py-1">
                {post.media.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setSlideIndex(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === slideIndex
                        ? "w-5 bg-[#B7F36B]"
                        : "w-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#202820]/20"
            >
              <Heart className="h-20 w-20 fill-[#B7F36B] text-[#202820] drop-shadow-2xl" />
            </motion.div>
          )}
        </div>
      )}

      {/* Privacy & Caption Strip */}
      <div className="flex items-center justify-between border-b border-[#202820]/10 bg-[#F7F6EF] px-5 py-2 text-[11px] text-[#525F52]">
        <span>
          {post.sharePreciseLocation && post.publicLat
            ? `GPS verified with consent (${post.publicLat.toFixed(3)}, ${post.publicLng?.toFixed(3)})`
            : "Locality-only location (exact GPS private)"}
        </span>
        {activeMedia?.caption && (
          <span className="hidden sm:inline truncate max-w-64 italic">
            {activeMedia.caption}
          </span>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => triggerEngage("like")}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold",
              post.likedByMe
                ? "text-[#202820]"
                : "text-[#525F52] hover:text-[#202820]"
            )}
          >
            <Heart
              className={cn(
                "h-5 w-5",
                post.likedByMe && "fill-[#B7F36B] text-[#202820]"
              )}
            />
            <span>{post.likesCount}</span>
          </motion.button>

          <button
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#525F52] hover:text-[#202820]"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentsCount}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#525F52] hover:text-[#202820]"
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
            className="text-[#525F52] hover:text-[#202820] transition-colors"
          >
            <Flag className="h-4 w-4" />
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => triggerEngage("bookmark")}
            aria-label="Bookmark story"
            className={cn(
              post.bookmarkedByMe
                ? "text-[#202820]"
                : "text-[#525F52] hover:text-[#202820]"
            )}
          >
            <Bookmark
              className={cn(
                "h-5 w-5",
                post.bookmarkedByMe && "fill-[#B7F36B] text-[#202820]"
              )}
            />
          </motion.button>
        </div>
      </div>

      {/* Inline Comments */}
      {commentsOpen && (
        <div className="border-t border-[#202820]/10 bg-[#F7F6EF] px-5 py-3 space-y-3">
          {post.comments.length === 0 ? (
            <p className="text-xs text-[#525F52]">
              No comments yet — join the discussion for {post.localityName}.
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
                  <div className="flex-1 rounded-xl bg-white px-3 py-2 text-xs border border-[#202820]/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#202820]">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-[#525F52]">
                        <RelativeTime iso={c.createdAt} />
                      </span>
                    </div>
                    <p className="mt-0.5 text-[#202820]/85">{c.content}</p>
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
              className="flex-1 rounded-full border border-[#202820]/15 bg-white px-3.5 py-2 text-xs outline-none focus:border-[#202820]"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submittingComment}
              className="rounded-full bg-[#202820] px-4 py-2 text-xs font-bold text-[#B7F36B] disabled:opacity-50"
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
          className="border-t border-amber-200 bg-amber-50/70 px-5 py-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#202820]">
              Flag for Pethri Editorial Desk
            </span>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="text-xs text-[#525F52]"
            >
              Cancel
            </button>
          </div>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-lg border border-[#202820]/15 bg-white px-3 py-1.5 text-xs outline-none"
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
            className="w-full rounded-lg border border-[#202820]/15 bg-white px-3 py-1.5 text-xs outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-[#202820] px-4 py-1.5 text-xs font-bold text-[#B7F36B]"
          >
            Submit Report
          </button>
        </form>
      )}
    </article>
  );
}
