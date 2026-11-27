"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Megaphone,
  Phone,
  ShieldCheck,
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
import { RelativeTime } from "@/components/RelativeTime";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  CommunityAnnouncement,
  LocalBusiness,
  LocalEvent,
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

  useEffect(() => {
    const param =
      activeLocalityId !== "all" ? `?locality=${activeLocalityId}` : "";
    fetch(`/api/directory${param}`)
      .then((r) => r.json())
      .then((d) => {
        setBusinesses(d.businesses ?? []);
        setAnnouncements(d.announcements ?? []);
      });
    fetch(`/api/broadcast${param}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.events)) setEvents(d.events);
      });
  }, [activeLocalityId]);

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
          ? "RSVP confirmed for event"
          : "RSVP cancelled",
        "info"
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E5E3DC] pb-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
            KARAVALI EVENTS, CULTURE &amp; LOCAL ECONOMY
          </p>
          <MaskedHeadlineReveal>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#181917]">
              Events, Directory &amp; Official Bulletins
            </h1>
          </MaskedHeadlineReveal>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-[#E5E3DC] bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("events")}
            className={cn(
              "relative z-0 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "events"
                ? "text-white"
                : "text-[#5A605C] hover:text-[#181917]"
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
              "relative z-0 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "businesses"
                ? "text-white"
                : "text-[#5A605C] hover:text-[#181917]"
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
              "relative z-0 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "announcements"
                ? "text-white"
                : "text-[#5A605C] hover:text-[#181917]"
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
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors",
            activeLocalityId === "all"
              ? "bg-[#1B5E43] border-[#1B5E43] text-white"
              : "bg-white border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
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
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors",
              activeLocalityId === loc.id
                ? "bg-[#398BFF] border-[#398BFF] text-white"
                : "bg-white border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
            )}
          >
            {loc.name}
          </button>
        ))}
      </div>

      {tab === "events" ? (
        <StaggerGroup className="grid gap-4 md:grid-cols-3">
          {events.map((evt) => (
            <StaggerItem key={evt.id}>
              <div className="h-full rounded-3xl border border-[#E5E3DC] bg-white p-6 flex flex-col justify-between hover:border-[#398BFF]/45 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase text-[#1B5E43]">
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
                  <h2 className="mt-2 font-editorial text-2xl text-[#181917]">
                    {evt.title}
                  </h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#5A605C]">
                    <MapPin className="h-3.5 w-3.5 text-[#1B5E43]" />
                    {evt.venue}
                  </p>
                  <p className="mt-1 text-[11px] text-[#5A605C]">
                    Organizer: {evt.organizer}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#E5E3DC] pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A605C]">
                    <Users className="h-4 w-4 text-[#1B5E43]" />
                    {evt.rsvpCount} attending
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEventRsvp(evt.id)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-bold transition-colors border",
                      evt.rsvpedByMe
                        ? "bg-[#398BFF] border-[#398BFF] text-white"
                        : "border-[#E5E3DC] bg-white text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF]"
                    )}
                  >
                    {evt.rsvpedByMe ? "Going ✓" : "RSVP Going"}
                  </button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : tab === "businesses" ? (
        <StaggerGroup className="grid gap-5 md:grid-cols-2">
          {businesses.map((biz) => (
            <StaggerItem key={biz.id}>
              <div className="h-full overflow-hidden rounded-3xl border border-[#E5E3DC] bg-white flex flex-col sm:flex-row hover:border-[#398BFF]/45 transition-colors">
                {biz.imageUrl && (
                  <img
                    src={biz.imageUrl}
                    alt={biz.name}
                    className="h-44 sm:h-auto sm:w-44 object-cover shrink-0"
                  />
                )}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#EAF2EE] px-2.5 py-0.5 text-[10px] font-bold text-[#1B5E43]">
                        {biz.category}
                      </span>
                      {biz.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B5E43]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 font-display text-lg font-extrabold text-[#181917]">
                      {biz.name}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#5A605C]">
                      {biz.description}
                    </p>
                  </div>
                  <div className="mt-4 space-y-1.5 border-t border-[#E5E3DC] pt-3 text-xs text-[#5A605C]">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#1B5E43]" />
                      <span>{biz.address}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#1B5E43]" />
                      <span>{biz.hours}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-bold text-[#398BFF]">
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
              className="rounded-3xl border border-[#E5E3DC] bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase",
                      ann.urgency === "urgent"
                        ? "bg-[#D94E34] text-white"
                        : "bg-[#EAF2EE] text-[#1B5E43]"
                    )}
                  >
                    {ann.urgency}
                  </span>
                  <span className="text-xs font-bold text-[#1B5E43]">
                    {ann.localityName}
                  </span>
                </div>
                <span className="text-[11px] text-[#5A605C]">
                  <RelativeTime iso={ann.createdAt} />
                </span>
              </div>
              <h2 className="mt-2 font-editorial text-2xl text-[#181917]">
                {ann.title}
              </h2>
              <p className="mt-1.5 text-sm text-[#5A605C]">{ann.summary}</p>
              <p className="mt-3 text-xs font-bold text-[#1B5E43]">
                Issued by: {ann.issuer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
