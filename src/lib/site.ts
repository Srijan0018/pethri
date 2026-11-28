const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl = configuredSiteUrl || "https://pethri.com";

try {
  const parsedSiteUrl = new URL(siteUrl);
  if (parsedSiteUrl.protocol !== "https:" && parsedSiteUrl.protocol !== "http:") {
    throw new Error();
  }
} catch {
  throw new Error("NEXT_PUBLIC_SITE_URL must be a valid HTTP or HTTPS URL.");
}

export const SITE_URL = new URL(siteUrl);
