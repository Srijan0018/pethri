"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Flame,
  MapPin,
  Megaphone,
  Search,
  Store,
} from "lucide-react";
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
    isAuthenticated,
    requireAuth,
    language,
    dict,
    showToast,
  } = usePethri();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalPosts, setTotalPosts] = useState(0);
  const [offset, setOffset] = useState(0);
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
  const [followedLocalities, setFollowedLocalities] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setSourceKind(initialSourceKind);
  }, [initialSourceKind]);

  useEffect(() => {
    if (initialLocality) {
      setActiveLocalityId(initialLocality);
    }
  }, [initialLocality, setActiveLocalityId]);

  useEffect(() => {
    setOffset(0);
  }, [activeLocalityId, category, sourceKind, verification, search]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFollowedLocalities({});
      return;
    }
    let active = true;
    fetch("/api/preferences")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load follows.");
        if (active && Array.isArray(data.followedLocalities)) {
          setFollowedLocalities(
            Object.fromEntries(data.followedLocalities.map((id: string) => [id, true]))
          );
        }
      })
      .catch((error: unknown) => {
        if (active) {
          showToast(
            error instanceof Error ? error.message : "Unable to load follows.",
            "error"
          );
        }
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, showToast]);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (activeLocalityId !== "all") params.set("locality", activeLocalityId);
      if (category !== "all") params.set("category", category);
      if (sourceKind !== "all") params.set("sourceKind", sourceKind);
      if (verification !== "all") params.set("verification", verification);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "20");
      params.set("offset", String(offset));

      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to load news.");
      setPosts(data.posts ?? []);
      setTotalPosts(data.total ?? 0);
    } catch (error) {
      setPosts([]);
      setTotalPosts(0);
      setLoadError(
        error instanceof Error ? error.message : "Unable to load news."
      );
    } finally {
      setLoading(false);
    }
  }, [activeLocalityId, category, sourceKind, verification, search, offset]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

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
      setFollowedLocalities((prev) => ({ ...prev, [locId]: Boolean(data.following) }));
      showToast(
        data.following ? "Following locality updates" : "Unfollowed locality",
        "info"
      );
    } else {
      const data = await res.json();
      showToast(data.error ?? "Unable to update locality follow.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT RAIL */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-4">
          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
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
                      ? "bg-[#173FBE] text-white"
                      : "text-[#111318] hover:bg-[#EEF2FF]"
                  )}
                >
                  <span>{src.label}</span>
                  {sourceKind === src.id && (
                    <span className="h-2 w-2 rounded-full bg-[#315CFF]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
              Filter by Beat
            </p>
            <div className="mt-2.5 space-y-1">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                  category === "all"
                    ? "bg-[#173FBE] text-white"
                    : "text-[#111318] hover:bg-[#EEF2FF]"
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
                      ? "bg-[#EEF2FF] text-[#173FBE] font-bold"
                      : "text-[#5B6472] hover:bg-[#FFFFFF] hover:text-[#111318]"
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

          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
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
                        ? "bg-[#315CFF] border-[#315CFF] text-white"
                        : "bg-[#FFFFFF] border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
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
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-full border border-[#E2E7F0] bg-white px-4 py-2.5 focus-within:border-[#315CFF] focus-within:ring-2 focus-within:ring-[#315CFF]/15 transition-all">
              <Search className="h-4 w-4 text-[#5B6472]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-[#111318] outline-none"
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
                      ? "bg-[#173FBE] border-[#173FBE] text-white"
                      : "bg-white border-[#E2E7F0] text-[#111318]"
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
                  className="h-80 animate-pulse rounded-2xl border border-[#E2E7F0] bg-white p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-[#EEF2FF]" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-[#EEF2FF]/70" />
                  <div className="mt-4 h-44 rounded-xl bg-[#FFFFFF]" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div role="alert" className="rounded-2xl border border-[#D94E34]/30 bg-white p-5 text-sm text-[#D94E34]">
              {loadError}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E7F0] bg-white p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-[#5B6472]/40" />
              <h3 className="mt-3 font-display text-lg font-bold text-[#111318]">
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
                  className="rounded-full border border-[#E2E7F0] px-4 py-2 text-xs font-bold text-[#173FBE] hover:border-[#315CFF] hover:text-[#315CFF]"
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
                  />
                </EditorialReveal>
              ))}
            </div>
          )}
          {!loading && !loadError && totalPosts > 20 && (
            <nav aria-label="News pages" className="flex items-center justify-between rounded-2xl border border-[#E2E7F0] bg-white p-3">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => setOffset((current) => Math.max(0, current - 20))}
                className="rounded-full border border-[#E2E7F0] px-4 py-2 text-xs font-bold text-[#173FBE] disabled:opacity-40"
              >
                Newer
              </button>
              <span className="text-xs text-[#5B6472]">
                {offset + 1}–{Math.min(offset + posts.length, totalPosts)} of {totalPosts}
              </span>
              <button
                type="button"
                disabled={offset + 20 >= totalPosts}
                onClick={() => setOffset((current) => current + 20)}
                className="rounded-full border border-[#E2E7F0] px-4 py-2 text-xs font-bold text-[#173FBE] disabled:opacity-40"
              >
                Older
              </button>
            </nav>
          )}
        </section>

        {/* RIGHT RAIL */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-4">
          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#173FBE]">
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
                      "font-semibold text-left hover:text-[#315CFF] transition-colors",
                      activeLocalityId === loc.id
                        ? "text-[#315CFF] font-extrabold underline"
                        : "text-[#5B6472]"
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
                        ? "bg-[#173FBE] border-[#173FBE] text-white"
                        : "bg-[#EEF2FF] border-[#E2E7F0] text-[#173FBE] hover:border-[#315CFF]"
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
          <div className="rounded-2xl border border-[#E2E7F0] bg-[#EEF2FF] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#173FBE]">
              <FileText className="h-4 w-4" />
              <span>Have a Verified Tip?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#5B6472]">
              News tips and civic reports are reviewed confidentially by our
              newsroom before publication.
            </p>
            <Link
              href="/report"
              className="inline-block rounded-full bg-[#173FBE] px-4 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#315CFF] transition-colors"
            >
              Submit Private Tip →
            </Link>
          </div>

          <div className="rounded-2xl border border-[#E2E7F0] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#173FBE]">
              <Megaphone className="h-4 w-4" />
              <span>Civic Advisories</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {DEMO_ANNOUNCEMENTS.slice(0, 2).map((ann) => (
                <div
                  key={ann.id}
                  className={cn(
                    "rounded-xl border bg-[#FFFFFF] p-3",
                    ann.urgency === "urgent"
                      ? "border-[#D94E34]/40"
                      : "border-[#E2E7F0]"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      ann.urgency === "urgent"
                        ? "text-[#D94E34]"
                        : "text-[#5B6472]"
                    )}
                  >
                    {ann.localityName} • {ann.urgency}
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-[#111318]">
                    {ann.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E7F0] bg-[#173FBE] p-4 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EEF2FF]">
              <Store className="h-4 w-4" />
              <span>Karavali Directory</span>
            </div>
            <p className="mt-2 text-sm font-bold">{DEMO_BUSINESSES[0].name}</p>
            <p className="mt-1 text-xs text-[#EEF2FF]/85">
              {DEMO_BUSINESSES[0].description}
            </p>
            <Link
              href="/directory"
              className="mt-3 inline-block text-xs font-bold text-white underline hover:text-[#315CFF]"
            >
              Events &amp; Businesses →
            </Link>
          </div>
        </aside>
      </div>

    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-[#5B6472]">
          Loading Pethri Karavali feed...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
