"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bookmark,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { DEMO_PROFILES } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import type { PostItem } from "@/types/pethri";

function ProfileContent() {
  const searchParams = useSearchParams();
  const requestedUsername = searchParams.get("user");
  const { currentUser } = usePethri();

  const viewedProfile =
    DEMO_PROFILES.find((p) => p.username === requestedUsername) ?? currentUser;
  const isOwnProfile = viewedProfile.id === currentUser.id;

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [tab, setTab] = useState<"contributions" | "saved">("contributions");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts?includePending=true`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const myContributions = posts.filter((p) => p.authorId === viewedProfile.id);
  const savedPosts = posts.filter(
    (p) => p.bookmarkedByMe && p.moderationStatus === "approved"
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Profile Hero Header */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-[#06183B] via-[#0A2E6E] to-[#D91E2A]" />
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <img
                src={viewedProfile.avatarUrl}
                alt={viewedProfile.fullName}
                className="h-24 w-24 rounded-3xl border-4 border-white bg-white object-cover shadow-lg"
              />
              <div className="pt-12 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-extrabold text-[#0B1426]">
                    {viewedProfile.fullName}
                  </h1>
                  {viewedProfile.isVerifiedReporter && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0A2E6E] px-2.5 py-0.5 text-[10px] font-bold text-white">
                      <ShieldCheck className="h-3 w-3" />
                      Verified Reporter
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  @{viewedProfile.username} •{" "}
                  <span className="font-semibold text-[#D91E2A]">
                    <MapPin className="inline h-3 w-3 mr-0.5" />
                    {viewedProfile.homeLocalityName}
                  </span>{" "}
                  • Role: {viewedProfile.role}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#D91E2A] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#B81621]"
              >
                <Camera className="h-3.5 w-3.5" />
                New Report
              </Link>
            )}
          </div>

          <p className="mt-4 max-w-2xl text-sm text-slate-700">
            {viewedProfile.bio}
          </p>

          <div className="mt-5 flex flex-wrap gap-6 border-t border-slate-100 pt-4 text-xs">
            <div>
              <span className="font-display text-lg font-extrabold text-[#0A2E6E]">
                {myContributions.length}
              </span>
              <span className="ml-1.5 text-slate-500">Contributions</span>
            </div>
            <div>
              <span className="font-display text-lg font-extrabold text-[#0A2E6E]">
                {
                  myContributions.filter((p) => p.verificationTier === "verified")
                    .length
                }
              </span>
              <span className="ml-1.5 text-slate-500">Officially Verified</span>
            </div>
            <div>
              <span className="font-display text-lg font-extrabold text-[#0A2E6E]">
                {savedPosts.length}
              </span>
              <span className="ml-1.5 text-slate-500">Saved Stories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("contributions")}
          className={cn(
            "rounded-full px-5 py-2 text-xs font-bold transition-colors",
            tab === "contributions"
              ? "bg-[#0A2E6E] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          )}
        >
          Reporter Contributions ({myContributions.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("saved")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-colors",
            tab === "saved"
              ? "bg-[#0A2E6E] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          )}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Saved Bookmarks ({savedPosts.length})
        </button>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl bg-white border border-slate-200" />
      ) : tab === "contributions" ? (
        myContributions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-bold text-[#0A2E6E]">
              No contributions yet
            </p>
            <Link
              href="/report"
              className="mt-3 inline-block rounded-full bg-[#D91E2A] px-4 py-2 text-xs font-bold text-white"
            >
              Submit First Story
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {myContributions.map((post) => (
              <div key={post.id} className="space-y-2">
                {/* Moderation Status Banner for Author */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-2 text-xs font-semibold",
                    post.moderationStatus === "approved"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : post.moderationStatus === "rejected"
                        ? "bg-red-50 text-[#D91E2A] border border-red-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {post.moderationStatus === "approved" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : post.moderationStatus === "rejected" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    Status:{" "}
                    <span className="uppercase">{post.moderationStatus}</span>
                    {post.moderationNotes ? ` — ${post.moderationNotes}` : ""}
                  </span>
                  <span><RelativeTime iso={post.createdAt} /></span>
                </div>
                <PostCard
                  post={post}
                  onPostUpdated={(u) =>
                    setPosts((prev) =>
                      prev.map((p) => (p.id === u.id ? u : p))
                    )
                  }
                />
              </div>
            ))}
          </div>
        )
      ) : savedPosts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
          Tap the bookmark icon on any story in the Feed to save it here.
        </div>
      ) : (
        <div className="space-y-5">
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostUpdated={(u) =>
                setPosts((prev) => prev.map((p) => (p.id === u.id ? u : p)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-slate-500">
          Loading profile...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
