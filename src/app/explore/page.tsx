"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
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
import { DEMO_PROFILES } from "@/lib/seed-data";
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
  const [reporters, setReporters] = useState<UserProfile[]>(DEMO_PROFILES);
  const [query, setQuery] = useState(initialQ);
  const [selectedTopic, setSelectedTopic] = useState<PostCategory | "all">(
    "all"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (activeLocalityId !== "all" && p.localityId !== activeLocalityId) {
        return false;
      }
      if (selectedTopic !== "all" && p.category !== selectedTopic) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay =
          `${p.headline} ${p.body} ${p.localityName} ${p.approxLandmark ?? ""}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [posts, activeLocalityId, selectedTopic, query]);

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
        prev.map((r) => (r.id === profileId ? data.profile : r))
      );
      showToast(
        data.profile.followedByMe
          ? `Following ${data.profile.fullName}`
          : `Unfollowed ${data.profile.fullName}`,
        "info"
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E3DC] pb-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
            EXPLORE KARAVALI • LOCALITIES, TOPICS &amp; REPORTERS
          </p>
          <MaskedHeadlineReveal>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#181917]">
              Explore Mangaluru, Udupi, Manipal &amp; Pethri
            </h1>
          </MaskedHeadlineReveal>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#E5E3DC] bg-white px-4 py-2 sm:w-80 focus-within:border-[#398BFF] focus-within:ring-2 focus-within:ring-[#398BFF]/15 transition-all">
          <Search className="h-4 w-4 text-[#5A605C]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locality, topic, reporter..."
            className="flex-1 bg-transparent text-sm text-[#181917] outline-none"
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
              ? "border-[#1B5E43] text-white"
              : "bg-white border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
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
                ? "border-[#398BFF] text-white"
                : "bg-white border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
            )}
          >
            {selectedTopic === cat && (
              <AnimatedNavPill
                layoutId="explore-topic-pill"
                className="bg-[#398BFF]"
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
              PETHRI JOURNALISTS &amp; CORRESPONDENTS
            </p>
            <h2 className="font-display text-xl font-extrabold text-[#181917]">
              Explore Reporters
            </h2>
          </div>
        </div>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reporters
            .filter((r) => r.isVerifiedReporter)
            .map((rep) => (
              <StaggerItem key={rep.id}>
                <div className="h-full rounded-2xl border border-[#E5E3DC] bg-white p-4 flex flex-col justify-between hover:border-[#398BFF]/45 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/profile?user=${rep.username}`}
                        className="flex items-center gap-2.5 min-w-0"
                      >
                        <img
                          src={rep.avatarUrl}
                          alt={rep.fullName}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-[#E5E3DC]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#181917] truncate hover:text-[#398BFF]">
                            {rep.fullName}
                          </p>
                          <p className="text-[10px] text-[#5A605C] truncate">
                            {rep.homeLocalityName} • {rep.role}
                          </p>
                        </div>
                      </Link>
                      <ShieldCheck className="h-4 w-4 shrink-0 text-[#1B5E43]" />
                    </div>
                    <p className="mt-2.5 text-[11px] leading-relaxed text-[#5A605C] line-clamp-2">
                      {rep.bio}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#E5E3DC] pt-2.5 text-[11px]">
                    <span className="font-semibold text-[#5A605C]">
                      {rep.followersCount} followers
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFollowReporter(rep.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold transition-colors border",
                        rep.followedByMe
                          ? "bg-[#1B5E43] border-[#1B5E43] text-white"
                          : "bg-[#EAF2EE] border-[#E5E3DC] text-[#1B5E43] hover:border-[#398BFF] hover:text-[#398BFF]"
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
            <div className="rounded-2xl border border-[#E5E3DC] border-t-[3px] border-t-[#1B5E43] bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2EE] px-2.5 py-0.5 text-xs font-bold text-[#1B5E43]">
                  <MapPin className="h-3.5 w-3.5" />
                  PIN {selectedLocality.pincode}
                </span>
                <span className="text-xs font-semibold text-[#5A605C]">
                  {selectedLocality.taluk}
                </span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-[#181917]">
                {selectedLocality.name}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5A605C]">
                {selectedLocality.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-[#E5E3DC] pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#181917]">
                  <Users className="h-4 w-4 text-[#1B5E43]" />
                  {selectedLocality.activeReporters} Active Reporters
                </span>
                <Link
                  href={`/report?locality=${selectedLocality.id}`}
                  className="font-extrabold text-[#398BFF] hover:underline"
                >
                  Send Private Tip →
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5">
              <h2 className="font-display text-lg font-extrabold text-[#181917]">
                All Karavali Localities ({localities.length})
              </h2>
              <p className="mt-1 text-xs text-[#5A605C]">
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
                    ? "border-[#398BFF] bg-[#398BFF] text-white electric-glow"
                    : "border-[#E5E3DC] bg-white hover:border-[#398BFF]"
                )}
              >
                <p className="text-xs font-bold">{loc.name}</p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    activeLocalityId === loc.id
                      ? "text-white/85"
                      : "text-[#5A605C]"
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
            <div className="h-64 animate-pulse rounded-2xl bg-white border border-[#E5E3DC]" />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E3DC] bg-white p-10 text-center">
              <p className="font-display text-lg font-bold text-[#181917]">
                No matching stories in this area yet
              </p>
              <p className="mt-1 text-xs text-[#5A605C]">
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
        <div className="mx-auto max-w-5xl px-4 py-12 text-center text-sm text-[#5A605C]">
          Loading Karavali explore map...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
