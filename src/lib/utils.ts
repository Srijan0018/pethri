import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(
  isoDate: string,
  referenceNowMs?: number | null
): string {
  const date = new Date(isoDate);
  if (!referenceNowMs) {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }
  const diffMs = referenceNowMs - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export const CATEGORY_META = {
  news: {
    label: "Local News",
    short: "News",
    accent: "bg-[#0A2E6E] text-white",
    pill: "bg-[#0A2E6E]/10 text-[#0A2E6E] border-[#0A2E6E]/20",
  },
  church: {
    label: "Church & Faith",
    short: "Church",
    accent: "bg-[#D91E2A] text-white",
    pill: "bg-[#D91E2A]/10 text-[#B91420] border-[#D91E2A]/20",
  },
  weddings: {
    label: "Weddings",
    short: "Weddings",
    accent: "bg-rose-600 text-white",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
  },
  agriculture: {
    label: "Agriculture",
    short: "Farming",
    accent: "bg-emerald-700 text-white",
    pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  sports: {
    label: "Sports",
    short: "Sports",
    accent: "bg-amber-600 text-white",
    pill: "bg-amber-50 text-amber-800 border-amber-200",
  },
  civic: {
    label: "Public Issues",
    short: "Civic",
    accent: "bg-slate-800 text-white",
    pill: "bg-slate-100 text-slate-800 border-slate-300",
  },
  celebrations: {
    label: "Celebrations",
    short: "Events",
    accent: "bg-indigo-700 text-white",
    pill: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
} as const;

export const VERIFICATION_META = {
  community: {
    label: "Community Submission",
    shortLabel: "Community",
    description:
      "Submitted by a local resident. Not yet verified by the Pethri editorial desk.",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  reviewed: {
    label: "Editorially Reviewed",
    shortLabel: "Reviewed",
    description:
      "Checked by a Pethri desk editor for context, locality accuracy, and community guidelines.",
    className: "bg-[#0A2E6E]/10 text-[#0A2E6E] border-[#0A2E6E]/25",
    dotClass: "bg-[#0A2E6E]",
  },
  verified: {
    label: "Officially Verified",
    shortLabel: "Verified",
    description:
      "Confirmed with local authorities, parish/panchayat records, or on-ground correspondents.",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-600",
  },
} as const;
