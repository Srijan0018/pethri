"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { usePethri } from "@/components/PethriProvider";
import { VerificationBadge } from "@/components/VerificationBadge";
import { RelativeTime } from "@/components/RelativeTime";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  ContentReport,
  ModerationStatus,
  PostItem,
  UserProfile,
  UserRole,
  VerificationTier,
} from "@/types/pethri";

export default function EditorialDashboardPage() {
  const { currentUser, switchDemoUser, supabaseReady, showToast } = usePethri();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<"queue" | "reports" | "users">("queue");
  const [statusFilter, setStatusFilter] = useState<"all" | ModerationStatus>(
    "pending"
  );
  const [notesByPost, setNotesByPost] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const isEditorial =
    currentUser.role === "editor" || currentUser.role === "admin";

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, edRes] = await Promise.all([
        fetch("/api/posts?includePending=true"),
        fetch("/api/editorial"),
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

  // Role-based Access Gate
  if (!isEditorial) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0A2E6E]/10 text-[#0A2E6E]">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#0A2E6E]">
            Editorial Desk Access Required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You are currently viewing as{" "}
            <span className="font-bold">{currentUser.fullName}</span> (role:{" "}
            <span className="font-bold uppercase text-[#D91E2A]">
              {currentUser.role}
            </span>
            ). Only accredited Pethri Desk Editors and Admins can verify news,
            handle flagged content, or manage reporters.
          </p>
          {!supabaseReady && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-[#0A2E6E]">
                Demo Mode Quick Switch
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Switch into the Demo Editorial Desk account to review pending
                citizen reports and test verification controls.
              </p>
              <button
                type="button"
                onClick={() => switchDemoUser("user-editor")}
                className="mt-3 rounded-full bg-[#0A2E6E] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#08245B]"
              >
                Enter Demo Editorial Desk
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
            Newsroom Governance &amp; Verification
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
            Pethri Editorial Desk
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
          Submission Queue ({posts.length})
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
          Reporters &amp; Roles ({profiles.length})
        </button>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-white border border-slate-200" />
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
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No submissions in the {statusFilter} queue.
            </div>
          ) : (
            <div className="space-y-4">
              {displayedPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div className="grid gap-5 lg:grid-cols-12">
                    {post.media[0] && (
                      <div className="lg:col-span-4 overflow-hidden rounded-2xl bg-slate-100">
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

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span>
                          Moderation:{" "}
                          <strong className="uppercase text-[#0A2E6E]">
                            {post.moderationStatus}
                          </strong>
                        </span>
                        <span>
                          GPS Consent:{" "}
                          <strong>
                            {post.sharePreciseLocation
                              ? "Explicitly Shared"
                              : "Private (Locality Only)"}
                          </strong>
                        </span>
                      </div>

                      {/* Editorial Notes + Action Controls */}
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
                            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-200"
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
                              handleReview(
                                post.id,
                                "approved",
                                "verified",
                                !post.isBreaking
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-[#D91E2A] px-3.5 py-1.5 text-xs font-bold text-[#D91E2A] hover:bg-red-50"
                          >
                            {post.isBreaking
                              ? "Remove Breaking"
                              : "Mark Breaking"}
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
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No community reports filed.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
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
