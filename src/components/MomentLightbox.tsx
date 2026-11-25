"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Share2,
  X,
} from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
import { RelativeTime } from "@/components/RelativeTime";
import { cn } from "@/lib/utils";
import type { PostItem } from "@/types/pethri";

interface MomentLightboxProps {
  moments: PostItem[];
  initialIndex: number;
  onClose: () => void;
  onLike?: (postId: string) => void;
}

export function MomentLightbox({
  moments,
  initialIndex,
  onClose,
  onLike,
}: MomentLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const current = moments[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(moments.length - 1, i + 1));
      }
      if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moments.length, onClose]);

  if (!current) return null;
  const media = current.media[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pethri Moment viewer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-3 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close moment viewer"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[#06183B] text-white shadow-2xl ring-1 ring-white/15 h-[84vh] max-h-[760px]">
        {/* Story Progress Bars */}
        <div className="flex gap-1.5 px-3 pt-3 z-10">
          {moments.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              aria-label={`Jump to moment ${idx + 1}`}
              onClick={() => setIndex(idx)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  idx <= index ? "w-full bg-white" : "w-0"
                )}
              />
            </button>
          ))}
        </div>

        {/* Author Top Overlay */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={current.author.avatarUrl}
              alt={current.author.fullName}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-[#D91E2A]"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {current.author.fullName}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-slate-300">
                <MapPin className="h-3 w-3 text-[#D91E2A]" />
                {current.localityName} • <RelativeTime iso={current.createdAt} />
              </p>
            </div>
          </div>
          <VerificationBadge tier={current.verificationTier} compact />
        </div>

        {/* Media Stage */}
        <div className="relative flex-1 overflow-hidden bg-black">
          {media?.mediaType === "video" ? (
            <video
              src={media.url}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={media?.url ?? "/images/scenes/pethri-town.svg"}
              alt={current.headline}
              className="h-full w-full object-cover"
            />
          )}

          {/* Left / Right Nav Zones */}
          {index > 0 && (
            <button
              type="button"
              aria-label="Previous moment"
              onClick={() => setIndex((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < moments.length - 1 && (
            <button
              type="button"
              aria-label="Next moment"
              onClick={() => setIndex((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Bottom Caption Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-4 pt-12">
            <h3 className="font-editorial text-xl leading-snug text-white">
              {current.headline}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-slate-200">
              {current.body}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onLike?.(current.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-[#D91E2A]"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      current.likedByMe && "fill-[#D91E2A] text-[#D91E2A]"
                    )}
                  />
                  <span>{current.likesCount}</span>
                </button>
                <Link
                  href="/feed"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Full Story</span>
                </Link>
              </div>
              <Link
                href="/report"
                onClick={onClose}
                className="rounded-full bg-[#D91E2A] px-3 py-1.5 text-xs font-bold text-white"
              >
                + Post Moment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
