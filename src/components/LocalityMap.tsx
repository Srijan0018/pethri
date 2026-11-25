"use client";

import React, { useState } from "react";
import { LocateFixed, MapPin, Navigation, Shield } from "lucide-react";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { Locality, PostItem } from "@/types/pethri";

interface LocalityMapProps {
  localities: Locality[];
  posts: PostItem[];
  selectedLocalityId: string;
  onSelectLocality: (id: string) => void;
}

export function LocalityMap({
  localities,
  posts,
  selectedLocalityId,
  onSelectLocality,
}: LocalityMapProps) {
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    setGpsStatus("Requesting location permission...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Find nearest locality by Euclidean approximation on local belt
        let closest = localities[0];
        let minDist = Infinity;
        for (const loc of localities) {
          const dist = Math.hypot(
            loc.centerLat - latitude,
            loc.centerLng - longitude
          );
          if (dist < minDist) {
            minDist = dist;
            closest = loc;
          }
        }
        setLocating(false);
        if (closest) {
          onSelectLocality(closest.id);
          setGpsStatus(
            `Centered near ${closest.name} (kept private on your device)`
          );
        }
      },
      () => {
        setLocating(false);
        setGpsStatus(
          "Location permission declined — browse manually by selecting any locality pin."
        );
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#06183B] text-white shadow-xl">
      {/* Map Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Interactive Pethri Belt Map
          </p>
          <p className="text-[11px] text-slate-300">
            Tap a locality node to filter dispatches. Exact coordinates stay
            private unless explicitly consented.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#D91E2A] transition-colors disabled:opacity-60"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          <span>{locating ? "Locating..." : "Find Nearest Locality"}</span>
        </button>
      </div>

      {gpsStatus && (
        <div className="flex items-center gap-2 bg-[#0A2E6E] px-5 py-2 text-[11px] text-amber-200 border-b border-white/10">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span>{gpsStatus}</span>
        </div>
      )}

      {/* Bespoke Interactive Cartographic Canvas */}
      <div className="relative h-[380px] sm:h-[440px] w-full overflow-hidden bg-gradient-to-br from-[#071D49] via-[#0A2E6E] to-[#06183B]">
        {/* Topographic & River SVG Layer */}
        <svg
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-55"
          aria-hidden="true"
        >
          {/* Lat/Lng Grid */}
          <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
            <line x1="0" y1="100" x2="1000" y2="100" />
            <line x1="0" y1="200" x2="1000" y2="200" />
            <line x1="0" y1="300" x2="1000" y2="300" />
            <line x1="0" y1="400" x2="1000" y2="400" />
            <line x1="200" y1="0" x2="200" y2="500" />
            <line x1="400" y1="0" x2="400" y2="500" />
            <line x1="600" y1="0" x2="600" y2="500" />
            <line x1="800" y1="0" x2="800" y2="500" />
          </g>
          {/* Seetha & Coastal River Curves */}
          <path
            d="M0 165 Q230 115 410 190 T760 175 T1000 220"
            stroke="#38BDF8"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
          />
          <path
            d="M120 500 Q260 360 460 350 T850 430"
            stroke="#38BDF8"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.25"
          />
          {/* Highway / Road Network Connecting Localities */}
          <path
            d="M240 280 L520 230 L720 180 L820 100"
            stroke="#FDE68A"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M200 140 L240 280 L400 315 L540 390"
            stroke="#FDE68A"
            strokeWidth="2"
            strokeDasharray="6 6"
            fill="none"
            opacity="0.45"
          />
        </svg>

        {/* Compass Badge */}
        <div className="absolute left-4 top-4 rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-md text-[10px] font-mono text-slate-200">
          <div className="flex items-center gap-1.5">
            <Navigation className="h-3 w-3 text-[#D91E2A]" />
            <span>UDUPI • BRAHMAVAR TALUK • 13.44°N 74.80°E</span>
          </div>
        </div>

        {/* Locality Interactive Nodes */}
        {localities.map((loc) => {
          const locPosts = posts.filter((p) => p.localityId === loc.id);
          const isSelected = selectedLocalityId === loc.id;
          const hasBreaking = locPosts.some((p) => p.isBreaking);

          return (
            <button
              key={loc.id}
              type="button"
              onClick={() =>
                onSelectLocality(isSelected ? "all" : loc.id)
              }
              style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-10"
            >
              {/* Pulse Ring */}
              {(isSelected || loc.isPrimary || hasBreaking) && (
                <span
                  className={cn(
                    "absolute inset-0 -m-2 rounded-full animate-ping opacity-40",
                    hasBreaking || isSelected ? "bg-[#D91E2A]" : "bg-amber-300"
                  )}
                />
              )}
              <div
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg transition-all group-hover:scale-105",
                  isSelected
                    ? "bg-[#D91E2A] text-white ring-4 ring-white/30 scale-110"
                    : loc.isPrimary
                      ? "bg-white text-[#0A2E6E] ring-2 ring-[#D91E2A]"
                      : "bg-[#06183B]/90 text-white border border-white/25 hover:bg-white hover:text-[#0A2E6E]"
                )}
              >
                <MapPin
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isSelected
                      ? "text-white"
                      : loc.isPrimary
                        ? "text-[#D91E2A]"
                        : "text-amber-300"
                  )}
                />
                <span>{loc.name}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-900/15 text-current"
                  )}
                >
                  {locPosts.length}
                </span>
              </div>
            </button>
          );
        })}

        {/* Consented Precise Coordinate Pins */}
        {posts
          .filter((p) => p.sharePreciseLocation && p.publicLat)
          .map((p) => {
            const loc = localities.find((l) => l.id === p.localityId);
            if (!loc) return null;
            return (
              <div
                key={`gps-${p.id}`}
                style={{
                  left: `${Math.min(92, loc.mapX + 6)}%`,
                  top: `${Math.min(88, loc.mapY + 6)}%`,
                }}
                title={`Consented GPS Report: ${p.headline}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-300/60 bg-emerald-600/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-md"
              >
                GPS • {CATEGORY_META[p.category].short}
              </div>
            );
          })}
      </div>

      {/* Bottom Locality Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-[#05122D] px-4 py-3">
        <button
          type="button"
          onClick={() => onSelectLocality("all")}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
            selectedLocalityId === "all"
              ? "bg-white text-[#0A2E6E]"
              : "bg-white/10 text-slate-300 hover:bg-white/20"
          )}
        >
          All Localities ({posts.length})
        </button>
        {localities.map((loc) => {
          const count = posts.filter((p) => p.localityId === loc.id).length;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelectLocality(loc.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
                selectedLocalityId === loc.id
                  ? "bg-[#D91E2A] text-white"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              )}
            >
              {loc.name} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
