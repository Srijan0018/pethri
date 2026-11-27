"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
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
    requireAuth,
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

  const highlights = useMemo(() => posts.filter((p) => p.isMoment), [posts]);

  const handlePostUpdated = (updated: PostItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleFollowLocality = async (locId: string) => {
    if (!requireAuth("follow localities")) return;
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
          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
              Editorial Desk Filter
            </p>
            <div className="mt-2.5 space-y-1">
              {(
                [
                  { id: "all", label: "All Published Content" },
                  { id: "newsroom", label: "Verified Newsroom" },
                  { id: "citizen", label: "Reviewed Community Tips" },
                  { id: "sponsored", label: "Sponsored Partners" },
                ] as const
              ).map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSourceKind(src.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                    sourceKind === src.id
                      ? "bg-[#1B5E43] text-white"
                      : "text-[#181917] hover:bg-[#EAF2EE]"
                  )}
                >
                  <span>{src.label}</span>
                  {sourceKind === src.id && (
                    <span className="h-2 w-2 rounded-full bg-[#398BFF]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
              Filter by Beat
            </p>
            <div className="mt-2.5 space-y-1">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                  category === "all"
                    ? "bg-[#1B5E43] text-white"
                    : "text-[#181917] hover:bg-[#EAF2EE]"
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
                      ? "bg-[#EAF2EE] text-[#1B5E43] font-bold"
                      : "text-[#5A605C] hover:bg-[#F8F7F4] hover:text-[#181917]"
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

          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
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
                      "rounded-full px-3 py-1 text-[11px] font-bold capitalize border transition-colors",
                      verification === tier
                        ? "bg-[#398BFF] border-[#398BFF] text-white"
                        : "bg-[#F8F7F4] border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
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
          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#181917]">
                <Sparkles className="h-4 w-4 text-[#1B5E43]" />
                <span>Verified Visual Highlights</span>
              </div>
              <Link
                href="/live"
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-[#D94E34] px-2.5 py-0.5 rounded-full"
              >
                <Radio className="h-3 w-3" />
                Official Live
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1">
              {highlights.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMomentIndex(idx)}
                  className="flex flex-col items-center gap-1.5 shrink-0 max-w-16 group"
                >
                  <div className="rounded-full p-0.5 bg-[#EAF2EE] ring-2 ring-[#398BFF]/60 group-hover:ring-[#398BFF] transition-all">
                    <img
                      src={m.media[0]?.url ?? m.author.avatarUrl}
                      alt={m.localityName}
                      className="h-13 w-13 rounded-full border-2 border-white object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#181917] truncate w-full text-center">
                    {m.localityName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-full border border-[#E5E3DC] bg-white px-4 py-2.5 focus-within:border-[#398BFF] focus-within:ring-2 focus-within:ring-[#398BFF]/15 transition-all">
              <Search className="h-4 w-4 text-[#5A605C]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-[#181917] outline-none"
              />
            </div>

            <div className="flex lg:hidden gap-2 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "newsroom", label: "Newsroom" },
                  { id: "citizen", label: "Reviewed Tips" },
                  { id: "sponsored", label: "Sponsored" },
                ] as const
              ).map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSourceKind(src.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1 text-xs font-bold border",
                    sourceKind === src.id
                      ? "bg-[#1B5E43] border-[#1B5E43] text-white"
                      : "bg-white border-[#E5E3DC] text-[#181917]"
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
                  className="h-80 animate-pulse rounded-2xl border border-[#E5E3DC] bg-white p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-[#EAF2EE]" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-[#EAF2EE]/70" />
                  <div className="mt-4 h-44 rounded-xl bg-[#F8F7F4]" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E3DC] bg-white p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-[#5A605C]/40" />
              <h3 className="mt-3 font-display text-lg font-bold text-[#181917]">
                No published dispatches match these filters
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
                  className="rounded-full border border-[#E5E3DC] px-4 py-2 text-xs font-bold text-[#1B5E43] hover:border-[#398BFF] hover:text-[#398BFF]"
                >
                  Reset Filters
                </button>
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
                      const i = highlights.findIndex(
                        (m) => m.id === clicked.id
                      );
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
          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1B5E43]">
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
                      "font-semibold text-left hover:text-[#398BFF] transition-colors",
                      activeLocalityId === loc.id
                        ? "text-[#398BFF] font-extrabold underline"
                        : "text-[#5A605C]"
                    )}
                  >
                    {language === "kn" && loc.nameKn ? loc.nameKn : loc.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFollowLocality(loc.id)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors border",
                      followedLocalities[loc.id]
                        ? "bg-[#1B5E43] border-[#1B5E43] text-white"
                        : "bg-[#EAF2EE] border-[#E5E3DC] text-[#1B5E43] hover:border-[#398BFF]"
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

          {/* Private News Tip Intake Box */}
          <div className="rounded-2xl border border-[#E5E3DC] bg-[#EAF2EE] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1B5E43]">
              <FileText className="h-4 w-4" />
              <span>Have a Verified Tip?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#5A605C]">
              News tips and civic reports are reviewed confidentially by our
              newsroom before publication.
            </p>
            <Link
              href="/report"
              className="inline-block rounded-full bg-[#1B5E43] px-4 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#398BFF] transition-colors"
            >
              Submit Private Tip →
            </Link>
          </div>

          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1B5E43]">
              <Megaphone className="h-4 w-4" />
              <span>Civic Advisories</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {DEMO_ANNOUNCEMENTS.slice(0, 2).map((ann) => (
                <div
                  key={ann.id}
                  className={cn(
                    "rounded-xl border bg-[#F8F7F4] p-3",
                    ann.urgency === "urgent"
                      ? "border-[#D94E34]/40"
                      : "border-[#E5E3DC]"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      ann.urgency === "urgent"
                        ? "text-[#D94E34]"
                        : "text-[#5A605C]"
                    )}
                  >
                    {ann.localityName} • {ann.urgency}
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-[#181917]">
                    {ann.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E3DC] bg-[#1B5E43] p-4 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EAF2EE]">
              <Store className="h-4 w-4" />
              <span>Karavali Directory</span>
            </div>
            <p className="mt-2 text-sm font-bold">{DEMO_BUSINESSES[0].name}</p>
            <p className="mt-1 text-xs text-[#EAF2EE]/85">
              {DEMO_BUSINESSES[0].description}
            </p>
            <Link
              href="/directory"
              className="mt-3 inline-block text-xs font-bold text-white underline hover:text-[#398BFF]"
            >
              Events &amp; Businesses →
            </Link>
          </div>
        </aside>
      </div>

      {momentIndex !== null && highlights.length > 0 && (
        <MomentLightbox
          moments={highlights}
          initialIndex={momentIndex}
          onClose={() => setMomentIndex(null)}
          onLike={async (postId) => {
            if (!requireAuth("react to highlights")) return;
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
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-[#5A605C]">
          Loading Pethri Karavali feed...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
