"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Camera,
  Compass,
  Eye,
  FileEdit,
  Flame,
  MapPin,
  Megaphone,
  Play,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import { MomentLightbox } from "@/components/MomentLightbox";
import {
  EditorialReveal,
  GsapImageMask,
  StaggerGroup,
  StaggerItem,
} from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_EVENTS,
  DEMO_LIVE_STREAMS,
  DEMO_POSTS,
} from "@/lib/seed-data";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  LiveBroadcast,
  LocalEvent,
  PostCategory,
  PostItem,
} from "@/types/pethri";

export default function KaravaliFrontpage() {
  const {
    localities,
    activeLocalityId,
    setActiveLocalityId,
    language,
    dict,
    showToast,
  } = usePethri();
  const [posts, setPosts] = useState<PostItem[]>(
    DEMO_POSTS.filter((p) => p.moderationStatus === "approved")
  );
  const [liveStreams, setLiveStreams] =
    useState<LiveBroadcast[]>(DEMO_LIVE_STREAMS);
  const [events, setEvents] = useState<LocalEvent[]>(DEMO_EVENTS);
  const [selectedCategory, setSelectedCategory] = useState<
    PostCategory | "all"
  >("all");
  const [momentIndex, setMomentIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.posts)) setPosts(d.posts);
      })
      .catch(() => {});

    fetch("/api/broadcast")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.liveStreams) && d.liveStreams.length > 0) {
          setLiveStreams(d.liveStreams);
        }
        if (Array.isArray(d.events)) setEvents(d.events);
      })
      .catch(() => {});
  }, []);

  const scopedPosts = useMemo(() => {
    return posts.filter((p) => {
      if (activeLocalityId !== "all" && p.localityId !== activeLocalityId) {
        return false;
      }
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [posts, activeLocalityId, selectedCategory]);

  const newsroomPosts = useMemo(
    () => scopedPosts.filter((p) => p.sourceKind === "newsroom"),
    [scopedPosts]
  );
  const citizenPosts = useMemo(
    () => scopedPosts.filter((p) => p.sourceKind === "citizen"),
    [scopedPosts]
  );
  const sponsoredPosts = useMemo(
    () => scopedPosts.filter((p) => p.sourceKind === "sponsored"),
    [scopedPosts]
  );

  const leadStory =
    newsroomPosts.find((p) => p.isBreaking) ??
    newsroomPosts[0] ??
    scopedPosts[0];
  const secondaryNewsroom = newsroomPosts
    .filter((p) => p.id !== leadStory?.id)
    .slice(0, 2);
  const latestWire = scopedPosts
    .filter((p) => p.sourceKind !== "sponsored")
    .slice(0, 5);
  const trendingStories = [...posts]
    .filter((p) => p.sourceKind !== "sponsored")
    .sort((a, b) => b.likesCount + b.sharesCount - (a.likesCount + a.sharesCount))
    .slice(0, 4);
  const moments = useMemo(() => posts.filter((p) => p.isMoment), [posts]);
  const primaryLive = liveStreams[0] ?? DEMO_LIVE_STREAMS[0];

  const getTitle = (p: PostItem) =>
    language === "kn" && p.headlineKn ? p.headlineKn : p.headline;
  const getBody = (p: PostItem) =>
    language === "kn" && p.bodyKn ? p.bodyKn : p.body;

  const handleMomentLike = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/engage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
    }
  };

  const handleEventRsvp = async (eventId: string) => {
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_event_rsvp", eventId }),
    });
    if (res.ok) {
      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? data.event : e))
      );
      showToast(
        data.event.rsvpedByMe
          ? "RSVP confirmed for Karavali event"
          : "RSVP removed",
        "info"
      );
    }
  };

  return (
    <div className="bg-[#F7F6EF]">
      {/* 1. COMPACT KARAVALI EDITION & LOCALITY PILL BAR (News-First Above the Fold) */}
      <div className="border-b border-[#202820]/10 bg-white/80">
        <div className="mx-auto max-w-[1440px] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#202820]">
              KARAVALI EDITION • MANGALURU · UDUPI · MANIPAL · PETHRI
            </span>
            {leadStory?.isBreaking && (
              <Link
                href={`/article/${leadStory.id}`}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-[#B7F36B] border border-[#202820]/20 px-3 py-0.5 text-[11px] font-extrabold text-[#202820]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#202820] animate-ping" />
                {dict.sections.breakingNews}: {getTitle(leadStory).slice(0, 52)}
                ...
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => setActiveLocalityId("all")}
              className={cn(
                "shrink-0 px-3 py-1 text-xs font-bold rounded-full transition-colors",
                activeLocalityId === "all"
                  ? "bg-[#202820] text-[#B7F36B]"
                  : "bg-[#DCEBCB]/60 text-[#202820] hover:bg-[#DCEBCB]"
              )}
            >
              {dict.allRegion}
            </button>
            {localities.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setActiveLocalityId(loc.id)}
                className={cn(
                  "shrink-0 px-3 py-1 text-xs font-semibold rounded-full transition-colors",
                  activeLocalityId === loc.id
                    ? "bg-[#B7F36B] text-[#202820] border border-[#202820]/25"
                    : "text-[#525F52] hover:bg-[#DCEBCB]/50 hover:text-[#202820]"
                )}
              >
                {language === "kn" && loc.nameKn ? loc.nameKn : loc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Strip */}
        <div className="border-t border-[#202820]/5 bg-[#F7F6EF]/70">
          <div className="mx-auto max-w-[1440px] px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "shrink-0 px-3 py-1 text-xs font-bold rounded-full",
                selectedCategory === "all"
                  ? "bg-[#202820] text-[#B7F36B]"
                  : "text-[#525F52] hover:bg-white"
              )}
            >
              Top Stories
            </button>
            {(Object.keys(CATEGORY_META) as PostCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 px-3 py-1 text-xs font-semibold rounded-full",
                  selectedCategory === cat
                    ? "bg-[#DCEBCB] text-[#202820] border border-[#202820]/20"
                    : "text-[#525F52] hover:bg-white"
                )}
              >
                {language === "kn"
                  ? CATEGORY_META[cat].labelKn
                  : CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. PETHRI MOMENTS & QUICK CAPTURE STRIP (Content-First on Mobile & Desktop) */}
      <section
        aria-label="Pethri Stories and Moments"
        className="border-b border-[#202820]/10 bg-white/60"
      >
        <div className="mx-auto max-w-[1440px] px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <Link
            href="/report?mode=moment"
            className="shrink-0 flex items-center gap-2.5 rounded-2xl border border-dashed border-[#202820]/30 bg-[#DCEBCB]/70 px-3.5 py-2 hover:bg-[#B7F36B] transition-colors"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#202820] text-[#B7F36B]">
              <Camera className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#202820]">
                {dict.drawer.shareMoment}
              </p>
              <p className="text-[10px] text-[#525F52]">Photo / Short</p>
            </div>
          </Link>

          <Link
            href="/live?start=true"
            className="shrink-0 flex items-center gap-2.5 rounded-2xl border border-[#202820]/15 bg-[#202820] px-3.5 py-2 text-[#B7F36B] hover:opacity-90 transition-opacity"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B7F36B] text-[#202820]">
              <Radio className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold">{dict.drawer.goLive}</p>
              <p className="text-[10px] text-[#C9E8D5]">
                {liveStreams.length} live now
              </p>
            </div>
          </Link>

          {moments.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMomentIndex(idx)}
              className="group shrink-0 flex items-center gap-2.5 rounded-2xl border border-[#202820]/10 bg-white p-1.5 pr-3.5 hover:border-[#202820] transition-colors text-left"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-2 ring-[#B7F36B]">
                <img
                  src={m.media[0]?.url ?? "/images/photos/church-feast.jpg"}
                  alt={getTitle(m)}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 rounded bg-[#202820]/85 p-0.5 text-[#B7F36B]">
                  <Play className="h-2.5 w-2.5 fill-current" />
                </span>
              </div>
              <div className="max-w-36">
                <p className="text-[10px] font-bold uppercase text-[#525F52]">
                  {m.localityName}
                </p>
                <p className="text-xs font-bold text-[#202820] line-clamp-1 group-hover:underline">
                  {getTitle(m)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. ASYMMETRIC LUXE STAGE: GSAP PARALLAX LEAD STORY + PETHRI LIVE + KARAVALI WIRE */}
      <section className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Lead Photojournalism Feature (7 cols) */}
          <div className="lg:col-span-7">
            {leadStory ? (
              <article className="overflow-hidden rounded-3xl border border-[#202820]/15 bg-white">
                <Link
                  href={`/article/${leadStory.id}`}
                  className="block group"
                >
                  <GsapImageMask
                    src={
                      leadStory.media[0]?.url ??
                      "/images/photos/pethri-town.jpg"
                    }
                    alt={getTitle(leadStory)}
                    className="h-[280px] sm:h-[400px] w-full"
                  >
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                      {leadStory.isBreaking && (
                        <span className="rounded-full bg-[#B7F36B] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#202820]">
                          {dict.sections.breakingNews}
                        </span>
                      )}
                      <span className="rounded-full bg-[#202820]/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F7F6EF]">
                        {dict.sections.newsroomDispatch}
                      </span>
                    </div>
                  </GsapImageMask>
                </Link>

                <div className="p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#525F52]">
                      <MapPin className="h-3.5 w-3.5 text-[#202820]" />
                      {leadStory.localityName} •{" "}
                      {language === "kn"
                        ? CATEGORY_META[leadStory.category].labelKn
                        : CATEGORY_META[leadStory.category].label}
                    </span>
                    <VerificationBadge
                      tier={leadStory.verificationTier}
                      compact
                    />
                  </div>

                  <Link href={`/article/${leadStory.id}`} className="group block">
                    <h1 className="mt-3 font-editorial text-3xl sm:text-[44px] leading-[1.08] text-[#202820] group-hover:underline">
                      {getTitle(leadStory)}
                    </h1>
                  </Link>

                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#525F52]">
                    {getBody(leadStory)}
                  </p>

                  {leadStory.corrections.length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#C9E8D5]/55 px-3 py-1.5 text-xs font-semibold text-[#202820]">
                      <FileEdit className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Correction:{" "}
                        {leadStory.corrections[0].summary.slice(0, 74)}...
                      </span>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#202820]/10 pt-4 text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={leadStory.author.avatarUrl}
                        alt={leadStory.author.fullName}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <span className="font-bold text-[#202820]">
                        {leadStory.author.fullName}
                      </span>
                      <span className="text-[#525F52]">
                        • <RelativeTime iso={leadStory.createdAt} />
                      </span>
                    </div>
                    <Link
                      href={`/article/${leadStory.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-[#DCEBCB] px-4 py-1.5 font-extrabold text-[#202820] hover:bg-[#B7F36B] transition-colors"
                    >
                      {dict.sections.readFullReport}{" "}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              <div className="rounded-3xl border border-[#202820]/15 bg-white p-8 text-center text-sm text-[#525F52]">
                No stories match this filter yet.
              </div>
            )}
          </div>

          {/* Right Stage (5 cols): Pethri Live Stream + Karavali Wire */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pethri Live Broadcast Card */}
            <EditorialReveal delay={0.05}>
              <div className="overflow-hidden rounded-3xl border border-[#202820]/15 bg-[#202820] text-[#F7F6EF]">
                <div className="relative h-48 bg-black">
                  <img
                    src={primaryLive.posterUrl}
                    alt={primaryLive.title}
                    className="h-full w-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#202820] via-transparent to-black/35" />
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B7F36B] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#202820]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#202820] animate-ping" />
                      {dict.sections.liveNow}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 font-mono text-[10px]">
                      <Eye className="h-3 w-3 text-[#B7F36B]" />
                      {primaryLive.viewerCount}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C9E8D5]">
                    {primaryLive.channelName} • {primaryLive.localityName}
                  </p>
                  <h2 className="mt-1.5 font-editorial text-2xl leading-snug text-[#F7F6EF]">
                    {primaryLive.title}
                  </h2>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-[#C9E8D5]">
                      Host: {primaryLive.hostName}
                    </span>
                    <Link
                      href="/live"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#B7F36B] px-4 py-1.5 text-xs font-extrabold text-[#202820] hover:bg-[#DCEBCB] transition-colors"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      {dict.sections.watchLive}
                    </Link>
                  </div>
                </div>
              </div>
            </EditorialReveal>

            {/* Karavali Chronological Wire */}
            <EditorialReveal delay={0.1}>
              <div className="rounded-3xl border border-[#202820]/12 bg-white p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#202820]/10">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#202820]">
                    <Flame className="h-4 w-4 text-[#202820]" />
                    {dict.sections.latestWire}
                  </span>
                  <Link
                    href="/feed"
                    className="text-xs font-bold text-[#202820] underline"
                  >
                    {dict.sections.openFeed} →
                  </Link>
                </div>
                <div className="divide-y divide-[#202820]/10">
                  {latestWire.map((item) => (
                    <Link
                      key={item.id}
                      href={`/article/${item.id}`}
                      className="block py-3.5 first:pt-3.5 last:pb-0 group"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1.5 text-[#525F52]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#B7F36B] ring-1 ring-[#202820]/40" />
                          {item.localityName} •{" "}
                          {item.sourceKind === "newsroom"
                            ? "Newsroom"
                            : "Community"}
                        </span>
                        <span className="font-mono text-[#525F52]">
                          <RelativeTime iso={item.createdAt} />
                        </span>
                      </div>
                      <h3 className="mt-1 font-editorial text-xl leading-snug text-[#202820] group-hover:underline">
                        {getTitle(item)}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            </EditorialReveal>
          </div>
        </div>
      </section>

      {/* 4. TIARA-INSPIRED DEEP FOREST × NEON LIME SPOTLIGHT BAND */}
      <section className="bg-[#202820] text-[#F7F6EF] bg-forest-grid py-12 border-y border-[#202820]">
        <div className="mx-auto max-w-[1440px] px-4">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-white/15">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#B7F36B]">
                MANGALURU · UDUPI · MANIPAL · KUNDAPURA · PETHRI
              </p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold">
                {dict.sections.trendingKaravali}
              </h2>
            </div>
            <Link
              href="/moments"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#B7F36B] px-4 py-2 text-xs font-extrabold text-[#202820] hover:bg-[#DCEBCB]"
            >
              Channels &amp; Shorts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <StaggerGroup className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trendingStories.map((story, idx) => (
              <StaggerItem key={story.id}>
                <Link
                  href={`/article/${story.id}`}
                  className="group block border-t border-white/15 pt-4 hover:border-[#B7F36B] transition-colors"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-3xl font-extrabold text-white/25 group-hover:text-[#B7F36B] transition-colors">
                      0{idx + 1}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C9E8D5]">
                      {story.localityName}
                    </span>
                  </div>
                  <div className="mt-3 h-40 overflow-hidden rounded-2xl bg-black">
                    <img
                      src={
                        story.media[0]?.url ?? "/images/photos/pethri-town.jpg"
                      }
                      alt={getTitle(story)}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 font-editorial text-xl leading-snug text-[#F7F6EF] group-hover:text-[#B7F36B]">
                    {getTitle(story)}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-[#C9E8D5]/75">
                    {story.likesCount} likes • {story.sharesCount} shares
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* 5. SEPARATED VERIFIED NEWSROOM vs CITIZEN COMMUNITY + EVENTS + SPONSORED */}
      <section className="mx-auto max-w-[1440px] px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left 8 Cols */}
          <div className="lg:col-span-8 space-y-10">
            {secondaryNewsroom.length > 0 && (
              <EditorialReveal>
                <div className="flex items-center justify-between border-b border-[#202820]/15 pb-3 mb-5">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#525F52]">
                      EDITORIALLY VERIFIED JOURNALISM
                    </span>
                    <h2 className="font-display text-xl font-extrabold text-[#202820]">
                      {dict.sections.newsroomDispatch}
                    </h2>
                  </div>
                  <Link
                    href="/feed?sourceKind=newsroom"
                    className="text-xs font-bold text-[#202820] underline"
                  >
                    All Newsroom →
                  </Link>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {secondaryNewsroom.map((story) => (
                    <Link
                      key={story.id}
                      href={`/article/${story.id}`}
                      className="group block rounded-2xl border border-[#202820]/12 bg-white p-4 hover:border-[#202820] transition-all"
                    >
                      <div className="h-48 overflow-hidden rounded-xl bg-[#202820]">
                        <img
                          src={
                            story.media[0]?.url ??
                            "/images/photos/paddy-harvest.jpg"
                          }
                          alt={getTitle(story)}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase text-[#525F52]">
                          {story.localityName} •{" "}
                          {CATEGORY_META[story.category].short}
                        </span>
                        <VerificationBadge
                          tier={story.verificationTier}
                          compact
                        />
                      </div>
                      <h3 className="mt-2 font-editorial text-2xl leading-snug text-[#202820] group-hover:underline">
                        {getTitle(story)}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#525F52] line-clamp-2">
                        {getBody(story)}
                      </p>
                    </Link>
                  ))}
                </div>
              </EditorialReveal>
            )}

            {/* Clearly Separated Citizen Community Contributions */}
            <EditorialReveal>
              <div className="flex items-center justify-between border-b border-[#202820]/15 pb-3 mb-5">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#525F52]">
                    RESIDENT POSTS • SEPARATE FROM NEWSROOM
                  </span>
                  <h2 className="font-display text-xl font-extrabold text-[#202820]">
                    {dict.sections.citizenDesk}
                  </h2>
                </div>
                <Link
                  href="/report"
                  className="rounded-full bg-[#202820] px-4 py-1.5 text-xs font-bold text-[#B7F36B] hover:opacity-90"
                >
                  + {dict.actions.reportNews}
                </Link>
              </div>

              <div className="space-y-3">
                {citizenPosts.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/article/${item.id}`}
                    className="group flex flex-col sm:flex-row gap-4 rounded-2xl border border-[#202820]/10 bg-white p-4 hover:border-[#202820] transition-colors"
                  >
                    <img
                      src={
                        item.media[0]?.url ?? "/images/photos/civic-road.jpg"
                      }
                      alt={getTitle(item)}
                      className="h-40 sm:h-24 sm:w-36 shrink-0 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase text-[#525F52]">
                            {item.localityName} •{" "}
                            {CATEGORY_META[item.category].short}
                          </span>
                          <VerificationBadge
                            tier={item.verificationTier}
                            compact
                          />
                        </div>
                        <h3 className="mt-1 font-editorial text-xl leading-snug text-[#202820] group-hover:underline">
                          {getTitle(item)}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#525F52]">
                        {item.author.fullName} •{" "}
                        <RelativeTime iso={item.createdAt} />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </EditorialReveal>
          </div>

          {/* Right 4 Cols */}
          <aside className="lg:col-span-4 space-y-6">
            <EditorialReveal>
              <div className="rounded-3xl border border-[#202820]/12 bg-[#DCEBCB]/55 p-6">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#202820]">
                  <Compass className="h-4 w-4" />
                  <span>Karavali Discovery</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#525F52]">
                  Explore hyperlocal streams across Mangaluru, Udupi, Manipal,
                  Kundapura, Pethri, Brahmavar &amp; Barkur.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {localities.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setActiveLocalityId(l.id)}
                      className={cn(
                        "px-3 py-1 text-[11px] font-bold rounded-full border transition-colors",
                        activeLocalityId === l.id
                          ? "border-[#202820] bg-[#202820] text-[#B7F36B]"
                          : "border-[#202820]/15 bg-white text-[#202820] hover:bg-[#B7F36B]"
                      )}
                    >
                      {language === "kn" && l.nameKn ? l.nameKn : l.name}
                    </button>
                  ))}
                </div>
                <Link
                  href="/explore"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#202820] underline"
                >
                  Open Interactive Map <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </EditorialReveal>

            <EditorialReveal delay={0.05}>
              <div className="rounded-3xl border border-[#202820]/12 bg-white p-6">
                <div className="flex items-center justify-between border-b border-[#202820]/10 pb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#202820]">
                    <Calendar className="h-4 w-4" />
                    {dict.sections.upcomingEvents}
                  </span>
                  <Link
                    href="/directory"
                    className="text-[11px] font-bold text-[#202820] underline"
                  >
                    All →
                  </Link>
                </div>
                <div className="mt-3 space-y-3">
                  {events.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className="border-b border-[#202820]/10 pb-3 last:border-b-0 last:pb-0"
                    >
                      <p className="text-[10px] font-bold uppercase text-[#525F52]">
                        {evt.localityName} • {evt.venue}
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-[#202820]">
                        {evt.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#525F52]">
                          <Users className="h-3 w-3" />
                          {evt.rsvpCount} going
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEventRsvp(evt.id)}
                          className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-bold transition-colors",
                            evt.rsvpedByMe
                              ? "bg-[#202820] text-[#B7F36B]"
                              : "border border-[#202820]/25 text-[#202820] hover:bg-[#DCEBCB]"
                          )}
                        >
                          {evt.rsvpedByMe
                            ? dict.actions.going
                            : dict.actions.interested}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </EditorialReveal>

            {sponsoredPosts[0] && (
              <div className="rounded-3xl border border-amber-300 bg-amber-50/60 p-5">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                  <span className="inline-flex items-center gap-1">
                    <Megaphone className="h-3.5 w-3.5" />
                    {dict.sections.sponsoredPartner}
                  </span>
                  <span>Paid Notice</span>
                </div>
                <Link
                  href={`/article/${sponsoredPosts[0].id}`}
                  className="mt-2 block font-editorial text-xl text-[#202820] hover:underline"
                >
                  {sponsoredPosts[0].headline}
                </Link>
                <p className="mt-1 text-xs text-[#525F52] line-clamp-2">
                  {sponsoredPosts[0].body}
                </p>
                <p className="mt-2 text-[10px] font-bold text-amber-900">
                  Advertiser: {sponsoredPosts[0].sponsorInfo?.advertiserName}
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-[#202820]/12 bg-[#C9E8D5]/45 p-5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#202820]">
                <ShieldCheck className="h-4 w-4" />
                <span>Karavali Civic Advisories</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {DEMO_ANNOUNCEMENTS.slice(0, 2).map((ann) => (
                  <div
                    key={ann.id}
                    className="border-l-2 border-[#202820] pl-2.5 text-xs"
                  >
                    <p className="font-bold text-[#202820]">{ann.title}</p>
                    <p className="text-[11px] text-[#525F52]">
                      {ann.issuer} • {ann.localityName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {momentIndex !== null && moments.length > 0 && (
        <MomentLightbox
          moments={moments}
          initialIndex={momentIndex}
          onClose={() => setMomentIndex(null)}
          onLike={handleMomentLike}
        />
      )}
    </div>
  );
}
