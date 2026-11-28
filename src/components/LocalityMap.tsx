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
          "Location permission declined — browse manually by selecting any Karavali pin."
        );
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-[#E2E7F0] bg-[#173FBE] text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-5 py-3.5">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#EEF2FF]">
            Interactive Karavali Belt Map
          </p>
          <p className="text-[11px] text-[#EEF2FF]/80">
            Tap Mangaluru, Udupi, Manipal, Kundapura, or Pethri to filter local
            stories.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#173FBE] hover:bg-[#315CFF] hover:text-white transition-colors disabled:opacity-60"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          <span>{locating ? "Locating..." : "Find Nearest Locality"}</span>
        </button>
      </div>

      {gpsStatus && (
        <div className="flex items-center gap-2 bg-[#EEF2FF] px-5 py-2 text-[11px] font-semibold text-[#111318]">
          <Shield className="h-3.5 w-3.5 shrink-0 text-[#173FBE]" />
          <span>{gpsStatus}</span>
        </div>
      )}

      <div className="relative h-[400px] sm:h-[460px] w-full overflow-hidden bg-[#173FBE] bg-primary-grid">
        <svg
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-80"
          aria-hidden="true"
        >
          {/* Arabian Sea Coastline Silhouette */}
          <path
            d="M0 0 L175 0 Q140 130 165 250 T210 500 L0 500 Z"
            fill="#EEF2FF"
            opacity="0.14"
          />
          {/* Coastal NH-66 Highway Line */}
          <path
            d="M240 80 L280 150 L380 310 L620 420"
            stroke="#315CFF"
            strokeWidth="3"
            strokeDasharray="8 6"
            fill="none"
            opacity="0.7"
          />
          {/* Interior Pethri–Brahmavar–Manipal Link */}
          <path
            d="M320 230 L540 210 L680 290 L380 310"
            stroke="#EEF2FF"
            strokeWidth="2"
            strokeDasharray="5 5"
            fill="none"
            opacity="0.5"
          />
        </svg>

        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#111318]/55 px-3 py-1 backdrop-blur-md text-[10px] font-mono text-[#EEF2FF]">
          <div className="flex items-center gap-1.5">
            <Navigation className="h-3 w-3 text-[#315CFF]" />
            <span>KARAVALI COAST • 12.91°N – 13.62°N</span>
          </div>
        </div>

        {localities.map((loc) => {
          const locPosts = posts.filter((p) => p.localityId === loc.id);
          const isSelected = selectedLocalityId === loc.id;
          const hasBreaking = locPosts.some((p) => p.isBreaking);

          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelectLocality(isSelected ? "all" : loc.id)}
              style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-10"
            >
              {(isSelected || hasBreaking) && (
                <span
                  className={cn(
                    "absolute inset-0 -m-2 rounded-full animate-ping opacity-40",
                    hasBreaking ? "bg-[#D94E34]" : "bg-[#315CFF]"
                  )}
                />
              )}
              <div
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold shadow-lg transition-all group-hover:scale-105",
                  isSelected
                    ? "bg-[#315CFF] text-white ring-4 ring-white/30 scale-110"
                    : loc.isPrimary
                      ? "bg-[#EEF2FF] text-[#111318]"
                      : "bg-white text-[#111318] hover:bg-[#315CFF] hover:text-white"
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{loc.name}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-[#EEF2FF] text-[#173FBE]"
                  )}
                >
                  {locPosts.length}
                </span>
              </div>
            </button>
          );
        })}

        {posts
          .filter((p) => p.sharePreciseLocation && p.publicLat)
          .map((p) => {
            const loc = localities.find((l) => l.id === p.localityId);
            if (!loc) return null;
            return (
              <div
                key={`gps-${p.id}`}
                style={{
                  left: `${Math.min(92, loc.mapX + 7)}%`,
                  top: `${Math.min(88, loc.mapY + 6)}%`,
                }}
                title={`Consented GPS Report: ${p.headline}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-2.5 py-0.5 text-[9px] font-extrabold text-[#173FBE] shadow-md border border-[#E2E7F0]"
              >
                GPS • {CATEGORY_META[p.category].short}
              </div>
            );
          })}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-[#111318] px-4 py-3">
        <button
          type="button"
          onClick={() => onSelectLocality("all")}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition-colors",
            selectedLocalityId === "all"
              ? "bg-[#315CFF] text-white"
              : "bg-white/10 text-[#EEF2FF] hover:bg-white/20"
          )}
        >
          All Karavali ({posts.length})
        </button>
        {localities.map((loc) => {
          const count = posts.filter((p) => p.localityId === loc.id).length;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelectLocality(loc.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition-colors",
                selectedLocalityId === loc.id
                  ? "bg-[#315CFF] text-white"
                  : "bg-white/10 text-[#EEF2FF] hover:bg-white/20"
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
