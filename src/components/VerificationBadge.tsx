"use client";

import React, { useState } from "react";
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
    className: "bg-[#F7F6EF] text-[#525F52] border-[#202820]/20",
    dotClass: "bg-amber-500",
  },
  reviewed: {
    label: "Editorially Reviewed",
    shortLabel: "Reviewed",
    description:
      "Checked by a Pethri desk editor for locality context, authenticity, and privacy compliance.",
    className: "bg-[#C9E8D5] text-[#202820] border-[#202820]/20",
    dotClass: "bg-[#202820]",
  },
  verified: {
    label: "Officially Verified",
    shortLabel: "Verified",
    description:
      "Confirmed directly with local authorities, parish/panchayat records, or accredited correspondents.",
    className: "bg-[#B7F36B] text-[#202820] border-[#202820]/25",
    dotClass: "bg-emerald-700",
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
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all hover:shadow-xs",
          meta.className,
          className
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{compact ? meta.shortLabel : meta.label}</span>
      </button>

      {showInfo && (
        <div
          role="tooltip"
          className="absolute right-0 top-full z-40 mt-1.5 w-64 rounded-xl border border-[#202820]/15 bg-[#F7F6EF] p-3 text-left shadow-xl"
        >
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#202820]">
            <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} />
            {meta.label}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#525F52]">
            {meta.description}
          </p>
        </div>
      )}
    </div>
  );
}
