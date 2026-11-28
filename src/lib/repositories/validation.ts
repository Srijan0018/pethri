import type { PostCategory, PostFormat, PostSourceKind, VerificationTier } from "@/types/pethri";

const VALID_CATEGORIES = new Set<string>([
  "news",
  "church",
  "weddings",
  "agriculture",
  "sports",
  "civic",
  "celebrations",
]);

const VALID_VERIFICATIONS = new Set<string>(["community", "reviewed", "verified"]);
const VALID_SOURCES = new Set<string>(["newsroom", "citizen", "sponsored"]);
const VALID_FORMATS = new Set<string>(["article", "photo", "carousel", "moment_video", "dispatch"]);

export function parsePagination(searchParams: URLSearchParams, defaultLimit = 20, maxLimit = 50) {
  const rawLimit = searchParams.get("limit");
  const rawOffset = searchParams.get("offset") ?? searchParams.get("skip");

  let limit = defaultLimit;
  if (rawLimit) {
    const parsed = parseInt(rawLimit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, maxLimit);
    }
  }

  let offset = 0;
  if (rawOffset) {
    const parsed = parseInt(rawOffset, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return { limit, offset };
}

export function isValidCategory(val: string): val is PostCategory {
  return VALID_CATEGORIES.has(val);
}

export function isValidVerification(val: string): val is VerificationTier {
  return VALID_VERIFICATIONS.has(val);
}

export function isValidSourceKind(val: string): val is PostSourceKind {
  return VALID_SOURCES.has(val);
}

export function isValidFormat(val: string): val is PostFormat {
  return VALID_FORMATS.has(val);
}

export function sanitizeText(val: unknown, maxLength = 5000): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLength);
}

export function matchesMomentFilter(isMoment: boolean, onlyMoments = false): boolean {
  return isMoment === onlyMoments;
}

export function hasMinimumPasswordLength(password: string): boolean {
  return password.length >= 12;
}
