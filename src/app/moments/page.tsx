"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  Sparkles,
} from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostItem } from "@/types/pethri";

export default function MomentsPage() {
  const { showToast } = usePethri();
  const [moments, setMoments] = useState<PostItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts?moments=true")
      .then((res) => res.json())
      .then((data) => {
        setMoments(data.posts ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const current = moments[activeIdx];

  const handleLike = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/engage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    if (res.ok) {
      const data = await res.json();
      setMoments((prev) =>
        prev.map((m) => (m.id === postId ? data.post : m))
      );
    }
  };

  const handleShare = async (postId: string) => {
    await fetch(`/api/posts/${postId}/engage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "share" }),
    });
    if (navigator.clipboard) {
      await navigator.clipboard
        .writeText(`${window.location.origin}/moments?id=${postId}`)
        .catch(() => {});
    }
    showToast("Moment link copied");
  };

  return (
    <div className="min-h-[calc(100vh-110px)] bg-[#06183B] text-white py-6 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Pethri Moments</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Vertical Local Reels &amp; Stories
            </h1>
          </div>
          <Link
            href="/report?mode=moment"
            className="inline-flex items-center gap-2 rounded-full bg-[#D91E2A] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#B81621]"
          >
            <Camera className="h-4 w-4" />
            Capture Moment
          </Link>
        </div>

        {loading ? (
          <div className="mx-auto h-[580px] max-w-sm animate-pulse rounded-3xl bg-white/10" />
        ) : !current ? (
          <div className="rounded-3xl border border-white/15 bg-white/5 p-12 text-center">
            <p className="text-sm text-slate-300">
              No moments posted yet. Capture the first local reel!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 items-center">
            {/* Vertical Reel Player Card */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative h-[600px] w-full max-w-[380px] overflow-hidden rounded-[32px] border border-white/20 bg-black shadow-2xl">
                {current.media[0]?.mediaType === "video" ? (
                  <video
                    src={current.media[0].url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={
                      current.media[0]?.url ?? "/images/scenes/church-feast.svg"
                    }
                    alt={current.headline}
                    className="h-full w-full object-cover"
                  />
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

                {/* Top Meta */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={current.author.avatarUrl}
                      alt={current.author.fullName}
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold">
                        {current.author.fullName}
                      </p>
                      <p className="flex items-center gap-1 text-[10px] text-slate-200">
                        <MapPin className="h-3 w-3 text-[#D91E2A]" />
                        {current.localityName} •{" "}
                        <RelativeTime iso={current.createdAt} />
                      </p>
                    </div>
                  </div>
                  <VerificationBadge tier={current.verificationTier} compact />
                </div>

                {/* Right Vertical Action Stack (Instagram Reels style) */}
                <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleLike(current.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-transform active:scale-90",
                        current.likedByMe && "bg-[#D91E2A]"
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-5 w-5",
                          current.likedByMe && "fill-white"
                        )}
                      />
                    </span>
                    <span className="text-[11px] font-bold">
                      {current.likesCount}
                    </span>
                  </button>

                  <Link
                    href="/feed"
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-md">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-bold">
                      {current.commentsCount}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleShare(current.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-md">
                      <Share2 className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-bold">
                      {current.sharesCount}
                    </span>
                  </button>
                </div>

                {/* Bottom Caption */}
                <div className="absolute bottom-4 left-4 right-16">
                  <span className="inline-block rounded-full bg-[#D91E2A] px-2.5 py-0.5 text-[10px] font-bold uppercase">
                    {CATEGORY_META[current.category].label}
                  </span>
                  <h2 className="mt-2 font-editorial text-xl leading-snug text-white">
                    {current.headline}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-200">
                    {current.body}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Reel Queue & Up/Down Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Up Next in Pethri Moments ({activeIdx + 1} / {moments.length})
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Previous moment"
                    disabled={activeIdx === 0}
                    onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 disabled:opacity-40"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next moment"
                    disabled={activeIdx === moments.length - 1}
                    onClick={() =>
                      setActiveIdx((i) => Math.min(moments.length - 1, i + 1))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 disabled:opacity-40"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {moments.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      idx === activeIdx
                        ? "border-[#D91E2A] bg-white/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <img
                      src={m.media[0]?.url ?? "/images/scenes/pethri-town.svg"}
                      alt={m.headline}
                      className="h-14 w-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-amber-300">
                        {m.localityName} • {CATEGORY_META[m.category].short}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-white line-clamp-1">
                        {m.headline}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-300">
                        by {m.author.fullName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
