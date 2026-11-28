"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { LocalityMap } from "@/components/LocalityMap";
import {
  AnimatedNavPill,
  EditorialReveal,
  MaskedHeadlineReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/MotionPrimitives";
import { PostCard } from "@/components/PostCard";
import { usePethri } from "@/components/PethriProvider";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostCategory, PostItem, UserProfile } from "@/types/pethri";

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const {
    localities,
    activeLocalityId,
    setActiveLocalityId,
    requireAuth,
    showToast,
  } = usePethri();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [reporters, setReporters] = useState<UserProfile[]>([]);
  const [matchingLocalities, setMatchingLocalities] = useState<
    typeof localities
  >([]);
  const [query, setQuery] = useState(initialQ);
  const [selectedTopic, setSelectedTopic] = useState<PostCategory | "all">(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setSearchError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (activeLocalityId !== "all") params.set("locality", activeLocalityId);
      if (selectedTopic !== "all") params.set("category", selectedTopic);
      params.set("limit", "30");
      fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Search failed.");
          setPosts(data.posts ?? []);
          setReporters(data.reporters ?? []);
          setMatchingLocalities(data.localities ?? []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setSearchError(
            error instanceof Error ? error.message : "Unable to search."
          );
          setPosts([]);
          setReporters([]);
          setMatchingLocalities([]);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeLocalityId, selectedTopic, query]);

  const filtered = posts;

  const selectedLocality = localities.find((l) => l.id === activeLocalityId);

  const handleFollowReporter = async (profileId: string) => {
    if (!requireAuth("follow Karavali reporters")) return;
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_follow_profile",
        profileId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setReporters((prev) =>
        prev.map((r) =>
          r.id === profileId
            ? {
                ...r,
                followedByMe: Boolean(data.following),
                followersCount: r.followersCount + (data.following ? 1 : -1),
              }
            : r
        )
      );
      showToast(
        data.following ? "Following reporter" : "Unfollowed reporter",
        "info"
      );
    } else {
      const data = await res.json();
      showToast(data.error ?? "Unable to update reporter follow.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E7F0] pb-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
            EXPLORE KARAVALI • LOCALITIES, TOPICS &amp; REPORTERS
          </p>
          <MaskedHeadlineReveal>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#111318]">
              Explore Mangaluru, Udupi, Manipal &amp; Pethri
            </h1>
          </MaskedHeadlineReveal>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#E2E7F0] bg-white px-4 py-2 sm:w-80 focus-within:border-[#315CFF] focus-within:ring-2 focus-within:ring-[#315CFF]/15 transition-all">
          <Search className="h-4 w-4 text-[#5B6472]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locality, topic, reporter..."
            className="flex-1 bg-transparent text-sm text-[#111318] outline-none"
          />
        </div>
      </div>

      {/* Topics Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedTopic("all")}
          className={cn(
            "relative z-0 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors",
            selectedTopic === "all"
              ? "border-[#173FBE] text-white"
              : "bg-white border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
          )}
        >
          {selectedTopic === "all" && (
            <AnimatedNavPill layoutId="explore-topic-pill" />
          )}
          All Topics
        </button>
        {(Object.keys(CATEGORY_META) as PostCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedTopic(cat)}
            className={cn(
              "relative z-0 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors",
              selectedTopic === cat
                ? "border-[#315CFF] text-white"
                : "bg-white border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
            )}
          >
            {selectedTopic === cat && (
              <AnimatedNavPill
                layoutId="explore-topic-pill"
                className="bg-[#315CFF]"
              />
            )}
            {CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      {/* Interactive Karavali Map */}
      <EditorialReveal>
        <LocalityMap
          localities={localities}
          posts={posts}
          selectedLocalityId={activeLocalityId}
          onSelectLocality={setActiveLocalityId}
        />
      </EditorialReveal>

      {/* Accredited Reporters & Correspondents */}
      {query.trim() && matchingLocalities.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold text-[#111318]">
            Matching Localities
          </h2>
          <div className="flex flex-wrap gap-2">
            {matchingLocalities.map((locality) => (
              <button
                key={locality.id}
                type="button"
                onClick={() => setActiveLocalityId(locality.id)}
                className="rounded-full border border-[#E2E7F0] bg-white px-3 py-1.5 text-xs font-bold text-[#173FBE] hover:border-[#315CFF]"
              >
                {locality.name}, {locality.district}
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
              PETHRI JOURNALISTS &amp; CORRESPONDENTS
            </p>
            <h2 className="font-display text-xl font-extrabold text-[#111318]">
              Explore Reporters
            </h2>
          </div>
        </div>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reporters.map((rep) => (
              <StaggerItem key={rep.id}>
                <div className="h-full rounded-2xl border border-[#E2E7F0] bg-white p-4 flex flex-col justify-between hover:border-[#315CFF]/45 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/profile?user=${rep.username}`}
                        className="flex items-center gap-2.5 min-w-0"
                      >
                        <img
                          src={rep.avatarUrl}
                          alt={rep.fullName}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-[#E2E7F0]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#111318] truncate hover:text-[#315CFF]">
                            {rep.fullName}
                          </p>
                          <p className="text-[10px] text-[#5B6472] truncate">
                            {rep.homeLocalityName} • {rep.role}
                          </p>
                        </div>
                      </Link>
                      <ShieldCheck className="h-4 w-4 shrink-0 text-[#173FBE]" />
                    </div>
                    <p className="mt-2.5 text-[11px] leading-relaxed text-[#5B6472] line-clamp-2">
                      {rep.bio}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#E2E7F0] pt-2.5 text-[11px]">
                    <span className="font-semibold text-[#5B6472]">
                      {rep.followersCount} followers
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFollowReporter(rep.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold transition-colors border",
                        rep.followedByMe
                          ? "bg-[#173FBE] border-[#173FBE] text-white"
                          : "bg-[#EEF2FF] border-[#E2E7F0] text-[#173FBE] hover:border-[#315CFF] hover:text-[#315CFF]"
                      )}
                    >
                      {rep.followedByMe ? (
                        <>
                          <UserCheck className="h-3 w-3" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          Follow
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </StaggerItem>
            ))}
        </StaggerGroup>
      </section>

      {/* Locality Spotlight + Filtered Dispatches */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-4 space-y-4">
          {selectedLocality ? (
            <div className="rounded-2xl border border-[#E2E7F0] border-t-[3px] border-t-[#173FBE] bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-bold text-[#173FBE]">
                  <MapPin className="h-3.5 w-3.5" />
                  PIN {selectedLocality.pincode}
                </span>
                <span className="text-xs font-semibold text-[#5B6472]">
                  {selectedLocality.taluk}
                </span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-[#111318]">
                {selectedLocality.name}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5B6472]">
                {selectedLocality.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-[#E2E7F0] pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#111318]">
                  <Users className="h-4 w-4 text-[#173FBE]" />
                  {selectedLocality.activeReporters} Active Reporters
                </span>
                <Link
                  href={`/report?locality=${selectedLocality.id}`}
                  className="font-extrabold text-[#315CFF] hover:underline"
                >
                  Send Private Tip →
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5">
              <h2 className="font-display text-lg font-extrabold text-[#111318]">
                All Karavali Localities ({localities.length})
              </h2>
              <p className="mt-1 text-xs text-[#5B6472]">
                Select any locality pin on the map or below to filter dispatches.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
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
                  "rounded-2xl border p-3 text-left transition-all",
                  activeLocalityId === loc.id
                    ? "border-[#315CFF] bg-[#315CFF] text-white electric-glow"
                    : "border-[#E2E7F0] bg-white hover:border-[#315CFF]"
                )}
              >
                <p className="text-xs font-bold">{loc.name}</p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    activeLocalityId === loc.id
                      ? "text-white/85"
                      : "text-[#5B6472]"
                  )}
                >
                  {loc.activeReporters} reporters
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-5">
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-white border border-[#E2E7F0]" />
          ) : searchError ? (
            <div role="alert" className="rounded-2xl border border-[#D94E34]/30 bg-white p-5 text-sm text-[#D94E34]">
              {searchError}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E7F0] bg-white p-10 text-center">
              <p className="font-display text-lg font-bold text-[#111318]">
                No matching stories in this area yet
              </p>
              <p className="mt-1 text-xs text-[#5B6472]">
                Clear filters or submit a private news tip from this locality.
              </p>
            </div>
          ) : (
            filtered.map((post) => (
              <EditorialReveal key={post.id}>
                <PostCard
                  post={post}
                  onPostUpdated={(u) =>
                    setPosts((prev) =>
                      prev.map((p) => (p.id === u.id ? u : p))
                    )
                  }
                />
              </EditorialReveal>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12 text-center text-sm text-[#5B6472]">
          Loading Karavali explore map...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
