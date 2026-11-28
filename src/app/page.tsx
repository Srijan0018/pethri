"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  FileEdit,
  FileText,
  MapPin,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  AnimatedLiveIndicator,
  AnimatedNavPill,
  EditorialReveal,
  GsapImageMask,
  MaskedHeadlineReveal,
  ScrollParallaxLayer,
  StaggerGroup,
  StaggerItem,
} from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  CommunityAnnouncement,
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
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    PostCategory | "all"
  >("all");

  // Load regional advisories once on mount
  useEffect(() => {
    let active = true;
    fetch("/api/directory")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.announcements) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Load events only when locality changes
  useEffect(() => {
    let active = true;
    const eventParams = new URLSearchParams({ time: "upcoming", limit: "4" });
    if (activeLocalityId !== "all") {
      eventParams.set("locality", activeLocalityId);
    }
    fetch(`/api/events?${eventParams.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.events) {
          setEvents(data.events);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeLocalityId]);

  // Load scoped posts (capped at 18 for fast payload & render)
  useEffect(() => {
    let active = true;
    const loadPosts = async () => {
      setLoading(true);
      setLoadError(null);
      const postParams = new URLSearchParams({ limit: "18" });
      if (activeLocalityId !== "all") {
        postParams.set("locality", activeLocalityId);
      }
      if (selectedCategory !== "all") {
        postParams.set("category", selectedCategory);
      }
      try {
        const postsResponse = await fetch(`/api/posts?${postParams.toString()}`);
        const postsData = await postsResponse.json();
        if (!postsResponse.ok) {
          throw new Error(
            postsData.error ?? "Unable to load the latest local news."
          );
        }
        if (!active) return;
        setPosts(postsData.posts ?? []);
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load the latest local news."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadPosts();
    return () => {
      active = false;
    };
  }, [activeLocalityId, selectedCategory]);

  const scopedPosts = posts;

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
    .slice(0, 3);
  const latestWire = scopedPosts
    .filter((p) => p.sourceKind !== "sponsored" && p.id !== leadStory?.id)
    .slice(0, 5);
  const trendingStories = [...posts]
    .filter((p) => p.sourceKind !== "sponsored")
    .sort((a, b) => b.likesCount + b.sharesCount - (a.likesCount + a.sharesCount))
    .slice(0, 4);

  const getTitle = (p: PostItem) =>
    language === "kn" && p.headlineKn ? p.headlineKn : p.headline;
  const getBody = (p: PostItem) =>
    language === "kn" && p.bodyKn ? p.bodyKn : p.body;

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
    <div className="bg-white text-[#111318]">
      {loadError && (
        <div role="alert" className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-4">
          <p className="rounded-2xl border border-[#D94E34]/30 bg-[#FFF9F7] px-4 py-3 text-sm text-[#B63D2B]">
            {loadError}
          </p>
        </div>
      )}

      {/* 1. COMMANDING FULL-BLEED EDITORIAL COVER STAGE (Clean white canvas with breathing room) */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
        {leadStory ? (
          <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-[#111318] text-white shadow-[0_24px_70px_-38px_rgba(17,19,24,0.72)]">
            <div className="grid lg:grid-cols-12 lg:min-h-[540px]">
              {/* Left 7 cols: Full-Bleed Hero Photography */}
              <Link
                href={`/article/${leadStory.id}`}
                className="relative lg:col-span-7 block min-h-[230px] sm:min-h-[340px] lg:min-h-[540px] overflow-hidden group"
              >
                <GsapImageMask
                  immediate
                  priority
                  src={
                    leadStory.media[0]?.url ?? "/images/photos/pethri-town.jpg"
                  }
                  alt={getTitle(leadStory)}
                  sizes="(min-width: 1440px) 840px, (min-width: 1024px) 58vw, calc(100vw - 32px)"
                  className="h-full w-full min-h-[230px] sm:min-h-[340px] lg:min-h-[540px]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/20 to-black/25 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#111318]" />
                <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-10 flex flex-wrap items-center gap-2">
                  {leadStory.isBreaking && (
                    <AnimatedLiveIndicator
                      label={dict.sections.breakingNews}
                      showWaveform
                    />
                  )}
                  <span className="rounded-full bg-[#111318]/80 backdrop-blur-md border border-white/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                    {dict.sections.newsroomDispatch}
                  </span>
                </div>
              </Link>

              {/* Right 5 cols: Commanding Typography & Editorial Context */}
              <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-8 lg:p-11 bg-[#111318]">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[#C5A572]">
                      <MapPin className="h-3.5 w-3.5" />
                      {leadStory.localityName} ·{" "}
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
                    <MaskedHeadlineReveal key={leadStory.id} delay={0.06}>
                      <h1 className="mt-3 sm:mt-5 font-editorial text-2xl sm:text-4xl lg:text-[48px] leading-[1.08] tracking-tight text-white group-hover:text-[#EEF2FF] transition-colors">
                        {getTitle(leadStory)}
                      </h1>
                    </MaskedHeadlineReveal>
                  </Link>

                  <p className="mt-3 sm:mt-5 text-xs sm:text-base leading-relaxed text-white/75 line-clamp-3 sm:line-clamp-4">
                    {getBody(leadStory)}
                  </p>

                  {leadStory.corrections.length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#EEF2FF]">
                      <FileEdit className="h-3.5 w-3.5 shrink-0 text-[#C5A572]" />
                      <span>
                        Correction:{" "}
                        {leadStory.corrections[0].summary.slice(0, 74)}...
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/12 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={leadStory.author.avatarUrl}
                      alt={leadStory.author.fullName}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-white">
                        {leadStory.author.fullName}
                      </p>
                      <p className="text-white/55">
                        <RelativeTime iso={leadStory.createdAt} />
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/article/${leadStory.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-extrabold text-[#111318] transition-all hover:bg-[#315CFF] hover:text-white"
                  >
                    {dict.sections.readFullReport}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div
            className="grid lg:grid-cols-12 overflow-hidden rounded-2xl sm:rounded-[2rem] bg-[#111318] lg:min-h-[540px] animate-pulse"
            aria-label="Loading verified local reporting"
          >
            <div className="lg:col-span-7 h-[230px] sm:h-[340px] lg:h-full bg-white/10" />
            <div className="lg:col-span-5 p-6 sm:p-10 space-y-4">
              <div className="h-3 w-36 rounded bg-white/15" />
              <div className="h-10 w-full rounded bg-white/15" />
              <div className="h-10 w-4/5 rounded bg-white/15" />
              <div className="h-20 w-full rounded bg-white/10" />
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl sm:rounded-[2rem] border border-[#E2E7F0] bg-[#F8FAFC] p-10 text-center text-sm text-[#5B6472]"
            aria-live="polite"
          >
            {dict.sections.noMatchingStories}
          </div>
        )}

        {/* 2. UNIFIED SINGLE-LINE EDITION & BEAT DOCK */}
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#E2E7F0] pb-4">
          {/* Beats */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "relative z-0 shrink-0 px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors",
                selectedCategory === "all"
                  ? "text-white"
                  : "text-[#5B6472] hover:bg-[#F3F4F6] hover:text-[#111318]"
              )}
            >
              {selectedCategory === "all" && (
                <AnimatedNavPill
                  layoutId="home-category-pill"
                  className="bg-[#111318]"
                />
              )}
              {dict.sections.allBeats}
            </button>
            {(Object.keys(CATEGORY_META) as PostCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "relative z-0 shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors",
                  selectedCategory === cat
                    ? "text-white"
                    : "text-[#5B6472] hover:bg-[#F3F4F6] hover:text-[#111318]"
                )}
              >
                {selectedCategory === cat && (
                  <AnimatedNavPill
                    layoutId="home-category-pill"
                    className="bg-[#111318]"
                  />
                )}
                {language === "kn"
                  ? CATEGORY_META[cat].labelKn
                  : CATEGORY_META[cat].label}
              </button>
            ))}
          </div>

          {/* Minimal Edition Metrics */}
          <div className="flex items-center gap-5 text-xs text-[#5B6472] shrink-0">
            <Link
              href="/feed"
              className="inline-flex items-center gap-1.5 hover:text-[#173FBE] transition-colors"
            >
              <span className="font-mono font-bold text-[#111318]">
                {loading ? "—" : scopedPosts.length}
              </span>
              <span>{dict.sections.stories}</span>
            </Link>
            <span className="h-3 w-px bg-[#E2E7F0]" aria-hidden="true" />
            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 hover:text-[#173FBE] transition-colors"
            >
              <span className="font-mono font-bold text-[#111318]">
                {loading ? "—" : events.length}
              </span>
              <span>{dict.sections.events}</span>
            </Link>
            <span className="h-3 w-px bg-[#E2E7F0]" aria-hidden="true" />
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 hover:text-[#173FBE] transition-colors"
            >
              <span className="font-mono font-bold text-[#111318]">
                {localities.length || "—"}
              </span>
              <span>{dict.sections.localities}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. ASYMMETRIC EDITORIAL WIRE + CONFIDENTIAL DESK */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Left 8 cols: Numbered Architectural Wire (No heavy boxes) */}
          <div className="lg:col-span-8">
            <div className="flex items-baseline justify-between border-b border-[#111318] pb-3">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#173FBE]">
                  {dict.sections.latestWire}
                </p>
                <h2 className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-[#111318]">
                  {dict.sections.nearbyDevelopments}
                </h2>
              </div>
              <Link
                href="/feed"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#173FBE] hover:underline"
              >
                {dict.sections.openFeed} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#E2E7F0]">
              {latestWire.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/article/${item.id}`}
                  className="group grid grid-cols-12 items-baseline gap-4 py-5 transition-colors hover:bg-[#F8FAFC]/80 px-2 -mx-2 rounded-xl"
                >
                  <span className="col-span-2 sm:col-span-1 font-mono text-sm font-bold text-[#315CFF]">
                    0{index + 1}
                  </span>
                  <div className="col-span-10 sm:col-span-11">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-[#5B6472]">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            item.isBreaking ? "bg-[#D94E34]" : "bg-[#315CFF]"
                          )}
                        />
                        {item.localityName} ·{" "}
                        {item.sourceKind === "newsroom"
                          ? dict.sections.editorialLabel
                          : dict.sections.reviewedTipLabel}
                      </span>
                      <span className="font-mono font-normal">
                        <RelativeTime iso={item.createdAt} />
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-editorial text-2xl sm:text-[26px] leading-snug text-[#111318] group-hover:text-[#173FBE] transition-colors">
                      {getTitle(item)}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right 4 cols: Confidential Newsroom Monolith */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <EditorialReveal delay={0.05}>
              <div className="relative overflow-hidden rounded-3xl bg-[#111318] text-white p-7 shadow-[0_24px_60px_-36px_rgba(17,19,24,0.75)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-65"
                  style={{ backgroundImage: "url('/images/coastal/karavali-shore.jpg')" }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111318]/90 via-[#111318]/45 to-[#111318]/15"
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A572]">
                    {dict.sections.editorialIntake}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] text-[#EEF2FF]">
                    <ShieldCheck className="h-3 w-3 text-[#C5A572]" />
                    {dict.sections.encrypted}
                  </span>
                </div>

                <h2 className="mt-4 font-editorial text-3xl leading-[1.12] text-white">
                  {dict.sections.submitTipHeadline}
                </h2>

                <p className="mt-3 text-xs leading-relaxed text-white/70">
                  {dict.sections.submitTipDesc}
                </p>

                <div className="mt-6 pt-5 border-t border-white/12 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-white/55">
                    {dict.sections.accreditedStaff}
                  </span>
                  <Link
                    href="/report"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#315CFF] px-4 py-2 text-xs font-extrabold text-white transition-all hover:bg-white hover:text-[#111318]"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {dict.actions.reportNews}
                  </Link>
                </div>
                </div>
              </div>
            </EditorialReveal>
          </aside>
        </div>
      </section>

      {/* 4. NEWSROOM DISPATCHES — CLEAN 3-COLUMN MAGAZINE SPREAD */}
      {secondaryNewsroom.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 sm:py-12 border-t border-[#E2E7F0]">
          <EditorialReveal>
            <div className="flex items-end justify-between gap-4 mb-7">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#173FBE]">
                  {dict.sections.authorisedReporting}
                </p>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111318]">
                  {dict.sections.newsroomDispatch}
                </h2>
              </div>
              <Link
                href="/feed?sourceKind=newsroom"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#173FBE] hover:underline"
              >
                {dict.sections.allNews} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {secondaryNewsroom.map((story) => (
                <Link
                  key={story.id}
                  href={`/article/${story.id}`}
                  className="group block"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-[#F3F4F6]">
                    <img
                      src={
                        story.media[0]?.url ?? "/images/photos/paddy-harvest.jpg"
                      }
                      alt={getTitle(story)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#173FBE]">
                      {story.localityName} ·{" "}
                      {language === "kn"
                        ? CATEGORY_META[story.category].labelKn
                        : CATEGORY_META[story.category].short}
                    </span>
                    <VerificationBadge tier={story.verificationTier} compact />
                  </div>
                  <h3 className="mt-2 font-editorial text-2xl leading-snug text-[#111318] group-hover:text-[#173FBE] transition-colors">
                    {getTitle(story)}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5B6472] line-clamp-2">
                    {getBody(story)}
                  </p>
                </Link>
              ))}
            </div>
          </EditorialReveal>
        </section>
      )}

      {/* 5. TRENDING ACROSS KARAVALI — DARK ARCHITECTURAL BAND WITH MERGED LIGHTHOUSE COAST */}
      <section className="relative overflow-hidden bg-[#111318] bg-ink-grid py-16 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-65"
          style={{
            backgroundImage: "url('/images/coastal/kaup-lighthouse.jpg')",
            maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, transparent 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#111318]/85 via-[#111318]/30 to-[#111318]/85"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-40 h-96 w-96 rounded-full bg-[#315CFF]/15 blur-3xl"
        />
        <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6">
          <ScrollParallaxLayer speed={12}>
            <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-white/15">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A572]">
                  {dict.allRegion}
                </p>
                <MaskedHeadlineReveal triggerOnScroll>
                  <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold">
                    {dict.sections.trendingKaravali}
                  </h2>
                </MaskedHeadlineReveal>
              </div>
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#111318] transition-all hover:bg-[#315CFF] hover:text-white"
              >
                {dict.sections.allVerifiedStories} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollParallaxLayer>

          <StaggerGroup className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {trendingStories.map((story, idx) => (
              <StaggerItem key={story.id}>
                <Link
                  href={`/article/${story.id}`}
                  className="group block pt-2 transition-colors"
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="font-display text-3xl font-extrabold text-[#C5A572]/60 transition-colors group-hover:text-[#C5A572]">
                      0{idx + 1}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/65">
                      {story.localityName}
                    </span>
                  </div>
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-[#252A31]">
                    <img
                      src={
                        story.media[0]?.url ?? "/images/photos/pethri-town.jpg"
                      }
                      alt={getTitle(story)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3.5 font-editorial text-xl leading-snug text-white transition-colors group-hover:text-[#C5A572]">
                    {getTitle(story)}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-white/55">
                    {story.likesCount} {dict.sections.reactions} ·{" "}
                    {story.commentsCount} {dict.sections.comments}
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* 6. CLEAN 3-COLUMN COMMUNITY, EVENTS & CIVIC BAND */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Col 1 (5 cols): Reviewed Community Reports */}
          <div className="lg:col-span-5">
            <div className="flex items-baseline justify-between border-b border-[#E2E7F0] pb-3 mb-5">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#173FBE]">
                  {dict.sections.communityContributions}
                </p>
                <h2 className="mt-0.5 font-display text-xl font-extrabold text-[#111318]">
                  {dict.sections.reviewedReports}
                </h2>
              </div>
              <Link
                href="/feed?sourceKind=citizen"
                className="text-xs font-bold text-[#315CFF] hover:underline"
              >
                {dict.sections.viewAll} →
              </Link>
            </div>

            <div className="divide-y divide-[#E2E7F0]">
              {reviewedCommunityPosts.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/article/${item.id}`}
                  className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <img
                    src={item.media[0]?.url ?? "/images/photos/civic-road.jpg"}
                    alt={getTitle(item)}
                    loading="lazy"
                    decoding="async"
                    className="h-20 w-24 shrink-0 rounded-xl object-cover bg-[#F3F4F6]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase text-[#173FBE]">
                        {item.localityName} ·{" "}
                        {language === "kn"
                          ? CATEGORY_META[item.category].labelKn
                          : CATEGORY_META[item.category].short}
                      </span>
                      <VerificationBadge tier={item.verificationTier} compact />
                    </div>
                    <h3 className="mt-1 font-editorial text-lg leading-snug text-[#111318] group-hover:text-[#173FBE] transition-colors line-clamp-2">
                      {getTitle(item)}
                    </h3>
                    <p className="mt-1 text-[11px] text-[#5B6472]">
                      {item.author.fullName} ·{" "}
                      <RelativeTime iso={item.createdAt} />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Col 2 (4 cols): Upcoming Events */}
          <div className="lg:col-span-4">
            <div className="flex items-baseline justify-between border-b border-[#E2E7F0] pb-3 mb-5">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#173FBE]">
                  {dict.sections.coastalCalendar}
                </p>
                <h2 className="mt-0.5 font-display text-xl font-extrabold text-[#111318]">
                  {dict.sections.upcomingEvents}
                </h2>
              </div>
              <Link
                href="/directory"
                className="text-xs font-bold text-[#315CFF] hover:underline"
              >
                {dict.nav.all} →
              </Link>
            </div>

            <div className="divide-y divide-[#E2E7F0]">
              {events.slice(0, 3).map((evt) => (
                <div key={evt.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5B6472]">
                    {evt.localityName} · {evt.venue}
                  </p>
                  <p className="mt-1 font-editorial text-xl leading-snug text-[#111318]">
                    {evt.title}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-[#5B6472]">
                      <Users className="h-3.5 w-3.5" />
                      {evt.rsvpCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEventRsvp(evt.id)}
                      className={cn(
                        "rounded-full px-3.5 py-1 text-[11px] font-bold transition-colors border",
                        evt.rsvpedByMe
                          ? "bg-[#111318] border-[#111318] text-white"
                          : "border-[#E2E7F0] bg-white text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF]"
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

          {/* Col 3 (3 cols): Civic Advisories & Map Discovery */}
          <aside className="lg:col-span-3 space-y-6">
            <div>
              <div className="flex items-center gap-1.5 border-b border-[#E2E7F0] pb-3 mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#173FBE]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{dict.sections.civicAdvisories}</span>
              </div>
              <div className="space-y-4">
                {announcements.slice(0, 2).map((ann) => (
                  <div
                    key={ann.id}
                    className={cn(
                      "border-l-2 pl-3 text-xs",
                      ann.urgency === "urgent"
                        ? "border-[#D94E34]"
                        : "border-[#173FBE]"
                    )}
                  >
                    <p className="font-bold text-[#111318] leading-snug">
                      {ann.title}
                    </p>
                    <p className="mt-1 text-[11px] text-[#5B6472]">
                      {ann.issuer} · {ann.localityName}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#EEF2FF] p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#173FBE]">
                <Compass className="h-3.5 w-3.5" />
                <span>{dict.sections.exploreTowns}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {localities.slice(0, 6).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setActiveLocalityId(l.id)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors",
                      activeLocalityId === l.id
                        ? "bg-[#111318] text-white"
                        : "bg-white text-[#111318] hover:text-[#173FBE]"
                    )}
                  >
                    {language === "kn" && l.nameKn ? l.nameKn : l.name}
                  </button>
                ))}
              </div>
              <Link
                href="/explore"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#173FBE] hover:underline"
              >
                {dict.sections.openMap} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {sponsoredPosts[0] && (
              <div className="border-t border-[#E2E7F0] pt-4">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-[#5B6472]">
                  <span className="inline-flex items-center gap-1 text-[#173FBE]">
                    <Megaphone className="h-3 w-3" />
                    {dict.sections.sponsoredPartner}
                  </span>
                  <span>{dict.sections.paid}</span>
                </div>
                <Link
                  href={`/article/${sponsoredPosts[0].id}`}
                  className="mt-2 block font-editorial text-lg leading-snug text-[#111318] hover:text-[#173FBE] transition-colors"
                >
                  {language === "kn" && sponsoredPosts[0].headlineKn
                    ? sponsoredPosts[0].headlineKn
                    : sponsoredPosts[0].headline}
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
