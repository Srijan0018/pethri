"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  MapPin,
  Megaphone,
  Phone,
  PlusCircle,
  ShieldCheck,
  Store,
} from "lucide-react";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { cn } from "@/lib/utils";
import type { CommunityAnnouncement, LocalBusiness } from "@/types/pethri";

export default function DirectoryPage() {
  const { localities, activeLocalityId, setActiveLocalityId, currentUser, showToast } =
    usePethri();
  const [businesses, setBusinesses] = useState<LocalBusiness[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>(
    []
  );
  const [tab, setTab] = useState<"businesses" | "announcements">("businesses");
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
  }, [activeLocalityId]);

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
            Local Economy &amp; Civic Bulletins
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
            Business Directory &amp; Community Announcements
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
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
            Announcements ({announcements.length})
          </button>
        </div>
      </div>

      {/* Locality Filter Strip */}
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

      {tab === "businesses" ? (
        <div className="grid gap-5 md:grid-cols-2">
          {businesses.map((biz) => (
            <div
              key={biz.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row"
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
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8 space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"
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

          <aside className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0A2E6E]">
              <PlusCircle className="h-4 w-4 text-[#D91E2A]" />
              <span>Post Civic Notice</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {currentUser.role === "editor" || currentUser.role === "admin"
                ? "Signed in as Editorial Staff — publish notices immediately."
                : "Switch to Editorial Desk role in the header to publish official notices (or test in demo mode)."}
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
