import React, { useId } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PethriLogoProps {
  variant?: "light" | "dark" | "image";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PethriLogo({
  variant = "light",
  size = "md",
  className,
}: PethriLogoProps) {
  const uid = useId().replace(/:/g, "");
  const ribbonId = `pethri-ribbon-${uid}`;
  const waveId = `pethri-wave-${uid}`;

  if (variant === "image") {
    return (
      <div
        className={cn(
          "inline-flex items-center overflow-hidden rounded-xl bg-white p-1 border border-[#E2E7F0]",
          className
        )}
      >
        <Image
          src="/images/pethri-logo.jpg"
          alt="Pethri.com official logo"
          width={280}
          height={84}
          className={cn(
            "object-contain",
            size === "sm" && "h-8 w-auto",
            size === "md" && "h-10 w-auto",
            size === "lg" && "h-14 w-auto"
          )}
        />
      </div>
    );
  }

  const iconSize = size === "sm" ? 32 : size === "lg" ? 46 : 38;
  const textSize =
    size === "sm"
      ? "text-xl"
      : size === "lg"
        ? "text-3xl sm:text-4xl"
        : "text-2xl";

  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "group inline-flex items-center gap-3 select-none",
        className
      )}
    >
      {/* Bespoke Coastal Beacon + Architectural 'P' Emblem (no boxy frame) */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="shrink-0 drop-shadow-[0_4px_12px_rgba(11,17,32,0.28)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id={ribbonId} x1="12" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isDark ? "#FFFFFF" : "#173FBE"} />
            <stop offset="100%" stopColor={isDark ? "#93B4FF" : "#315CFF"} />
          </linearGradient>
          <linearGradient id={waveId} x1="8" y1="48" x2="56" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C5A572" />
            <stop offset="100%" stopColor="#315CFF" />
          </linearGradient>
        </defs>

        {/* Outer Signal Arcs (Top-Right) */}
        <path
          d="M44 12C49.5 15.5 53 21.5 53 28"
          stroke="#C5A572"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M49 7C56.2 11.8 60 19.5 60 28"
          stroke={isDark ? "#FFFFFF" : "#315CFF"}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Architectural 'P' Pillar & Bowl */}
        <path
          d="M17 48V15C17 12.7909 18.7909 11 21 11H34C42.2843 11 48 16.2 48 23.5C48 30.8 42.2843 36 34 36H25"
          stroke={`url(#${ribbonId})`}
          strokeWidth="6.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lighthouse Beacon Core inside the 'P' */}
        <circle
          cx="33"
          cy="23.5"
          r="4.2"
          fill="#C5A572"
        />
        <circle
          cx="33"
          cy="23.5"
          r="1.8"
          fill={isDark ? "#111318" : "#FFFFFF"}
        />

        {/* Karavali Coastal Horizon Wave */}
        <path
          d="M10 52C17.5 47.5 25.5 55.5 34 51.5C41.5 48 48 52.5 55 49.5"
          stroke={`url(#${waveId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>

      {/* Editorial Wordmark + Micro Karavali Tag */}
      <div className="flex flex-col leading-none">
        <div
          className={cn(
            "font-display font-extrabold tracking-tight flex items-baseline",
            textSize
          )}
        >
          <span
            className={cn(
              isDark
                ? "text-white drop-shadow-[0_2px_10px_rgba(11,17,32,0.55)]"
                : "text-[#111318]"
            )}
          >
            pethri
          </span>
          <span className="text-[#C5A572] font-editorial italic font-normal ml-0.5">
            .com
          </span>
        </div>
        <span
          className={cn(
            "mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.32em]",
            isDark ? "text-white/75" : "text-[#173FBE]/80"
          )}
        >
          KARAVALI
        </span>
      </div>
    </div>
  );
}
