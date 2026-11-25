"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { cn, VERIFICATION_META } from "@/lib/utils";
import type { VerificationTier } from "@/types/pethri";

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
  const meta = VERIFICATION_META[tier];

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
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all hover:shadow-xs",
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
          className="absolute right-0 top-full z-40 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#0A2E6E]">
            <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} />
            {meta.label}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            {meta.description}
          </p>
        </div>
      )}
    </div>
  );
}
