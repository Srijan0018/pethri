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
          "inline-flex items-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200",
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

  const iconSize = size === "sm" ? 30 : size === "lg" ? 44 : 36;
  const textSize =
    size === "sm"
      ? "text-lg"
      : size === "lg"
        ? "text-2xl sm:text-3xl"
        : "text-xl";

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className="relative flex items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-[#0A2E6E]/15">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          {/* Outer dashed community ring */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="#0A2E6E"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.7"
          />
          {/* News speech bubble frame */}
          <path
            d="M14 23C14 19.6863 16.6863 17 20 17H42C45.3137 17 48 19.6863 48 23V37C48 40.3137 45.3137 43 42 43H27L17 50V43H20C16.6863 43 14 40.3137 14 37V23Z"
            fill="#FFFFFF"
            stroke="#0A2E6E"
            strokeWidth="3.2"
          />
          {/* Media frame & headline lines */}
          <rect x="19" y="24" width="11" height="11" rx="2" fill="#0A2E6E" />
          <path d="M20 33L23.5 29L26 31.5L28 29.5L30 33H20Z" fill="#FFFFFF" />
          <line x1="33" y1="25" x2="43" y2="25" stroke="#0A2E6E" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="33" y1="30" x2="43" y2="30" stroke="#0A2E6E" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="33" y1="35" x2="40" y2="35" stroke="#0A2E6E" strokeWidth="2.5" strokeLinecap="round" />
          {/* Signature Red Pin */}
          <path
            d="M32 6C27.5817 6 24 9.58172 24 14C24 19.5 32 27 32 27C32 27 40 19.5 40 14C40 9.58172 36.4183 6 32 6Z"
            fill="#D91E2A"
          />
          <circle cx="32" cy="14" r="3.2" fill="#FFFFFF" />
          {/* Red swoop */}
          <path
            d="M23 48C33 50 45 45 52 35"
            stroke="#D91E2A"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className={cn("font-display font-extrabold tracking-tight leading-none", textSize)}>
        <span className={variant === "dark" ? "text-white" : "text-[#0A2E6E]"}>
          pethri
        </span>
        <span className="text-[#D91E2A]">.com</span>
      </div>
    </div>
  );
}
