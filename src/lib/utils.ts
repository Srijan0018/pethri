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
    labelKn: "ಸ್ಥಳೀಯ ಸುದ್ದಿ",
    short: "News",
    accent: "bg-[#1B5E43] text-white",
    pill: "bg-[#EAF2EE] text-[#1B5E43] border-[#E5E3DC]",
  },
  church: {
    label: "Church & Faith",
    labelKn: "ಚರ್ಚ್ ಮತ್ತು ಧಾರ್ಮಿಕ",
    short: "Faith",
    accent: "bg-[#181917] text-white",
    pill: "bg-[#EAF2EE] text-[#181917] border-[#E5E3DC]",
  },
  weddings: {
    label: "Weddings",
    labelKn: "ಮದುವೆ ಸಂಭ್ರಮ",
    short: "Weddings",
    accent: "bg-[#1B5E43] text-white",
    pill: "bg-white text-[#181917] border-[#E5E3DC]",
  },
  agriculture: {
    label: "Agriculture",
    labelKn: "ಕೃಷಿ ಮತ್ತು ಬೆಳೆ",
    short: "Farming",
    accent: "bg-[#1B5E43] text-white",
    pill: "bg-[#EAF2EE] text-[#1B5E43] border-[#E5E3DC]",
  },
  sports: {
    label: "Sports & Kabaddi",
    labelKn: "ಕ್ರೀಡೆ ಮತ್ತು ಕಬಡ್ಡಿ",
    short: "Sports",
    accent: "bg-[#1B5E43] text-white",
    pill: "bg-[#EAF2EE] text-[#181917] border-[#E5E3DC]",
  },
  civic: {
    label: "Public Issues",
    labelKn: "ಸಾರ್ವಜನಿಕ ಸಮಸ್ಯೆ",
    short: "Civic",
    accent: "bg-[#181917] text-white",
    pill: "bg-[#F8F7F4] text-[#181917] border-[#E5E3DC]",
  },
  celebrations: {
    label: "Celebrations",
    labelKn: "ಉತ್ಸವ ಮತ್ತು ಹಬ್ಬ",
    short: "Events",
    accent: "bg-[#1B5E43] text-white",
    pill: "bg-[#EAF2EE] text-[#1B5E43] border-[#E5E3DC]",
  },
} as const;
