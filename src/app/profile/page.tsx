"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedUsername = searchParams.get("user");
  const initialTab =
    searchParams.get("tab") === "saved" ? "saved" : "contributions";
  const {
    currentUser,
    isAuthenticated,
    authMode,
    authLoading,
    authEmail,
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
    if (!authLoading && isOwnProfile && !isAuthenticated) {
      router.replace("/auth?next=/profile");
    }
  }, [authLoading, isOwnProfile, isAuthenticated, router]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts?includePending=true`, {
      headers: isAuthenticated ? { "x-pethri-actor-id": currentUser.id } : undefined,
    })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }, [isAuthenticated, currentUser.id]);

  if (isOwnProfile && (authLoading || !isAuthenticated)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14">
        <div className="rounded-3xl border border-[#E2E7F0] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#173FBE]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#111318]">
            {authLoading
              ? "Checking your session..."
              : "Redirecting to Sign In"}
          </h1>
          <p className="mt-2 text-sm text-[#5B6472]">
            Sign in with Supabase Auth or a demo preview profile to access your
            private Pethri profile and saved stories.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth?next=/profile"
              className="rounded-full bg-[#173FBE] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#315CFF] transition-colors"
            >
              Go to Sign In
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
      <div className="overflow-hidden rounded-3xl border border-[#E2E7F0] bg-white">
        <div className="h-24 bg-[#173FBE] border-b-[3px] border-[#315CFF]" />
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
                  <h1 className="font-display text-2xl font-extrabold text-[#111318]">
                    {viewedProfile.fullName}
                  </h1>
                  {viewedProfile.isVerifiedReporter && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] border border-[#173FBE]/25 px-2.5 py-0.5 text-[10px] font-extrabold text-[#173FBE]">
                      <ShieldCheck className="h-3 w-3" />
                      Accredited {viewedProfile.role}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5B6472]">
                  {authMode === "supabase" && isOwnProfile && authEmail
                    ? `${authEmail} • Supabase Auth`
                    : `@${viewedProfile.username}`}{" "}
                  •{" "}
                  <span className="font-bold text-[#173FBE]">
                    <MapPin className="inline h-3 w-3 mr-0.5" />
                    {viewedProfile.homeLocalityName}
                  </span>
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#173FBE] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#315CFF] transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Submit Private Tip
              </Link>
            )}
          </div>

          <p className="mt-4 max-w-2xl text-sm text-[#5B6472]">
            {viewedProfile.bio}
          </p>

          <div className="mt-5 flex flex-wrap gap-6 border-t border-[#E2E7F0] pt-4 text-xs">
            <div>
              <span className="font-display text-lg font-extrabold text-[#111318]">
                {viewedProfile.followersCount}
              </span>
              <span className="ml-1.5 text-[#5B6472]">Followers</span>
            </div>
            <div>
              <span className="font-display text-lg font-extrabold text-[#111318]">
                {myContributions.length}
              </span>
              <span className="ml-1.5 text-[#5B6472]">
                {viewedProfile.isVerifiedReporter ? "Reports" : "Private Tips"}
              </span>
            </div>
            <div>
              <span className="font-display text-lg font-extrabold text-[#111318]">
                {savedPosts.length}
              </span>
              <span className="ml-1.5 text-[#5B6472]">Saved</span>
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
              ? "border-[#173FBE] text-white"
              : "bg-white border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
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
              ? "border-[#173FBE] text-white"
              : "bg-white border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
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
                  ? "border-[#173FBE] text-white"
                  : "bg-white border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
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
                  ? "border-[#173FBE] text-white"
                  : "bg-white border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
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
        <div className="h-48 animate-pulse rounded-2xl bg-white border border-[#E2E7F0]" />
      ) : tab === "contributions" ? (
        myContributions.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-10 text-center">
            <p className="text-sm font-bold text-[#111318]">
              No submissions yet
            </p>
            <Link
              href="/report"
              className="mt-3 inline-block rounded-full bg-[#173FBE] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#315CFF]"
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
                      ? "bg-[#EEF2FF] border-[#173FBE]/25 text-[#173FBE]"
                      : post.moderationStatus === "rejected"
                        ? "bg-[#D94E34]/10 border-[#D94E34]/35 text-[#D94E34]"
                        : "bg-white border-[#E2E7F0] text-[#111318]"
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {post.moderationStatus === "approved" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : post.moderationStatus === "rejected" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#315CFF]" />
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
          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-10 text-center text-xs text-[#5B6472]">
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
          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-extrabold text-[#111318]">
              Followed Karavali Localities
            </h2>
            <div className="flex flex-wrap gap-2">
              {followedLocalities.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/feed?locality=${loc.id}`}
                  className="rounded-full bg-[#EEF2FF] border border-[#E2E7F0] px-3.5 py-1.5 text-xs font-bold text-[#173FBE] hover:border-[#315CFF]"
                >
                  {loc.name}
                </Link>
              ))}
            </div>
            <Link
              href="/explore"
              className="inline-block text-xs font-bold text-[#315CFF] hover:underline"
            >
              Manage localities in Explore →
            </Link>
          </div>

          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-extrabold text-[#111318]">
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
                        ? "bg-[#315CFF] border-[#315CFF] text-white"
                        : "bg-[#FFFFFF] text-[#111318] border-[#E2E7F0] hover:border-[#315CFF]"
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
        <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E7F0] pb-2.5">
            <h2 className="font-display text-base font-extrabold text-[#111318]">
              Notification Inbox
            </h2>
            <button
              type="button"
              onClick={markNotificationsRead}
              className="text-xs font-bold text-[#315CFF] hover:underline"
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
                    ? "border-[#E2E7F0] bg-[#FFFFFF]"
                    : "border-[#173FBE]/25 bg-[#EEF2FF]"
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#111318]">
                    {n.title}
                  </span>
                  <span className="text-[11px] text-[#5B6472]">
                    <RelativeTime iso={n.createdAt} />
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5B6472]">{n.message}</p>
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
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-[#5B6472]">
          Loading profile...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
