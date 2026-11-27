"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
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
import {
  AnimatedLiveIndicator,
  EditorialReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/MotionPrimitives";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
import { usePethri } from "@/components/PethriProvider";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  ChannelPlaylist,
  LiveBroadcast,
  PostItem,
} from "@/types/pethri";

export default function VisualHighlightsPage() {
  const { requireAuth, showToast } = usePethri();
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
    if (!requireAuth("react to visual highlights")) return;
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
        .writeText(`${window.location.origin}/article/${postId}`)
        .catch(() => {});
    }
    showToast("Link copied to clipboard");
  };

  const handleSubscribe = async (playlistId: string) => {
    if (!requireAuth("subscribe to playlists")) return;
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
    <div className="min-h-[calc(100vh-110px)] bg-[#1B5E43] text-white bg-forest-grid py-7 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#EAF2EE]">
              <Sparkles className="h-3.5 w-3.5 text-[#398BFF]" />
              <span>Curated Visual Highlights &amp; Channels</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Pethri Story Reels &amp; Official Video Playlists
            </h1>
          </div>
          <Link
            href="/live"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-[#1B5E43] hover:bg-[#398BFF] hover:text-white transition-colors"
          >
            <Radio className="h-4 w-4 text-[#D94E34]" />
            Watch Official Live
          </Link>
        </div>

        {/* Official Live Stage */}
        {broadcast && (
          <EditorialReveal>
            <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#181917]/75 grid lg:grid-cols-12 shadow-lg">
              <div className="lg:col-span-7 relative min-h-[260px] bg-black">
                <img
                  src={broadcast.posterUrl}
                  alt={broadcast.title}
                  className="h-full w-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <AnimatedLiveIndicator
                    label={broadcast.isLive ? "LIVE NOW" : "REPLAY"}
                    showWaveform={broadcast.isLive}
                  />
                  {broadcast.isLive && (
                    <span className="rounded-full bg-[#181917]/80 px-2.5 py-1 text-xs font-mono">
                      {broadcast.viewerCount} watching
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    <Play className="h-3.5 w-3.5 fill-current text-[#398BFF]" />
                    {broadcast.channelName}
                  </span>
                  <span className="text-[11px] text-[#EAF2EE]">
                    Started <RelativeTime iso={broadcast.startedAt} />
                  </span>
                </div>
              </div>
              <div className="lg:col-span-5 p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#398BFF]">
                    Official Broadcast • {broadcast.localityName}
                  </p>
                  <h2 className="mt-2 font-editorial text-2xl sm:text-3xl leading-snug text-white">
                    {broadcast.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-[#EAF2EE]/85">
                    {broadcast.summary}
                  </p>
                </div>
                <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between text-xs">
                  <span className="text-[#EAF2EE]/80">
                    Host: <strong className="text-white">{broadcast.hostName}</strong>
                  </span>
                  <Link
                    href="/live"
                    className="text-[11px] font-bold text-[#398BFF] hover:underline"
                  >
                    Open Live Chat →
                  </Link>
                </div>
              </div>
            </section>
          </EditorialReveal>
        )}

        {/* Playlists */}
        <EditorialReveal delay={0.05}>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#EAF2EE]">
                <ListVideo className="h-4 w-4 text-[#398BFF]" />
                Editorial Video Channels &amp; Playlists
              </h2>
              {selectedPlaylist && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlaylist(null);
                    setActiveIdx(0);
                  }}
                  className="text-xs font-bold text-white underline hover:text-[#398BFF]"
                >
                  Show All Highlights
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
                        ? "border-[#398BFF] bg-white text-[#181917] electric-glow"
                        : "border-white/15 bg-white/10 text-white hover:bg-white/15"
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
                      <p className="mt-2.5 text-sm font-bold">{pl.title}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-[11px] line-clamp-2",
                          selectedPlaylist === pl.slug
                            ? "text-[#5A605C]"
                            : "text-[#EAF2EE]/80"
                        )}
                      >
                        {pl.description}
                      </p>
                    </button>
                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span
                        className={
                          selectedPlaylist === pl.slug
                            ? "text-[#5A605C]"
                            : "text-[#EAF2EE]/80"
                        }
                      >
                        {pl.episodeCount} clips • {pl.subscribersCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSubscribe(pl.id)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold transition-colors",
                          pl.subscribedByMe
                            ? "bg-[#EAF2EE] text-[#1B5E43]"
                            : "bg-[#398BFF] text-white"
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

        {/* Swipeable Vertical Story Highlights Viewer */}
        <EditorialReveal delay={0.08}>
          <section className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#EAF2EE]">
              Verified Story Highlights (Swipe Up / Down)
            </h2>

            {loading ? (
              <div className="mx-auto h-[540px] max-w-sm animate-pulse rounded-3xl bg-white/10" />
            ) : !current ? (
              <div className="rounded-2xl border border-white/15 bg-white/10 p-10 text-center text-sm text-[#EAF2EE]">
                No highlights in this playlist yet.
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
                    className="relative h-[580px] w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/25 bg-[#181917] shadow-2xl cursor-grab active:cursor-grabbing"
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
                          className="h-9 w-9 rounded-full border-2 border-[#398BFF] object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold">
                            {current.author.fullName}
                          </p>
                          <p className="flex items-center gap-1 text-[10px] text-[#EAF2EE]">
                            <MapPin className="h-3 w-3 text-[#398BFF]" />
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
                            current.likedByMe && "bg-[#398BFF] text-white"
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
                        href={`/article/${current.id}`}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 hover:bg-[#398BFF] transition-colors">
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
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 hover:bg-[#398BFF] transition-colors">
                          <Share2 className="h-5 w-5" />
                        </span>
                        <span className="text-[11px] font-bold">
                          {current.sharesCount}
                        </span>
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-4 right-16">
                      <span className="inline-block rounded-full bg-[#398BFF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white">
                        {CATEGORY_META[current.category].label}
                      </span>
                      <Link
                        href={`/article/${current.id}`}
                        className="block group"
                      >
                        <h3 className="mt-2 font-editorial text-xl leading-snug text-white group-hover:text-[#EAF2EE]">
                          {current.headline}
                        </h3>
                      </Link>
                      <p className="mt-1 line-clamp-2 text-xs text-white/80">
                        {current.body}
                      </p>
                    </div>
                  </motion.div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#EAF2EE]">
                      Queue ({activeIdx + 1} / {visibleMoments.length})
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="Previous highlight"
                        disabled={activeIdx === 0}
                        onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-[#398BFF] disabled:opacity-40 transition-colors"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next highlight"
                        disabled={activeIdx >= visibleMoments.length - 1}
                        onClick={() =>
                          setActiveIdx((i) =>
                            Math.min(visibleMoments.length - 1, i + 1)
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-[#398BFF] disabled:opacity-40 transition-colors"
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
                            ? "border-[#398BFF] bg-white text-[#181917] electric-glow"
                            : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                        )}
                      >
                        <img
                          src={
                            m.media[0]?.url ?? "/images/photos/pethri-town.jpg"
                          }
                          alt={m.headline}
                          className="h-14 w-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-[11px] font-bold",
                              idx === activeIdx
                                ? "text-[#398BFF]"
                                : "text-[#EAF2EE]"
                            )}
                          >
                            {m.localityName} • {CATEGORY_META[m.category].short}
                          </p>
                          <p className="mt-0.5 text-sm font-bold line-clamp-1">
                            {m.headline}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 text-[11px]",
                              idx === activeIdx
                                ? "text-[#5A605C]"
                                : "text-[#EAF2EE]/80"
                            )}
                          >
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
