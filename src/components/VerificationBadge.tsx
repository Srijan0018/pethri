"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationTier } from "@/types/pethri";

const TRUST_STYLES: Record<
  VerificationTier,
  {
    label: string;
    shortLabel: string;
    description: string;
    className: string;
    dotClass: string;
  }
> = {
  community: {
    label: "Community Submission",
    shortLabel: "Community",
    description:
      "Submitted by a Karavali resident. Clearly kept separate from verified newsroom reporting.",
    className: "bg-[#FFFFFF] text-[#5B6472] border-[#E2E7F0]",
    dotClass: "bg-[#5B6472]",
  },
  reviewed: {
    label: "Editorially Reviewed",
    shortLabel: "Reviewed",
    description:
      "Checked by a Pethri desk editor for locality context, authenticity, and privacy compliance.",
    className: "bg-white text-[#111318] border-[#315CFF]/40",
    dotClass: "bg-[#315CFF]",
  },
  verified: {
    label: "Officially Verified",
    shortLabel: "Verified",
    description:
      "Confirmed directly with local authorities, parish/panchayat records, or accredited correspondents.",
    className: "bg-[#EEF2FF] text-[#173FBE] border-[#173FBE]/25",
    dotClass: "bg-[#173FBE]",
  },
};

interface VerificationBadgeProps {
  tier: VerificationTier;
  compact?: boolean;
  className?: string;
}

export function VerificationBadge({
  tier,
  compact = false,
  className,
}: VerificationBadgeProps) {
  const [showInfo, setShowInfo] = useState(false);
  const meta = TRUST_STYLES[tier];

  const Icon =
    tier === "verified"
      ? ShieldCheck
      : tier === "reviewed"
        ? CheckCircle2
        : Clock;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowInfo((prev) => !prev)}
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
        aria-label={`${meta.label}: ${meta.description}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all hover:border-[#315CFF]/60",
          meta.className,
          className
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            tier === "reviewed" && "text-[#315CFF]",
            tier === "verified" && "text-[#173FBE]"
          )}
        />
        <span>{compact ? meta.shortLabel : meta.label}</span>
      </button>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 460, damping: 32 }}
            className="absolute right-0 top-full z-40 mt-1.5 w-64 origin-top-right rounded-xl border border-[#E2E7F0] bg-white p-3 text-left shadow-xl"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#111318]">
              <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} />
              {meta.label}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5B6472]">
              {meta.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
