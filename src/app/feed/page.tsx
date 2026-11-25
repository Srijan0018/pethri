"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Flame,
  MapPin,
  Megaphone,
  Search,
  Sparkles,
  Store,
} from "lucide-react";
import { MomentLightbox } from "@/components/MomentLightbox";
import { PostCard } from "@/components/PostCard";
import { usePethri } from "@/components/PethriProvider";
import { DEMO_ANNOUNCEMENTS, DEMO_BUSINESSES } from "@/lib/seed-data";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostCategory, PostItem, VerificationTier } from "@/types/pethri";

function FeedContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") ?? "all") as
    | PostCategory
    | "all";
  const initialLocality = searchParams.get("locality");

  const { localities, activeLocalityId, setActiveLocalityId } = usePethri();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<PostCategory | "all">(
    initialCategory
  );
  const [verification, setVerification] = useState<VerificationTier | "all">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [momentIndex, setMomentIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialLocality) {
      setActiveLocalityId(initialLocality);
    }
  }, [initialLocality, setActiveLocalityId]);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeLocalityId !== "all") params.set("locality", activeLocalityId);
      if (category !== "all") params.set("category", category);
      if (verification !== "all") params.set("verification", verification);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [activeLocalityId, category, verification, search]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const moments = useMemo(() => posts.filter((p) => p.isMoment), [posts]);

  const handlePostUpdated = (updated: PostItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT RAIL: Desktop Navigation & Filters */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filter by Beat
            </p>
            <div className="mt-3 space-y-1">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                  category === "all"
                    ? "bg-[#0A2E6E] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <span>All Local Stories</span>
              </button>
              {(Object.keys(CATEGORY_META) as PostCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                    category === cat
                      ? "bg-[#D91E2A] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span>{CATEGORY_META[cat].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trust Level
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(["all", "verified", "reviewed", "community"] as const).map(
                (tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setVerification(tier)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold capitalize transition-colors",
                      verification === tier
                        ? "bg-[#0A2E6E] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {tier === "all" ? "All Tiers" : tier}
                  </button>
                )
              )}
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: Story Rings + Social News Stream */}
        <section className="lg:col-span-6 space-y-5">
          {/* Pethri Moments Story Tray */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A2E6E]">
                <Sparkles className="h-4 w-4 text-[#D91E2A]" />
                <span>Pethri Moments</span>
              </div>
              <Link
                href="/moments"
                className="text-[11px] font-bold text-[#D91E2A] hover:underline"
              >
                Open Reels
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1">
              <Link
                href="/report?mode=moment"
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#D91E2A] bg-red-50 text-[#D91E2A]">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">
                  Add Yours
                </span>
              </Link>
              {moments.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMomentIndex(idx)}
                  className="flex flex-col items-center gap-1.5 shrink-0 max-w-16"
                >
                  <div className="rounded-full p-0.5 bg-gradient-to-tr from-[#D91E2A] via-amber-400 to-[#0A2E6E]">
                    <img
                      src={m.media[0]?.url ?? m.author.avatarUrl}
                      alt={m.localityName}
                      className="h-13 w-13 rounded-full border-2 border-white object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 truncate w-full text-center">
                    {m.localityName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile / Inline Search & Category Chips */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Pethri stories, churches, civic reports..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex lg:hidden gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold",
                  category === "all"
                    ? "bg-[#0A2E6E] text-white"
                    : "bg-white border border-slate-200 text-slate-700"
                )}
              >
                All
              </button>
              {(Object.keys(CATEGORY_META) as PostCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold",
                    category === cat
                      ? "bg-[#D91E2A] text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  )}
                >
                  {CATEGORY_META[cat].short}
                </button>
              ))}
            </div>
          </div>

          {/* Feed States: Loading, Empty, Live Posts */}
          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-slate-200" />
                  <div className="mt-4 h-44 rounded-2xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 font-display text-lg font-bold text-[#0A2E6E]">
                No stories match these filters yet
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Try switching to All Localities or be the first citizen reporter
                to share an update!
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveLocalityId("all");
                    setCategory("all");
                    setVerification("all");
                    setSearch("");
                  }}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Reset Filters
                </button>
                <Link
                  href="/report"
                  className="rounded-full bg-[#D91E2A] px-4 py-2 text-xs font-bold text-white"
                >
                  Report Local News
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdated={handlePostUpdated}
                  onOpenMoment={(clicked) => {
                    const idx = moments.findIndex((m) => m.id === clicked.id);
                    setMomentIndex(idx >= 0 ? idx : 0);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* RIGHT RAIL: Locality Pulse, Advisories & Business Spotlight */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
              <Megaphone className="h-4 w-4" />
              <span>Community Bulletins</span>
            </div>
            <div className="mt-3 space-y-3">
              {DEMO_ANNOUNCEMENTS.slice(0, 2).map((ann) => (
                <div
                  key={ann.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-[#0A2E6E]">
                      {ann.localityName}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                        ann.urgency === "urgent"
                          ? "bg-[#D91E2A] text-white"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {ann.urgency}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {ann.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                    {ann.summary}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/directory"
              className="mt-3 block text-center text-xs font-bold text-[#0A2E6E] hover:underline"
            >
              All Notices &amp; Directory →
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0A2E6E]">
              <Flame className="h-4 w-4 text-[#D91E2A]" />
              <span>Active Localities</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {localities.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() =>
                    setActiveLocalityId(
                      activeLocalityId === loc.id ? "all" : loc.id
                    )
                  }
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    activeLocalityId === loc.id
                      ? "bg-[#D91E2A] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-[#06183B] p-4 text-white shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Store className="h-4 w-4" />
              <span>Local Business Spotlight</span>
            </div>
            <p className="mt-2 text-sm font-bold">{DEMO_BUSINESSES[0].name}</p>
            <p className="mt-1 text-xs text-slate-300">
              {DEMO_BUSINESSES[0].description}
            </p>
            <Link
              href="/directory"
              className="mt-3 inline-block text-xs font-bold text-amber-200 hover:underline"
            >
              Browse Business Directory →
            </Link>
          </div>
        </aside>
      </div>

      {momentIndex !== null && moments.length > 0 && (
        <MomentLightbox
          moments={moments}
          initialIndex={momentIndex}
          onClose={() => setMomentIndex(null)}
          onLike={async (postId) => {
            const res = await fetch(`/api/posts/${postId}/engage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "like" }),
            });
            if (res.ok) {
              const data = await res.json();
              handlePostUpdated(data.post);
            }
          }}
        />
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-slate-500">
          Loading Pethri social feed...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
