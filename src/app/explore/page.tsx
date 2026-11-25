"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Search, Users } from "lucide-react";
import { LocalityMap } from "@/components/LocalityMap";
import { PostCard } from "@/components/PostCard";
import { usePethri } from "@/components/PethriProvider";
import { cn } from "@/lib/utils";
import type { PostItem } from "@/types/pethri";

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const { localities, activeLocalityId, setActiveLocalityId } = usePethri();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [query, setQuery] = useState(initialQ);
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
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay =
          `${p.headline} ${p.body} ${p.localityName} ${p.approxLandmark ?? ""}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [posts, activeLocalityId, query]);

  const selectedLocality = localities.find((l) => l.id === activeLocalityId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
            Location-Based Discovery
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
            Explore Pethri &amp; Neighbouring Localities
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 shadow-2xs sm:w-80">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locality, landmark, topic..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Interactive Geospatial Locality Map */}
      <LocalityMap
        localities={localities}
        posts={posts}
        selectedLocalityId={activeLocalityId}
        onSelectLocality={setActiveLocalityId}
      />

      {/* Selected Locality Spotlight + Nearby Cards */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-4 space-y-4">
          {selectedLocality ? (
            <div className="rounded-3xl border border-[#0A2E6E]/20 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#D91E2A]/10 px-2.5 py-0.5 text-xs font-bold text-[#D91E2A]">
                  <MapPin className="h-3.5 w-3.5" />
                  PIN {selectedLocality.pincode}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {selectedLocality.taluk} Taluk
                </span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-[#0A2E6E]">
                {selectedLocality.name}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {selectedLocality.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                  <Users className="h-4 w-4 text-[#0A2E6E]" />
                  {selectedLocality.activeReporters} Active Reporters
                </span>
                <Link
                  href={`/report?locality=${selectedLocality.id}`}
                  className="font-bold text-[#D91E2A] hover:underline"
                >
                  Report here →
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="font-display text-lg font-extrabold text-[#0A2E6E]">
                All Localities ({localities.length})
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Select any locality card or map pin to zoom into ward-level
                stories.
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
                    ? "border-[#D91E2A] bg-[#D91E2A] text-white shadow-md"
                    : "border-slate-200 bg-white hover:border-[#0A2E6E]"
                )}
              >
                <p className="text-xs font-bold">{loc.name}</p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    activeLocalityId === loc.id
                      ? "text-white/85"
                      : "text-slate-500"
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
            <div className="h-64 animate-pulse rounded-3xl bg-white border border-slate-200" />
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
              <p className="font-display text-lg font-bold text-[#0A2E6E]">
                No matching dispatches in this area yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Clear the search or submit the first report from this locality.
              </p>
            </div>
          ) : (
            filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={(u) =>
                  setPosts((prev) =>
                    prev.map((p) => (p.id === u.id ? u : p))
                  )
                }
              />
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
        <div className="mx-auto max-w-5xl px-4 py-12 text-center text-sm text-slate-500">
          Loading interactive locality map...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
