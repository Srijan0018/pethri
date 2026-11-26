"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  EditorialReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/MotionPrimitives";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  ListVideo,
  MapPin,
  MessageCircle,
  Play,
  Radio,
  Share2,
  Sparkles,
} from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
import { usePethri } from "@/components/PethriProvider";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  ChannelPlaylist,
  LiveBroadcast,
  PostItem,
} from "@/types/pethri";

export default function ChannelsAndMomentsPage() {
  const { showToast } = usePethri();
  const [moments, setMoments] = useState<PostItem[]>([]);
  const [broadcast, setBroadcast] = useState<LiveBroadcast | null>(null);
  const [playlists, setPlaylists] = useState<ChannelPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/posts?moments=true").then((r) => r.json()),
      fetch("/api/broadcast").then((r) => r.json()),
    ])
      .then(([postData, broadData]) => {
        setMoments(postData.posts ?? []);
        if (broadData.broadcast) setBroadcast(broadData.broadcast);
        if (Array.isArray(broadData.playlists))
          setPlaylists(broadData.playlists);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleMoments = selectedPlaylist
    ? moments.filter((m) => m.playlistSlug === selectedPlaylist)
    : moments;

  const current = visibleMoments[activeIdx] ?? visibleMoments[0];

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
    showToast("Link copied to clipboard");
  };

  const handleSubscribe = async (playlistId: string) => {
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_playlist_subscribe",
        playlistId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? data.playlist : p))
      );
      showToast(
        data.playlist.subscribedByMe
          ? `Subscribed to ${data.playlist.title}`
          : `Unsubscribed from ${data.playlist.title}`,
        "info"
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-110px)] bg-[#202820] text-[#F7F6EF] bg-forest-grid py-6 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B7F36B]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Pethri Channels, Live &amp; Moments</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Karavali Broadcasts, Playlists &amp; Shorts
            </h1>
          </div>
          <Link
            href="/report?mode=moment"
            className="inline-flex items-center gap-2 rounded-full bg-[#B7F36B] px-5 py-2.5 text-xs font-extrabold text-[#202820] hover:bg-[#DCEBCB]"
          >
            <Camera className="h-4 w-4" />
            Share a Moment
          </Link>
        </div>

        {/* 1. OFFICIAL NEWSROOM LIVE BROADCAST STAGE (YouTube Live-inspired) */}
        {broadcast && (
          <EditorialReveal>
          <section className="overflow-hidden rounded-2xl border border-white/15 bg-black/40 grid lg:grid-cols-12">
            <div className="lg:col-span-7 relative min-h-[260px] bg-slate-950">
              <img
                src={broadcast.posterUrl}
                alt={broadcast.title}
                className="h-full w-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-extrabold uppercase",
                    broadcast.isLive
                      ? "bg-[#D91E2A] text-white"
                      : "bg-slate-700 text-slate-200"
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {broadcast.isLive ? "Live Now" : "Broadcast Off Air"}
                </span>
                {broadcast.isLive && (
                  <span className="rounded bg-black/70 px-2.5 py-1 text-xs font-mono">
                    {broadcast.viewerCount} watching
                  </span>
                )}
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <Play className="h-3.5 w-3.5 fill-current text-amber-300" />
                  {broadcast.channelName}
                </span>
                <span className="text-[11px] text-slate-300">
                  Started <RelativeTime iso={broadcast.startedAt} />
                </span>
              </div>
            </div>
            <div className="lg:col-span-5 p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Official Newsroom Broadcast • {broadcast.localityName}
                </p>
                <h2 className="mt-2 font-editorial text-2xl sm:text-3xl leading-snug text-white">
                  {broadcast.title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {broadcast.summary}
                </p>
              </div>
              <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Host: <strong className="text-white">{broadcast.hostName}</strong>
                </span>
                <Link
                  href="/live"
                  className="text-[11px] font-bold text-[#B7F36B] hover:underline"
                >
                  Open Live Chat &amp; Studio →
                </Link>
              </div>
            </div>
          </section>
          </EditorialReveal>
        )}

        {/* 2. PETHRI VIDEO PLAYLISTS (YouTube Channels-inspired) */}
        <EditorialReveal delay={0.05}>
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-amber-300">
              <ListVideo className="h-4 w-4" />
              Newsroom Video Channels &amp; Playlists
            </h2>
            {selectedPlaylist && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlaylist(null);
                  setActiveIdx(0);
                }}
                className="text-xs font-bold text-white underline"
              >
                Show All Shorts
              </button>
            )}
          </div>
          <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {playlists.map((pl) => (
              <StaggerItem key={pl.id}>
              <div
                className={cn(
                  "rounded-2xl border p-3.5 transition-all hover:-translate-y-1",
                  selectedPlaylist === pl.slug
                    ? "border-[#D91E2A] bg-white/15"
                    : "border-white/15 bg-white/5"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlaylist(
                      selectedPlaylist === pl.slug ? null : pl.slug
                    );
                    setActiveIdx(0);
                  }}
                  className="w-full text-left"
                >
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
                    className="h-24 w-full rounded-xl object-cover"
                  />
                  <p className="mt-2.5 text-sm font-bold text-white">
                    {pl.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-300 line-clamp-2">
                    {pl.description}
                  </p>
                </button>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">
                    {pl.episodeCount} clips • {pl.subscribersCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSubscribe(pl.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold",
                      pl.subscribedByMe
                        ? "bg-white text-[#202820]"
                        : "bg-[#B7F36B] text-[#202820]"
                    )}
                  >
                    {pl.subscribedByMe && <Check className="h-3 w-3" />}
                    {pl.subscribedByMe ? "Subscribed" : "Subscribe"}
                  </button>
                </div>
              </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
        </EditorialReveal>

        {/* 3. VERTICAL PETHRI SHORTS PLAYER */}
        <EditorialReveal delay={0.08}>
        <section className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-300">
            Pethri Shorts &amp; Citizen Video Clips
          </h2>

          {loading ? (
            <div className="mx-auto h-[540px] max-w-sm animate-pulse rounded-3xl bg-white/10" />
          ) : !current ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center text-sm text-slate-300">
              No shorts in this playlist yet.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12 items-center">
              <div className="lg:col-span-6 flex justify-center">
                <motion.div
                  key={current.id}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.22}
                  onDragEnd={(_e, info) => {
                    if (
                      info.offset.y < -55 &&
                      activeIdx < visibleMoments.length - 1
                    ) {
                      setActiveIdx((i) => i + 1);
                    } else if (info.offset.y > 55 && activeIdx > 0) {
                      setActiveIdx((i) => i - 1);
                    }
                  }}
                  initial={{ opacity: 0.75, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative h-[580px] w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl cursor-grab active:cursor-grabbing"
                >
                  <AnimatePresence mode="wait">
                    {current.media[0]?.mediaType === "video" ? (
                      <motion.video
                        key={current.id}
                        src={current.media[0].url}
                        controls
                        autoPlay
                        loop
                        playsInline
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 1 }}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <motion.img
                        key={current.id}
                        src={
                          current.media[0]?.url ??
                          "/images/photos/church-feast.jpg"
                        }
                        alt={current.headline}
                        initial={{ opacity: 0.75, scale: 1.03 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </AnimatePresence>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

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

                  <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleLike(current.id)}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full bg-black/60 transition-transform active:scale-90",
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
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60">
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
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60">
                        <Share2 className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-bold">
                        {current.sharesCount}
                      </span>
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4 right-16">
                    <span className="inline-block rounded-full bg-[#D91E2A] px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      {CATEGORY_META[current.category].label}
                    </span>
                    <Link href={`/article/${current.id}`} className="block group">
                      <h3 className="mt-2 font-editorial text-xl leading-snug text-white group-hover:text-amber-200">
                        {current.headline}
                      </h3>
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-200">
                      {current.body}
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Queue ({activeIdx + 1} / {visibleMoments.length})
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label="Previous short"
                      disabled={activeIdx === 0}
                      onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 disabled:opacity-40"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next short"
                      disabled={activeIdx >= visibleMoments.length - 1}
                      onClick={() =>
                        setActiveIdx((i) =>
                          Math.min(visibleMoments.length - 1, i + 1)
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 disabled:opacity-40"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {visibleMoments.map((m, idx) => (
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
                        src={m.media[0]?.url ?? "/images/photos/pethri-town.jpg"}
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
        </section>
        </EditorialReveal>
      </div>
    </div>
  );
}
