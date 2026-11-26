"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Megaphone,
  Phone,
  PlusCircle,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { usePethri } from "@/components/PethriProvider";
import { StaggerGroup, StaggerItem } from "@/components/MotionPrimitives";
import { RelativeTime } from "@/components/RelativeTime";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  CommunityAnnouncement,
  LocalBusiness,
  LocalEvent,
} from "@/types/pethri";

export default function DirectoryAndEventsPage() {
  const {
    localities,
    activeLocalityId,
    setActiveLocalityId,
    currentUser,
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
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newIssuer, setNewIssuer] = useState("Pethri Parish / Panchayat Desk");
  const [newUrgency, setNewUrgency] = useState<"notice" | "advisory" | "urgent">(
    "notice"
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

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;
    const res = await fetch("/api/directory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_announcement",
        localityId: activeLocalityId !== "all" ? activeLocalityId : "loc-pethri",
        title: newTitle.trim(),
        summary: newSummary.trim(),
        issuer: newIssuer.trim(),
        urgency: newUrgency,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnnouncements((prev) => [data.announcement, ...prev]);
      setNewTitle("");
      setNewSummary("");
      showToast("Community announcement published");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
            Locality Communities &amp; Local Economy
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
            Events, Business Directory &amp; Notices
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("events")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "events" ? "bg-[#0A2E6E] text-white" : "text-slate-600"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Events ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("businesses")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "businesses"
                ? "bg-[#0A2E6E] text-white"
                : "text-slate-600"
            )}
          >
            <Store className="h-3.5 w-3.5" />
            Businesses ({businesses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("announcements")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              tab === "announcements"
                ? "bg-[#D91E2A] text-white"
                : "text-slate-600"
            )}
          >
            <Megaphone className="h-3.5 w-3.5" />
            Bulletins ({announcements.length})
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveLocalityId("all")}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold",
            activeLocalityId === "all"
              ? "bg-[#0A2E6E] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          )}
        >
          All Localities
        </button>
        {localities.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActiveLocalityId(loc.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold",
              activeLocalityId === loc.id
                ? "bg-[#D91E2A] text-white"
                : "bg-white border border-slate-200 text-slate-700"
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
            <div
              className="h-full rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase text-[#D91E2A]">
                    {evt.localityName}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                      CATEGORY_META[evt.category].pill
                    )}
                  >
                    {CATEGORY_META[evt.category].short}
                  </span>
                </div>
                <h2 className="mt-2 font-editorial text-2xl text-[#0B1426]">
                  {evt.title}
                </h2>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-[#D91E2A]" />
                  {evt.venue}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Organizer: {evt.organizer}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Users className="h-4 w-4 text-[#0A2E6E]" />
                  {evt.rsvpCount} attending
                </span>
                <button
                  type="button"
                  onClick={() => handleEventRsvp(evt.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                    evt.rsvpedByMe
                      ? "bg-[#0A2E6E] text-white"
                      : "border border-[#0A2E6E] text-[#0A2E6E] hover:bg-[#0A2E6E] hover:text-white"
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
            <div
              className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row"
            >
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
                    <span className="rounded-full bg-[#0A2E6E]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#0A2E6E]">
                      {biz.category}
                    </span>
                    {biz.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-lg font-extrabold text-[#0B1426]">
                    {biz.name}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {biz.description}
                  </p>
                </div>
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#D91E2A]" />
                    <span>{biz.address}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#0A2E6E]" />
                    <span>{biz.hours}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold text-[#0A2E6E]">
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
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8 space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        ann.urgency === "urgent"
                          ? "bg-[#D91E2A] text-white"
                          : ann.urgency === "advisory"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#0A2E6E]/10 text-[#0A2E6E]"
                      )}
                    >
                      {ann.urgency}
                    </span>
                    <span className="text-xs font-bold text-[#D91E2A]">
                      {ann.localityName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    <RelativeTime iso={ann.createdAt} />
                  </span>
                </div>
                <h2 className="mt-2 font-editorial text-2xl text-[#0B1426]">
                  {ann.title}
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">{ann.summary}</p>
                <p className="mt-3 text-xs font-semibold text-[#0A2E6E]">
                  Issued by: {ann.issuer}
                </p>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0A2E6E]">
              <PlusCircle className="h-4 w-4 text-[#D91E2A]" />
              <span>Post Civic Notice</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Signed in as <strong>{currentUser.fullName}</strong> (
              {currentUser.role}).
            </p>
            <form
              onSubmit={handlePublishAnnouncement}
              className="mt-4 space-y-3"
            >
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Notice headline..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#0A2E6E]"
              />
              <textarea
                rows={3}
                required
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Schedule, road diversion, parish or panchayat details..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#0A2E6E]"
              />
              <input
                type="text"
                required
                value={newIssuer}
                onChange={(e) => setNewIssuer(e.target.value)}
                placeholder="Issuing body"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#0A2E6E]"
              />
              <select
                value={newUrgency}
                onChange={(e) =>
                  setNewUrgency(
                    e.target.value as "notice" | "advisory" | "urgent"
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"
              >
                <option value="notice">Notice</option>
                <option value="advisory">Advisory</option>
                <option value="urgent">Urgent Alert</option>
              </select>
              <button
                type="submit"
                className="w-full rounded-full bg-[#0A2E6E] py-2.5 text-xs font-bold text-white hover:bg-[#08245B]"
              >
                Publish Community Bulletin
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
