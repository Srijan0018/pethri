"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { CATEGORY_META, cn, isLocalImageSrc } from "@/lib/utils";
import { shareContent } from "@/lib/share";
import type { PostItem } from "@/types/pethri";

const MotionImage = motion.create(Image);

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
  const { currentUser, requireAuth, language, dict, showToast } = usePethri();
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
  ): Promise<boolean> => {
    if (action !== "share") {
      const labelMap = {
        like: "react to stories",
        bookmark: "save bookmarks",
        comment: "post a comment",
      };
      if (!requireAuth(labelMap[action])) return false;
    }

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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          (data as { error?: string }).error ?? "Unable to sync interaction.",
          "error"
        );
        return false;
      }
      if ((data as { post?: PostItem }).post && onPostUpdated) {
        onPostUpdated((data as { post: PostItem }).post);
      }
      return true;
    } catch {
      showToast("Could not sync engagement right now", "error");
      return false;
    }
  };

  const handleFollowToggle = async () => {
    if (!requireAuth("follow reporters")) return;
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
    if (!requireAuth("react to stories")) return;
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 700);
    if (!post.likedByMe) {
      triggerEngage("like");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/article/${post.id}`;
    try {
      const result = await shareContent({
        title: post.headline,
        text: post.headline,
        url: shareUrl,
      });
      if (result === "cancelled") return;
      await triggerEngage("share");
      showToast(
        result === "shared" ? "Article shared" : "Article link copied to clipboard",
        "info"
      );
    } catch {
      showToast("Unable to share this article. Please try copying its URL.", "error");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    if (!requireAuth("post a comment")) return;
    setSubmittingComment(true);
    const ok = await triggerEngage("comment", { content: commentText.trim() });
    if (ok) {
      setCommentText("");
    }
    setSubmittingComment(false);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth("submit a moderation report")) return;
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
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition-all hover:border-[#315CFF]/45 hover:shadow-lg",
        isSponsored
          ? "border-[#E2E7F0] bg-[#FFFFFF]"
          : isNewsroom
            ? "border-[#E2E7F0] border-t-[3px] border-t-[#173FBE]"
            : "border-[#E2E7F0]"
      )}
    >
      {isSponsored && (
        <div className="flex items-center justify-between border-b border-[#E2E7F0] bg-[#EEF2FF] px-4 py-1.5 text-[11px] font-semibold text-[#173FBE]">
          <span className="inline-flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5" />
            <span>
              SPONSORED •{" "}
              {post.sponsorInfo?.advertiserName ?? "Local Business Partner"}
            </span>
          </span>
          <span className="text-[10px] text-[#5B6472]">
            {post.sponsorInfo?.disclosure ?? "Paid Local Notice"}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/profile?user=${post.author.username}`}>
            <Image
              src={post.author.avatarUrl}
              alt={post.author.fullName}
              width={40}
              height={40}
              unoptimized={!isLocalImageSrc(post.author.avatarUrl)}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-[#E2E7F0]"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile?user=${post.author.username}`}
                className="text-sm font-bold text-[#111318] hover:text-[#315CFF] truncate transition-colors"
              >
                {post.author.fullName}
              </Link>
              {isNewsroom ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#173FBE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <ShieldCheck className="h-3 w-3" />
                  Editorial
                </span>
              ) : !isSponsored ? (
                <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#173FBE]">
                  Reviewed Tip
                </span>
              ) : null}
              {!isSponsored && post.author.id !== currentUser.id && (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors",
                    followingAuthor
                      ? "bg-[#EEF2FF] border-[#173FBE]/25 text-[#173FBE]"
                      : "bg-white text-[#111318] border-[#E2E7F0] hover:border-[#315CFF] hover:text-[#315CFF]"
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
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[#5B6472]">
              <span className="inline-flex items-center gap-1 font-bold text-[#173FBE]">
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
          <span className="inline-flex items-center gap-1 rounded-full bg-[#D94E34] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
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
          <span className="text-[11px] font-mono font-medium text-[#5B6472]">
            {slideIndex + 1}/{post.media.length}
          </span>
        )}
        {post.isMoment && (
          <button
            type="button"
            onClick={() => onOpenMoment?.(post)}
            className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] border border-[#173FBE]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#173FBE] hover:border-[#315CFF] hover:text-[#315CFF] transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Story Highlight
          </button>
        )}
      </div>

      {/* Headline & Editorial Body */}
      <div className="px-5 pb-3.5">
        <Link href={`/article/${post.id}`} className="group block">
          <h2 className="font-editorial text-2xl sm:text-[28px] leading-snug text-[#111318] group-hover:text-[#173FBE] transition-colors">
            {displayHeadline}
          </h2>
        </Link>
        <p className="mt-1.5 text-sm leading-relaxed text-[#5B6472]">
          {displayBody}
        </p>

        <Link
          href={`/article/${post.id}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#315CFF] hover:text-[#173FBE] transition-colors"
        >
          <span>{dict.sections.readFullReport}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        {post.corrections && post.corrections.length > 0 && (
          <div className="mt-3 rounded-xl border border-[#E2E7F0] bg-[#EEF2FF]/75 px-3 py-2 text-xs">
            <button
              type="button"
              onClick={() => setCorrectionsOpen((v) => !v)}
              className="flex w-full items-center justify-between font-bold text-[#173FBE]"
            >
              <span className="inline-flex items-center gap-1.5">
                <FileEdit className="h-3.5 w-3.5" />
                Correction History ({post.corrections.length})
              </span>
              <span className="text-[11px] text-[#315CFF] hover:underline">
                {correctionsOpen ? "Hide" : "View log"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {correctionsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1.5 border-t border-[#E2E7F0] pt-2 text-[11px] text-[#111318]">
                    {post.corrections.map((c) => (
                      <div key={c.id}>
                        <p className="font-bold">
                          {c.correctedBy} • <RelativeTime iso={c.correctedAt} />
                        </p>
                        <p className="text-[#5B6472]">{c.summary}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Media Carousel / Video / Photo */}
      {activeMedia && (
        <div
          onDoubleClick={handleDoubleTap}
          className="relative bg-[#111318] select-none overflow-hidden group"
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
              <MotionImage
                key={activeMedia.id}
                src={activeMedia.url}
                alt={activeMedia.caption ?? post.headline}
                fill
                sizes="(max-width: 640px) 100vw, 672px"
                unoptimized={!isLocalImageSrc(activeMedia.url)}
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
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[#173FBE]/95 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-[#315CFF] transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  Watch Highlight{" "}
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
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-[#111318]/75 text-white hover:bg-[#315CFF] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next media slide"
                onClick={() =>
                  setSlideIndex((i) => (i + 1) % post.media.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-[#111318]/75 text-white hover:bg-[#315CFF] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-[#111318]/70 px-2.5 py-1">
                {post.media.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setSlideIndex(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === slideIndex
                        ? "w-5 bg-[#315CFF]"
                        : "w-1.5 bg-white/55"
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
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#111318]/20"
            >
              <Heart className="h-20 w-20 fill-[#315CFF] text-white drop-shadow-2xl" />
            </motion.div>
          )}
        </div>
      )}

      {/* Privacy & Caption Strip */}
      <div className="flex items-center justify-between border-b border-[#E2E7F0] bg-[#FFFFFF] px-5 py-2 text-[11px] text-[#5B6472]">
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
              "inline-flex items-center gap-1.5 text-xs font-bold transition-colors",
              post.likedByMe
                ? "text-[#315CFF]"
                : "text-[#5B6472] hover:text-[#315CFF]"
            )}
          >
            <Heart
              className={cn(
                "h-5 w-5",
                post.likedByMe && "fill-[#315CFF] text-[#315CFF]"
              )}
            />
            <span>{post.likesCount}</span>
          </motion.button>

          <button
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold transition-colors",
              commentsOpen
                ? "text-[#315CFF]"
                : "text-[#5B6472] hover:text-[#315CFF]"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentsCount}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B6472] hover:text-[#315CFF] transition-colors"
          >
            <Share2 className="h-5 w-5" />
            <span>{post.sharesCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!requireAuth("flag content")) return;
              setReportOpen((v) => !v);
            }}
            aria-label="Report post"
            title="Flag or request editorial fact-check"
            className="text-[#5B6472] hover:text-[#D94E34] transition-colors"
          >
            <Flag className="h-4 w-4" />
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => triggerEngage("bookmark")}
            aria-label="Bookmark story"
            className={cn(
              "transition-colors",
              post.bookmarkedByMe
                ? "text-[#315CFF]"
                : "text-[#5B6472] hover:text-[#315CFF]"
            )}
          >
            <Bookmark
              className={cn(
                "h-5 w-5",
                post.bookmarkedByMe && "fill-[#315CFF] text-[#315CFF]"
              )}
            />
          </motion.button>
        </div>
      </div>

      {/* Inline Comments */}
      <AnimatePresence initial={false}>
        {commentsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[#E2E7F0] bg-[#FFFFFF]"
          >
            <div className="px-5 py-3 space-y-3">
              {post.comments.length === 0 ? (
                <p className="text-xs text-[#5B6472]">
                  No comments yet — join the discussion for {post.localityName}.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {post.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <Image
                        src={c.authorAvatar}
                        alt={c.authorName}
                        width={24}
                        height={24}
                        unoptimized={!isLocalImageSrc(c.authorAvatar)}
                        className="h-6 w-6 rounded-full object-cover mt-0.5"
                      />
                      <div className="flex-1 rounded-xl bg-white px-3 py-2 text-xs border border-[#E2E7F0]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#111318]">
                            {c.authorName}
                          </span>
                          <span className="text-[10px] text-[#5B6472]">
                            <RelativeTime iso={c.createdAt} />
                          </span>
                        </div>
                        <p className="mt-0.5 text-[#5B6472]">{c.content}</p>
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
                  placeholder={`Add a comment on ${post.localityName}...`}
                  className="flex-1 rounded-full border border-[#E2E7F0] bg-white px-3.5 py-2 text-xs outline-none focus:border-[#315CFF]"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="rounded-full bg-[#173FBE] px-4 py-2 text-xs font-bold text-white hover:bg-[#111318] disabled:opacity-50"
                >
                  Comment
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Form */}
      <AnimatePresence initial={false}>
        {reportOpen && (
          <motion.form
            onSubmit={handleReportSubmit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[#E2E7F0] bg-[#FFFFFF]"
          >
            <div className="px-5 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111318]">
                  Flag for Pethri Editorial Review
                </span>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="text-xs text-[#5B6472]"
                >
                  Cancel
                </button>
              </div>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-lg border border-[#E2E7F0] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#315CFF]"
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
                className="w-full rounded-lg border border-[#E2E7F0] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#315CFF]"
              />
              <button
                type="submit"
                className="rounded-full bg-[#D94E34] px-4 py-1.5 text-xs font-bold text-white"
              >
                Submit Report
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
