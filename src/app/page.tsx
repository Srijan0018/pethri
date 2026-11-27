"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Compass,
  Eye,
  FileEdit,
  FileText,
  Flame,
  MapPin,
  Megaphone,
  Play,
  ShieldCheck,
  Users,
} from "lucide-react";
import { MomentLightbox } from "@/components/MomentLightbox";
import {
  AnimatedLiveIndicator,
  AnimatedNavPill,
  EditorialReveal,
  GsapImageMask,
  HorizontalCarousel,
  MaskedHeadlineReveal,
  ScrollParallaxLayer,
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

export default function PethriPulseHomePage() {
  const {
    localities,
    activeLocalityId,
    setActiveLocalityId,
    requireAuth,
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
  const reviewedCommunityPosts = useMemo(
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
  const highlights = useMemo(() => posts.filter((p) => p.isMoment), [posts]);
  const officialLive =
    liveStreams.find((s) => s.streamSourceKind === "official_newsroom") ??
    liveStreams[0] ??
    DEMO_LIVE_STREAMS[0];

  const getTitle = (p: PostItem) =>
    language === "kn" && p.headlineKn ? p.headlineKn : p.headline;
  const getBody = (p: PostItem) =>
    language === "kn" && p.bodyKn ? p.bodyKn : p.body;

  const handleMomentLike = async (postId: string) => {
    if (!requireAuth("react to visual highlights")) return;
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
    if (!requireAuth("RSVP to Karavali events")) return;
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
    <div className="bg-[#F8F7F4]">
      {/* 1. PETHRI PULSE EDITION BAR & LOCALITY FILTER */}
      <div className="border-b border-[#E5E3DC] bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
              PETHRI PULSE • KARAVALI EDITION
            </span>
            {leadStory?.isBreaking && (
              <Link
                href={`/article/${leadStory.id}`}
                className="hidden xl:inline-flex items-center gap-2 rounded-full bg-[#F8F7F4] border border-[#D94E34]/30 px-3 py-0.5 text-[11px] font-bold text-[#181917] hover:border-[#398BFF] transition-colors"
              >
                <AnimatedLiveIndicator label={dict.sections.breakingNews} />
                <span>{getTitle(leadStory).slice(0, 52)}...</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => setActiveLocalityId("all")}
              className={cn(
                "relative z-0 shrink-0 px-3 py-1 text-xs font-bold rounded-full border transition-colors",
                activeLocalityId === "all"
                  ? "text-white border-[#1B5E43]"
                  : "bg-[#F8F7F4] text-[#181917] border-[#E5E3DC] hover:bg-[#EAF2EE]"
              )}
            >
              {activeLocalityId === "all" && (
                <AnimatedNavPill layoutId="home-locality-pill" />
              )}
              {dict.allRegion}
            </button>
            {localities.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setActiveLocalityId(loc.id)}
                className={cn(
                  "relative z-0 shrink-0 px-3 py-1 text-xs font-semibold rounded-full border transition-colors",
                  activeLocalityId === loc.id
                    ? "text-white border-[#398BFF] electric-glow"
                    : "bg-white text-[#5A605C] border-transparent hover:bg-[#EAF2EE] hover:text-[#1B5E43]"
                )}
              >
                {activeLocalityId === loc.id && (
                  <AnimatedNavPill
                    layoutId="home-locality-pill"
                    className="bg-[#398BFF]"
                  />
                )}
                {language === "kn" && loc.nameKn ? loc.nameKn : loc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Beat Category Pills */}
        <div className="border-t border-[#E5E3DC] bg-[#F8F7F4]">
          <div className="mx-auto max-w-[1440px] px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "relative z-0 shrink-0 px-3 py-1 text-xs font-bold rounded-full transition-colors",
                selectedCategory === "all"
                  ? "text-white"
                  : "text-[#5A605C] hover:bg-white hover:text-[#181917]"
              )}
            >
              {selectedCategory === "all" && (
                <AnimatedNavPill layoutId="home-category-pill" />
              )}
              Pethri Pulse
            </button>
            {(Object.keys(CATEGORY_META) as PostCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "relative z-0 shrink-0 px-3 py-1 text-xs font-semibold rounded-full border transition-colors",
                  selectedCategory === cat
                    ? "text-[#1B5E43] border-[#1B5E43]/30"
                    : "border-transparent text-[#5A605C] hover:bg-white hover:text-[#181917]"
                )}
              >
                {selectedCategory === cat && (
                  <AnimatedNavPill
                    layoutId="home-category-pill"
                    className="bg-[#EAF2EE]"
                  />
                )}
                {language === "kn"
                  ? CATEGORY_META[cat].labelKn
                  : CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CINEMATIC HERO STAGE */}
      <section className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Lead Verified Story (7 cols) */}
          <div className="lg:col-span-7">
            {leadStory ? (
              <article className="overflow-hidden rounded-3xl border border-[#E5E3DC] bg-white shadow-xs transition-all hover:border-[#398BFF]/40 hover:shadow-md">
                <Link href={`/article/${leadStory.id}`} className="block group">
                  <GsapImageMask
                    immediate
                    src={
                      leadStory.media[0]?.url ??
                      "/images/photos/pethri-town.jpg"
                    }
                    alt={getTitle(leadStory)}
                    className="h-[280px] sm:h-[400px] w-full"
                  >
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                      {leadStory.isBreaking && (
                        <AnimatedLiveIndicator
                          label={dict.sections.breakingNews}
                          showWaveform
                        />
                      )}
                      <span className="rounded-full bg-[#1B5E43]/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        Verified Newsroom
                      </span>
                    </div>
                  </GsapImageMask>
                </Link>

                <div className="p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1B5E43]">
                      <MapPin className="h-3.5 w-3.5" />
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
                    <MaskedHeadlineReveal delay={0.08}>
                      <h1 className="mt-3 font-editorial text-3xl sm:text-[44px] leading-[1.08] text-[#181917] group-hover:text-[#1B5E43] transition-colors">
                        {getTitle(leadStory)}
                      </h1>
                    </MaskedHeadlineReveal>
                  </Link>

                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5A605C]">
                    {getBody(leadStory)}
                  </p>

                  {leadStory.corrections.length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2EE] border border-[#E5E3DC] px-3 py-1.5 text-xs font-semibold text-[#1B5E43]">
                      <FileEdit className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Correction:{" "}
                        {leadStory.corrections[0].summary.slice(0, 74)}...
                      </span>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E3DC] pt-4 text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={leadStory.author.avatarUrl}
                        alt={leadStory.author.fullName}
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-[#E5E3DC]"
                      />
                      <span className="font-bold text-[#181917]">
                        {leadStory.author.fullName}
                      </span>
                      <span className="text-[#5A605C]">
                        • <RelativeTime iso={leadStory.createdAt} />
                      </span>
                    </div>
                    <Link
                      href={`/article/${leadStory.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-[#EAF2EE] px-4 py-1.5 font-extrabold text-[#1B5E43] hover:bg-[#398BFF] hover:text-white transition-all"
                    >
                      {dict.sections.readFullReport}{" "}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              <div className="rounded-3xl border border-[#E5E3DC] bg-white p-8 text-center text-sm text-[#5A605C]">
                No verified articles match this filter yet.
              </div>
            )}
          </div>

          {/* Right Stage (5 cols): Official Live Broadcast + Nearby Developments Wire */}
          <div className="lg:col-span-5 space-y-6">
            <EditorialReveal delay={0.06}>
              <div className="overflow-hidden rounded-3xl border border-[#E5E3DC] bg-[#1B5E43] text-white shadow-sm">
                <div className="relative h-48 bg-[#181917]">
                  <img
                    src={officialLive.posterUrl}
                    alt={officialLive.title}
                    className="h-full w-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B5E43] via-transparent to-black/35" />
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <AnimatedLiveIndicator label="OFFICIAL LIVE" showWaveform />
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#181917]/75 px-2.5 py-0.5 font-mono text-[10px] text-white">
                      <Eye className="h-3 w-3 text-[#398BFF]" />
                      {officialLive.viewerCount}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#EAF2EE]/80">
                    {officialLive.channelName} • {officialLive.localityName}
                  </p>
                  <h2 className="mt-1.5 font-editorial text-2xl leading-snug text-white">
                    {officialLive.title}
                  </h2>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-[#EAF2EE]/85">
                      Host: {officialLive.hostName}
                    </span>
                    <Link
                      href="/live"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#398BFF] px-4 py-1.5 text-xs font-extrabold text-white electric-glow hover:bg-white hover:text-[#1B5E43] transition-colors"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      {dict.sections.watchLive}
                    </Link>
                  </div>
                </div>
              </div>
            </EditorialReveal>

            <EditorialReveal delay={0.1}>
              <div className="rounded-3xl border border-[#E5E3DC] bg-white p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC]">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#1B5E43]">
                    <Flame className="h-4 w-4" />
                    Nearby Developments
                  </span>
                  <Link
                    href="/feed"
                    className="text-xs font-bold text-[#398BFF] hover:underline"
                  >
                    {dict.sections.openFeed} →
                  </Link>
                </div>
                <div className="divide-y divide-[#E5E3DC]">
                  {latestWire.map((item) => (
                    <Link
                      key={item.id}
                      href={`/article/${item.id}`}
                      className="block py-3.5 first:pt-3.5 last:pb-0 group"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1.5 text-[#5A605C]">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              item.isBreaking ? "bg-[#D94E34]" : "bg-[#398BFF]"
                            )}
                          />
                          {item.localityName} •{" "}
                          {item.sourceKind === "newsroom"
                            ? "Editorial"
                            : "Reviewed Tip"}
                        </span>
                        <span className="font-mono text-[#5A605C]">
                          <RelativeTime iso={item.createdAt} />
                        </span>
                      </div>
                      <h3 className="mt-1 font-editorial text-xl leading-snug text-[#181917] group-hover:text-[#1B5E43] transition-colors">
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

      {/* 3. HORIZONTAL VISUAL HIGHLIGHTS CAROUSEL */}
      <section className="border-y border-[#E5E3DC] bg-[#EAF2EE]/60 py-8">
        <div className="mx-auto max-w-[1440px] px-4">
          <HorizontalCarousel
            subtitle="CURATED KARAVALI STORIES"
            title="Visual Highlights & Video Dispatches"
            rightSlot={
              <Link
                href="/moments"
                className="text-xs font-extrabold text-[#398BFF] hover:underline mr-2"
              >
                Open Story Viewer →
              </Link>
            }
          >
            {highlights.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMomentIndex(idx)}
                className="group relative shrink-0 w-56 sm:w-64 h-72 overflow-hidden rounded-2xl border border-[#E5E3DC] bg-[#181917] text-left transition-all hover:border-[#398BFF] hover:shadow-lg"
              >
                <img
                  src={m.media[0]?.url ?? "/images/photos/church-feast.jpg"}
                  alt={getTitle(m)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181917] via-[#181917]/25 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-[#1B5E43]">
                    {m.localityName}
                  </span>
                </div>
                <div className="absolute bottom-3.5 left-3.5 right-3.5">
                  <p className="font-editorial text-lg leading-snug text-white line-clamp-2 group-hover:text-[#EAF2EE]">
                    {getTitle(m)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-white/80">
                    {m.author.fullName}
                  </p>
                </div>
              </button>
            ))}
          </HorizontalCarousel>
        </div>
      </section>

      {/* 4. RECOMMENDED & TRENDING ACROSS KARAVALI */}
      <section className="overflow-hidden bg-[#1B5E43] text-white bg-forest-grid py-12 border-b border-[#E5E3DC]">
        <div className="mx-auto max-w-[1440px] px-4">
          <ScrollParallaxLayer speed={14}>
            <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-white/15">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#EAF2EE]/80">
                  RECOMMENDED ACROSS MANGALURU · UDUPI · MANIPAL · PETHRI
                </p>
                <MaskedHeadlineReveal triggerOnScroll>
                  <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold">
                    {dict.sections.trendingKaravali}
                  </h2>
                </MaskedHeadlineReveal>
              </div>
              <Link
                href="/live"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#1B5E43] hover:bg-[#398BFF] hover:text-white transition-colors"
              >
                Official Broadcasts <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollParallaxLayer>

          <StaggerGroup className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trendingStories.map((story, idx) => (
              <StaggerItem key={story.id}>
                <Link
                  href={`/article/${story.id}`}
                  className="group block border-t border-white/15 pt-4 hover:border-[#398BFF] transition-colors"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-3xl font-extrabold text-white/30 group-hover:text-[#398BFF] transition-colors">
                      0{idx + 1}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#EAF2EE]">
                      {story.localityName}
                    </span>
                  </div>
                  <div className="mt-3 h-40 overflow-hidden rounded-2xl bg-[#181917]">
                    <img
                      src={
                        story.media[0]?.url ?? "/images/photos/pethri-town.jpg"
                      }
                      alt={getTitle(story)}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 font-editorial text-xl leading-snug text-white group-hover:text-[#EAF2EE]">
                    {getTitle(story)}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-[#EAF2EE]/75">
                    {story.likesCount} reactions • {story.commentsCount} comments
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* 5. SEPARATED EDITORIAL REPORTING vs REVIEWED COMMUNITY HIGHLIGHTS + EVENTS */}
      <section className="mx-auto max-w-[1440px] px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8 space-y-10">
            {secondaryNewsroom.length > 0 && (
              <EditorialReveal>
                <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-3 mb-5">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
                      AUTHORISED NEWSROOM REPORTING
                    </span>
                    <h2 className="font-display text-xl font-extrabold text-[#181917]">
                      {dict.sections.newsroomDispatch}
                    </h2>
                  </div>
                  <Link
                    href="/feed?sourceKind=newsroom"
                    className="text-xs font-bold text-[#398BFF] hover:underline"
                  >
                    All News →
                  </Link>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {secondaryNewsroom.map((story) => (
                    <Link
                      key={story.id}
                      href={`/article/${story.id}`}
                      className="group block rounded-2xl border border-[#E5E3DC] bg-white p-4 hover:border-[#398BFF]/55 hover:shadow-md transition-all"
                    >
                      <div className="h-48 overflow-hidden rounded-xl bg-[#181917]">
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
                        <span className="text-[11px] font-bold uppercase text-[#1B5E43]">
                          {story.localityName} •{" "}
                          {CATEGORY_META[story.category].short}
                        </span>
                        <VerificationBadge
                          tier={story.verificationTier}
                          compact
                        />
                      </div>
                      <h3 className="mt-2 font-editorial text-2xl leading-snug text-[#181917] group-hover:text-[#1B5E43] transition-colors">
                        {getTitle(story)}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#5A605C] line-clamp-2">
                        {getBody(story)}
                      </p>
                    </Link>
                  ))}
                </div>
              </EditorialReveal>
            )}

            <EditorialReveal>
              <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-3 mb-5">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
                    EDITORIALLY APPROVED CONTRIBUTIONS • CLEARLY SEPARATED
                  </span>
                  <h2 className="font-display text-xl font-extrabold text-[#181917]">
                    Reviewed Community Reports
                  </h2>
                </div>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EE] border border-[#E5E3DC] px-4 py-1.5 text-xs font-extrabold text-[#1B5E43] hover:bg-[#398BFF] hover:text-white hover:border-[#398BFF] transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Submit Private Tip
                </Link>
              </div>

              <div className="space-y-3">
                {reviewedCommunityPosts.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/article/${item.id}`}
                    className="group flex flex-col sm:flex-row gap-4 rounded-2xl border border-[#E5E3DC] bg-white p-4 hover:border-[#398BFF]/55 hover:shadow-xs transition-all"
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
                          <span className="text-[10px] font-bold uppercase text-[#1B5E43]">
                            {item.localityName} •{" "}
                            {CATEGORY_META[item.category].short}
                          </span>
                          <VerificationBadge
                            tier={item.verificationTier}
                            compact
                          />
                        </div>
                        <h3 className="mt-1 font-editorial text-xl leading-snug text-[#181917] group-hover:text-[#1B5E43] transition-colors">
                          {getTitle(item)}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#5A605C]">
                        Source: {item.author.fullName} •{" "}
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
              <div className="rounded-3xl border border-[#E5E3DC] bg-[#EAF2EE] p-6">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1B5E43]">
                  <Compass className="h-4 w-4" />
                  <span>Karavali Discovery</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#5A605C]">
                  Explore verified reporting across Mangaluru, Udupi, Manipal,
                  Kundapura, Pethri, Brahmavar &amp; Barkur.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {localities.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setActiveLocalityId(l.id)}
                      className={cn(
                        "px-3 py-1 text-[11px] font-bold rounded-full border transition-all",
                        activeLocalityId === l.id
                          ? "border-[#398BFF] bg-[#398BFF] text-white"
                          : "border-[#E5E3DC] bg-white text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF]"
                      )}
                    >
                      {language === "kn" && l.nameKn ? l.nameKn : l.name}
                    </button>
                  ))}
                </div>
                <Link
                  href="/explore"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#398BFF] hover:underline"
                >
                  Open Interactive Map <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </EditorialReveal>

            <EditorialReveal delay={0.05}>
              <div className="rounded-3xl border border-[#E5E3DC] bg-white p-6">
                <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1B5E43]">
                    <Calendar className="h-4 w-4" />
                    {dict.sections.upcomingEvents}
                  </span>
                  <Link
                    href="/directory"
                    className="text-[11px] font-bold text-[#398BFF] hover:underline"
                  >
                    All →
                  </Link>
                </div>
                <div className="mt-3 space-y-3">
                  {events.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className="border-b border-[#E5E3DC] pb-3 last:border-b-0 last:pb-0"
                    >
                      <p className="text-[10px] font-bold uppercase text-[#5A605C]">
                        {evt.localityName} • {evt.venue}
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-[#181917]">
                        {evt.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#5A605C]">
                          <Users className="h-3 w-3" />
                          {evt.rsvpCount} going
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEventRsvp(evt.id)}
                          className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-bold transition-colors border",
                            evt.rsvpedByMe
                              ? "bg-[#398BFF] border-[#398BFF] text-white"
                              : "border-[#E5E3DC] bg-white text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF]"
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
              <div className="rounded-3xl border border-[#E5E3DC] bg-white p-5">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#1B5E43]">
                  <span className="inline-flex items-center gap-1">
                    <Megaphone className="h-3.5 w-3.5" />
                    {dict.sections.sponsoredPartner}
                  </span>
                  <span className="text-[#5A605C]">Paid Notice</span>
                </div>
                <Link
                  href={`/article/${sponsoredPosts[0].id}`}
                  className="mt-2 block font-editorial text-xl text-[#181917] hover:text-[#1B5E43] transition-colors"
                >
                  {sponsoredPosts[0].headline}
                </Link>
                <p className="mt-1 text-xs text-[#5A605C] line-clamp-2">
                  {sponsoredPosts[0].body}
                </p>
                <p className="mt-2 text-[10px] font-bold text-[#1B5E43]">
                  Advertiser: {sponsoredPosts[0].sponsorInfo?.advertiserName}
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-[#E5E3DC] bg-white p-5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1B5E43]">
                <ShieldCheck className="h-4 w-4" />
                <span>Karavali Civic Advisories</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {DEMO_ANNOUNCEMENTS.slice(0, 2).map((ann) => (
                  <div
                    key={ann.id}
                    className={cn(
                      "border-l-2 pl-2.5 text-xs",
                      ann.urgency === "urgent"
                        ? "border-[#D94E34]"
                        : "border-[#1B5E43]"
                    )}
                  >
                    <p className="font-bold text-[#181917]">{ann.title}</p>
                    <p className="text-[11px] text-[#5A605C]">
                      {ann.issuer} • {ann.localityName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {momentIndex !== null && highlights.length > 0 && (
        <MomentLightbox
          moments={highlights}
          initialIndex={momentIndex}
          onClose={() => setMomentIndex(null)}
          onLike={handleMomentLike}
        />
      )}
    </div>
  );
}
