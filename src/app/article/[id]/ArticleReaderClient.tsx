"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { CATEGORY_META, cn, isLocalImageSrc } from "@/lib/utils";
import { shareContent } from "@/lib/share";
import type { PostItem } from "@/types/pethri";

export function ArticleReaderClient() {
  const params = useParams<{ id: string }>();
  const postId = params?.id;
  const { currentUser, isAuthenticated, requireAuth, language, dict, showToast } =
    usePethri();

  const [post, setPost] = useState<PostItem | null>(null);
  const [related, setRelated] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedPostId, setLoadedPostId] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Needs fact-check");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    if (!postId) return;
    const controller = new AbortController();
    fetch(`/api/posts/${postId}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Unable to load article.");
        return response.json();
      })
      .then((data) => {
        setPost(data?.post ?? null);
        setRelated(data?.related ?? []);
        setLoadError(false);
        setLoadedPostId(postId);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadError(true);
        setLoadedPostId(postId);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [postId, reloadKey]);

  const engage = async (
    action: "like" | "bookmark" | "share" | "comment",
    content?: string
  ): Promise<boolean> => {
    if (!post) return false;
    if (action !== "share") {
      const labelMap = {
        like: "react to this article",
        bookmark: "bookmark this article",
        comment: "comment on this article",
      };
      if (!requireAuth(labelMap[action])) return false;
    }

    try {
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          (data as { error?: string }).error ?? "Unable to post interaction.",
          "error"
        );
        return false;
      }
      if ((data as { post?: PostItem }).post) {
        setPost((data as { post: PostItem }).post);
      }
      return true;
    } catch {
      showToast("Could not connect to server. Please try again.", "error");
      return false;
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
      setFollowingAuthor(Boolean(data.following));
      showToast(
        data.following
          ? `Following ${post.author.fullName}`
          : `Unfollowed ${post.author.fullName}`,
        "info"
      );
    }
  };

  const handleShare = async () => {
    try {
      const result = await shareContent({
        title: post?.headline ?? "Pethri.com article",
        text: post?.headline,
        url: window.location.href,
      });
      if (result === "cancelled") return;
      await engage("share");
      showToast(
        result === "shared" ? "Article shared" : "Article link copied to clipboard",
        "info"
      );
    } catch {
      showToast("Unable to share the article. Please try copying its URL.", "error");
    }
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

  if (loading || loadedPostId !== postId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-5">
        <div role="status" aria-live="polite">
          <span className="sr-only">Loading article</span>
          <div className="h-6 w-48 animate-pulse bg-[#EEF2FF] rounded" />
        </div>
        <div className="h-14 w-full animate-pulse bg-[#EEF2FF]/60 rounded" />
        <div className="h-80 w-full animate-pulse bg-[#E2E7F0] rounded-2xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-editorial text-3xl text-[#111318]">
          {loadError ? "Unable to load this article" : "Article not found"}
        </h1>
        <p className="mt-2 text-sm text-[#5B6472]">
          {loadError
            ? "Check your connection and try again."
            : "This submission may still be in private editorial review."}
        </p>
        {loadError && (
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError(false);
              setReloadKey((key) => key + 1);
            }}
            className="mt-5 min-h-11 rounded-full border border-[#E2E7F0] bg-white px-5 text-xs font-bold text-[#111318] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315CFF]"
          >
            Try again
          </button>
        )}
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173FBE] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#315CFF] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315CFF]"
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
  const title =
    language === "kn" && post.headlineKn ? post.headlineKn : post.headline;
  const bodyText =
    language === "kn" && post.bodyKn ? post.bodyKn : post.body;

  return (
    <article className="bg-[#FFFFFF] min-h-screen">
      <div className="border-b border-[#E2E7F0] bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 font-bold text-[#315CFF] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{dict.sections.backToNews}</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#5B6472]">
            <span className="font-bold text-[#173FBE] uppercase">
              {post.localityName}
            </span>
            <span>/</span>
            <span>
              {language === "kn"
                ? CATEGORY_META[post.category].labelKn
                : CATEGORY_META[post.category].label}
            </span>
          </div>
        </div>
      </div>

      <header className="mx-auto max-w-4xl px-4 pt-8 pb-6">
        {post.isDemoData && (
          <p className="mb-4 text-xs font-semibold text-[#5B6472]">
            Development preview: sample content, not live local reporting.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {post.isBreaking && isNewsroom && (
            <span className="rounded-full bg-[#D94E34] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
              Breaking News
            </span>
          )}
          {isNewsroom ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#173FBE] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Editorial Reporting
            </span>
          ) : isSponsored ? (
            <span className="rounded-full bg-[#EEF2FF] border border-[#E2E7F0] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#111318]">
              Sponsored Partner • {post.sponsorInfo?.advertiserName}
            </span>
          ) : (
            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#173FBE]">
              Editorially Reviewed Tip
            </span>
          )}

          {!isSponsored && <VerificationBadge tier={post.verificationTier} />}
        </div>

        <MaskedHeadlineReveal>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[54px] leading-[1.08] tracking-tight text-[#111318]">
            {title}
          </h1>
        </MaskedHeadlineReveal>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-[#E2E7F0] py-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile?user=${post.author.username}`}>
              <Image
                src={post.author.avatarUrl}
                alt={post.author.fullName}
                width={48}
                height={48}
                unoptimized={!isLocalImageSrc(post.author.avatarUrl)}
                className="h-12 w-12 rounded-full object-cover ring-1 ring-[#E2E7F0]"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile?user=${post.author.username}`}
                  className="text-sm font-extrabold text-[#111318] hover:text-[#315CFF] transition-colors"
                >
                  {post.author.fullName}
                </Link>
                <span className="text-[11px] font-semibold uppercase text-[#5B6472]">
                  • {post.author.role}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#5B6472]">
                <span className="inline-flex items-center gap-1 font-bold text-[#173FBE]">
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
                    ? "bg-[#173FBE] border-[#173FBE] text-white"
                    : "border-[#E2E7F0] bg-white text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF]"
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
                  ? "border-[#315CFF] bg-[#315CFF] text-white"
                  : "border-[#E2E7F0] bg-white text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF]"
              )}
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share article"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E7F0] bg-white text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF] transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {activeMedia && (
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-3xl border border-[#E2E7F0] bg-[#111318]">
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
                priority
                src={activeMedia.url}
                alt={activeMedia.caption ?? post.headline}
                sizes="(min-width: 1024px) 960px, calc(100vw - 32px)"
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-[#111318]/75 text-white hover:bg-[#315CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() =>
                    setSlideIndex((i) => (i + 1) % post.media.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-[#111318]/75 text-white hover:bg-[#315CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B6472]">
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
            <p className="editorial-dropcap text-base sm:text-lg leading-[1.82] text-[#111318] whitespace-pre-line">
              {bodyText}
            </p>
          </EditorialReveal>

          {post.corrections && post.corrections.length > 0 && (
            <div className="rounded-2xl border border-[#E2E7F0] bg-[#EEF2FF] p-4 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[#173FBE]">
                <FileEdit className="h-4 w-4" />
                <span>Editorial Correction History</span>
              </div>
              <div className="mt-2 space-y-2 text-[#111318]">
                {post.corrections.map((c) => (
                  <div key={c.id}>
                    <p className="font-bold">
                      {c.correctedBy} • <RelativeTime iso={c.correctedAt} />
                    </p>
                    <p className="mt-0.5 text-[#5B6472]">{c.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#E2E7F0] py-4">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => engage("like")}
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-bold transition-colors",
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
                <span>{post.likesCount} Reactions</span>
              </button>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#5B6472]">
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B6472] hover:text-[#D94E34] transition-colors"
            >
              <Flag className="h-4 w-4" />
              Request Fact-Check / Report
            </button>
          </div>

          {reportOpen && (
            <form
              onSubmit={handleReportSubmit}
              className="rounded-2xl border border-[#E2E7F0] bg-white p-4 space-y-2.5"
            >
              <p className="text-xs font-bold text-[#111318]">
                Submit Correction Request or Flag
              </p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-xl border border-[#E2E7F0] bg-[#FFFFFF] px-3 py-2 text-xs outline-none focus:border-[#315CFF]"
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
                className="w-full rounded-xl border border-[#E2E7F0] bg-[#FFFFFF] px-3 py-2 text-xs outline-none focus:border-[#315CFF]"
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
            <h2 className="font-display text-lg font-extrabold text-[#111318]">
              {dict.sections.communityDiscussion} ({post.comments.length})
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentText.trim() || submittingComment) return;
                setSubmittingComment(true);
                const ok = await engage("comment", commentText.trim());
                if (ok) {
                  setCommentText("");
                }
                setSubmittingComment(false);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? dict.sections.writeComment
                    : dict.sections.signInToComment
                }
                className="flex-1 rounded-full border border-[#E2E7F0] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#315CFF]"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="rounded-full bg-[#173FBE] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#315CFF] disabled:opacity-50 transition-colors"
              >
                {submittingComment
                  ? dict.sections.posting
                  : dict.sections.commentAction}
              </button>
            </form>

            <div className="space-y-3">
              {post.comments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-2xl border border-[#E2E7F0] bg-white p-3.5"
                >
                  <Image
                    src={c.authorAvatar}
                    alt={c.authorName}
                    width={32}
                    height={32}
                    unoptimized={!isLocalImageSrc(c.authorAvatar)}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#111318]">
                      {c.authorName}{" "}
                      <span className="font-normal text-[#5B6472]">
                        • <RelativeTime iso={c.createdAt} />
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[#5B6472]">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-5 lg:border-l lg:border-[#E2E7F0] lg:pl-6">
          <div className="border-b border-[#E2E7F0] pb-2">
            <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#173FBE]">
              {dict.sections.relatedDispatches}
            </p>
            <h2 className="font-display text-lg font-extrabold text-[#111318]">
              {dict.sections.moreFrom} {post.localityName}
            </h2>
          </div>

          <div className="divide-y divide-[#E2E7F0]">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/article/${item.id}`}
                className="block py-4 first:pt-0 group"
              >
                <p className="text-[10px] font-bold uppercase text-[#173FBE]">
                  {item.localityName} •{" "}
                  {language === "kn"
                    ? CATEGORY_META[item.category].labelKn
                    : CATEGORY_META[item.category].short}
                </p>
                <h3 className="mt-1 font-editorial text-xl leading-snug text-[#111318] group-hover:text-[#315CFF] transition-colors">
                  {language === "kn" && item.headlineKn
                    ? item.headlineKn
                    : item.headline}
                </h3>
                <p className="mt-1 text-[11px] text-[#5B6472]">
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
