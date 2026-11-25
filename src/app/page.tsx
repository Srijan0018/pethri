"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  MapPin,
  Newspaper,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MomentLightbox } from "@/components/MomentLightbox";
import { PethriLogo } from "@/components/PethriLogo";
import { usePethri } from "@/components/PethriProvider";
import { VerificationBadge } from "@/components/VerificationBadge";
import { RelativeTime } from "@/components/RelativeTime";
import { DEMO_ANNOUNCEMENTS, DEMO_POSTS } from "@/lib/seed-data";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostCategory, PostItem } from "@/types/pethri";

export default function LandingPage() {
  const { localities, activeLocalityId, setActiveLocalityId } = usePethri();
  const [posts, setPosts] = useState<PostItem[]>(
    DEMO_POSTS.filter((p) => p.moderationStatus === "approved")
  );
  const [momentIndex, setMomentIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      })
      .catch(() => {});
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeLocalityId === "all") return posts;
    return posts.filter((p) => p.localityId === activeLocalityId);
  }, [posts, activeLocalityId]);

  const moments = useMemo(
    () => posts.filter((p) => p.isMoment),
    [posts]
  );

  const heroLead = filteredPosts[0] ?? posts[0];
  const secondaryCards = filteredPosts.slice(1, 5);
  const trendingStories = [...posts]
    .sort((a, b) => b.likesCount + b.sharesCount - (a.likesCount + a.sharesCount))
    .slice(0, 4);

  const handleMomentLike = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/engage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? data.post : p))
      );
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* 1. IMMERSIVE KINETIC EDITORIAL HERO */}
      <section className="relative overflow-hidden bg-[#06183B] text-white bg-navy-grid">
        {/* Ambient Accent Glows */}
        <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[#D91E2A]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left Editorial Typography Column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#D91E2A] animate-pulse" />
                <span className="text-xs font-bold tracking-wider uppercase text-amber-200">
                  Hyperlocal Social News Network
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.03]">
                Every street,{" "}
                <span className="font-editorial italic font-normal text-amber-200">
                  parish bell
                </span>{" "}
                &amp; morning harvest in{" "}
                <span className="text-[#FF4D58]">Pethri.</span>
              </h1>

              <p className="max-w-xl text-sm sm:text-base leading-relaxed text-slate-200">
                Real-time citizen moments meet verified local journalism. Follow
                breaking transport updates, church feasts, coastal weddings,
                agriculture mandi news, floodlit sports, and civic action across
                Pethri &amp; Brahmavar.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 rounded-full bg-[#D91E2A] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#D91E2A]/35 hover:bg-[#B81621] transition-all active:scale-95"
                >
                  <Newspaper className="h-4 w-4" />
                  <span>Open Live News Feed</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white hover:text-[#0A2E6E] transition-all"
                >
                  <Camera className="h-4 w-4" />
                  <span>Capture &amp; Report</span>
                </Link>
              </div>

              {/* Quick Locality Switcher Chips */}
              <div className="pt-2">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Tune into a locality:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveLocalityId("all")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                      activeLocalityId === "all"
                        ? "bg-white text-[#0A2E6E]"
                        : "bg-white/10 text-slate-200 hover:bg-white/20"
                    )}
                  >
                    All Belt
                  </button>
                  {localities.slice(0, 6).map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setActiveLocalityId(loc.id)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                        activeLocalityId === loc.id
                          ? "bg-[#D91E2A] text-white"
                          : "bg-white/10 text-slate-200 hover:bg-white/20"
                      )}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Asymmetric Layered Collage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="lg:col-span-6 relative"
            >
              <div className="grid grid-cols-12 gap-3 sm:gap-4 items-stretch">
                {/* Main Lead Feature Card */}
                {heroLead && (
                  <div className="col-span-12 sm:col-span-7 relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900 shadow-2xl group">
                    <img
                      src={
                        heroLead.media[0]?.url ??
                        "/images/scenes/pethri-town.svg"
                      }
                      alt={heroLead.headline}
                      className="h-72 sm:h-[390px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06183B] via-[#06183B]/45 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#D91E2A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        <MapPin className="h-3 w-3" />
                        {heroLead.localityName}
                      </span>
                      <VerificationBadge tier={heroLead.verificationTier} compact />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                        Lead Dispatch • <RelativeTime iso={heroLead.createdAt} />
                      </p>
                      <h2 className="mt-1 font-editorial text-xl sm:text-2xl leading-snug text-white">
                        {heroLead.headline}
                      </h2>
                      <Link
                        href="/feed"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-white"
                      >
                        Read full story <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Right Stacked Floating Cards: Brand Identity + Live Moment */}
                <div className="col-span-12 sm:col-span-5 flex flex-col gap-3 sm:gap-4">
                  <div className="rounded-3xl bg-white p-4 text-[#0A2E6E] shadow-xl flex flex-col items-center justify-center text-center">
                    <PethriLogo variant="image" size="lg" className="border-none ring-0 shadow-none" />
                    <p className="mt-2 text-[11px] font-semibold text-slate-500">
                      Local Voices • Verified News • Community Pulse
                    </p>
                  </div>

                  {moments[0] && (
                    <button
                      type="button"
                      onClick={() => setMomentIndex(0)}
                      className="group relative flex-1 min-h-[190px] overflow-hidden rounded-3xl border border-white/15 bg-slate-900 text-left shadow-xl"
                    >
                      <img
                        src={
                          moments[0].media[0]?.url ??
                          "/images/scenes/church-feast.svg"
                        }
                        alt={moments[0].headline}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                        <Play className="h-3 w-3 fill-[#D91E2A] text-[#D91E2A]" />
                        Featured Moment
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[10px] font-bold uppercase text-amber-300">
                          {moments[0].localityName}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs font-bold text-white">
                          {moments[0].headline}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Kinetic Breaking Marquee */}
        <div className="border-t border-white/10 bg-[#D91E2A] py-2 text-xs font-bold text-white overflow-hidden">
          <div className="animate-marquee">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-8 pr-8">
                <span className="uppercase tracking-widest text-amber-200">
                  ● Pethri Breaking &amp; Advisories
                </span>
                {DEMO_ANNOUNCEMENTS.map((a) => (
                  <span key={`${dup}-${a.id}`} className="inline-flex items-center gap-2">
                    <span className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] uppercase">
                      {a.localityName}
                    </span>
                    <span>{a.title}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. PETHRI MOMENTS HORIZONTAL REEL STRIP */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Pethri Moments</span>
            </div>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
              Stories unfolding right now
            </h2>
          </div>
          <Link
            href="/moments"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0A2E6E] hover:text-[#D91E2A]"
          >
            Full Reels View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {/* Quick Capture Card */}
          <Link
            href="/report?mode=moment"
            className="group shrink-0 w-40 sm:w-44 h-64 rounded-3xl border-2 border-dashed border-[#0A2E6E]/30 bg-white p-4 flex flex-col items-center justify-center text-center hover:border-[#D91E2A] hover:bg-red-50/40 transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D91E2A] text-white shadow-lg group-hover:scale-110 transition-transform">
              <Camera className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-[#0A2E6E]">
              Post a Moment
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Capture photo or short clip in 2 taps
            </p>
          </Link>

          {moments.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMomentIndex(idx)}
              className="group relative shrink-0 w-44 sm:w-48 h-64 overflow-hidden rounded-3xl bg-slate-900 text-left shadow-md hover:shadow-xl transition-all"
            >
              <img
                src={m.media[0]?.url ?? "/images/scenes/pethri-town.svg"}
                alt={m.headline}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <div className="absolute top-3 left-3 rounded-full p-0.5 bg-gradient-to-tr from-[#D91E2A] via-amber-400 to-[#0A2E6E]">
                <img
                  src={m.author.avatarUrl}
                  alt={m.author.fullName}
                  className="h-8 w-8 rounded-full border-2 border-white object-cover"
                />
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                  {m.localityName}
                </span>
                <p className="mt-1.5 line-clamp-2 text-xs font-bold text-white leading-snug">
                  {m.headline}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. ASYMMETRIC LOCAL NEWS BENTO + TRENDING PULSE */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Editorial Bento Grid */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
                  Editorial Highlights
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
                  Local Dispatches &amp; Community Voices
                </h2>
              </div>
              <Link
                href="/feed"
                className="rounded-full bg-[#0A2E6E] px-4 py-2 text-xs font-bold text-white hover:bg-[#08245B]"
              >
                View All Feed
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {secondaryCards.map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/feed?category=${item.category}`}
                  className={cn(
                    "group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs hover:shadow-lg transition-all flex flex-col",
                    idx === 0 && "sm:col-span-2 sm:flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "overflow-hidden bg-slate-100",
                      idx === 0 ? "sm:w-1/2 h-56 sm:h-auto" : "h-48"
                    )}
                  >
                    <img
                      src={
                        item.media[0]?.url ?? "/images/scenes/pethri-town.svg"
                      }
                      alt={item.headline}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                            CATEGORY_META[item.category].pill
                          )}
                        >
                          {CATEGORY_META[item.category].label}
                        </span>
                        <VerificationBadge tier={item.verificationTier} compact />
                      </div>
                      <h3 className="mt-3 font-editorial text-xl sm:text-2xl leading-snug text-[#0B1426] group-hover:text-[#0A2E6E]">
                        {item.headline}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {item.body}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-[#D91E2A]">
                        {item.localityName}
                      </span>
                      <span><RelativeTime iso={item.createdAt} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column: Trending & Locality Discovery */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
                <Flame className="h-4 w-4" />
                <span>Trending Across Pethri</span>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {trendingStories.map((story, idx) => (
                  <Link
                    key={story.id}
                    href={`/feed?locality=${story.localityId}`}
                    className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="font-display text-2xl font-extrabold text-slate-200 group-hover:text-[#D91E2A] transition-colors">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#0A2E6E]">
                        {story.localityName} •{" "}
                        {CATEGORY_META[story.category].short}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-[#0A2E6E]">
                        {story.headline}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {story.likesCount} likes • {story.sharesCount} shares
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Interactive Map Discovery CTA */}
            <div className="rounded-3xl bg-[#0A2E6E] p-6 text-white shadow-xl bg-navy-grid">
              <Compass className="h-7 w-7 text-amber-300" />
              <h3 className="mt-3 font-display text-xl font-extrabold">
                Explore by Locality Map
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                Jump between Pethri, Brahmavar, Barkur, Cherkady, Aroor, and
                Neelavar to browse local reports and verified businesses.
              </p>
              <Link
                href="/explore"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0A2E6E] hover:bg-amber-200 transition-colors"
              >
                Open Interactive Map <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* 4. CATEGORIES SHOWCASE */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
              Beat Coverage
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
              Built for every facet of local life
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {(Object.keys(CATEGORY_META) as PostCategory[]).map((key) => {
              const meta = CATEGORY_META[key];
              return (
                <Link
                  key={key}
                  href={`/feed?category=${key}`}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center hover:border-[#0A2E6E] hover:bg-white hover:shadow-md transition-all"
                >
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                      meta.accent
                    )}
                  >
                    {meta.short}
                  </span>
                  <p className="mt-2.5 text-xs font-bold text-slate-800 group-hover:text-[#0A2E6E]">
                    {meta.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. THREE-TIER VERIFICATION TRUST CHARTER */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
              Editorial Integrity Charter
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
              Transparent verification — never auto-trusted
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Every citizen report enters as a{" "}
              <span className="font-semibold text-amber-800">
                Community Submission
              </span>
              . Only trained editors can elevate stories after cross-checking
              on-ground sources.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Clock className="h-4 w-4" />
                <span>1. Community Submission</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-amber-950/80">
                First-hand photos, videos, and civic tips uploaded by residents.
                Clearly labeled as unverified citizen observations until
                reviewed.
              </p>
            </div>
            <div className="rounded-2xl border border-[#0A2E6E]/20 bg-[#0A2E6E]/5 p-5">
              <div className="flex items-center gap-2 text-[#0A2E6E] font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>2. Editorially Reviewed</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">
                A Pethri desk editor has reviewed media authenticity, locality
                context, and privacy compliance before publishing to the main
                feed.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>3. Officially Verified</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-emerald-950/80">
                Confirmed directly with Panchayat offices, parish bulletins,
                transport depots, or accredited local correspondents.
              </p>
            </div>
          </div>
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
