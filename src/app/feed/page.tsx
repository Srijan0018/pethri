"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Flame,
  MapPin,
  Megaphone,
  Radio,
  Search,
  Sparkles,
  Store,
} from "lucide-react";
import { MomentLightbox } from "@/components/MomentLightbox";
import { EditorialReveal } from "@/components/MotionPrimitives";
import { PostCard } from "@/components/PostCard";
import { usePethri } from "@/components/PethriProvider";
import { DEMO_ANNOUNCEMENTS, DEMO_BUSINESSES } from "@/lib/seed-data";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  PostCategory,
  PostItem,
  PostSourceKind,
  VerificationTier,
} from "@/types/pethri";

function FeedContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") ?? "all") as
    | PostCategory
    | "all";
  const initialSourceKind = (searchParams.get("sourceKind") ?? "all") as
    | PostSourceKind
    | "all";
  const initialLocality = searchParams.get("locality");

  const {
    localities,
    activeLocalityId,
    setActiveLocalityId,
    language,
    dict,
    showToast,
  } = usePethri();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<PostCategory | "all">(
    initialCategory
  );
  const [sourceKind, setSourceKind] = useState<PostSourceKind | "all">(
    initialSourceKind
  );
  const [verification, setVerification] = useState<VerificationTier | "all">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [momentIndex, setMomentIndex] = useState<number | null>(null);
  const [followedLocalities, setFollowedLocalities] = useState<
    Record<string, boolean>
  >({ "loc-pethri": true, "loc-mangaluru": true, "loc-udupi": true });

  useEffect(() => {
    setSourceKind(initialSourceKind);
  }, [initialSourceKind]);

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
      if (sourceKind !== "all") params.set("sourceKind", sourceKind);
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
  }, [activeLocalityId, category, sourceKind, verification, search]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const moments = useMemo(() => posts.filter((p) => p.isMoment), [posts]);

  const handlePostUpdated = (updated: PostItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleFollowLocality = async (locId: string) => {
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_follow_locality",
        localityId: locId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setFollowedLocalities((prev) => ({
        ...prev,
        [locId]: Boolean(data.locality?.followedByMe),
      }));
      showToast(
        data.locality?.followedByMe
          ? `Following ${data.locality.name} updates`
          : `Unfollowed ${data.locality.name}`,
        "info"
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT RAIL */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-4">
          <div className="rounded-2xl border border-[#202820]/10 bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#525F52]">
              Source Desk
            </p>
            <div className="mt-2.5 space-y-1">
              {(
                [
                  { id: "all", label: "All Karavali Stream" },
                  { id: "newsroom", label: dict.sections.newsroomDispatch },
                  { id: "citizen", label: dict.sections.citizenDesk },
                  { id: "sponsored", label: dict.sections.sponsoredPartner },
                ] as const
              ).map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSourceKind(src.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                    sourceKind === src.id
                      ? "bg-[#202820] text-[#B7F36B]"
                      : "text-[#202820] hover:bg-[#DCEBCB]/50"
                  )}
                >
                  <span>{src.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#202820]/10 bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#525F52]">
              Filter by Beat
            </p>
            <div className="mt-2.5 space-y-1">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                  category === "all"
                    ? "bg-[#202820] text-[#B7F36B]"
                    : "text-[#202820] hover:bg-[#DCEBCB]/50"
                )}
              >
                <span>All Beats</span>
              </button>
              {(Object.keys(CATEGORY_META) as PostCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                    category === cat
                      ? "bg-[#DCEBCB] text-[#202820]"
                      : "text-[#525F52] hover:bg-[#F7F6EF]"
                  )}
                >
                  <span>
                    {language === "kn"
                      ? CATEGORY_META[cat].labelKn
                      : CATEGORY_META[cat].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#202820]/10 bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#525F52]">
              Verification Tier
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
                        ? "bg-[#202820] text-[#B7F36B]"
                        : "bg-[#F7F6EF] text-[#202820] hover:bg-[#DCEBCB]"
                    )}
                  >
                    {tier === "all" ? "All Tiers" : tier}
                  </button>
                )
              )}
            </div>
          </div>
        </aside>

        {/* CENTER STREAM */}
        <section className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-[#202820]/10 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#202820]">
                <Sparkles className="h-4 w-4" />
                <span>{dict.sections.pethriMoments}</span>
              </div>
              <Link
                href="/live"
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#202820] bg-[#B7F36B] px-2.5 py-0.5 rounded-full"
              >
                <Radio className="h-3 w-3" />
                Pethri Live
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1">
              <Link
                href="/report?mode=moment"
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#202820]/40 bg-[#DCEBCB]/70 text-[#202820]">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-[#202820]">
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
                  <div className="rounded-full p-0.5 bg-[#B7F36B] ring-1 ring-[#202820]/20">
                    <img
                      src={m.media[0]?.url ?? m.author.avatarUrl}
                      alt={m.localityName}
                      className="h-13 w-13 rounded-full border-2 border-white object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#202820] truncate w-full text-center">
                    {m.localityName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-full border border-[#202820]/15 bg-white px-4 py-2.5">
              <Search className="h-4 w-4 text-[#525F52]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex lg:hidden gap-2 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "newsroom", label: "Newsroom" },
                  { id: "citizen", label: "Community" },
                  { id: "sponsored", label: "Sponsored" },
                ] as const
              ).map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSourceKind(src.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1 text-xs font-bold",
                    sourceKind === src.id
                      ? "bg-[#202820] text-[#B7F36B]"
                      : "bg-white border border-[#202820]/15 text-[#202820]"
                  )}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-80 animate-pulse rounded-2xl border border-[#202820]/10 bg-white p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-[#DCEBCB]" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-[#DCEBCB]/60" />
                  <div className="mt-4 h-44 rounded-xl bg-[#F7F6EF]" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-[#202820]/10 bg-white p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-[#525F52]/40" />
              <h3 className="mt-3 font-display text-lg font-bold text-[#202820]">
                No stories match these filters yet
              </h3>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveLocalityId("all");
                    setCategory("all");
                    setSourceKind("all");
                    setVerification("all");
                    setSearch("");
                  }}
                  className="rounded-full border border-[#202820]/20 px-4 py-2 text-xs font-bold text-[#202820]"
                >
                  Reset Filters
                </button>
                <Link
                  href="/report"
                  className="rounded-full bg-[#202820] px-4 py-2 text-xs font-bold text-[#B7F36B]"
                >
                  Submit News
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post, idx) => (
                <EditorialReveal key={post.id} delay={idx === 0 ? 0 : 0.04}>
                  <PostCard
                    post={post}
                    onPostUpdated={handlePostUpdated}
                    onOpenMoment={(clicked) => {
                      const i = moments.findIndex((m) => m.id === clicked.id);
                      setMomentIndex(i >= 0 ? i : 0);
                    }}
                  />
                </EditorialReveal>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT RAIL */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-4">
          <div className="rounded-2xl border border-[#202820]/10 bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#202820]">
              <Flame className="h-4 w-4" />
              <span>Karavali Localities</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {localities.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveLocalityId(
                        activeLocalityId === loc.id ? "all" : loc.id
                      )
                    }
                    className={cn(
                      "font-semibold text-left hover:underline",
                      activeLocalityId === loc.id
                        ? "text-[#202820] font-extrabold underline"
                        : "text-[#525F52]"
                    )}
                  >
                    {language === "kn" && loc.nameKn ? loc.nameKn : loc.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFollowLocality(loc.id)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                      followedLocalities[loc.id]
                        ? "bg-[#202820] text-[#B7F36B]"
                        : "bg-[#DCEBCB]/70 text-[#202820]"
                    )}
                  >
                    {followedLocalities[loc.id]
                      ? dict.actions.following
                      : dict.actions.follow}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#202820]/10 bg-[#DCEBCB]/55 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#202820]">
              <Megaphone className="h-4 w-4" />
              <span>Civic Advisories</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {DEMO_ANNOUNCEMENTS.slice(0, 2).map((ann) => (
                <div
                  key={ann.id}
                  className="rounded-xl border border-[#202820]/10 bg-white p-3"
                >
                  <span className="text-[10px] font-bold uppercase text-[#525F52]">
                    {ann.localityName} • {ann.urgency}
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-[#202820]">
                    {ann.title}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/directory"
              className="mt-3 block text-center text-xs font-extrabold text-[#202820] underline"
            >
              Events &amp; Directory →
            </Link>
          </div>

          <div className="rounded-2xl border border-[#202820]/15 bg-[#202820] p-4 text-[#F7F6EF]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B7F36B]">
              <Store className="h-4 w-4" />
              <span>Karavali Directory</span>
            </div>
            <p className="mt-2 text-sm font-bold">{DEMO_BUSINESSES[0].name}</p>
            <p className="mt-1 text-xs text-[#C9E8D5]">
              {DEMO_BUSINESSES[0].description}
            </p>
            <Link
              href="/directory"
              className="mt-3 inline-block text-xs font-bold text-[#B7F36B] underline"
            >
              Browse Local Businesses →
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
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-[#525F52]">
          Loading Pethri Karavali feed...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
