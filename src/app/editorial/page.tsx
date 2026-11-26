"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  Flag,
  Lock,
  Newspaper,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  ContentReport,
  LiveBroadcast,
  ModerationStatus,
  PostCategory,
  PostItem,
  UserProfile,
  UserRole,
  VerificationTier,
} from "@/types/pethri";

export default function EditorialDashboardPage() {
  const { currentUser, switchDemoUser, localities, supabaseReady, showToast } =
    usePethri();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [broadcast, setBroadcast] = useState<LiveBroadcast | null>(null);

  const [tab, setTab] = useState<"queue" | "publish" | "reports" | "users">(
    "queue"
  );
  const [statusFilter, setStatusFilter] = useState<"all" | ModerationStatus>(
    "pending"
  );
  const [notesByPost, setNotesByPost] = useState<Record<string, string>>({});
  const [correctionByPost, setCorrectionByPost] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);

  // Newsroom Publisher state
  const [pubHeadline, setPubHeadline] = useState("");
  const [pubBody, setPubBody] = useState("");
  const [pubCategory, setPubCategory] = useState<PostCategory>("news");
  const [pubLocalityId, setPubLocalityId] = useState("loc-pethri");
  const [pubMode, setPubMode] = useState<"newsroom" | "sponsored">("newsroom");
  const [pubBreaking, setPubBreaking] = useState(false);
  const [pubSponsorName, setPubSponsorName] = useState("");

  // Live Broadcast control state
  const [liveTitle, setLiveTitle] = useState("");
  const [liveSummary, setLiveSummary] = useState("");

  const isNewsroom =
    currentUser.role === "journalist" ||
    currentUser.role === "editor" ||
    currentUser.role === "admin";

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, edRes, brRes] = await Promise.all([
        fetch("/api/posts?includePending=true"),
        fetch("/api/editorial"),
        fetch("/api/broadcast"),
      ]);
      if (postsRes.ok) {
        const pd = await postsRes.json();
        setPosts(pd.posts ?? []);
      }
      if (edRes.ok) {
        const ed = await edRes.json();
        setReports(ed.reports ?? []);
        setProfiles(ed.profiles ?? []);
      }
      if (brRes.ok) {
        const bd = await brRes.json();
        if (bd.broadcast) {
          setBroadcast(bd.broadcast);
          setLiveTitle(bd.broadcast.title);
          setLiveSummary(bd.broadcast.summary);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleReview = async (
    postId: string,
    moderationStatus: ModerationStatus,
    verificationTier: VerificationTier,
    isBreaking?: boolean
  ) => {
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "post_review",
        postId,
        moderationStatus,
        verificationTier,
        isBreaking,
        moderationNotes: notesByPost[postId] ?? undefined,
        reviewerId: currentUser.id,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      showToast(
        `Updated post to ${moderationStatus.toUpperCase()} (${verificationTier})`
      );
    }
  };

  const handleLogCorrection = async (postId: string) => {
    const summary = correctionByPost[postId]?.trim();
    if (!summary) return;
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "post_correction",
        postId,
        summary,
        correctedBy: currentUser.fullName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      setCorrectionByPost((prev) => ({ ...prev, [postId]: "" }));
      showToast("Correction logged transparently on article");
    }
  };

  const handlePublishDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishMode: pubMode,
        authorId: currentUser.id,
        localityId: pubLocalityId,
        category: pubCategory,
        headline: pubHeadline,
        body: pubBody,
        isBreaking: pubMode === "newsroom" ? pubBreaking : false,
        isMoment: false,
        sponsorInfo:
          pubMode === "sponsored"
            ? {
                advertiserName: pubSponsorName || "Local Business Partner",
                disclosure: "Sponsored Local Partner • Paid Notice",
              }
            : undefined,
        media: [
          {
            mediaType: "image",
            url: "/images/photos/pethri-town.jpg",
            aspectRatio: "16:9",
            caption:
              pubMode === "sponsored"
                ? "Sponsored local partner"
                : "Pethri Newsroom Dispatch",
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setPubHeadline("");
      setPubBody("");
      setPubBreaking(false);
      setPubSponsorName("");
      showToast(
        pubMode === "sponsored"
          ? "Sponsored Partner notice published"
          : "Official Newsroom dispatch published!"
      );
      setTab("queue");
      setStatusFilter("approved");
    } else {
      const err = await res.json();
      showToast(err.error ?? "Failed to publish", "error");
    }
  };

  const handleToggleBroadcast = async (nextLive: boolean) => {
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_broadcast",
        actorId: currentUser.id,
        isLive: nextLive,
        title: liveTitle,
        summary: liveSummary,
        localityId: pubLocalityId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setBroadcast(data.broadcast);
      showToast(
        nextLive
          ? "Official Pethri Live Broadcast is NOW ON AIR"
          : "Live Broadcast ended",
        "info"
      );
    } else {
      const err = await res.json();
      showToast(err.error ?? "Unauthorized", "error");
    }
  };

  const handleResolveReport = async (
    reportId: string,
    status: ContentReport["status"]
  ) => {
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "report_resolve",
        reportId,
        status,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? data.report : r))
      );
      showToast(`Report marked ${status}`);
    }
  };

  const handleProfileUpdate = async (
    userId: string,
    updates: {
      role?: UserRole;
      isVerifiedReporter?: boolean;
      isSuspended?: boolean;
    }
  ) => {
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "profile_governance",
        userId,
        ...updates,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? data.profile : p))
      );
      showToast(`Updated ${data.profile.fullName}`);
    }
  };

  const pendingCount = posts.filter(
    (p) => p.moderationStatus === "pending"
  ).length;
  const openReportsCount = reports.filter((r) => r.status === "open").length;
  const displayedPosts = posts.filter((p) =>
    statusFilter === "all" ? true : p.moderationStatus === statusFilter
  );

  if (!isNewsroom) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0A2E6E]/10 text-[#0A2E6E]">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#0A2E6E]">
            Authorized Newsroom Access Required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You are signed in as{" "}
            <span className="font-bold">{currentUser.fullName}</span> (role:{" "}
            <span className="font-bold uppercase text-[#D91E2A]">
              {currentUser.role}
            </span>
            ). Only authorized Newsroom Journalists, Editors, and Admins can
            publish official breaking news, start live broadcasts, log
            corrections, or moderate submissions.
          </p>
          {!supabaseReady && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-[#0A2E6E]">
                Demo Newsroom Switch
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => switchDemoUser("user-editor")}
                  className="rounded-full bg-[#0A2E6E] px-5 py-2 text-xs font-bold text-white hover:bg-[#08245B]"
                >
                  Sign in as Newsroom Editor
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoUser("user-ananya")}
                  className="rounded-full border border-[#0A2E6E] px-5 py-2 text-xs font-bold text-[#0A2E6E] hover:bg-slate-100"
                >
                  Sign in as Staff Journalist
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
            Newsroom Governance &amp; Broadcast Control
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
            Pethri Newsroom &amp; Editorial Desk
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800">
            <Clock className="h-3.5 w-3.5" />
            {pendingCount} Pending Review
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 font-bold text-[#D91E2A]">
            <Flag className="h-3.5 w-3.5" />
            {openReportsCount} Open Reports
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors",
            tab === "queue"
              ? "bg-[#0A2E6E] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          )}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Review &amp; Corrections ({posts.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("publish")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors",
            tab === "publish"
              ? "bg-[#D91E2A] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          )}
        >
          <Newspaper className="h-3.5 w-3.5" />
          Publish Breaking / Live
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors",
            tab === "reports"
              ? "bg-[#D91E2A] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Flagged Reports ({reports.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("users")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors",
            tab === "users"
              ? "bg-[#0A2E6E] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          Staff &amp; Reporters ({profiles.length})
        </button>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white border border-slate-200" />
      ) : tab === "publish" ? (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Official Newsroom & Sponsored Publisher */}
          <form
            onSubmit={handlePublishDispatch}
            className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-[#0A2E6E]">
                Official Newsroom &amp; Partner Publisher
              </h2>
              <span className="rounded-full bg-[#0A2E6E] px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                {currentUser.role}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPubMode("newsroom")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold",
                  pubMode === "newsroom"
                    ? "bg-[#0A2E6E] text-white"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                Official Newsroom Dispatch
              </button>
              <button
                type="button"
                onClick={() => setPubMode("sponsored")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold",
                  pubMode === "sponsored"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                Sponsored Local Partner
              </button>
            </div>

            {pubMode === "sponsored" && (
              <input
                type="text"
                required
                value={pubSponsorName}
                onChange={(e) => setPubSponsorName(e.target.value)}
                placeholder="Advertiser / Local Business Name *"
                className="w-full rounded-xl border border-amber-300 bg-amber-50/40 px-3.5 py-2.5 text-xs outline-none"
              />
            )}

            <input
              type="text"
              required
              value={pubHeadline}
              onChange={(e) => setPubHeadline(e.target.value)}
              placeholder="Headline *"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#0A2E6E]"
            />

            <textarea
              rows={4}
              required
              value={pubBody}
              onChange={(e) => setPubBody(e.target.value)}
              placeholder="Full newsroom report or partner message *"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#0A2E6E]"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={pubCategory}
                onChange={(e) => setPubCategory(e.target.value as PostCategory)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none"
              >
                {(Object.keys(CATEGORY_META) as PostCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_META[k].label}
                  </option>
                ))}
              </select>
              <select
                value={pubLocalityId}
                onChange={(e) => setPubLocalityId(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none"
              >
                {localities.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {pubMode === "newsroom" && (
              <label className="flex items-center gap-2 text-xs font-bold text-[#D91E2A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={pubBreaking}
                  onChange={(e) => setPubBreaking(e.target.checked)}
                  className="accent-[#D91E2A]"
                />
                Publish as Official Breaking News Alert
              </label>
            )}

            <button
              type="submit"
              className="rounded-full bg-[#D91E2A] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#B81621]"
            >
              {pubMode === "sponsored"
                ? "Publish Clearly Marked Sponsored Notice"
                : "Publish Official Newsroom Story"}
            </button>
          </form>

          {/* Official Live Broadcast Control */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-[#06183B] p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                <Radio className="h-4 w-4" />
                Live Broadcast Control
              </span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-extrabold uppercase",
                  broadcast?.isLive
                    ? "bg-[#D91E2A] text-white"
                    : "bg-white/15 text-slate-300"
                )}
              >
                {broadcast?.isLive ? "ON AIR" : "OFF AIR"}
              </span>
            </div>
            <input
              type="text"
              value={liveTitle}
              onChange={(e) => setLiveTitle(e.target.value)}
              placeholder="Live broadcast title"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-400 outline-none"
            />
            <textarea
              rows={3}
              value={liveSummary}
              onChange={(e) => setLiveSummary(e.target.value)}
              placeholder="Broadcast briefing summary"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-400 outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleToggleBroadcast(true)}
                className="flex-1 rounded-full bg-[#D91E2A] py-2.5 text-xs font-bold text-white hover:bg-[#B81621]"
              >
                Go Live Now
              </button>
              <button
                type="button"
                onClick={() => handleToggleBroadcast(false)}
                className="rounded-full border border-white/25 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10"
              >
                End Stream
              </button>
            </div>
          </div>
        </div>
      ) : tab === "queue" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "rejected", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-bold capitalize",
                  statusFilter === s
                    ? "bg-[#D91E2A] text-white"
                    : "bg-white border border-slate-200 text-slate-600"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {displayedPosts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No submissions in the {statusFilter} queue.
            </div>
          ) : (
            <div className="space-y-4">
              {displayedPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="grid gap-5 lg:grid-cols-12">
                    {post.media[0] && (
                      <div className="lg:col-span-4 overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={post.media[0].url}
                          alt={post.headline}
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        "space-y-3",
                        post.media[0] ? "lg:col-span-8" : "lg:col-span-12"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded bg-[#0A2E6E]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0A2E6E]">
                            {post.sourceKind}
                          </span>
                          <span className="font-bold text-[#D91E2A]">
                            {post.localityName}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                            {CATEGORY_META[post.category].label}
                          </span>
                          <span className="text-slate-400">
                            by @{post.author.username} •{" "}
                            <RelativeTime iso={post.createdAt} />
                          </span>
                        </div>
                        <VerificationBadge tier={post.verificationTier} />
                      </div>

                      <h2 className="font-editorial text-2xl text-[#0B1426]">
                        {post.headline}
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-600">
                        {post.body}
                      </p>

                      <div className="border-t border-slate-100 pt-3 space-y-3">
                        <input
                          type="text"
                          value={
                            notesByPost[post.id] ?? post.moderationNotes ?? ""
                          }
                          onChange={(e) =>
                            setNotesByPost((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder="Add verification source or editorial note..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#0A2E6E]"
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleReview(post.id, "approved", "community")
                            }
                            className="rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-200"
                          >
                            Approve (Community)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleReview(post.id, "approved", "reviewed")
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-[#0A2E6E] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#08245B]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve &amp; Mark Reviewed
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleReview(
                                post.id,
                                "approved",
                                "verified",
                                post.isBreaking
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Officially Verify
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleReview(post.id, "rejected", "community")
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3.5 py-1.5 text-xs font-bold text-[#D91E2A] hover:bg-red-100"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>

                        {/* Correction History Logger */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={correctionByPost[post.id] ?? ""}
                            onChange={(e) =>
                              setCorrectionByPost((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Log public correction note (e.g., Corrected bus timing to 5:20 PM)..."
                            className="flex-1 rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-1.5 text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleLogCorrection(post.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#0A2E6E] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            <FileEdit className="h-3.5 w-3.5" />
                            Log Correction
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === "reports" ? (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No community reports filed.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        rep.status === "open"
                          ? "bg-[#D91E2A] text-white"
                          : "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {rep.status}
                    </span>
                    <span className="text-xs font-bold text-[#0A2E6E]">
                      {rep.reason}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      by @{rep.reporterUsername} •{" "}
                      <RelativeTime iso={rep.createdAt} />
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    Post: {rep.postHeadline}
                  </p>
                  {rep.details && (
                    <p className="text-xs text-slate-600">{rep.details}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolveReport(rep.id, "resolved")}
                    className="rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white"
                  >
                    Mark Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveReport(rep.id, "dismissed")}
                    className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((prof) => (
            <div
              key={prof.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={prof.avatarUrl}
                    alt={prof.fullName}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#0B1426]">
                      {prof.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{prof.username} • {prof.homeLocalityName}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#0A2E6E]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#0A2E6E]">
                  {prof.role}
                </span>
              </div>
              <p className="text-xs text-slate-600">{prof.bio}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <select
                  aria-label={`Role for ${prof.fullName}`}
                  value={prof.role}
                  onChange={(e) =>
                    handleProfileUpdate(prof.id, {
                      role: e.target.value as UserRole,
                    })
                  }
                  className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-semibold outline-none"
                >
                  <option value="citizen">Citizen</option>
                  <option value="correspondent">Correspondent</option>
                  <option value="journalist">Staff Journalist</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleProfileUpdate(prof.id, {
                        isVerifiedReporter: !prof.isVerifiedReporter,
                      })
                    }
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold",
                      prof.isVerifiedReporter
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {prof.isVerifiedReporter
                      ? "Verified Reporter"
                      : "Grant Badge"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleProfileUpdate(prof.id, {
                        isSuspended: !prof.isSuspended,
                      })
                    }
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold",
                      prof.isSuspended
                        ? "bg-[#D91E2A] text-white"
                        : "bg-red-50 text-[#D91E2A]"
                    )}
                  >
                    {prof.isSuspended ? "Suspended" : "Suspend"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
