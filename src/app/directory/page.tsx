"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Megaphone,
  Phone,
  ShieldCheck,
  Share2,
  Store,
  Users,
} from "lucide-react";
import {
  AnimatedNavPill,
  MaskedHeadlineReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { shareContent } from "@/lib/share";
import { RelativeTime } from "@/components/RelativeTime";
import { CATEGORY_META, cn, isLocalImageSrc } from "@/lib/utils";
import type {
  CommunityAnnouncement,
  LocalBusiness,
  LocalEvent,
  PostCategory,
} from "@/types/pethri";

export default function EventsAndDirectoryPage() {
  const {
    localities,
    activeLocalityId,
    setActiveLocalityId,
    requireAuth,
    showToast,
  } = usePethri();
  const [businesses, setBusinesses] = useState<LocalBusiness[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>(
    []
  );
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [tab, setTab] = useState<"events" | "businesses" | "announcements">(
    "events"
  );
  const [eventCategory, setEventCategory] = useState<PostCategory | "all">("all");
  const [eventTime, setEventTime] = useState<"upcoming" | "past">("upcoming");
  const [eventError, setEventError] = useState<string | null>(null);
  const [loadedEventQuery, setLoadedEventQuery] = useState("");
  const eventQuery = `${activeLocalityId}|${eventCategory}|${eventTime}`;

  useEffect(() => {
    let active = true;
    const param =
      activeLocalityId !== "all" ? `?locality=${activeLocalityId}` : "";
    fetch(`/api/directory${param}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Unable to load directory.");
        if (!active) return;
        setBusinesses(d.businesses ?? []);
        setAnnouncements(d.announcements ?? []);
      })
      .catch((error: unknown) => {
        if (active) {
          showToast(
            error instanceof Error ? error.message : "Unable to load directory.",
            "error"
          );
        }
      });
    const eventParams = new URLSearchParams({ time: eventTime, limit: "50" });
    if (activeLocalityId !== "all") {
      eventParams.set("locality", activeLocalityId);
    }
    if (eventCategory !== "all") {
      eventParams.set("category", eventCategory);
    }
    fetch(`/api/events?${eventParams.toString()}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Unable to load events.");
        if (active) {
          setEvents(d.events ?? []);
          setEventError(null);
          setLoadedEventQuery(eventQuery);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setEvents([]);
          setEventError(
            error instanceof Error ? error.message : "Unable to load events."
          );
          setLoadedEventQuery(eventQuery);
        }
      })
      ;
    return () => {
      active = false;
    };
  }, [activeLocalityId, eventCategory, eventTime, eventQuery, showToast]);

  const eventsLoading = loadedEventQuery !== eventQuery;
  const visibleEventError =
    loadedEventQuery === eventQuery ? eventError : null;

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
        data.rsvped
          ? "RSVP confirmed for event"
          : "RSVP cancelled",
        "info"
      );
      if (data.event) {
        setEvents((prev) =>
          prev.map((event) => (event.id === eventId ? data.event : event))
        );
      }
    } else {
      const data = await res.json();
      showToast(data.error ?? "Unable to update event RSVP.", "error");
    }
  };

  const handleEventShare = async (event: LocalEvent) => {
    try {
      const result = await shareContent({
        title: event.title,
        text: event.title,
        url: `${window.location.origin}/events/${event.id}`,
      });
      if (result === "cancelled") return;
      showToast(
        result === "shared" ? "Event shared" : "Event link copied to clipboard",
        "info"
      );
    } catch {
      showToast("Unable to share this event. Please try copying its URL.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2E7F0] pb-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
            KARAVALI EVENTS, CULTURE &amp; LOCAL ECONOMY
          </p>
          <MaskedHeadlineReveal>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#111318]">
              Events, Directory &amp; Official Bulletins
            </h1>
          </MaskedHeadlineReveal>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-[#E2E7F0] bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("events")}
            className={cn(
              "relative z-0 inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "events"
                ? "text-white"
                : "text-[#5B6472] hover:text-[#111318]"
            )}
          >
            {tab === "events" && <AnimatedNavPill layoutId="directory-tab-pill" />}
            <Calendar className="h-3.5 w-3.5" />
            Events ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("businesses")}
            className={cn(
              "relative z-0 inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "businesses"
                ? "text-white"
                : "text-[#5B6472] hover:text-[#111318]"
            )}
          >
            {tab === "businesses" && (
              <AnimatedNavPill layoutId="directory-tab-pill" />
            )}
            <Store className="h-3.5 w-3.5" />
            Businesses ({businesses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("announcements")}
            className={cn(
              "relative z-0 inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "announcements"
                ? "text-white"
                : "text-[#5B6472] hover:text-[#111318]"
            )}
          >
            {tab === "announcements" && (
              <AnimatedNavPill layoutId="directory-tab-pill" />
            )}
            <Megaphone className="h-3.5 w-3.5" />
            Notices ({announcements.length})
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveLocalityId("all")}
          className={cn(
            "min-h-11 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors",
            activeLocalityId === "all"
              ? "bg-[#173FBE] border-[#173FBE] text-white"
              : "bg-white border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
          )}
        >
          All Karavali
        </button>
        {localities.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActiveLocalityId(loc.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors",
              activeLocalityId === loc.id
                ? "bg-[#315CFF] border-[#315CFF] text-white"
                : "bg-white border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
            )}
          >
            {loc.name}
          </button>
        ))}
      </div>

      {tab === "events" ? (
        <>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            {(["upcoming", "past"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setEventTime(range)}
                className={cn(
                  "min-h-11 rounded-full border px-4 py-1.5 text-xs font-bold capitalize",
                  eventTime === range
                    ? "border-[#173FBE] bg-[#173FBE] text-white"
                    : "border-[#E2E7F0] bg-white text-[#111318]"
                )}
              >
                {range} events
              </button>
            ))}
          </div>
          <select
            aria-label="Filter events by category"
            value={eventCategory}
            onChange={(event) => setEventCategory(event.target.value as PostCategory | "all")}
            className="min-h-11 rounded-full border border-[#E2E7F0] bg-white px-3 py-1.5 text-xs font-bold text-[#111318]"
          >
            <option value="all">All categories</option>
            {(Object.keys(CATEGORY_META) as PostCategory[]).map((category) => (
              <option key={category} value={category}>{CATEGORY_META[category].label}</option>
            ))}
          </select>
        </div>
        {visibleEventError && (
          <p role="alert" className="rounded-2xl border border-[#D94E34]/30 bg-white p-4 text-sm text-[#D94E34]">
            {visibleEventError}
          </p>
        )}
        {eventsLoading ? (
          <div className="grid gap-4 md:grid-cols-3" aria-label="Loading events">
            {[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-3xl border border-[#E2E7F0] bg-white" />)}
          </div>
        ) : !visibleEventError && events.length === 0 ? (
          <div className="rounded-3xl border border-[#E2E7F0] bg-white p-8 text-center text-sm text-[#5B6472]">
            No {eventTime} events match these filters.
          </div>
        ) : (
        <StaggerGroup className="grid gap-4 md:grid-cols-3">
          {events.map((evt) => (
            <StaggerItem key={evt.id}>
              <div className="h-full rounded-3xl border border-[#E2E7F0] bg-white p-6 flex flex-col justify-between hover:border-[#315CFF]/45 transition-colors">
                <div>
                  {evt.imageUrl && (
                    <Image
                      src={evt.imageUrl}
                      alt=""
                      width={640}
                      height={320}
                      unoptimized={!isLocalImageSrc(evt.imageUrl)}
                      className="mb-4 h-40 w-full rounded-2xl object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase text-[#173FBE]">
                      {evt.localityName}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                        CATEGORY_META[evt.category].pill
                      )}
                    >
                      {CATEGORY_META[evt.category].short}
                    </span>
                  </div>
                  <h2 className="mt-2 font-editorial text-2xl text-[#111318]">
                    <Link
                      href={`/events/${evt.id}`}
                      className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315CFF]"
                    >
                      {evt.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#5B6472]">
                    {evt.description}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#173FBE]">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(evt.startsAt))}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#5B6472]">
                    <MapPin className="h-3.5 w-3.5 text-[#173FBE]" />
                    {evt.venue}
                  </p>
                  <p className="mt-1 text-[11px] text-[#5B6472]">
                    Organizer: {evt.organizer}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#E2E7F0] pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6472]">
                    <Users className="h-4 w-4 text-[#173FBE]" />
                    {evt.rsvpCount} attending
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEventShare(evt)}
                      aria-label={`Share ${evt.title}`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#E2E7F0] text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315CFF]"
                    >
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEventRsvp(evt.id)}
                      className={cn(
                        "min-h-11 rounded-full px-4 text-xs font-bold transition-colors border",
                        evt.rsvpedByMe
                          ? "bg-[#315CFF] border-[#315CFF] text-white"
                          : "border-[#E2E7F0] bg-white text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF]"
                      )}
                    >
                      {evt.rsvpedByMe ? "Going ✓" : "RSVP Going"}
                    </button>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
        )}
        </>
      ) : tab === "businesses" ? (
        <StaggerGroup className="grid gap-5 md:grid-cols-2">
          {businesses.map((biz) => (
            <StaggerItem key={biz.id}>
              <div className="h-full overflow-hidden rounded-3xl border border-[#E2E7F0] bg-white flex flex-col sm:flex-row hover:border-[#315CFF]/45 transition-colors">
                {biz.imageUrl && (
                  <Image
                    src={biz.imageUrl}
                    alt={biz.name}
                    width={352}
                    height={240}
                    unoptimized={!isLocalImageSrc(biz.imageUrl)}
                    className="h-44 sm:h-auto sm:w-44 object-cover shrink-0"
                  />
                )}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[10px] font-bold text-[#173FBE]">
                        {biz.category}
                      </span>
                      {biz.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#173FBE]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 font-display text-lg font-extrabold text-[#111318]">
                      {biz.name}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#5B6472]">
                      {biz.description}
                    </p>
                  </div>
                  <div className="mt-4 space-y-1.5 border-t border-[#E2E7F0] pt-3 text-xs text-[#5B6472]">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#173FBE]" />
                      <span>{biz.address}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#173FBE]" />
                      <span>{biz.hours}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-bold text-[#315CFF]">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${biz.phone}`} className="hover:underline">
                        {biz.phone}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-3xl border border-[#E2E7F0] bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase",
                      ann.urgency === "urgent"
                        ? "bg-[#D94E34] text-white"
                        : "bg-[#EEF2FF] text-[#173FBE]"
                    )}
                  >
                    {ann.urgency}
                  </span>
                  <span className="text-xs font-bold text-[#173FBE]">
                    {ann.localityName}
                  </span>
                </div>
                <span className="text-[11px] text-[#5B6472]">
                  <RelativeTime iso={ann.createdAt} />
                </span>
              </div>
              <h2 className="mt-2 font-editorial text-2xl text-[#111318]">
                {ann.title}
              </h2>
              <p className="mt-1.5 text-sm text-[#5B6472]">{ann.summary}</p>
              <p className="mt-3 text-xs font-bold text-[#173FBE]">
                Issued by: {ann.issuer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
