import React from "react";
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
  if (variant === "image") {
    return (
      <div
        className={cn(
          "inline-flex items-center overflow-hidden rounded-xl bg-white p-1 border border-[#202820]/10",
          className
        )}
      >
        <img
          src="/images/pethri-logo.jpg"
          alt="Pethri.com official logo"
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

  const iconSize = size === "sm" ? 28 : size === "lg" ? 40 : 34;
  const textSize =
    size === "sm"
      ? "text-lg"
      : size === "lg"
        ? "text-2xl sm:text-3xl"
        : "text-xl";

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className="relative flex items-center justify-center rounded-xl bg-[#DCEBCB] p-1.5 ring-1 ring-[#202820]/12">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="32"
            cy="32"
            r="27"
            stroke="#202820"
            strokeWidth="2"
            strokeDasharray="5 4"
            opacity="0.6"
          />
          <path
            d="M15 23C15 19.6863 17.6863 17 21 17H43C46.3137 17 49 19.6863 49 23V37C49 40.3137 46.3137 43 43 43H28L18 50V43H21C17.6863 43 15 40.3137 15 37V23Z"
            fill="#F7F6EF"
            stroke="#202820"
            strokeWidth="3.2"
          />
          <rect x="20" y="24" width="11" height="11" rx="2" fill="#202820" />
          <path d="M21 33L24.5 29L27 31.5L29 29.5L31 33H21Z" fill="#B7F36B" />
          <line x1="34" y1="25" x2="44" y2="25" stroke="#202820" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="34" y1="30" x2="44" y2="30" stroke="#202820" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="34" y1="35" x2="41" y2="35" stroke="#202820" strokeWidth="2.5" strokeLinecap="round" />
          {/* Karavali Neon Pin */}
          <path
            d="M32 5C27.5817 5 24 8.58172 24 13C24 18.5 32 26 32 26C32 26 40 18.5 40 13C40 8.58172 36.4183 5 32 5Z"
            fill="#202820"
          />
          <circle cx="32" cy="13" r="4" fill="#B7F36B" />
        </svg>
      </div>
      <div
        className={cn(
          "font-display font-extrabold tracking-tight leading-none flex items-baseline",
          textSize
        )}
      >
        <span className={variant === "dark" ? "text-[#F7F6EF]" : "text-[#202820]"}>
          pethri
        </span>
        <span
          className={cn(
            "ml-0.5 px-1.5 py-0.5 rounded-md text-[0.72em] font-mono font-bold",
            variant === "dark"
              ? "bg-[#B7F36B] text-[#202820]"
              : "bg-[#202820] text-[#B7F36B]"
          )}
        >
          .com
        </span>
      </div>
    </div>
  );
}
