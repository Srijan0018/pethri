"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  Bookmark,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AnimatedNavPill } from "@/components/MotionPrimitives";
import { PostCard } from "@/components/PostCard";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { DEMO_PROFILES } from "@/lib/seed-data";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostCategory, PostItem } from "@/types/pethri";

function ProfileContent() {
  const searchParams = useSearchParams();
  const requestedUsername = searchParams.get("user");
  const initialTab =
    searchParams.get("tab") === "saved" ? "saved" : "contributions";
  const {
    currentUser,
    isAuthenticated,
    localities,
    notifications,
    markNotificationsRead,
  } = usePethri();

  const viewedProfile =
    DEMO_PROFILES.find((p) => p.username === requestedUsername) ?? currentUser;
  const isOwnProfile =
    !requestedUsername || viewedProfile.id === currentUser.id;

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [tab, setTab] = useState<
    "contributions" | "saved" | "interests" | "notifications"
  >(initialTab);
  const [interests, setInterests] = useState<PostCategory[]>([
    "news",
    "sports",
    "agriculture",
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts?includePending=true`, {
      headers: isAuthenticated ? { "x-pethri-actor-id": currentUser.id } : undefined,
    })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }, [isAuthenticated, currentUser.id]);

  if (isOwnProfile && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14">
        <div className="rounded-3xl border border-[#E5E3DC] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF2EE] text-[#1B5E43]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#181917]">
            Your Pethri Profile &amp; Saved Stories
          </h1>
          <p className="mt-2 text-sm text-[#5A605C]">
            Sign in to manage followed Karavali localities, topic interests,
            bookmarked stories, notifications, and private news tips.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth"
              className="rounded-full bg-[#1B5E43] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#398BFF] transition-colors"
            >
              Sign In / Create Account
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#E5E3DC] px-6 py-3 text-xs font-bold text-[#181917] hover:border-[#398BFF]"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const myContributions = posts.filter((p) => p.authorId === viewedProfile.id);
  const savedPosts = posts.filter(
    (p) => p.bookmarkedByMe && p.moderationStatus === "approved"
  );
  const followedLocalities = localities.filter((l) => l.followedByMe);

  const toggleInterest = (cat: PostCategory) => {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="overflow-hidden rounded-3xl border border-[#E5E3DC] bg-white">
        <div className="h-24 bg-[#1B5E43] border-b-[3px] border-[#398BFF]" />
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <img
                src={viewedProfile.avatarUrl}
                alt={viewedProfile.fullName}
                className="h-24 w-24 rounded-3xl border-4 border-white bg-white object-cover shadow-md"
              />
              <div className="pt-12 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-extrabold text-[#181917]">
                    {viewedProfile.fullName}
                  </h1>
                  {viewedProfile.isVerifiedReporter && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2EE] border border-[#1B5E43]/25 px-2.5 py-0.5 text-[10px] font-extrabold text-[#1B5E43]">
                      <ShieldCheck className="h-3 w-3" />
                      Accredited {viewedProfile.role}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5A605C]">
                  @{viewedProfile.username} •{" "}
                  <span className="font-bold text-[#1B5E43]">
                    <MapPin className="inline h-3 w-3 mr-0.5" />
                    {viewedProfile.homeLocalityName}
                  </span>
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1B5E43] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#398BFF] transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Submit Private Tip
              </Link>
            )}
          </div>

          <p className="mt-4 max-w-2xl text-sm text-[#5A605C]">
            {viewedProfile.bio}
          </p>

          <div className="mt-5 flex flex-wrap gap-6 border-t border-[#E5E3DC] pt-4 text-xs">
            <div>
              <span className="font-display text-lg font-extrabold text-[#181917]">
                {viewedProfile.followersCount}
              </span>
              <span className="ml-1.5 text-[#5A605C]">Followers</span>
            </div>
            <div>
              <span className="font-display text-lg font-extrabold text-[#181917]">
                {myContributions.length}
              </span>
              <span className="ml-1.5 text-[#5A605C]">
                {viewedProfile.isVerifiedReporter ? "Reports" : "Private Tips"}
              </span>
            </div>
            <div>
              <span className="font-display text-lg font-extrabold text-[#181917]">
                {savedPosts.length}
              </span>
              <span className="ml-1.5 text-[#5A605C]">Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("contributions")}
          className={cn(
            "relative z-0 rounded-full px-5 py-2 text-xs font-bold transition-colors border",
            tab === "contributions"
              ? "border-[#1B5E43] text-white"
              : "bg-white border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
          )}
        >
          {tab === "contributions" && (
            <AnimatedNavPill layoutId="profile-tab-pill" />
          )}
          {viewedProfile.isVerifiedReporter ? "Published Stories" : "My Tips"} (
          {myContributions.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("saved")}
          className={cn(
            "relative z-0 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-colors border",
            tab === "saved"
              ? "border-[#1B5E43] text-white"
              : "bg-white border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
          )}
        >
          {tab === "saved" && <AnimatedNavPill layoutId="profile-tab-pill" />}
          <Bookmark className="h-3.5 w-3.5" />
          Saved ({savedPosts.length})
        </button>
        {isOwnProfile && (
          <>
            <button
              type="button"
              onClick={() => setTab("interests")}
              className={cn(
                "relative z-0 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-colors border",
                tab === "interests"
                  ? "border-[#1B5E43] text-white"
                  : "bg-white border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
              )}
            >
              {tab === "interests" && (
                <AnimatedNavPill layoutId="profile-tab-pill" />
              )}
              <Sparkles className="h-3.5 w-3.5" />
              Localities &amp; Interests
            </button>
            <button
              type="button"
              onClick={() => setTab("notifications")}
              className={cn(
                "relative z-0 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-colors border",
                tab === "notifications"
                  ? "border-[#1B5E43] text-white"
                  : "bg-white border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
              )}
            >
              {tab === "notifications" && (
                <AnimatedNavPill layoutId="profile-tab-pill" />
              )}
              <Bell className="h-3.5 w-3.5" />
              Notifications ({notifications.length})
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-white border border-[#E5E3DC]" />
      ) : tab === "contributions" ? (
        myContributions.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-10 text-center">
            <p className="text-sm font-bold text-[#181917]">
              No submissions yet
            </p>
            <Link
              href="/report"
              className="mt-3 inline-block rounded-full bg-[#1B5E43] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#398BFF]"
            >
              Submit Private News Tip
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {myContributions.map((post) => (
              <div key={post.id} className="space-y-2">
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-2 text-xs font-semibold",
                    post.moderationStatus === "approved"
                      ? "bg-[#EAF2EE] border-[#1B5E43]/25 text-[#1B5E43]"
                      : post.moderationStatus === "rejected"
                        ? "bg-[#D94E34]/10 border-[#D94E34]/35 text-[#D94E34]"
                        : "bg-white border-[#E5E3DC] text-[#181917]"
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {post.moderationStatus === "approved" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : post.moderationStatus === "rejected" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#398BFF]" />
                    )}
                    Status:{" "}
                    <span className="uppercase">{post.moderationStatus}</span>
                    {post.moderationNotes ? ` — ${post.moderationNotes}` : ""}
                  </span>
                  <span>
                    <RelativeTime iso={post.createdAt} />
                  </span>
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
      ) : tab === "saved" ? (
        savedPosts.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-10 text-center text-xs text-[#5A605C]">
            Bookmark any story in News or Home to save it here.
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
        )
      ) : tab === "interests" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-extrabold text-[#181917]">
              Followed Karavali Localities
            </h2>
            <div className="flex flex-wrap gap-2">
              {followedLocalities.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/feed?locality=${loc.id}`}
                  className="rounded-full bg-[#EAF2EE] border border-[#E5E3DC] px-3.5 py-1.5 text-xs font-bold text-[#1B5E43] hover:border-[#398BFF]"
                >
                  {loc.name}
                </Link>
              ))}
            </div>
            <Link
              href="/explore"
              className="inline-block text-xs font-bold text-[#398BFF] hover:underline"
            >
              Manage localities in Explore →
            </Link>
          </div>

          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-extrabold text-[#181917]">
              Topic Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_META) as PostCategory[]).map((cat) => {
                const active = interests.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleInterest(cat)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors",
                      active
                        ? "bg-[#398BFF] border-[#398BFF] text-white"
                        : "bg-[#F8F7F4] text-[#181917] border-[#E5E3DC] hover:border-[#398BFF]"
                    )}
                  >
                    {CATEGORY_META[cat].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-2.5">
            <h2 className="font-display text-base font-extrabold text-[#181917]">
              Notification Inbox
            </h2>
            <button
              type="button"
              onClick={markNotificationsRead}
              className="text-xs font-bold text-[#398BFF] hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className={cn(
                  "block rounded-xl p-3 border transition-colors",
                  n.isRead
                    ? "border-[#E5E3DC] bg-[#F8F7F4]"
                    : "border-[#1B5E43]/25 bg-[#EAF2EE]"
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#181917]">
                    {n.title}
                  </span>
                  <span className="text-[11px] text-[#5A605C]">
                    <RelativeTime iso={n.createdAt} />
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5A605C]">{n.message}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-[#5A605C]">
          Loading profile...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
