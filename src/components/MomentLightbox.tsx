"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Share2,
  X,
} from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181917]/92 p-3 backdrop-blur-xs"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close moment viewer"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-[#398BFF] transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#181917] text-white shadow-2xl ring-1 ring-white/15 h-[84vh] max-h-[760px]"
      >
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
                  idx <= index ? "w-full bg-[#398BFF]" : "w-0"
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
              className="h-9 w-9 rounded-full object-cover ring-2 ring-[#398BFF]"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {current.author.fullName}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-[#EAF2EE]">
                <MapPin className="h-3 w-3 text-[#398BFF]" />
                {current.localityName} • <RelativeTime iso={current.createdAt} />
              </p>
            </div>
          </div>
          <VerificationBadge tier={current.verificationTier} compact />
        </div>

        {/* Swipeable Media Stage */}
        <motion.div
          key={current.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -60 && index < moments.length - 1) {
              setIndex((i) => i + 1);
            } else if (info.offset.x > 60 && index > 0) {
              setIndex((i) => i - 1);
            }
          }}
          className="relative flex-1 overflow-hidden bg-black cursor-grab active:cursor-grabbing"
        >
          <AnimatePresence mode="wait">
            {media?.mediaType === "video" ? (
              <motion.video
                key={current.id}
                src={media.url}
                controls
                autoPlay
                playsInline
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="h-full w-full object-cover"
              />
            ) : (
              <motion.img
                key={current.id}
                src={media?.url ?? "/images/photos/pethri-town.jpg"}
                alt={current.headline}
                initial={{ opacity: 0.65, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="h-full w-full object-cover"
              />
            )}
          </AnimatePresence>

          {index > 0 && (
            <button
              type="button"
              aria-label="Previous moment"
              onClick={() => setIndex((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white hover:bg-[#398BFF] transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < moments.length - 1 && (
            <button
              type="button"
              aria-label="Next moment"
              onClick={() => setIndex((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white hover:bg-[#398BFF] transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Bottom Caption Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-4 pt-12">
            <h3 className="font-editorial text-xl leading-snug text-white">
              {current.headline}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-white/80">
              {current.body}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onLike?.(current.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-[#398BFF] transition-colors"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      current.likedByMe && "fill-[#398BFF] text-[#398BFF]"
                    )}
                  />
                  <span>{current.likesCount}</span>
                </button>
                <Link
                  href={`/article/${current.id}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded-full bg-[#1B5E43] px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-[#398BFF] transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Read Full Article</span>
                </Link>
              </div>
              <span className="text-[10px] font-mono text-[#EAF2EE]">
                {index + 1} / {moments.length}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
