import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isLocalImageSrc(src: string): boolean {
  return src.startsWith("/") && !src.startsWith("//");
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
    accent: "bg-[#173FBE] text-white",
    pill: "bg-[#EEF2FF] text-[#173FBE] border-[#E2E7F0]",
  },
  church: {
    label: "Religion & Culture",
    labelKn: "ಧರ್ಮ ಮತ್ತು ಸಂಸ್ಕೃತಿ",
    short: "Religion",
    accent: "bg-[#111318] text-white",
    pill: "bg-[#EEF2FF] text-[#111318] border-[#E2E7F0]",
  },
  weddings: {
    label: "Weddings",
    labelKn: "ಮದುವೆ ಸಂಭ್ರಮ",
    short: "Weddings",
    accent: "bg-[#173FBE] text-white",
    pill: "bg-white text-[#111318] border-[#E2E7F0]",
  },
  agriculture: {
    label: "Agriculture",
    labelKn: "ಕೃಷಿ ಮತ್ತು ಬೆಳೆ",
    short: "Farming",
    accent: "bg-[#173FBE] text-white",
    pill: "bg-[#EEF2FF] text-[#173FBE] border-[#E2E7F0]",
  },
  sports: {
    label: "Sports & Kabaddi",
    labelKn: "ಕ್ರೀಡೆ ಮತ್ತು ಕಬಡ್ಡಿ",
    short: "Sports",
    accent: "bg-[#173FBE] text-white",
    pill: "bg-[#EEF2FF] text-[#111318] border-[#E2E7F0]",
  },
  civic: {
    label: "Public Issues",
    labelKn: "ಸಾರ್ವಜನಿಕ ಸಮಸ್ಯೆ",
    short: "Civic",
    accent: "bg-[#111318] text-white",
    pill: "bg-[#FFFFFF] text-[#111318] border-[#E2E7F0]",
  },
  celebrations: {
    label: "Celebrations",
    labelKn: "ಉತ್ಸವ ಮತ್ತು ಹಬ್ಬ",
    short: "Events",
    accent: "bg-[#173FBE] text-white",
    pill: "bg-[#EEF2FF] text-[#173FBE] border-[#E2E7F0]",
  },
} as const;
